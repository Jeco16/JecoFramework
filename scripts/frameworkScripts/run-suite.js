/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

function parseArgs(argv) {
  const opts = {};
  for (const a of argv) {
    if (a.startsWith('--config=')) opts.config = a.split('=')[1];
    else if (a.startsWith('--suite=')) opts.suite = a.split('=')[1];
    else if (a === '--clean') opts.clean = true;
  }
  return opts;
}

async function main() {
  const argv = process.argv.slice(2);
  const opts = parseArgs(argv);

  // Run index cleanup targeted to the suite if provided (pretest previously cleaned all suites
  // but npm pre/post scripts don't receive script args, so perform targeted clean here).
  try {
    const cleanArgs = ['./scripts/frameworkScripts/clean-report-indexes.js'];
    if (opts.suite) cleanArgs.push(opts.suite);
    console.log(
      'Before targeted cleanup, playwright-report contains:',
      fs.existsSync(path.resolve(process.cwd(), 'playwright-report'))
        ? fs.readdirSync(path.resolve(process.cwd(), 'playwright-report'))
        : '<missing>'
    );
    const cleaner = spawn('node', cleanArgs, { stdio: 'inherit', shell: true });
    await new Promise((res) => cleaner.on('exit', res));
    console.log(
      'After targeted cleanup, playwright-report contains:',
      fs.existsSync(path.resolve(process.cwd(), 'playwright-report'))
        ? fs.readdirSync(path.resolve(process.cwd(), 'playwright-report'))
        : '<missing>'
    );
  } catch (e) {
    /* ignore cleanup errors */
  }

  // If no args provided, and there's a single suite under tests/e2e, use it
  if (!opts.config && !opts.suite) {
    const testsE2E = path.resolve(process.cwd(), 'tests', 'e2e');
    try {
      if (fs.existsSync(testsE2E)) {
        const subs = fs
          .readdirSync(testsE2E)
          .filter((d) => fs.statSync(path.join(testsE2E, d)).isDirectory());
        if (subs.length === 1) {
          opts.config = path.join('tests', 'e2e', subs[0], 'suite.config.js');
          opts.suite = subs[0];
          console.log(`Auto-detected single suite: ${opts.suite}`);
        }
      }
    } catch (e) {
      /* ignore */
    }
  }

  // If a suite was provided but no config, try to use the suite's config.js
  if (opts.suite && !opts.config) {
    const candidateCfg = path.join('tests', 'e2e', opts.suite, 'suite.config.js');
    if (fs.existsSync(path.resolve(process.cwd(), candidateCfg))) {
      opts.config = candidateCfg;
      console.log(`Using suite config: ${opts.config}`);
    }
  }

  if (opts.config) {
    try {
      const cfgPath = path.resolve(process.cwd(), opts.config);
      const src = fs.readFileSync(cfgPath, 'utf8');

      // Try AST parsing using `acorn` for robust extraction of `suite` object.
      // If `acorn` is not installed, fall back to the legacy text-based extractor.
      let detectedTags = [];
      let suiteName;
      let parsedWithAST = false;

      try {
        let acornMod;
        try {
          acornMod = await import('acorn');
          acornMod = acornMod && (acornMod.default || acornMod);
        } catch (ie) {
          acornMod = null;
        }

        if (acornMod) {
          const ast = acornMod.parse(src, {
            ecmaVersion: 2022,
            sourceType: 'module',
          });
          const body = ast && ast.body ? ast.body : [];

          const extractFromObject = (objNode) => {
            if (!objNode || objNode.type !== 'ObjectExpression') return;
            for (const prop of objNode.properties || []) {
              const key = prop.key && (prop.key.name || prop.key.value);
              if (!key) continue;
              if (key === 'name') {
                if (prop.value && prop.value.type === 'Literal') suiteName = prop.value.value;
              }
              if (key === 'tags') {
                if (prop.value && prop.value.type === 'ArrayExpression') {
                  for (const el of prop.value.elements) {
                    if (!el) continue;
                    if (el.type === 'Literal') detectedTags.push(el.value);
                  }
                }
              }
            }
          };

          for (const node of body) {
            if (node.type === 'ExportNamedDeclaration' && node.declaration) {
              const decl = node.declaration;
              if (decl.type === 'VariableDeclaration') {
                for (const d of decl.declarations || []) {
                  if (d.id && d.id.name === 'suite' && d.init) {
                    extractFromObject(d.init);
                    parsedWithAST = true;
                    break;
                  }
                }
              }
            }
            if (parsedWithAST) break;
            // also accept plain variable declaration: const suite = { ... }
            if (node.type === 'VariableDeclaration') {
              for (const d of node.declarations || []) {
                if (d.id && d.id.name === 'suite' && d.init) {
                  extractFromObject(d.init);
                  parsedWithAST = true;
                  break;
                }
              }
            }
            if (parsedWithAST) break;
          }
        } else {
          console.warn(
            'acorn not found; falling back to text-based suite parsing. For robust parsing install `acorn`.'
          );
        }
      } catch (e) {
        // any AST parsing issues fall back to text parsing below
        console.warn(
          'AST parsing failed, falling back to text extraction:',
          e && e.message ? e.message : e
        );
      }

      // If AST parsing didn't yield results, fall back to the legacy text extraction
      if (!parsedWithAST) {
        // Extract the `suite` object block to avoid matching project names like 'chromium'
        let suiteBlock = null;
        const exportIdx = src.indexOf('export const suite');
        const constIdx = src.indexOf('const _suite');
        const startIdx = exportIdx >= 0 ? exportIdx : constIdx >= 0 ? constIdx : -1;
        if (startIdx >= 0) {
          const braceIdx = src.indexOf('{', startIdx);
          if (braceIdx >= 0) {
            let depth = 0;
            for (let i = braceIdx; i < src.length; i++) {
              const ch = src[i];
              if (ch === '{') depth++;
              else if (ch === '}') depth--;
              if (depth === 0) {
                suiteBlock = src.slice(braceIdx + 1, i);
                break;
              }
            }
          }
        }

        const searchArea = suiteBlock || src;

        // detect suite name without importing (search only in suiteBlock)
        const nameMatch = searchArea.match(/\bname\s*:\s*(['"])([^'"]+)\1/);
        if (nameMatch) suiteName = nameMatch[2];

        // detect tags array content (search only in suiteBlock)
        const tagsMatch = searchArea.match(/\btags\s*:\s*\[([^\]]*)\]/m);
        if (tagsMatch) {
          const inside = tagsMatch[1];
          const tagStrings = inside.match(/(['"])(.*?)\1/g);
          if (tagStrings) detectedTags = tagStrings.map((s) => s.slice(1, -1));
        }
      }

      if (suiteName) opts.suite = suiteName;

      // determine env from tags (accept separators :, ., =, -)
      const knownEnvs = ['dev', 'qa', 'uat', 'prod', 'staging', 'preprod'];
      let suiteEnv = null;
      for (const t of detectedTags) {
        if (!t) continue;
        const m = String(t).match(/^(?:env(?:ironment)?[:=.\- _]?)([a-z0-9_-]+)$/i);
        if (m) {
          suiteEnv = m[1].toLowerCase();
          break;
        }
        if (knownEnvs.includes(String(t).toLowerCase())) {
          suiteEnv = String(t).toLowerCase();
          break;
        }
      }
      if (!suiteEnv) suiteEnv = process.env.ENV || process.env.NODE_ENV || 'dev';
      process.env.ENV = suiteEnv;

      // load .env files now that we know the env
      const baseEnv = path.join(process.cwd(), '.env');
      if (fs.existsSync(baseEnv)) dotenv.config({ path: baseEnv });
      const envFile = path.join(process.cwd(), `.env.${suiteEnv}`);
      if (fs.existsSync(envFile)) dotenv.config({ path: envFile });

      console.log(`Detected suite env '${suiteEnv}' from ${opts.config}`);
    } catch (e) {
      // ignore parsing errors and fall back
    }
  }

  if (!opts.suite) {
    console.error('Suite name not provided. Use --suite=<name> or export SUITE_NAME.');
    process.exit(1);
  }

  if (opts.clean) {
    try {
      fs.rmSync(path.resolve(process.cwd(), 'playwright-report'), {
        recursive: true,
        force: true,
      });
      fs.rmSync(path.resolve(process.cwd(), 'artifacts'), {
        recursive: true,
        force: true,
      });
      console.log('Cleaned previous reports/artifacts');
    } catch (e) {
      /* ignore */
    }
  }

  // prepare suite folder (removes only index.html)
  console.log(
    'Before prepare-report, playwright-report contains:',
    fs.existsSync(path.resolve(process.cwd(), 'playwright-report'))
      ? fs.readdirSync(path.resolve(process.cwd(), 'playwright-report'))
      : '<missing>'
  );
  const prep = spawn('node', ['./scripts/frameworkScripts/prepare-report.js', opts.suite], {
    stdio: 'inherit',
    shell: true,
  });
  await new Promise((res) => prep.on('exit', res));
  console.log(
    'After prepare-report, playwright-report contains:',
    fs.existsSync(path.resolve(process.cwd(), 'playwright-report'))
      ? fs.readdirSync(path.resolve(process.cwd(), 'playwright-report'))
      : '<missing>'
  );

  // Run playwright with optional config
  const cmd = 'npx';
  const args = ['playwright', 'test'];
  // Force a global HTML reporter so Playwright writes an index.html in root;
  // `move-report.js` will relocate it into the suite folder and we've hardened
  // the move logic to preserve attachments/assets.
  args.push('--reporter=html');
  if (opts.config) args.push(`--config=${opts.config}`);
  // Run headed by default unless HEADLESS environment variable is explicitly 'true'
  if (process.env.HEADLESS !== 'true') {
    args.push('--headed');
  }
  // If a suite name was provided, limit Playwright to that suite folder
  if (opts.suite) {
    const suitePath = `tests/e2e/${opts.suite}`; // use forward slashes for CLI
    args.push(suitePath);
  }

  // Backup existing suite folders under playwright-report to avoid Playwright overwriting them
  const reportRoot = path.resolve(process.cwd(), 'playwright-report');
  const backupRoot = path.resolve(process.cwd(), '.playwright-report-backup');
  try {
    if (fs.existsSync(reportRoot)) {
      if (!fs.existsSync(backupRoot)) fs.mkdirSync(backupRoot, { recursive: true });
      for (const name of fs.readdirSync(reportRoot)) {
        const p = path.join(reportRoot, name);
        try {
          if (!fs.statSync(p).isDirectory()) continue;
          // only backup non-run folders (suite folders)
          if (name.startsWith('run-')) continue;
          const dest = path.join(backupRoot, name);
          if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
          fs.renameSync(p, dest);
          console.log(
            `Backed up existing report folder ${name} -> .playwright-report-backup/${name}`
          );
        } catch (e) {
          /* ignore per-folder errors */
        }
      }
    }
  } catch (e) {
    /* ignore backup errors */
  }

  console.log('Spawning Playwright:', cmd, args.join(' '), 'cwd=', process.cwd());
  const child = spawn(cmd, args, { stdio: 'inherit', shell: true });
  child.on('exit', (code) => {
    // After tests, move index.html if Playwright wrote it to root
    console.log(
      'Before move-report, playwright-report contains:',
      fs.existsSync(path.resolve(process.cwd(), 'playwright-report'))
        ? fs.readdirSync(path.resolve(process.cwd(), 'playwright-report'))
        : '<missing>'
    );
    const mover = spawn('node', ['./scripts/frameworkScripts/move-report.js', opts.suite], {
      stdio: 'inherit',
      shell: true,
    });
    mover.on('exit', () => {
      console.log(
        'After move-report, playwright-report contains:',
        fs.existsSync(path.resolve(process.cwd(), 'playwright-report'))
          ? fs.readdirSync(path.resolve(process.cwd(), 'playwright-report'))
          : '<missing>'
      );
      // Restore any backed up suite folders
      try {
        if (fs.existsSync(backupRoot)) {
          for (const name of fs.readdirSync(backupRoot)) {
            const src = path.join(backupRoot, name);
            const dst = path.join(reportRoot, name);
            if (!fs.existsSync(dst)) {
              fs.renameSync(src, dst);
              console.log(`Restored report folder ${name} from backup`);
            } else {
              // destination exists, remove backup
              fs.rmSync(src, { recursive: true, force: true });
            }
          }
          try {
            fs.rmSync(backupRoot, { recursive: true, force: true });
          } catch (e) {
            /* ignore */
          }
        }
      } catch (e) {
        /* ignore restore errors */
      }
      // cleanup test-results folder if Playwright created it
      try {
        const tr = path.resolve(process.cwd(), 'test-results');
        if (fs.existsSync(tr)) fs.rmSync(tr, { recursive: true, force: true });
      } catch (e) {
        /* ignore */
      }
      process.exit(code ?? 0);
    });
  });
}

main();
