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
    const destPath = path.join(dest, file.replace(/\.ejs$/, ''));
    const stat = await fs.stat(srcPath);
    if (stat.isDirectory()) {
      if (!dryRun) await fs.copy(srcPath, destPath, { overwrite: true });
      console.log(
        dryRun ? `[dry-run] copy ${srcPath} -> ${destPath}` : `copy ${srcPath} -> ${destPath}`
      );
    } else {
      // Prefer copying package README if available in the scaffold package root
      const packageReadme = path.join(__dirname, '..', 'README.md');
      if ((file === 'README.md.ejs' || file === 'README.md') && (await fs.pathExists(packageReadme))) {
        const destReadme = path.join(dest, 'README.md');
        if (!dryRun) await fs.copy(packageReadme, destReadme, { overwrite: true });
        console.log(dryRun ? `[dry-run] copy ${packageReadme} -> ${destReadme}` : `copy ${packageReadme} -> ${destReadme}`);
      } else if (file.endsWith('.ejs')) {
        const tpl = await fs.readFile(srcPath, 'utf8');
        const out = ejs.render(tpl, { name: path.basename(dest) });
        if (!dryRun) await fs.writeFile(destPath, out, 'utf8');
        console.log(dryRun ? `[dry-run] render ${srcPath} -> ${destPath}` : `render ${srcPath} -> ${destPath}`);
      } else {
        if (!dryRun) await fs.copy(srcPath, destPath, { overwrite: true });
        console.log(dryRun ? `[dry-run] copy ${srcPath} -> ${destPath}` : `copy ${srcPath} -> ${destPath}`);
      }
    }
  }
  console.log('Scaffold complete. Run `npm install` in the new project.');
}

run().catch((err) => {
  console.error('Error creating scaffold:', err);
  process.exit(1);
});
