/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { test as base } from '@playwright/test';
import { BasePage } from '../../src/pages/base.page.js';
import { LoginPage } from '../../src/pages/login.page.js';
import { logger, startCapture, stopCapture, setCaptureEnv } from '../../src/utils/logger.js';
import { ApiClient } from '../../src/api/api.client.js';
import {
  verifyStatus,
  verifyStatusInRange,
  verifyFieldExists,
} from '../../src/api/api.assertions.js';
import { loadByTestId, findFilePathByTestId } from '../../src/data/loader.js';
import fs from 'fs/promises';
import path from 'path';

export const test = base.extend({
  // Base fixture for the base page -------------
  basePage: async ({ page }, use) => {
    const basePageInstance = new BasePage(page);

    basePageInstance.open = async (url, title) => {
      await basePageInstance.goto(url);
      await basePageInstance.expectTitle(title);
      logger.info(`Opened URL: ${url} and verified title: ${title}`);
    };

    await use(basePageInstance);
  },

  testData: async ({ page: _page }, use, testInfo) => {
    void _page;
    const title = testInfo.title;
    const match = title.match(/([A-Z0-9]+_\d+)/i);
    const testId = match ? match[1] : null;
    // start capturing logger output for this testId so reporter can include logs as steps
    try {
      if (testId) {
        startCapture(testId);
        setCaptureEnv(testId);
      }
    } catch (e) {
      /* ignore capture start errors */
    }
    logger.info(`testData loader: title="${title}", testId=${testId}`);
    const data = await loadByTestId(testId);
    // Add annotations so the Playwright HTML reporter shows testId and data file
    const source = await findFilePathByTestId(testId);
    try {
      testInfo.annotations = testInfo.annotations || [];
      if (testId) testInfo.annotations.push({ type: 'testId', description: String(testId) });
      if (source) testInfo.annotations.push({ type: 'dataFile', description: source });

      // Attach per-test metadata so Playwright will include it in report/data
      try {
        const meta = { title, testId, dataFile: source, keys: Object.keys(data) };
        await testInfo.attach('test-metadata', {
          body: Buffer.from(JSON.stringify(meta)),
          contentType: 'application/json',
        });
      } catch (e) {
        // ignore attach errors
      }
    } catch (e) {
      // ignore annotation errors
    }
    await use(data);

    // After the test, write a per-test metadata file into report/data
    try {
      // collect captured logs and format them as steps
      let captured = [];
      try {
        captured = stopCapture(testId) || [];
      } catch (e) {
        captured = [];
      }
      // clear env capture helper
      try {
        setCaptureEnv(null);
      } catch (e) {
        /* ignore */
      }

      const steps = [];
      for (const c of captured) {
        steps.push({
          title: String(c.msg || ''),
          status: c.level || 'info',
          time: c.time,
          meta: c.meta || {},
        });
      }
      // include test errors as failed steps
      const errs =
        testInfo.errors && Array.isArray(testInfo.errors)
          ? testInfo.errors
          : testInfo.error
            ? [testInfo.error]
            : [];
      for (const er of errs) {
        try {
          const msg = er && er.message ? er.message : String(er);
          steps.push({
            title: msg,
            status: 'failed',
            time: new Date().toISOString(),
            meta: { stack: er && er.stack ? er.stack : '' },
          });
        } catch (e) {
          // ignore
        }
      }

      // copy attachments (screenshots, videos) to report/attachments/<testId>/
      const attachmentsArr = [];
      try {
        const atts = Array.isArray(testInfo.attachments) ? testInfo.attachments : [];
        for (const a of atts) {
          try {
            const destDir = path.join(
              process.cwd(),
              'report',
              'attachments',
              String(testId || 'unknown')
            );
            await fs.mkdir(destDir, { recursive: true });
            let fileName = a.name
              ? a.name.replace(/[^a-z0-9.\-_%(), ]/gi, '_')
              : `attachment-${Date.now()}`;
            // prefer copying if a.path exists
            if (a.path) {
              const src = a.path;
              const base = path.basename(src);
              const dest = path.join(destDir, base);
              await fs.copyFile(src, dest).catch(() => {});
              const relPath = path.posix.join('attachments', String(testId || 'unknown'), base);
              const attachEntry = {
                name: a.name || base,
                path: relPath,
                contentType: a.contentType || '',
              };
              // attempt to inline small images as base64 so report displays reliably via file://
              try {
                const stat = await fs.stat(dest).catch(() => null);
                if (stat && stat.size && stat.size < 1024 * 1024) {
                  const buf = await fs.readFile(dest).catch(() => null);
                  if (buf)
                    attachEntry.inline = `data:${attachEntry.contentType || 'image/png'};base64,${buf.toString('base64')}`;
                }
              } catch (e) {
                // ignore inline errors
              }
              attachmentsArr.push(attachEntry);
            } else if (a.body) {
              // write body to file
              if (!fileName) fileName = `attachment-${Date.now()}`;
              const dest = path.join(destDir, fileName);
              const body = a.body;
              if (typeof body === 'string') {
                await fs.writeFile(dest, body, 'utf8').catch(() => {});
              } else {
                await fs.writeFile(dest, Buffer.from(body)).catch(() => {});
              }
              attachmentsArr.push({
                name: a.name || fileName,
                path: path.posix.join('attachments', String(testId || 'unknown'), fileName),
                contentType: a.contentType || '',
              });
            }
          } catch (inner) {
            // ignore per-attachment errors
          }
        }
      } catch (e) {
        // ignore attachments collection errors
      }

      const finalMeta = {
        title,
        testId,
        dataFile: source || '',
        keys: Object.keys(data || {}),
        status: testInfo.status || '',
        startTime: testInfo.startTime ? new Date(testInfo.startTime).toISOString() : null,
        duration: typeof testInfo.duration !== 'undefined' ? testInfo.duration : null,
        steps,
        attachments: attachmentsArr,
      };
      const outDir = path.resolve(process.cwd(), 'report', 'data');
      await fs.mkdir(outDir, { recursive: true });
      const outPath = path.join(outDir, `${testId || 'unknown'}-${Date.now()}.json`);
      await fs.writeFile(outPath, JSON.stringify(finalMeta), 'utf8');
    } catch (e) {
      // ignore write errors
    }
  },

  // API fixture -------------------------------

  api: async ({ playwright }, use) => {
    const baseURL = process.env.API_BASE_URL || process.env.BASE_URL || '';
    // Defaults to true (needed e.g. behind corporate TLS-inspecting proxies); set
    // API_IGNORE_HTTPS_ERRORS=false to enforce strict certificate validation.
    const ignoreHttps =
      String(process.env.API_IGNORE_HTTPS_ERRORS ?? 'true').toLowerCase() !== 'false';

    // Create a dedicated APIRequestContext so we can control options like ignoreHTTPSErrors
    const reqCtx = await playwright.request.newContext({
      baseURL: baseURL || undefined,
      ignoreHTTPSErrors: ignoreHttps,
    });

    const api = new ApiClient(reqCtx, baseURL);

    api.verifyStatus = (res, expectedStatus) => verifyStatus(res, expectedStatus);
    api.verifyStatusInRange = (res, minStatus, maxStatus) =>
      verifyStatusInRange(res, minStatus, maxStatus);
    api.verifyFieldExists = (res, field) => verifyFieldExists(res, field);

    await use(api);

    // cleanup
    try {
      await reqCtx.dispose();
    } catch (e) {
      /* ignore disposal errors */
    }
  },

  // Login page fixture -------------------------------

  loginPage: async ({ page }, use) => {
    const loginPageInstance = new LoginPage(page);
    await use(loginPageInstance);
  },

  // Add more fixtures here if needed
});
export { expect } from '@playwright/test';
