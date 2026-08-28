import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const templateDir = path.join(__dirname, '..', 'template');

const keepEjs = (name) => name.endsWith('.ejs');

async function cleanTemplate() {
  const items = await fs.readdir(templateDir);
  for (const it of items) {
    if (keepEjs(it)) continue;
    await fs.remove(path.join(templateDir, it));
  }
}

async function copyIfExists(relPath, destName) {
  const src = path.join(repoRoot, relPath);
  if (await fs.pathExists(src)) {
    const dest = path.join(templateDir, destName || path.basename(relPath));
    await fs.copy(src, dest, { overwrite: true, filter: (srcPath) => {
      // exclude heavy or CI-specific folders
      if (/node_modules|playwright-report|report|artifacts|docs|\.git/.test(srcPath)) return false;
      return true;
    }});
    console.log('copied', relPath, '->', dest);
  } else {
    console.log('skip, not found:', relPath);
  }
}

async function run() {
  console.log('Cleaning template...');
  await cleanTemplate();
  console.log('Copying files...');
  await copyIfExists('src');
  await copyIfExists('tests');
  await copyIfExists('playwright.config.js');
  await copyIfExists('.env.example');
  await copyIfExists('.gitignore');
  await copyIfExists('LICENSE');
  await copyIfExists('CHANGELOG.md');
  console.log('Template export complete.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
