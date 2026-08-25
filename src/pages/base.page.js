/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { expect } from '@playwright/test';

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  locator(sel) {
    return this.page.locator(sel);
  }

  async goto(path = '/') {
    await this.page.goto(path);
    await this.page.waitForTimeout(100);
  }

  async click(sel, options) {
    await this.locator(sel).click(options);
    await this.page.waitForTimeout(100);
  }

  async fill(sel, value, options) {
    await this.locator(sel).fill(value, options);
    await this.page.waitForTimeout(100);
  }

  async text(sel) {
    return this.locator(sel).textContent();
  }

  async isVisible(sel) {
    return this.locator(sel).isVisible();
  }

  async highlight(sel, duration = 600, color = 'rgba(99,102,241,0.75)') {
    try {
      await this.locator(sel).evaluate(
        (el, params) => {
          const { duration, color } = params;
          //const prev = el.getAttribute('data-prev-style') || '';
          el.setAttribute('data-prev-style', el.getAttribute('style') || '');
          el.style.transition = 'box-shadow 0.12s ease, outline 0.12s ease';
          el.style.boxShadow = `0 0 0 4px ${color}`;
          el.style.outline = `2px solid ${color}`;
          setTimeout(() => {
            try {
              el.setAttribute('style', el.getAttribute('data-prev-style') || '');
            } catch (e) {
              // swallow errors to avoid breaking tests if highlight fails
            }
            el.removeAttribute('data-prev-style');
          }, duration);
        },
        { duration, color }
      );
    } catch (e) {
      // swallow errors to avoid breaking tests if highlight fails
    }
  }

  async highlightAndClick(sel, options) {
    await this.highlight(sel, 600);
    await this.click(sel, options);
    await this.page.waitForTimeout(100); // small delay to allow for UI updates
  }

  async highlightAndFill(sel, value, options) {
    await this.highlight(sel, 600);
    await this.fill(sel, value, options);
    await this.page.waitForTimeout(100);
  }

  async expectTitle(title) {
    await expect(this.page).toHaveTitle(title);
  }
}
