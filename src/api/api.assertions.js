/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { logger } from '../utils/logger.js';
import * as failAssertions from '../assertions/fail.assertions.js';

// Domain assertions for API responses, kept separate from the transport layer (ApiClient).

export function verifyStatus(res, expectedStatus) {
  if (res.status !== expectedStatus) {
    failAssertions.fail(`Expected status ${expectedStatus} but got ${res.status}`);
  } else {
    logger.pass(`Received expected status: ${expectedStatus}`);
  }
}

export function verifyStatusInRange(res, minStatus, maxStatus) {
  if (res.status < minStatus || res.status > maxStatus) {
    failAssertions.fail(`Expected status in range ${minStatus}-${maxStatus} but got ${res.status}`);
  } else {
    logger.pass(`Received status in expected range: ${minStatus}-${maxStatus}`);
  }
}

export function verifyFieldExists(res, field) {
  if (!res.json || !(field in res.json)) {
    failAssertions.fail(`Expected field '${field}' to exist in response but it does not.`);
  } else {
    logger.pass(`Field '${field}' exists in response.`);
  }
}
