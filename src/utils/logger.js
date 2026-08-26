/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
const LEVELS = ['pass', 'debug', 'info', 'warn', 'error'];

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

export const logger = {
  pass: (msg, meta) => {
    if (getLevelIndex() <= 0) console.log(format('PASS', msg, meta));
  },
  debug: (msg, meta) => {
    if (getLevelIndex() <= 1) console.debug(format('DEBUG', msg, meta));
  },
  info: (msg, meta) => {
    if (getLevelIndex() <= 2) console.log(format('INFO', msg, meta));
  },
  warn: (msg, meta) => {
    if (getLevelIndex() <= 3) console.warn(format('WARN', msg, meta));
  },
  error: (msg, meta) => {
    if (getLevelIndex() <= 4) console.error(format('ERROR', msg, meta));
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
  if (!id) return;
  _captures.set(id, []);
}

export function stopCapture(id) {
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
  if (id) process.env.__JECO_CURRENT_CAPTURE_ID = String(id);
  else delete process.env.__JECO_CURRENT_CAPTURE_ID;
}

export { _captures as __internal_captures };
