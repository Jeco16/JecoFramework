/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { expect } from '@playwright/test';
import { logger } from '../../utils/frameworkUtils/logger.js';
import { BasePage } from '../frameworkPages/base.page.js';

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    this.userInput = '#user-name';
    this.passwordInput = '#password';
    this.loginButton = '#login-button';
    this.inventoryList = '.inventory_list';
    this.clickLogoutButton = '#logout_sidebar_link';
    this.clickMenuButton = '#react-burger-menu-btn';
  }
}
