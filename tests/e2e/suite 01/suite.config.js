/*
      Copyright 2026 Jacopo Enrico Marinaccio
      Licensed under the Apache License, Version 2.0
      You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
      */
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export const suite = {
  name: process.env.SUITE_NAME || 'suite 01',
  owner: '//Define your name here',
  tags: ['end.dev'], // Define your tags here, e.g., 'env:dev' or 'dev'
  env: {
    credentials: {
      // Define your credentials here
    },
    dev: {
      baseURL: '//define your dev baseURL here',
    },
    qa: {
      baseURL: '//define your qa baseURL here',
    },
    prod: {
      baseURL: '//define your prod baseURL here',
    },
    preprod: {
      baseURL: '//define your preprod baseURL here',
    },
    // Add more environments as needed
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
      '//define your default baseURL here'
    );
  },
  enumerable: true,
});

export default defineConfig({
  reporters: [
    ['list'],
    [
      'html',
      {
        outputFolder: path.resolve(process.cwd(), 'playwright-report', 'suite 01'),
        open: 'never',
      },
    ],
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
