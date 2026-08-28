# Migration Notes — Upgrading to v1.0.0

JecoFramework did not have a stable `1.0.0` release before; these notes summarize
the cumulative, potentially breaking changes introduced across the `0.x` line so
that anyone building on an older checkout can upgrade safely to `1.0.0`.

## Requirements

- **Node.js >= 20.0.0** is required (see `engines` in `package.json`). Older Node
  versions are not supported.

## Test execution model

- The legacy suite-runner scripts (custom suite creation/deletion/run scripts) were
  **removed since v0.5.0** in favor of native Playwright `projects` (`e2e`, `api`, `self`).
  If you still invoke any old suite-runner script, switch to:

  ```bash
  npm run test           # runs e2e + api projects
  npm run test:e2e
  npm run test:api
  npm run selftest        # framework self-tests, not part of npm run test
  ```

- Tests are plain `*.spec.js` files under `tests/e2e/` or `tests/api/` — no
  scaffolding/registration step is required.

## Reporting

- The built-in Playwright `html` reporter was **replaced (since v0.6.0)** by a
  custom, self-contained reporter (`src/reporters/customizeReport.reporter.js`)
  that writes a single `report/index.html`. If any tooling in your project reads
  Playwright's default HTML report output, update it to read `report/index.html`
  and the JSON files under `report/data/` instead.
- `report/data/` and `report/attachments/` are **wiped and recreated on every run**
  (`onBegin`). Do not store anything you want to keep inside `report/`.
- The old `generate-report` helper script was **removed in v0.7.5**; the reporter
  now runs automatically as part of the Playwright `reporter` pipeline configured
  in `playwright.config.js` — no manual step required.

## Logging & console output

- Logger output captured during a test is recorded into the HTML report as
  `steps`, independent of whether it is also printed to the console.
- Console printing can be suppressed with `LOG_SILENT=true` or
  `LOG_TO_CONSOLE=false` (see `.env.example`, which sets `LOG_SILENT=true` by
  default). If you relied on seeing logger output in the terminal, either unset
  these variables or open the generated `report/index.html` — the runner prints a
  highlighted pointer to it whenever console logging is suppressed.

## Environment & secrets

- Environment/config values live in `src/config/env.config.js` and are selected
  via the `ENV` variable (default `dev`).
- `.env` (copied from `.env.example`) is now loaded automatically at test
  bootstrap (`tests/fixtures/fixtures.js` and `playwright.config.js` both load
  `dotenv/config` early). You no longer need to call
  `require('dotenv').config()` yourself.

## Documentation

- API documentation can now be generated locally with:

  ```bash
  npm run docs
  ```

  Output is written to `docs/api/` (git-ignored, regenerated on demand).

## No action needed for

- Page Object Model structure (`src/pages/`), the `api`/`testData`/`loginPage`/`basePage`
  fixtures, and per-test data loading by `testId` (`src/data/loader.js`) are unchanged
  in shape since their introduction and remain backward compatible.
