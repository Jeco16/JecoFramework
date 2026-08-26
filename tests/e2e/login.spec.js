/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { env } from '../../src/config/env.config.js';
import { test } from '../fixtures/fixtures.js';

test.describe('Saucedemo - E2E', () => {
  test('@smoke E2E_01 - login e logout with fixture', async ({ basePage, loginPage, testData }) => {
    await basePage.open(env.baseURL, /Swag Labs/);
    await loginPage.login(testData.username, testData.password);
    await loginPage.logout();
  });

  test('E2E_02 - login with bad credentials', async ({ basePage, loginPage, testData }) => {
    await basePage.open(env.baseURL, /Swag Labs/);
    await loginPage.login(testData.username, testData.password);
  });
});
