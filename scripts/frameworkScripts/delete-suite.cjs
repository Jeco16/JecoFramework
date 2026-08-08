/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const readline = require('readline');

function question(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) =>
    rl.question(prompt, (ans) => {
      rl.close();
      res(ans);
    })
  );
}

async function removeIfExists(target) {
  if (!fs.existsSync(target)) return false;
  try {
    await fsp.rm(target, { recursive: true, force: true });
    return true;
  } catch (e) {
    return false;
  }
}

(async () => {
  try {
    const arg = process.argv[2];
    const name = arg
      ? arg.trim()
      : (await question('Name of the suite to delete: ')).trim();
    if (!name) {
      console.error('Suite name required!');
      process.exit(1);
    }

    const suiteDir = path.resolve(process.cwd(), 'tests', 'e2e', name);
    const reportDir = path.resolve(process.cwd(), 'playwright-report', name);

    if (!fs.existsSync(suiteDir)) {
      console.error('Suite directory not found:', suiteDir);
      process.exit(1);
    }

    const confirm = (
      await question(
        `Confirm irreversible deletion of "${name}"? Type "yes" to confirm: `
      )
    ).trim();
    if (confirm !== 'yes') {
      console.log('Cancelled.');
      process.exit(0);
    }

    const removedSuite = await removeIfExists(suiteDir);
    if (removedSuite) console.log('Suite removed:', suiteDir);
    else console.warn('Unable to remove suite (permissions?):', suiteDir);

    if (fs.existsSync(reportDir)) {
      const removedReport = await removeIfExists(reportDir);
      if (removedReport) console.log('Related report removed:', reportDir);
      else console.warn('Unable to remove related report (permissions?):', reportDir);
    } else {
      console.log('No related report found in playwright-report for this suite.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
