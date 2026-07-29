import { spawn } from 'child_process';

const arg = process.argv.slice(2).find(a => a.startsWith('--suite='));
const suite = arg ? arg.split('=')[1] : process.env.SUITE_NAME;
const target = suite ? `playwright-report/${suite}` : 'playwright-report';

const p = spawn('npx', ['playwright', 'show-report', target], { stdio: 'inherit', shell: true });
p.on('exit', (c) => process.exit(c ?? 0));
// scripts/show-report.js
import { spawn } from 'child_process';
const arg = process.argv.slice(2).find(a => a.startsWith('--suite=')) ;
const suite = arg ? arg.split('=')[1] : process.env.SUITE_NAME;
const target = suite ? `playwright-report/${suite}` : 'playwright-report';
const p = spawn('npx', ['playwright', 'show-report', target], { stdio: 'inherit', shell: true });
p.on('exit', (c) => process.exit(c ?? 0));