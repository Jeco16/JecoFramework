/**
 * Copyright 2026 JecoFramework
 * Licensed under the Apache License, Version 2.0.
 * See LICENSE file in the project root for license information.
 */
import { expect } from '@playwright/test';
import { logger } from '../../utils/frameworkUtils/logger.js';
import { BasePage } from '../frameworkPages/base.page.js';

export class LoginPage extends BasePage {
  
  constructor(page) {
    super(page);
  }

  async open(url) { 
    await this.goto(url); 
    await this.expectTitle(/Swag Labs/);
    logger.debug('Apro la pagina di login');
  }

  async login(user, pass) {
    await this.fill('#user-name', user);
    logger.debug('Inserisco username: ' + user);
    await this.fill('#password', pass);
    logger.debug('Inserisco password: ' + pass);
    await this.click('#login-button');    
    if (await this.isVisible('.inventory_list')) {
      logger.pass('Login effettuato con successo');
    } else {
      logger.error('Login fallito - controllare le credenziali');
    }
  }
  
}