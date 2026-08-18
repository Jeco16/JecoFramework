/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { suite } from './suite.config.js';
import { test, expect } from '../../fixtures/fixtures.js';

test.describe(`${suite.name} - API`, () => {

  test('[@api][@smoke] API_01 - Example login flow [METHOD POST]', async ({ api }) => {
    const credentials = {
      username: suite.env.credentials.API_USER_1,
      password: suite.env.credentials.API_PASSWORD,
    };
    const loginRes = await api.post(suite.apiURL+"auth", credentials);
    await api.verifyStatus(loginRes, 200);
    await api.verifyFieldExists(loginRes, 'token');
  });

  test('[@api] API_02 - Example of get bookings [METHOD GET]', async ({ api }) => {    
    const res = await api.get(suite.apiURL+"booking");
    await api.verifyStatusInRange(res, 200, 299);
  });

  test('[@api] API_03 - Example of get booking with specific ID [METHOD GET]', async ({ api }) => {
    const res = await api.get(suite.apiURL+"booking/1");
    await api.verifyStatusInRange(res, 200, 299);
  });

  test('[@api] API_04 - Example of creation of new booking [METHOD POST]', async ({ api }) => {
    const newBooking = {
      firstname: "John",
      lastname: "Doe",
      totalprice: 123,
      depositpaid: true,
      bookingdates: {
        checkin: "2024-01-01",
        checkout: "2024-01-10"
      },
      additionalneeds: "Breakfast"
    };
    const res = await api.post(suite.apiURL+"booking", newBooking);
    await api.verifyStatusInRange(res, 200, 299);
  });

});
