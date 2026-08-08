/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

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

  if (!opts.suite && opts.config) {
    try {
      const cfgPath = path.resolve(process.cwd(), opts.config);
      const cfgUrl = `file://${cfgPath}`;
      const mod = await import(cfgUrl);
      if (mod && mod.suite && mod.suite.name) {
        opts.suite = mod.suite.name;
      }
    } catch (e) {
      // ignore, require explicit --suite later
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
          } catch (e) {}
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
