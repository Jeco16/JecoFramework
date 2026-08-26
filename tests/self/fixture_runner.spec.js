import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

test('fixture run writes per-test metadata to report/data', async () => {
  const cmd =
    'npx playwright test tests/self/fixture_target.spec.js --project=self --reporter=list';
  await new Promise((resolve, reject) => {
    exec(cmd, { cwd: process.cwd(), env: process.env }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || stdout).toString()));
      return resolve(stdout.toString());
    });
  });

  const outDir = path.resolve(process.cwd(), 'report', 'data');
  const files = await fs.readdir(outDir).catch(() => []);
  const found = files.find((f) => f.startsWith('SELF_99-'));
  expect(found).toBeTruthy();
});
