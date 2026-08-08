/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { test as base } from "@playwright/test";
import { BasePage } from "../../src/pages/frameworkPages/base.page.js";
import { LoginPage } from "../../src/pages/templatePages/template.page.js";
import { logger } from "../../src/utils/frameworkUtils/logger.js";

export const test = base.extend({
  // Base fixture for the base page -------------
  basePage: async ({ page }, use) => {
    const basePageInstance = new BasePage(page);

    basePageInstance.open = async (url, title) => {
      await basePageInstance.goto(url);
      await basePageInstance.expectTitle(title);
      logger.info(`Opened URL: ${url} and verified title: ${title}`);
    };

    await use(basePageInstance);
  },

  //Custom fixture -------------------------------

  templatePage: async ({ page }, use) => {
    const templatePageInstance = new LoginPage(page);

    templatePageInstance.login = async (username, password) => {
      logger.info(`Attempting to login with username: ${username}`);
      await templatePageInstance.fill(templatePageInstance.userInput, username);
      await templatePageInstance.fill(
        templatePageInstance.passwordInput,
        password,
      );
      await templatePageInstance.click(templatePageInstance.loginButton);
      if (
        await templatePageInstance.isVisible(templatePageInstance.inventoryList)
      ) {
        logger.pass(`Login successful for username: ${username}`);
      } else {
        logger.error(`Login failed for username: ${username}`);
      }
    };

    templatePageInstance.logout = async () => {
      logger.info(`Attempting to logout`);
      await templatePageInstance.click(templatePageInstance.clickMenuButton);
      await templatePageInstance.click(templatePageInstance.clickLogoutButton);
      if (
        await templatePageInstance.isVisible(templatePageInstance.userInput)
      ) {
        logger.pass(`Logout successful`);
      } else {
        logger.error(`Logout failed`);
      }
    };

    await use(templatePageInstance);
  },

  // Add more fixtures here if needed
});
export { expect } from "@playwright/test";
