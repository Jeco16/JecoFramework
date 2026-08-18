/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export const suite = {
  name: process.env.SUITE_NAME || 'suiteTemplate',
  owner: 'Jacopo Enrico Marinaccio',
  // Tags: include an env tag like 'env:dev' or plain 'dev' to select environment
  tags: ['env:dev'],
  env: {
    credentials: {
      USER_1: 'standard_user',
      USER_2: 'locked_out_user',
      USER_3: 'problem_user',
      USER_4: 'performance_glitch_user',
      USER_5: 'error_user',
      USER_6: 'visual_user',
      API_USER_1: 'admin',
      API_PASSWORD: 'password123',
      PASSWORD: 'secret_sauce',
    },
    dev: {
      baseURL: 'https://www.saucedemo.com/',
      apiURL: 'https://restful-booker.herokuapp.com/',
    },
    qa: {
      baseURL: 'https://www.saucedemo.com/',
      apiURL: 'https://restful-booker.herokuapp.com/',
    },
    prod: {
      baseURL: 'https://www.saucedemo.com/',
      apiURL: 'https://restful-booker.herokuapp.com/',
    },
    preprod: {
      baseURL: 'https://www.saucedemo.com/',
      apiURL: 'https://restful-booker.herokuapp.com/',
    },
  },
};

// runtime getter for suite.baseURL: reads based on process.env.ENV (set by run-suite.js from tags)
Object.defineProperty(suite, 'baseURL', {
  get() {
    const env = process.env.ENV || process.env.NODE_ENV || 'dev';
    const e = this.env && this.env[env];
    return (
      (e && e.baseURL) ||
      (this.env && this.env.dev && this.env.dev.baseURL) ||
      'https://www.saucedemo.com/'
    );
  },
  enumerable: true,
});

// runtime getter for suite.apiURL: reads based on process.env.ENV (set by run-suite.js from tags)
Object.defineProperty(suite, 'apiURL', {
  get() {
    const env = process.env.ENV || process.env.NODE_ENV || 'dev';
    const e = this.env && this.env[env];
    return (
      (e && e.apiURL) ||
      (this.env && this.env.dev && this.env.dev.apiURL) ||
      ''
    );
  },
  enumerable: true,
});

export default defineConfig({
  reporters: [
    ['list'], // Keeping the existing reporter
    [
      'html',
      {
        outputFolder: path.resolve(process.cwd(), 'playwright-report', suite.name),
        open: 'never',
      },
    ], // Adding HTML reporter
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
