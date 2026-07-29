/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { suite } from './suite.config.js';
import { logger } from '../../../src/utils/frameworkUtils/logger.js';
import { test, expect } from '../../fixtures/frameworkFixtures/base.fixture.js';

test.describe(suite.name, () => {
  test('Test template 001 - login e logout with base page fixture', async ({ basePage }) => {

    logger.info('Start browser and open login page');
    await basePage.goto(suite.baseURL);
    await basePage.fill('#user-name', suite.env.USER_1);
    logger.debug('Inserisco username: ' + suite.env.USER_1);
    await basePage.fill('#password', suite.env.PASS);
    logger.debug('Inserisco password: ' + suite.env.PASS);
    await basePage.click('#login-button');   
     
    if (await basePage.isVisible('.inventory_list')) {
      logger.pass('Login effettuato con successo');
    } else {
      logger.error('Login fallito - controllare le credenziali');
    }

  });
});
