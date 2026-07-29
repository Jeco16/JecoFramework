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
  return new Promise((res) => rl.question(prompt, ans => { rl.close(); res(ans); }));
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
    const name = arg ? arg.trim() : (await question('Nome della suite da cancellare (es. suite03_myteam): ')).trim();
    if (!name) {
      console.error('Nome suite obbligatorio. Uscita.');
      process.exit(1);
    }

    const suiteDir = path.resolve(process.cwd(), 'tests', 'e2e', name);
    const reportDir = path.resolve(process.cwd(), 'playwright-report', name);

    if (!fs.existsSync(suiteDir)) {
      console.error('Directory suite non trovata:', suiteDir);
      process.exit(1);
    }

    const confirm = (await question(`Confermi la cancellazione irreversibile di "${name}"? Digita "yes" per confermare: `)).trim();
    if (confirm !== 'yes') {
      console.log('Annullato.');
      process.exit(0);
    }

    const removedSuite = await removeIfExists(suiteDir);
    if (removedSuite) console.log('Suite rimossa:', suiteDir);
    else console.warn('Impossibile rimuovere la suite (permessi?):', suiteDir);

    if (fs.existsSync(reportDir)) {
      const removedReport = await removeIfExists(reportDir);
      if (removedReport) console.log('Report relativo rimosso:', reportDir);
      else console.warn('Impossibile rimuovere il report relativo (permessi?):', reportDir);
    } else {
      console.log('Nessun report relativo trovato in playwright-report per questa suite.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Errore:', err);
    process.exit(1);
  }
})();