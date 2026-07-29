/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { test as base } from '@playwright/test';
import { BasePage } from '../../../src/pages/frameworkPages/base.page.js';

export const test = base.extend({
  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  },
});
export { expect } from '@playwright/test';