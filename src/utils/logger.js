/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
const LEVELS = ['pass', 'debug', 'info', 'warn', 'error'];

/**
 * @module utils/logger
 * @description Lightweight runtime logger with optional per-test capture support.
 */

/**
 * @typedef {Object} LogEntry
 * @property {string} level - Log level (pass|debug|info|warn|error)
 * @property {string} msg - Log message
 * @property {any} meta - Optional metadata attached to the log
 * @property {string} time - ISO timestamp when the log was recorded
 */

function getLevelIndex() {
  const lvl = process.env.LOG_LEVEL ?? 'pass';
  const idx = LEVELS.indexOf(lvl);
  return idx === -1 ? LEVELS.indexOf('debug') : idx;
}

function format(level, msg, meta) {
  const time = new Date().toISOString();
  const m = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${time} [${level.toUpperCase()}] ${msg}${m}`;
}
function shouldLogToConsole() {
  try {
    if (typeof process.env.LOG_SILENT !== 'undefined') {
      if (String(process.env.LOG_SILENT).toLowerCase() === 'true') return false;
    }
    if (typeof process.env.LOG_TO_CONSOLE !== 'undefined') {
      return String(process.env.LOG_TO_CONSOLE).toLowerCase() !== 'false';
    }
  } catch (e) {
    // ignore and fall through to default
  }
  return true;
}

export const logger = {
  pass: (msg, meta) => {
    if (getLevelIndex() <= 0 && shouldLogToConsole()) console.log(format('PASS', msg, meta));
  },
  debug: (msg, meta) => {
    if (getLevelIndex() <= 1 && shouldLogToConsole()) console.debug(format('DEBUG', msg, meta));
  },
  info: (msg, meta) => {
    if (getLevelIndex() <= 2 && shouldLogToConsole()) console.log(format('INFO', msg, meta));
  },
  warn: (msg, meta) => {
    if (getLevelIndex() <= 3 && shouldLogToConsole()) console.warn(format('WARN', msg, meta));
  },
  error: (msg, meta) => {
    if (getLevelIndex() <= 4 && shouldLogToConsole()) console.error(format('ERROR', msg, meta));
  },
};
export default logger;

// Capture support: allow tests to start/stop capturing logs scoped by an id.
// This is used by fixtures to record logs per-test for the custom reporter.
const _captures = new Map();
function _pushCapture(id, level, msg, meta) {
  try {
    if (!_captures.has(id)) return;
    const arr = _captures.get(id);
    arr.push({ level, msg, meta, time: new Date().toISOString() });
  } catch (e) {
    // swallow
  }
}

export function startCapture(id) {
  /**
   * Start capturing logs for a given capture id.
   * The capture buffer can be retrieved with `stopCapture(id)`.
   * @param {string} id - Capture identifier (typically the testId)
   */
  if (!id) return;
  _captures.set(id, []);
}

export function stopCapture(id) {
  /**
   * Stop capturing logs for the given id and return captured entries.
   * @param {string} id - Capture identifier
   * @returns {LogEntry[]} captured logs
   */
  if (!id) return [];
  const out = _captures.get(id) || [];
  _captures.delete(id);
  return out;
}

// wrap existing methods to also push into capture buffer when active
const _wrap = (fn, levelName) => (msg, meta) => {
  _pushCapture(
    currentCaptureIdFromArgs(msg, meta) || currentCaptureIdFromEnv(),
    levelName,
    msg,
    meta
  );
  return fn(msg, meta);
};

// Helper to attempt extracting current capture id from meta (rare), fallback to env var
function currentCaptureIdFromArgs(_msg, meta) {
  try {
    if (meta && meta.__captureId) return String(meta.__captureId);
  } catch (e) {
    // ignore
  }
  return null;
}

function currentCaptureIdFromEnv() {
  return process.env.__JECO_CURRENT_CAPTURE_ID || null;
}

// Rebind logger methods to wrapped versions so captures receive entries.
logger.pass = _wrap(logger.pass, 'pass');
logger.debug = _wrap(logger.debug, 'debug');
logger.info = _wrap(logger.info, 'info');
logger.warn = _wrap(logger.warn, 'warn');
logger.error = _wrap(logger.error, 'error');

// Expose an env helper for use in fixtures where setting an env var is simpler.
export function setCaptureEnv(id) {
  /**
   * Helper to set the process env var used by fixtures to signal current capture id.
   * @param {string|null} id
   */
  if (id) process.env.__JECO_CURRENT_CAPTURE_ID = String(id);
  else delete process.env.__JECO_CURRENT_CAPTURE_ID;
}

export { _captures as __internal_captures };
