/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import 'dotenv/config';
import { pathToFileURL } from 'url';
import pathModule from 'path';
import fs from 'fs/promises';

// If console logging is globally silenced, print a single helpful pointer
// to the generated HTML report so users know where to look for logs.
(async () => {
  try {
    const silent = String(process.env.LOG_SILENT || '').toLowerCase() === 'true';
    const toConsoleFalse = String(process.env.LOG_TO_CONSOLE || '').toLowerCase() === 'false';
    // Print the notice from the main Playwright runner process (not workers) to avoid duplication
    const isPwWorker = typeof process.env.PW_WORKER_INDEX !== 'undefined';
    if ((silent || toConsoleFalse) && !isPwWorker && !globalThis.__JECO_LOG_NOTICE_PRINTED) {
      const reportIndex = pathModule.resolve(process.cwd(), 'report', 'index.html');
      const url = pathToFileURL(reportIndex).href;
      // Always print the notice for every run (no marker file)
        // Friendly, concise message in English with highlighted link
        // Use ANSI escape codes to make the report link more visible in terminals.
        // eslint-disable-next-line no-console
        try {
          const title = '\x1b[1m\x1b[33mLogs are suppressed in the console.\x1b[0m';
          const hint = '\x1b[1mFor full details open the test report:\x1b[0m';
          const highlight = `\x1b[30m\x1b[43m ${url} \x1b[0m`; // black on yellow background
          console.log('');
          console.log(title);
          console.log(hint, highlight);
          console.log('');
        } catch (e) {
          // fallback to plain message
          // eslint-disable-next-line no-console
          console.log(`Logs are suppressed in the console. For full details, open the test report: ${url}`);
        }
        try {
          globalThis.__JECO_LOG_NOTICE_PRINTED = true;
        } catch (err) {
          // ignore if cannot set global
        }
      }
  } catch (e) {
    // ignore failures building the message
  }
})();
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
import path from 'path';

/**
 * Fixtures exported for tests. Provides `basePage`, `testData`, `api`, and `loginPage`.
 * @module tests/fixtures
 */

/**
 * @typedef {Object} FinalMeta
 * @property {string} title
 * @property {string|null} testId
 * @property {string} dataFile
 * @property {string[]} keys
 * @property {string} status
 * @property {string|null} startTime
 * @property {number|null} duration
 * @property {Array<Object>} steps
 * @property {Array<Object>} attachments
 */

export const test = base.extend({
  /**
   * Provide a `BasePage` instance bound to the Playwright `page`.
   * @fixture
   * @name basePage
   * @param {{page: import('@playwright/test').Page}} context
   * @param {(instance: BasePage) => Promise<void>} use
   */
  basePage: async ({ page }, use) => {
    const basePageInstance = new BasePage(page);

    basePageInstance.open = async (url, title) => {
      await basePageInstance.goto(url);
      await basePageInstance.expectTitle(title);
      logger.info(`Opened URL: ${url} and verified title: ${title}`);
    };

    await use(basePageInstance);
  },

  /**
   * Load per-test data by convention (see `src/data`) and attach test metadata.
   * Writes a metadata JSON file into `report/data/<testId>-<timestamp>.json` containing
   * a `FinalMeta` object and copies Playwright attachments into `report/attachments/<testId>/`.
   * @fixture
   * @name testData
   * @param {{page: import('@playwright/test').Page}} context
   * @param {(data: any) => Promise<void>} use
   * @param {TestInfo} testInfo
   */
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

  /**
   * Provide an `ApiClient` instance backed by a Playwright `APIRequestContext`.
   * Honors `API_BASE_URL` / `BASE_URL` env overrides and `API_IGNORE_HTTPS_ERRORS`.
   * @fixture
   * @name api
   * @param {{playwright: import('@playwright/test').Playwright}} context
   * @param {(api: ApiClient) => Promise<void>} use
   */
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

  /**
   * Provide a `LoginPage` instance for test flows that need login/logout actions.
   * @fixture
   * @name loginPage
   * @param {{page: import('@playwright/test').Page}} context
   * @param {(loginPage: LoginPage) => Promise<void>} use
   */
  loginPage: async ({ page }, use) => {
    const loginPageInstance = new LoginPage(page);
    await use(loginPageInstance);
  },

  // Add more fixtures here if needed
});
export { expect } from '@playwright/test';
