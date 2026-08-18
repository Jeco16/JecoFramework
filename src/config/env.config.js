/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/

// Environment-specific configuration (base URLs).
// Select the active environment via `ENV=<name>` (default: 'dev').
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
    return (environments[currentEnvName()] || environments.dev).baseURL;
  },
  get apiURL() {
    return (environments[currentEnvName()] || environments.dev).apiURL;
  },
};

export default env;
