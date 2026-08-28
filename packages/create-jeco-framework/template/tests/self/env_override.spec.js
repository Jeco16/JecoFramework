import test, { expect } from '@playwright/test';
import { env } from '../../src/config/env.config.js';

test('env override via BASE_URL and API_BASE_URL', async () => {
  // set env vars and assert getters prefer them
  process.env.BASE_URL = 'https://example.test/';
  process.env.API_BASE_URL = 'https://api.example.test/';

  expect(env.baseURL).toBe('https://example.test/');
  expect(env.apiURL).toBe('https://api.example.test/');
});
