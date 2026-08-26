import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import CustomizeReportReporter from '../../src/reporters/customizeReport.reporter.js';

test.describe('Reporter generation', () => {
  test('reporter.onBegin clears data dir and onEnd generates report/index.html', async () => {
    const reporter = new CustomizeReportReporter();
    // ensure start clean
    await reporter.onBegin({}, {});
    const outDir = path.resolve(process.cwd(), 'report', 'data');
    await fs.mkdir(outDir, { recursive: true });
    const meta = {
      title: 'SelfTest Example',
      testId: 'SELF_01',
      dataFile: 'src/data/e2e/SELF_01.json',
      keys: ['k1'],
      status: 'passed',
      startTime: new Date().toISOString(),
      duration: 10,
      ran: true,
    };
    const outPath = path.join(outDir, `SELF_01-${Date.now()}.json`);
    await fs.writeFile(outPath, JSON.stringify(meta), 'utf8');

    // call onEnd and assert report generated
    await reporter.onEnd({}, {});
    const indexPath = path.resolve(process.cwd(), 'report', 'index.html');
    const exists = await fs
      .access(indexPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBeTruthy();
    const html = await fs.readFile(indexPath, 'utf8');
    expect(html).toContain('SelfTest Example');
  });
});
