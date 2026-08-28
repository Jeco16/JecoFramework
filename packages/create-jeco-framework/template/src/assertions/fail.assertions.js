/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/

/**
 * @module assertions/fail.assertions
 * @description Minimal helpers that force a test failure by throwing an Error.
 * Keeping these synchronous and tiny avoids coupling to test frameworks.
 */

/**
 * Throw a test-failing Error with the provided message.
 * Use this from higher-level assertion helpers to standardize failure behavior.
 * @param {string} message - Failure message
 * @throws {Error}
 */
export function fail(message) {
  throw new Error(message);
}

export default {
  fail,
};
