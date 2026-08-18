/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.resolve('src/data');

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function findFileRecursive(dir, filename) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isFile() && e.name === filename) return p;
    if (e.isDirectory()) {
      const found = await findFileRecursive(p, filename);
      if (found) return found;
    }
  }
  return null;
}

export async function loadByTestId(testId) {
  if (!testId) return {};
  const filename = `${testId}.json`;
  const direct = path.join(DATA_DIR, filename);
  if (await exists(direct)) {
    const raw = await fs.readFile(direct, 'utf8');
    return JSON.parse(raw);
  }
  const found = await findFileRecursive(DATA_DIR, filename);
  if (found) {
    const raw = await fs.readFile(found, 'utf8');
    return JSON.parse(raw);
  }
  // fallback: check folder testId/data.json
  const alt = path.join(DATA_DIR, testId, 'data.json');
  if (await exists(alt)) {
    const raw = await fs.readFile(alt, 'utf8');
    return JSON.parse(raw);
  }
  return {};
}

export default { loadByTestId };
