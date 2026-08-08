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
