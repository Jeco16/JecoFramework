/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { logger } from '../utils/logger.js';
import * as failAssertions from '../assertions/fail.assertions.js';

/**
 * @module api/api.assertions
 * @description Domain-level assertions for API responses. These helpers wrap
 * `failAssertions.fail()` and emit logger events on success.
 */

/**
 * @typedef {Object} ApiResponse
 * @property {number} status
 * @property {boolean} ok
 * @property {any} json
 * @property {any} headers
 */

/**
 * Verify that the response status equals the expected status.
 * @param {ApiResponse} res
 * @param {number} expectedStatus
 */
export function verifyStatus(res, expectedStatus) {
  logger.info('Response: ' + JSON.stringify(res, null, 2));
  if (res.status !== expectedStatus) {
    failAssertions.fail(`Expected status ${expectedStatus} but got ${res.status}`);
  } else {
    logger.pass(`Received expected status: ${expectedStatus}`);
  }
}

/**
 * Verify that the response status is within the provided inclusive range.
 * @param {ApiResponse} res
 * @param {number} minStatus
 * @param {number} maxStatus
 */
export function verifyStatusInRange(res, minStatus, maxStatus) {
  logger.info('Response: ' + JSON.stringify(res, null, 2));
  if (res.status < minStatus || res.status > maxStatus) {
    failAssertions.fail(`Expected status in range ${minStatus}-${maxStatus} but got ${res.status}`);
  } else {
    logger.pass(`Received status in expected range: ${minStatus}-${maxStatus}`);
  }
}

/**
 * Verify that a given field exists in the parsed JSON body of the response.
 * @param {ApiResponse} res
 * @param {string} field
 */
export function verifyFieldExists(res, field) {
  logger.info('Response: ' + JSON.stringify(res, null, 2));
  if (!res.json || !(field in res.json)) {
    failAssertions.fail(`Expected field '${field}' to exist in response but it does not.`);
  } else {
    logger.pass(`Field '${field}' exists in response.`);
  }
}
