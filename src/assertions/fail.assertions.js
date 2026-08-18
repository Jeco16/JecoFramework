// Fail assertions utilities for tests
// Exported helpers intentionally minimal and synchronous where possible.
export function fail(message) {
  throw new Error(message);
}

export default {
  fail,
};
