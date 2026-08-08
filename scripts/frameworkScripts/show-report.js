/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { spawn } from 'child_process';

// Usage: node ./scripts/frameworkScripts/show-report.js [--suite=<name>]
// This script launches `npx playwright show-report <target>` and forwards stdout/stderr.
const arg = process.argv.slice(2).find(a => a.startsWith('--suite='));
const suite = arg ? arg.split('=')[1] : process.env.SUITE_NAME;
const target = suite ? `playwright-report/${suite}` : 'playwright-report';

console.log(`Launching Playwright report viewer for: ${target}`);
const p = spawn('npx', ['playwright', 'show-report', target], { stdio: 'inherit', shell: true });

p.on('exit', (code) => {
	const exitCode = code ?? 0;
	if (exitCode === 0) console.log('Playwright report viewer exited successfully.');
	else console.error('Playwright report viewer exited with code', exitCode);
	process.exit(exitCode);
});

p.on('error', (err) => {
	console.error('Failed to launch Playwright report viewer:', err);
	process.exit(1);
});