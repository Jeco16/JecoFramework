import fs from 'fs';
import path from 'path';

// Usage: node ./scripts/prepare-report.js [suiteName]
const suiteName = process.argv[2] || process.env.SUITE_NAME;
const root = path.resolve(process.cwd(), 'playwright-report');

if (!fs.existsSync(root)) {
  fs.mkdirSync(root, { recursive: true });
  console.log('Created playwright-report root');
} else {
  console.log('playwright-report root exists');
}

if (!suiteName) {
  console.log('No suite name provided to prepare-report.js — nothing to prepare.');
  process.exit(0);
}

const suiteDir = path.join(root, suiteName);
if (!fs.existsSync(suiteDir)) {
  fs.mkdirSync(suiteDir, { recursive: true });
  console.log(`Created suite folder playwright-report/${suiteName}`);
} else {
  console.log(`Suite folder playwright-report/${suiteName} exists`);
}

// Remove only index.html if present — we'll let Playwright recreate it
const indexFile = path.join(suiteDir, 'index.html');
if (fs.existsSync(indexFile)) {
  try {
    fs.unlinkSync(indexFile);
    console.log(`Removed existing index.html in playwright-report/${suiteName}`);
  } catch (e) {
    console.error('Failed to remove existing index.html:', e);
    process.exit(1);
  }
} else {
  console.log('No existing index.html to remove');
}
