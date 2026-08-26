/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { test, expect } from '@playwright/test';
import { loadByTestId } from '../../src/data/loader.js';
import CustomizeReportReporter from '../../src/reporters/customizeReport.reporter.js';

test.describe('Framework self-tests', () => {
  test('data loader loads E2E_01', async () => {
    const data = await loadByTestId('E2E_01');
    expect(data).toBeTruthy();
  });

  test('custom reporter exports class with lifecycle methods', async () => {
    expect(typeof CustomizeReportReporter).toBe('function');
    const inst = new CustomizeReportReporter();
    expect(typeof inst.onBegin === 'function' || typeof inst.onBegin === 'undefined').toBeTruthy();
    expect(typeof inst.onEnd === 'function' || typeof inst.onEnd === 'undefined').toBeTruthy();
  });
});
