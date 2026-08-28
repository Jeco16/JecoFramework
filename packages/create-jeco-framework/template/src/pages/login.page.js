/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { BasePage } from './base.page.js';
import * as failAssertions from '../assertions/fail.assertions.js';
import { logger } from '../utils/logger.js';

/**
 * @module pages/login.page
 * @description Page object modeling the login flow for the demo app.
 */

/**
 * @class LoginPage
 * @extends BasePage
 */
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

  /**
   * Perform login flow using provided credentials.
   * Throws via `failAssertions.fail()` when login doesn't appear successful.
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    logger.info(`Attempting to login with username: ${username}`);
    await this.highlightAndFill(this.userInput, username);
    await this.highlightAndFill(this.passwordInput, password);
    await this.highlightAndClick(this.loginButton);
    if (await this.isVisible(this.inventoryList)) {
      logger.pass(`Login successful for username: ${username}`);
    } else {
      failAssertions.fail(`Login failed for username: ${username}`);
    }
  }

  /**
   * Perform logout flow and assert user input is visible again.
   */
  async logout() {
    logger.info(`Attempting to logout`);
    await this.highlightAndClick(this.clickMenuButton);
    await this.highlightAndClick(this.clickLogoutButton);
    if (await this.isVisible(this.userInput)) {
      logger.pass(`Logout successful`);
    } else {
      failAssertions.fail(`Logout failed`);
    }
  }
}
