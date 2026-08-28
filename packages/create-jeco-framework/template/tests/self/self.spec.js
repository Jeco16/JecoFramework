/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { test, expect } from '@playwright/test';
import { loadByTestId } from '../../src/data/loader.js';

test.describe('Framework self-tests', () => {
  test('data loader loads E2E_01', async () => {
    const data = await loadByTestId('E2E_01');
    expect(data).toBeTruthy();
  });

  test('sanity: template self test placeholder', async () => {
    // placeholder assertion for the scaffold template self-tests
    expect(1 + 1).toBe(2);
  });
});
