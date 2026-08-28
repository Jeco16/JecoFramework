/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/

// Environment-specific configuration (base URLs).
// Select the active environment via `ENV=<name>` (default: 'dev').
/**
 * @module config/env.config
 * @description Centralized environment configuration with runtime overrides.
 */

/**
 * @typedef {Object} EnvInfo
 * @property {string} name - active environment name
 * @property {string} baseURL - base URL for UI tests
 * @property {string} apiURL - base URL for API tests
 */
const environments = {
  // Define additional environments as needed for your application
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
};

function currentEnvName() {
  return process.env.ENV || process.env.NODE_ENV || 'dev';
}

export const env = {
  get name() {
    return currentEnvName();
  },
  get baseURL() {
    // Allow overriding the configured baseURL via environment variable `BASE_URL`.
    // This makes `.env.example` (BASE_URL) effective without changing code.
    return process.env.BASE_URL || (environments[currentEnvName()] || environments.dev).baseURL;
  },
  get apiURL() {
    // Allow overriding the configured apiURL via environment variable `API_BASE_URL`.
    return process.env.API_BASE_URL || (environments[currentEnvName()] || environments.dev).apiURL;
  },
};

export default env;
