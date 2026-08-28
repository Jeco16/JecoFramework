# JecoFramework - Enterprise Playwright Automation Framework

![Version](https://img.shields.io/github/v/release/Jeco16/JecoFramework)
![Playwright](https://img.shields.io/badge/Playwright-8A2BE2)
![Node](https://img.shields.io/badge/Node.js-green)
![CI](https://img.shields.io/badge/CI-red?logo=github)
![License](https://img.shields.io/badge/license-Apache%202.0-orange)
![Logo](https://img.shields.io/badge/github-Jeco16/JecoFramework-blue?logo=github)

JecoFramework is an enterprise Playwright-based automation framework
designed to provide:

- Project-based execution (native Playwright `projects`: `e2e`, `api`)
- Page Object Model
- Fixtures
- Logging
- Reporting
- Multi-environment support
- Continuous integration

Licensed under Apache 2.0.

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Tests](#tests)
- [Environment management](#environment-management)
- [Secrets \& .env files](#secrets--env-files)
- [Continuous integration](#continuous-integration)
  - [CI steps](#ci-steps)
  - [Smoke test configuration](#smoke-test-configuration)
- [Report](#report)
- [Self-tests](#self-tests)
- [Element highlighting](#element-highlighting)
- [Eslint/Prettier](#eslintprettier)
- [Version](#version)
- [Roadmap](#roadmap)
  - [v0.8.0](#v080)
  - [v1.0.0](#v100)
  - [future goals](#future-goals)

## Quick Start

```bash
git clone https://github.com/Jeco16/JecoFramework

npm install

npm run test
```

Run a single project (e2e or api):

```bash
npm run test:e2e
npm run test:api
```

Run a single test:

```bash
npm run test:api -- -g "API_01"
```

## Features

✅ Playwright

✅ JavaScript (ES Modules)

✅ Node.js

✅ Native Playwright projects (e2e/api)

✅ Continuous Integration Ready

✅ Page Object Model

✅ Custom Fixtures

✅ Environment management

✅ Logging

✅ Custom standalone HTML Reporting

✅ Per-test data management

✅ Element highlighting during interactions

✅ Apache 2.0 License

✅ Eslint/Prettier

## Prerequisites

- Node.js >= 20.0 (see `package.json` "engines")
- Recommended: commit `package-lock.json` for reproducible installs

## Installation

1. Clone repository:

```bash
git clone https://github.com/Jeco16/JecoFramework
```

2. Install node deps:

```bash
npm install
```

3. Install browsers (optional)

```bash
npx playwright install
```

## Project Structure

```text
│
├── 📁 .github/workflows
│   │
│   └── 📄ci.yml → Configuration file where the steps for CI are defined
│
├──🗄️ node_modules → Node file installation folder
│
├──🗄️ report → Custom standalone HTML report (regenerated on every run, git-ignored)
│
├── 📁 src
│   │
│   ├── 🟦 api
│   │   │
│   │   ├── 📄 api.client.js → HTTP transport layer
│   │   │
│   │   └── 📄 api.assertions.js → Domain assertions for API responses
│   │
│   ├── 🟦 assertions → Management of assertions
│   │
│   ├── 🟦 config → Environment-specific base URLs and credentials
│   │
│   ├── 🟦 data
│   │   │
│   │   ├── 📄 loader.js → Locates and loads per-test JSON data files by testId
│   │   │
│   │   ├── 🟩 e2e/ → Per-test JSON data files for e2e tests (e.g. E2E_01.json)
│   │   │
│   │   └── 🟩 api/ → Per-test JSON data files for api tests (e.g. API_01.json)
│   │
│   ├── 🟦 pages
│   │   │
│   │   ├── 📄 base.page.js → Generic POM base class (incl. `highlight`/`highlightAndClick`/`highlightAndFill`)
│   │   │
│   │   └── 📄 login.page.js → Example page object
│   │
│   ├── 🟦 reporters → Custom Playwright reporter generating the standalone HTML report
│   │
│   └── 🟦 utils
│       │
│       ├── 🟩 images → Image source for the README
│       │
│       └── 📄 logger.js → Log management
│
├── 📁 tests
│   │
│   ├── 🟦 e2e → Sample automated E2E test
│   │
│   ├── 🟦 api → Sample automated API test
│   │
│   ├── 🟦 self → Sample automated framework-self test
│   │
│   └── 🟦 fixtures → Generic fixture file (page objects, api client, per-test data loading + metadata)
│
├── 📄 .env.example
│
├── 📄 .eslintrc.cjs / .eslintignore / .prettierrc / .prettierignore → Lint/format config
│
├── 📄 .gitignore
│
├── 📄 CHANGELOG.md
│
├── 📄 LICENSE
│
├── 📄 NOTICE
│
├── 📄 package-lock.json
│
├── 📄 package.json
│
├── 📄 playwright.config.js → Single source of truth: `projects` for `e2e` and `api`
│
└── 📄 README.md
```

## Tests

The framework comes with two native Playwright `projects`:

- **e2e** (`tests/e2e/**`) — browser-based tests using the Page Object Model.
- **api** (`tests/api/**`) — HTTP tests using the `api` fixture (see `src/api/api.client.js`).

Each test file is a plain Playwright spec — create new ones simply by adding a `*.spec.js` file under `tests/e2e/` or `tests/api/`, no scaffolding step required.

1. Run all tests

```bash
npm run test
npm run test:headed
```

2. Run a single project

```bash
npm run test:e2e
npm run test:api
```

3. Filter by tag (e.g. smoke tests) or project, using Playwright's native CLI flags

```bash
npm run test -- --grep "\@smoke\"
npm run test -- --project=api
```

## Environment management

Environments and credentials are centralized in `src/config/env.config.js`:

```javascript
const environments = {
  dev: {
    baseURL: 'https://www.saucedemo.com/',
    apiURL: 'https://restful-booker.herokuapp.com/',
  },
  qa: {/* ... */},
  prod: {/* ... */},
  preprod: {/* ... */},
};
```

The active environment is selected via the `ENV` environment variable (default: `dev`):

```powershell
$env:ENV='qa'; npm run test
```

`env.baseURL`, `env.apiURL` and `env.credentials` are then imported directly in test files (see `tests/e2e/login.spec.js` and `tests/api/booking.spec.js`) — no tag parsing or per-suite config file needed.

## Secrets & .env files

For local development, keep environment-specific settings and secrets out of version control by using a `.env` file. A safe example is provided at `.env.example`.

Usage:

1. Copy `.env.example` to `.env` and update values (do **not** commit `.env`).

```bash
cp .env.example .env
```

2. Run tests using the env values:

PowerShell:

```powershell
$env:ENV='qa'; npm run test
```

Unix/bash:

```bash
ENV=qa npm run test
```

3. CI: store secrets and environment variables securely in your CI system (e.g. GitHub Actions Secrets, Azure Pipelines variables). Avoid placing secrets directly in repository files.

Notes:

- `.env` and `.env.local` are already listed in `.gitignore` to avoid accidental commits.
- The project loads env vars via `process.env`. The `dotenv` package is available for local convenience — simply `npm install` and `require('dotenv').config()` at the test bootstrap if you want automatic loading in local runs.

## Continuous integration

In this framework, a **CI workflow** (ci.yml) is configured with two jobs:

1. `selftest`: installs dependencies and Playwright browsers, then runs the framework self-tests (`npm run selftest`) and uploads the generated `report/` as an artifact (`self-report`). This job runs first and gates the second job.
2. `test`: depends on `selftest`; runs npm ci, installs the Playwright browsers, applies `npm run lint:fix`, launches the smoke tests with `--grep "@smoke"` in headless (`HEADLESS=true`), and uploads the `playwright-report` and `artifacts` folders.

### CI steps

```powershell
# selftest job
Install dependencies
run: npm ci

Install Playwright browsers
run: npm run install:browsers

Run framework self-tests
run: npm run selftest

Upload selftest report (report/)

# test job (needs: selftest)
Install dependencies
run: npm ci

Install Playwright browsers
run: npm run install:browsers

Run lint
run: npm run lint:fix

Run smoke tests
run: 'npm run test -- --grep "\@smoke\"'
```

### Smoke test configuration

You can add a test to the CI using the **"@smoke"** tag.
It is possible to add the tag directly to the title of the test in question.

```javascript
test.describe('Saucedemo - E2E', () => {
  test('@smoke login e logout con fixture', async ({ basePage, loginPage }) => {
```

## Report

This framework generates a **custom standalone HTML report** (`src/reporters/customizeReport.reporter.js`), configured in `playwright.config.js` alongside the `list` reporter — no dependency on Playwright's built-in `html` reporter.

![Report screenshot](src/utils/images/report.png)

On every run:

- `report/data/` and `report/attachments/` are wiped and recreated (`onBegin`), so stale metadata/screenshots from previous runs never leak in.
- The `testData` fixture (see `tests/fixtures/fixtures.js`) writes a per-test metadata file (`testId`, `dataFile`, `keys`, `status`, `startTime`, `duration`, `steps`, `attachments`) into `report/data/` after each test. Logger output captured during the test is recorded as `steps`, and failed assertions are recorded as failed steps.
- Screenshots for **failed tests only** are copied to `report/attachments/<testId>/`; small images are additionally inlined as base64 in the metadata so they always render, even when the report is opened directly via `file://`.
- At the end of the run (`onEnd`), the reporter aggregates that metadata, keeps only tests that actually ran, and writes a single self-contained `report/index.html` with:
  - A title showing the run date and time (`Report of dd/mm/yyyy HH:mm`).
  - A pie chart (Passed / Failed / Skipped) with legend **and the overall success percentage** displayed next to it.
  - A clickable list of executed tests with **bold, color-coded status** (green = passed, red = failed, yellow = skipped) plus start time and duration.
  - Clicking a test row expands a panel showing its step list (including logger output and failed assertions), followed by any screenshot/video attachments as thumbnails.
  - Attachment thumbnails open in a **lightbox** on click for a larger view; internal `test-metadata` attachments are filtered out of the display.
- The report embeds its own CSS/logo (no external assets required) and is regenerated from scratch on every run — the `report/` folder is git-ignored.

### Viewing the report

- After a run, open the generated report in your browser. When running locally, use the `file://` URL to the project `report/index.html`. Example (Windows): `file:///C:/JecoFramework/report/index.html`.

## Logger & Console

- The framework captures logger output per-test and includes it as `steps` in the generated report, even when console output is suppressed.
- To suppress console logging (useful for CI or quieter local runs), set one of the following environment variables:
  - `LOG_SILENT=true` — fully silence console logs while still capturing them for the HTML report.
  - `LOG_TO_CONSOLE=false` — alternate flag to avoid printing logs to the console while preserving capture.
- When console output is suppressed, the test runner prints a short, highlighted notice pointing to `report/index.html` so you can open the report for full details.

## Release & CI notes

- `semantic-release` has been added to the repository configuration to automate changelog generation and publishing. To enable automated releases in CI you must provide:
  - `GITHUB_TOKEN` with repo write and workflow permissions (or configure `persist-credentials: true` in the release workflow).
  - `NPM_TOKEN` (if publishing to npm).
- The `selftest` job runs first in CI and uploads `report/` as an artifact; the main `test` job depends on it. Ensure the CI runner has permissions to create artifacts and access the required secrets.


## Self-tests

The framework ships with its own self-tests under `tests/self/`, used to validate the fixtures and reporter without depending on the `e2e`/`api` suites:

- Verifies the `testData` fixture writes the expected metadata file to `report/data/`.
- Runs a child Playwright process to confirm end-to-end fixture behavior.
- Confirms the reporter's `onBegin`/`onEnd` lifecycle produces a valid `report/index.html`.

Self-tests run in their own Playwright project (`self`) and are **not** part of `npm run test`. Run them explicitly with:

```bash
npm run selftest
```

## Element highlighting

`BasePage` (`src/pages/base.page.js`) exposes helpers to visually highlight the element being interacted with while tests run (useful in headed/debug mode):

```javascript
await this.highlight(selector); // outline/box-shadow flash on the element
await this.highlightAndClick(selector); // highlight, then click
await this.highlightAndFill(selector, value); // highlight, then fill
```

`LoginPage` uses these wrappers for all its interactions.

## Eslint/Prettier

The functionalities of **ESLint** and **Prettier** are integrated into this framework.

The commands for using the controls are as follows:

1. Prettier:

```bash
npm run format
```

2. ESLint, check only:

```bash
npm run lint
```

3. ESLint, check and fix:
4.

```bash
npm run lint:fix
```

## Version

Current version: [Latest release](https://github.com/Jeco16/JecoFramework/releases/latest)

For more information, consult the **CHANGELOG.md** file.

## Roadmap

### v1.0.0

- Stable public release
- npm package

### future goals

- Docker integration
- MCP integration
- Automatic release processes
- Automatic Changelog.md
