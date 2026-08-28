/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { env } from '../../src/config/env.config.js';
import { test } from '../fixtures/fixtures.js';

test.describe('Restful Booker - API', () => {
  test('@smoke API_01 - Example login flow [METHOD POST]', async ({ api, testData }) => {
    const credentials = {
      username: testData.username,
      password: testData.password,
    };
    const loginRes = await api.post(`${env.apiURL}auth`, credentials);
    api.verifyStatus(loginRes, testData.expectedStatus);
    api.verifyFieldExists(loginRes, testData.expectedField);
  });

  test(' API_02 - Example of get bookings [METHOD GET]', async ({ api, testData }) => {
    const res = await api.get(`${env.apiURL}booking`);
    api.verifyStatusInRange(res, testData.minRange, testData.maxRange);
  });

  test(' API_03 - Example of get booking with specific ID [METHOD GET]', async ({
    api,
    testData,
  }) => {
    const res = await api.get(`${env.apiURL}booking/1`);
    api.verifyStatusInRange(res, testData.minRange, testData.maxRange);
  });

  test(' API_04 - Example of creation of new booking [METHOD POST]', async ({ api, testData }) => {
    const newBooking = testData.requestBody;
    const res = await api.post(`${env.apiURL}booking`, newBooking);
    api.verifyStatusInRange(res, testData.minRange, testData.maxRange);
  });
});
