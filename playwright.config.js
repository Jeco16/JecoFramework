/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/

// Single source of truth for Playwright configuration.
// Environments are selected via `ENV=<name>` (see src/config/env.config.js); browser/test-type
// separation is handled natively via `projects`, no custom suite runner required.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  outputDir: 'artifacts',
  testDir: 'tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    headless: process.env.HEADLESS === 'true',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'e2e',
      testDir: 'tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: 'tests/api',
      use: {},
    },
    // Additional projects can be defined here for different browsers, devices, or test types.
  ],
});
