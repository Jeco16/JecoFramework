/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { expect } from '@playwright/test';

/**
 * @module pages/base.page
 * @description Base page object providing small helpers for interaction and assertions.
 */

/**
 * @class BasePage
 * @param {import('@playwright/test').Page} page - Playwright Page instance
 */
export class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Return a Playwright locator for a selector.
   * @param {string} sel
   * @returns {import('@playwright/test').Locator}
   */
  locator(sel) {
    return this.page.locator(sel);
  }

  /**
   * Navigate to a path (relative or absolute) and wait a short moment.
   * @param {string} [path='/']
   */
  async goto(path = '/') {
    await this.page.goto(path);
    await this.page.waitForTimeout(100);
  }

  /**
   * Click a selector and wait briefly.
   * @param {string} sel
   * @param {import('@playwright/test').LocatorClickOptions} [options]
   */
  async click(sel, options) {
    await this.locator(sel).click(options);
    await this.page.waitForTimeout(100);
  }

  /**
   * Fill an input selector and wait briefly.
   * @param {string} sel
   * @param {string} value
   * @param {import('@playwright/test').LocatorFillOptions} [options]
   */
  async fill(sel, value, options) {
    await this.locator(sel).fill(value, options);
    await this.page.waitForTimeout(100);
  }

  /**
   * Get text content of an element.
   * @param {string} sel
   * @returns {Promise<string|null>}
   */
  async text(sel) {
    return this.locator(sel).textContent();
  }

  /**
   * Check visibility of a selector.
   * @param {string} sel
   * @returns {Promise<boolean>}
   */
  async isVisible(sel) {
    return this.locator(sel).isVisible();
  }

  /**
   * Temporarily highlight an element (for debugging/visual clarity).
   * @param {string} sel
   * @param {number} [duration=600] ms
   * @param {string} [color='rgba(99,102,241,0.75)']
   */
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

  /**
   * Highlight an element and click it.
   * @param {string} sel
   * @param {import('@playwright/test').LocatorClickOptions} [options]
   */
  async highlightAndClick(sel, options) {
    await this.highlight(sel, 600);
    await this.click(sel, options);
    await this.page.waitForTimeout(100); // small delay to allow for UI updates
  }

  /**
   * Highlight an element and fill it with a value.
   * @param {string} sel
   * @param {string} value
   * @param {import('@playwright/test').LocatorFillOptions} [options]
   */
  async highlightAndFill(sel, value, options) {
    await this.highlight(sel, 600);
    await this.fill(sel, value, options);
    await this.page.waitForTimeout(100);
  }

  /**
   * Assert that the current page title equals the provided string.
   * @param {string} title
   */
  async expectTitle(title) {
    await expect(this.page).toHaveTitle(title);
  }
}
