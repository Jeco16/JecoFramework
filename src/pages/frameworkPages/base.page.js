/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { expect } from "@playwright/test";

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  locator(sel) {
    return this.page.locator(sel);
  }

  async goto(path = "/") {
    await this.page.goto(path);
  }

  async click(sel, options) {
    await this.locator(sel).click(options);
  }

  async fill(sel, value, options) {
    await this.locator(sel).fill(value, options);
  }

  async text(sel) {
    return this.locator(sel).textContent();
  }

  async isVisible(sel) {
    return this.locator(sel).isVisible();
  }

  async expectTitle(title) {
    await expect(this.page).toHaveTitle(title);
  }
}
