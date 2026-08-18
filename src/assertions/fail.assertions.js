/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/

// Fail assertions utilities for tests
// Exported helpers intentionally minimal and synchronous where possible.
export function fail(message) {
  throw new Error(message);
}

export default {
  fail,
};
