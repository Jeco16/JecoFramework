import test, { expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import CustomizeReportReporter from '../../src/reporters/customizeReport.reporter.js';

test('custom reporter handles missing attachments and generates index.html', async () => {
  const reportDir = path.join(process.cwd(), 'report');
  const dataDir = path.join(reportDir, 'data');

  // ensure clean slate
  await fs.rm(reportDir, { recursive: true, force: true }).catch(() => {});

  const reporter = new CustomizeReportReporter();
  await reporter.onBegin();

  await fs.mkdir(dataDir, { recursive: true });

  const meta = {
    title: 'MISSING_ATTACH',
    testId: 'MISSING_ATTACH',
    dataFile: '',
    keys: [],
    status: 'failed',
    startTime: new Date().toISOString(),
    duration: 123,
    steps: [],
    attachments: [
      {
        name: 'test-metadata',
        contentType: 'application/json',
        path: 'report/data/test-metadata.json',
      },
      {
        name: 'nonexistent.png',
        contentType: 'image/png',
        path: 'report/attachments/nonexistent.png',
      },
    ],
    ran: true,
  };

  await fs.writeFile(
    path.join(dataDir, 'MISSING_ATTACH.json'),
    JSON.stringify(meta, null, 2),
    'utf8'
  );

  await reporter.onEnd({}, {});

  const indexPath = path.join(reportDir, 'index.html');
  const exists = await fs
    .access(indexPath)
    .then(() => true)
    .catch(() => false);
  expect(exists).toBe(true);

  const html = await fs.readFile(indexPath, 'utf8');
  expect(html).toContain('Report of');
  // Ensure the report did not crash rendering due to missing attachments
  expect(html.length).toBeGreaterThan(100);
});
