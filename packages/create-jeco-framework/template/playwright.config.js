/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/

// Single source of truth for Playwright configuration.
// Environments are selected via `ENV=<name>` (see src/config/env.config.js); browser/test-type
// separation is handled natively via `projects`, no custom suite runner required.
import { defineConfig, devices } from '@playwright/test';
import os from 'os';
import path from 'path';
import 'dotenv/config';

export default defineConfig({
  // Set `CREATE_ARTIFACTS=true` to enable artifacts folder creation, otherwise
  // leave undefined so Playwright won't write the top-level `artifacts` folder.
  // Use `artifacts` only when explicitly requested; otherwise write runtime
  // artifacts into a system temp directory to avoid polluting the repo root.
  outputDir:
    process.env.CREATE_ARTIFACTS === 'true'
      ? 'artifacts'
      : path.join(os.tmpdir(), `jeco-playwright-${Date.now()}`),
  testDir: 'tests',
  fullyParallel: true,
  // Add custom reporter module to customize HTML report without external scripts.
  reporter: [['list'], ['./src/reporters/customizeReport.reporter.js']],
  use: {
    headless: process.env.HEADLESS === 'true',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
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
      use: {
        headless: true,
        screenshot: 'off',
        video: 'off',
      },
    },
    {
      name: 'self',
      testDir: 'tests/self',
      use: {
        headless: true,
        screenshot: 'off',
        video: 'off',
      },
    },
    // Additional projects can be defined here for different browsers, devices, or test types.
  ],
});
