/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { suite } from './suite.config.js';
import { logger } from '../../../src/utils/frameworkUtils/logger.js';
import { test, expect } from '../../fixtures/fixtures.js';

test.describe(suite.name, () => {
  test('Test template 001 - login e logout with fixture', async ({basePage, templatePage}) => {

    await basePage.open(suite.baseURL, /Swag Labs/);
    await templatePage.login(suite.env.USER_1, suite.env.PASS);
    await templatePage.logout();
    
  });
});
