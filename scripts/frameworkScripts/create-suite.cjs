/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

async function copyRecursive(src, dest) {
  if (fsSync.cp) {
    await fs.cp(src, dest, { recursive: true });
    return;
  }
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const srcPath = path.join(src, e.name);
    const destPath = path.join(dest, e.name);
    if (e.isDirectory()) await copyRecursive(srcPath, destPath);
    else await fs.copyFile(srcPath, destPath);
  }
}

async function main() {
  const rl = readline.createInterface({ input, output });
  try {
    const defaultTemplate = 'suiteTemplate';
    //const template = (await rl.question(`Template suite (default: ${defaultTemplate}): `)) || defaultTemplate;
    const name = (await rl.question('New suite name: ')).trim();
    if (!name) {
      console.error('Nome suite obbligatorio. Esco.');
      process.exit(1);
    }

    const base = path.resolve(process.cwd(), 'tests', 'e2e');
    const src = path.join(base, defaultTemplate);
    const dest = path.join(base, name);

    try {
      await fs.access(src);
    } catch {
      console.error(`Template non trovato: ${src}`);
      process.exit(1);
    }

    if (fsSync.existsSync(dest)) {
      const overwrite = (
        await rl.question(`La suite ${name} esiste già. Sovrascrivere? (y/N): `)
      ).toLowerCase();
      if (overwrite !== 'y') {
        console.log('Annullato.');
        process.exit(0);
      }
    }

    await copyRecursive(src, dest);

    // creazione file config di default
    const configPath = path.join(dest, 'suite.config.js');
    const basic = `/*
      Copyright 2026 Jacopo Enrico Marinaccio
      Licensed under the Apache License, Version 2.0
      You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
      */
      import { defineConfig, devices } from '@playwright/test';
      import path from 'path';

      export const suite = {
        name: process.env.SUITE_NAME || '${name}',
        owner: '',
        tags: [],
        baseURL: process.env.BASE_URL || '//define your base URL here',
        env: {}
      };

      export default defineConfig({
        reporters: [
          ['list'],
          ['html', { outputFolder: path.resolve(process.cwd(), 'playwright-report', '${name}'), open: 'never' }]
        ],
        projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
      });
      `;
    await fs.writeFile(configPath, basic, 'utf8');

    //creazione file di test di default
    const testPath = path.join(dest, 'TestTemplate001.spec.js');
    const testBasic = `/*
      Copyright 2026 Jacopo Enrico Marinaccio
      Licensed under the Apache License, Version 2.0
      You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
      */
      import { suite } from './suite.config.js';
      import { logger } from '../../../src/utils/frameworkUtils/logger.js';
      import { test, expect } from '../../fixtures/fixtures.js';

      test.describe(suite.name, () => {
        test('Define your testname here', async ({ basePage }) => {
      
          // Define your test steps here, for example:
          await basePage.open(suite.baseURL, 'Your expected title');
      
        });
      });

      `;
    await fs.writeFile(testPath, testBasic, 'utf8');

    console.log(`Suite creata: ${dest}`);
    console.log('Ricontrolla e personalizza la config/env/test prima di eseguire.');
  } finally {
    rl.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
