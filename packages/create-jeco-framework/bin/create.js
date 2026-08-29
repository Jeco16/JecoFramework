#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import minimist from 'minimist';

const args = minimist(process.argv.slice(2), { boolean: ['dry-run', 'flat'] });
const target = args._[0] || '.';
const dryRun = args['dry-run'] || false;
const flat = args['flat'] || false;

const cwd = process.cwd();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateRoot = path.join(__dirname, '..', 'template');

async function run() {
  const dest = path.resolve(cwd, target);
  if (dryRun) console.log('[dry-run] Would create project at', dest);
  if (!dryRun) await fs.ensureDir(dest);

  // Determine base source: allow a top-level "wrapper" folder to be flattened with --flat
  let baseSource = templateRoot;
  const topEntries = await fs.readdir(templateRoot);
  if (flat && topEntries.length === 1) {
    const only = path.join(templateRoot, topEntries[0]);
    const statOnly = await fs.stat(only).catch(() => null);
    if (statOnly && statOnly.isDirectory()) baseSource = only;
  }

  // Copy template files, render ejs templates
  const files = await fs.readdir(baseSource);
  for (const file of files) {
    const srcPath = path.join(baseSource, file);
    // npm strips files literally named ".gitignore" from published tarballs, so the
    // template ships it as "gitignore" and it's restored to a dotfile here.
    const destName = file === 'gitignore' ? '.gitignore' : file.replace(/\.ejs$/, '');
    const destPath = path.join(dest, destName);
    const stat = await fs.stat(srcPath);
    if (stat.isDirectory()) {
      if (!dryRun) await fs.copy(srcPath, destPath, { overwrite: true });
      console.log(
        dryRun ? `[dry-run] copy ${srcPath} -> ${destPath}` : `copy ${srcPath} -> ${destPath}`
      );
    } else {
      if (file.endsWith('.ejs')) {
        const tpl = await fs.readFile(srcPath, 'utf8');
        const now = new Date();
        const context = {
          name: path.basename(dest),
          logsilent: process.env.LOG_SILENT === 'true' || !!args['log-silent'],
          date: `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`,
        };
        const out = ejs.render(tpl, context);
        if (!dryRun) await fs.writeFile(destPath, out, 'utf8');
        console.log(
          dryRun ? `[dry-run] render ${srcPath} -> ${destPath}` : `render ${srcPath} -> ${destPath}`
        );
      } else {
        if (!dryRun) await fs.copy(srcPath, destPath, { overwrite: true });
        console.log(
          dryRun ? `[dry-run] copy ${srcPath} -> ${destPath}` : `copy ${srcPath} -> ${destPath}`
        );
      }
    }
  }
  console.log('Scaffold complete. Run `npm install` in the new project.');
}

run().catch((err) => {
  console.error('Error creating scaffold:', err);
  process.exit(1);
});
