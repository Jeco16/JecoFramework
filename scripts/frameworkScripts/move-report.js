/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import fs from "fs";
import path from "path";

// Auto-detect suite name and move Playwright HTML report's index.html
// Behavior:
// - If CLI arg or SUITE_NAME env provided, use it.
// - Otherwise, look for run-*/index.html produced by Playwright, and try to detect suite
//   by matching candidate suite names from tests/e2e/*/suite.config.js inside the HTML.
// - If single candidate exists, use that. Otherwise fall back to moving into a run-<ts> folder.

const root = path.resolve(process.cwd(), "playwright-report");
if (!fs.existsSync(root)) {
  console.log("playwright-report root does not exist, nothing to move.");
  process.exit(0);
}

const explicitSuite = process.argv[2] || process.env.SUITE_NAME;

function discoverCandidateSuites() {
  const candidates = [];
  const testsE2E = path.resolve(process.cwd(), "tests", "e2e");
  try {
    if (!fs.existsSync(testsE2E)) return candidates;
    for (const dir of fs.readdirSync(testsE2E)) {
      const cfg = path.join(testsE2E, dir, "suite.config.js");
      if (!fs.existsSync(cfg)) continue;
      try {
        const content = fs.readFileSync(cfg, "utf8");
        const m = content.match(/name\s*:\s*['"]([^'"]+)['"]/);
        if (m && m[1]) candidates.push(m[1]);
        else candidates.push(dir);
      } catch (e) {
        candidates.push(dir);
      }
    }
  } catch (e) {
    /* ignore */
  }
  return candidates;
}

const candidates = discoverCandidateSuites();

const runs = fs
  .readdirSync(root)
  .filter(
    (n) =>
      n.startsWith("run-") && fs.statSync(path.join(root, n)).isDirectory(),
  );

function ensureSuiteDir(name) {
  const suiteDir = path.join(root, name);
  if (!fs.existsSync(suiteDir)) fs.mkdirSync(suiteDir, { recursive: true });
  return suiteDir;
}

function copyDirSync(src, dst) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dst, entry);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) copyDirSync(s, d);
    else fs.copyFileSync(s, d);
  }
}

function preserveAttachmentsAndRemove(runPath, suiteDir, runName) {
  try {
    // copy attachments directory (if present) into suiteDir/attachments
    // (placed directly under suiteDir so relative paths in index.html remain valid)
    const attachmentsSrc = path.join(runPath, "attachments");
    if (
      fs.existsSync(attachmentsSrc) &&
      fs.statSync(attachmentsSrc).isDirectory()
    ) {
      const attachmentsDst = path.join(suiteDir, "attachments");
      copyDirSync(attachmentsSrc, attachmentsDst);
      console.log(`Copied attachments from ${runPath} -> ${attachmentsDst}`);
    }
    // copy any other non-index files (assets) into suiteDir to preserve paths
    const others = fs
      .readdirSync(runPath)
      .filter((n) => n !== "index.html" && n !== "attachments");
    if (others.length > 0) {
      for (const o of others) {
        const s = path.join(runPath, o);
        const d = path.join(suiteDir, o);
        const stat = fs.statSync(s);
        if (stat.isDirectory()) copyDirSync(s, d);
        else {
          if (!fs.existsSync(suiteDir))
            fs.mkdirSync(suiteDir, { recursive: true });
          fs.copyFileSync(s, d);
        }
      }
      console.log(
        `Copied additional run assets from ${runPath} -> ${suiteDir}`,
      );
    }
    // now remove the run folder
    fs.rmSync(runPath, { recursive: true, force: true });
    console.log(
      `Removed run folder ${runPath} after preserving attachments/assets`,
    );
  } catch (e) {
    console.warn("Failed to preserve attachments for", runPath, e);
    try {
      fs.rmSync(runPath, { recursive: true, force: true });
    } catch (er) {}
  }
}

function moveIndex(srcIndexPath, suiteName) {
  const suiteDir = ensureSuiteDir(suiteName);
  const dst = path.join(suiteDir, "index.html");
  try {
    fs.renameSync(srcIndexPath, dst);
  } catch (e) {
    fs.copyFileSync(srcIndexPath, dst);
    fs.unlinkSync(srcIndexPath);
  }
}

