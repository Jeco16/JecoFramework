//DEFAULT PLAYWRIGHT CONFIGURATION FILE
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  outputDir: 'artifacts',
  testDir: 'tests',
  use: {
    headless: process.env.HEADLESS === 'true',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  reporters: [ ['list'] ]
});
