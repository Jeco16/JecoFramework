# JecoFramework - Playwright automation framework

Licensed under the Apache License 2.0 — see the LICENSE file for details.

Setup

Prerequisites

- Node.js >= 18.0.0 (see `package.json` "engines")
- Recommended: commit `package-lock.json` for reproducible installs

1. Install node deps:

```bash
npm install
npx playwright install
```

Run tests

```bash
npm run test
npm run test:headed
```

Run a single suite

```powershell
# run by suite name
npm run test -- --suite=suite01_sauce

# or set env var for the session
$env:SUITE_NAME='suite01_sauce'; npm run test

# run playwright directly (uses suite's suite.config.js)
npx playwright test --config=tests/e2e/suite01_sauce/suite.config.js tests/e2e/suite01_sauce
```

Configuration

- Copy `.env.example` to `.env` and adjust `BASE_URL` or `HEADLESS` as needed.

Report handling and new scripts

- Test runs write an HTML `index.html` report which is moved into `playwright-report/<suite>` after each run.
- To avoid overwriting other suites' reports, the runner temporarily backs up existing suite folders, lets Playwright write the root report, then moves the report into the correct suite folder and restores backups.
- Key scripts and files:
	- `scripts/run-suite.js`: main test runner. Pass `--suite=<name>` or set `SUITE_NAME` env var.
	- `scripts/clean-report-indexes.js`: removes `index.html` entries (accepts optional suite name).
	- `scripts/prepare-report.js`: creates `playwright-report/<suite>` and removes only that suite's `index.html`.
	- `scripts/move-report.js`: moves the generated `index.html` into the suite folder and only removes `run-*` temporary folders.

Examples

- Open last HTML report:

```bash
npx playwright show-report
```