// If explicit suite provided, move everything there
if (explicitSuite) {
  ensureSuiteDir(explicitSuite);
  const rootIndex = path.join(root, "index.html");
  if (fs.existsSync(rootIndex)) {
    try {
      moveIndex(rootIndex, explicitSuite);
      console.log(`Moved index.html into playwright-report/${explicitSuite}`);
    } catch (e) {
      console.error("Failed moving root index.html:", e);
    }
  }
  for (const r of runs) {
    const runIndex = path.join(root, r, "index.html");
    if (!fs.existsSync(runIndex)) continue;
    try {
      moveIndex(runIndex, explicitSuite);
      // Only remove run-* folders to avoid accidentally deleting suite folders
      const targetRunPath = path.join(root, r);
      if (r.startsWith("run-")) {
        console.log(
          "Preserving attachments then removing run folder:",
          targetRunPath,
        );
        try {
          preserveAttachmentsAndRemove(
            targetRunPath,
            path.join(root, explicitSuite),
            r,
          );
          console.log(
            `Moved ${r}/index.html into playwright-report/${explicitSuite} and removed ${r}`,
          );
        } catch (e) {
          console.warn("Failed removing run folder", r, e);
        }
      } else {
        console.log(
          `Moved ${r}/index.html into playwright-report/${explicitSuite} (did not remove ${r} because it is not a run-* folder)`,
        );
      }
    } catch (e) {
      console.warn("Error moving from", r, e);
    }
  }
  process.exit(0);
}

if (runs.length === 0) {
  // nothing to do
  // If there's an index in root and a single candidate, move it
  const rootIndex = path.join(root, "index.html");
  if (fs.existsSync(rootIndex) && candidates.length === 1) {
    moveIndex(rootIndex, candidates[0]);
    console.log(
      `Moved root index.html into playwright-report/${candidates[0]}`,
    );
    process.exit(0);
  }

  // If any suite folder already contains index.html, nothing to move — report exists
  const existingSuites = [];
  for (const c of candidates) {
    const p = path.join(root, c, "index.html");
    if (fs.existsSync(p)) existingSuites.push(c);
  }
  if (existingSuites.length > 0) {
    console.log(
      `Report already present in suite folder(s): ${existingSuites.join(", ")}; nothing to move.`,
    );
    process.exit(0);
  }

  console.log(
    "No run-* folders found and no explicit suite provided — nothing to move.",
  );
  process.exit(0);
}

for (const r of runs) {
  const runIndex = path.join(root, r, "index.html");
  if (!fs.existsSync(runIndex)) continue;
  let moved = false;
  try {
    const content = fs.readFileSync(runIndex, "utf8");
    for (const c of candidates) {
      if (content.includes(c)) {
        moveIndex(runIndex, c);
        const targetRunPath = path.join(root, r);
        if (r.startsWith("run-")) {
          console.log(
            "Preserving attachments then removing run folder (detected candidate):",
            targetRunPath,
          );
          try {
            preserveAttachmentsAndRemove(targetRunPath, path.join(root, c), r);
          } catch (e) {}
        }
        console.log(
          `Detected suite '${c}' in ${r}; moved index.html into playwright-report/${c} and removed ${r}`,
        );
        moved = true;
        break;
      }
    }
    if (moved) continue;
    if (candidates.length === 1) {
      moveIndex(runIndex, candidates[0]);
      const targetRunPath = path.join(root, r);
      if (r.startsWith("run-")) {
        console.log(
          "Preserving attachments then removing run folder (single candidate):",
          targetRunPath,
        );
        try {
          preserveAttachmentsAndRemove(
            targetRunPath,
            path.join(root, candidates[0]),
            r,
          );
        } catch (e) {}
      }
      console.log(
        `Single candidate '${candidates[0]}' used for ${r}; moved into playwright-report/${candidates[0]}`,
      );
      continue;
    }
    // fallback: use the run folder name as suite name
    const fallback = r;
    moveIndex(runIndex, fallback);
    try {
      const targetRunPath = path.join(root, r);
      if (r.startsWith("run-")) {
        console.log("Removing run folder (fallback):", targetRunPath);
        fs.rmSync(targetRunPath, { recursive: true, force: true });
      }
    } catch (e) {}
    try {
      const targetRunPath = path.join(root, r);
      if (r.startsWith("run-")) {
        console.log(
          "Preserving attachments then removing run folder (fallback):",
          targetRunPath,
        );
        preserveAttachmentsAndRemove(
          targetRunPath,
          path.join(root, fallback),
          r,
        );
      }
    } catch (e) {}
    console.log(
      `Could not detect suite for ${r}; moved index.html into playwright-report/${fallback}`,
    );
  } catch (e) {
    console.warn("Error processing", r, e);
  }
}
