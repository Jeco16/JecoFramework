/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'playwright-report');
const explicitSuite = process.argv[2] || process.env.SUITE_NAME;
if (!fs.existsSync(root)) {
  console.log('playwright-report does not exist — creating root folder');
  fs.mkdirSync(root, { recursive: true });
  process.exit(0);
}

// If an explicit suite is provided, only remove root index and that suite's index
const rootIndex = path.join(root, 'index.html');
if (fs.existsSync(rootIndex)) {
  try {
    fs.unlinkSync(rootIndex);
    console.log('Removed playwright-report/index.html');
  } catch (e) {
    console.warn('Failed removing root index.html', e);
  }
}

if (explicitSuite) {
  const idx = path.join(root, explicitSuite, 'index.html');
  if (fs.existsSync(idx)) {
    try {
      fs.unlinkSync(idx);
      console.log(`Removed ${path.join('playwright-report', explicitSuite, 'index.html')}`);
    } catch (e) {
      console.warn('Failed removing', idx, e);
    }
  } else {
    console.log(`No existing index.html to remove in playwright-report/${explicitSuite}`);
  }
  console.log('Cleaned index.html for explicit suite only (folders preserved)');
  process.exit(0);
}

// No explicit suite: remove index.html in immediate subfolders (suites)
for (const name of fs.readdirSync(root)) {
  const p = path.join(root, name);
  try {
    if (!fs.statSync(p).isDirectory()) continue;
    const idx = path.join(p, 'index.html');
    if (fs.existsSync(idx)) {
      try {
        fs.unlinkSync(idx);
        console.log(`Removed ${path.join('playwright-report', name, 'index.html')}`);
      } catch (e) {
        console.warn('Failed removing', idx, e);
      }
    }
  } catch (e) {
    /* ignore */
  }
}

console.log('Cleaned existing report index.html files (folders preserved)');
