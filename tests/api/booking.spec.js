/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { env } from '../../src/config/env.config.js';
import { test } from '../fixtures/fixtures.js';

test.describe('Restful Booker - API', () => {
  test('@smoke API_01 - Example login flow [METHOD POST]', async ({ api }) => {
    const credentials = {
      username: env.credentials.API_USER_1,
      password: env.credentials.API_PASSWORD,
    };
    const loginRes = await api.post(`${env.apiURL}auth`, credentials);
    api.verifyStatus(loginRes, 200);
    api.verifyFieldExists(loginRes, 'token');
  });

  test(' API_02 - Example of get bookings [METHOD GET]', async ({ api }) => {
    const res = await api.get(`${env.apiURL}booking`);
    api.verifyStatusInRange(res, 200, 299);
  });

  test(' API_03 - Example of get booking with specific ID [METHOD GET]', async ({ api }) => {
    const res = await api.get(`${env.apiURL}booking/1`);
    api.verifyStatusInRange(res, 200, 299);
  });

  test(' API_04 - Example of creation of new booking [METHOD POST]', async ({ api }) => {
    const newBooking = {
      firstname: 'John',
      lastname: 'Doe',
      totalprice: 123,
      depositpaid: true,
      bookingdates: {
        checkin: '2024-01-01',
        checkout: '2024-01-10',
      },
      additionalneeds: 'Breakfast',
    };
    const res = await api.post(`${env.apiURL}booking`, newBooking);
    api.verifyStatusInRange(res, 200, 299);
  });
});
