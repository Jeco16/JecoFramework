/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { test as base } from '@playwright/test';
import { BasePage } from '../../src/pages/base.page.js';
import { LoginPage } from '../../src/pages/login.page.js';
import { logger } from '../../src/utils/logger.js';
import { ApiClient } from '../../src/api/api.client.js';
import {
  verifyStatus,
  verifyStatusInRange,
  verifyFieldExists,
} from '../../src/api/api.assertions.js';
import { loadByTestId } from '../../src/data/loader.js';

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
    logger.info(`testData loader: title="${title}", testId=${testId}`);
    const data = await loadByTestId(testId);
    await use(data);
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
