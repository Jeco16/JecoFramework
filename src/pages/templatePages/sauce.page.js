import { expect } from '@playwright/test';
import { logger } from '../../utils/frameworkUtils/logger.js';
import { BasePage } from '../frameworkPages/base.page.js';

export class SaucePage extends BasePage {
  constructor(page) {
    super(page);
  }

  async logout() {
    await this.click('#react-burger-menu-btn');
    await this.click('#logout_sidebar_link');
    if (await this.isVisible('#login-button')) {
      logger.pass('Logout effettuato con successo');
    } else {
      logger.error('Logout fallito - controllare lo stato della pagina');
    }
  }
}