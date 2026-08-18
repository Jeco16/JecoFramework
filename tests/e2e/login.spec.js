/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { env } from '../../src/config/env.config.js';
import { test } from '../fixtures/fixtures.js';

test.describe('Saucedemo - E2E', () => {
  test('@smoke E2E_01 - login e logout con fixture', async ({ basePage, loginPage }) => {
    await basePage.open(env.baseURL, /Swag Labs/);
    await loginPage.login(env.credentials.USER_1, env.credentials.PASSWORD);
    await loginPage.logout();
  });
});
