/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { test, expect } from '@playwright/test';
import { suite } from './suite.config.js';
import { logger } from '../../../src/utils/frameworkUtils/logger.js';
import { LoginPage } from '../../../src/pages/templatePages/login.page.js';
import { SaucePage } from '../../../src/pages/templatePages/sauce.page.js';

test.describe(suite.name, () => {
  test('Test template 001 - login e logout', async ({ page }) => {

    const loginPage = new LoginPage(page);
    const saucePage = new SaucePage(page);
    await loginPage.open(suite.baseURL);
    await loginPage.login(suite.env.USER_1, suite.env.PASS);
    await saucePage.logout();

  });
});
