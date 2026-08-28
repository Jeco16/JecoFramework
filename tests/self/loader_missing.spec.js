import test, { expect } from '@playwright/test';
import { loadByTestId } from '../../src/data/loader.js';

test('loadByTestId returns empty object for non-existent test id', async () => {
  const res = await loadByTestId('NON_EXISTENT_TEST_9999');
  expect(res).toEqual({});
});
