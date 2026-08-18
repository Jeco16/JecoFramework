/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { suite } from './suite.config.js';
import { test } from '../../fixtures/fixtures.js';

test.describe(suite.name, () => {
  test('[@e2e][@smoke] E2E_01 - login e logout with fixture', async ({
    basePage,
    templatePage,
  }) => {
    await basePage.open(suite.baseURL, /Swag Labs/);
    await templatePage.login(suite.env.credentials.USER_1, suite.env.credentials.PASSWORD);
    await templatePage.logout();
  });
});
