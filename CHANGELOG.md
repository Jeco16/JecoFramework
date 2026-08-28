# Changelog

## [0.9.0] - 2026/08/28

### Added

- Self-tests: expanded `tests/self/` to validate loader/fixtures/reporter/logger flows; `npm run selftest` runs the `self` Playwright project with `--workers=1` to avoid race conditions and uploads the generated `report/` as a CI artifact.
- Documentation: JSDoc added across core modules (`logger`, `loader`, `reporter`, `api`, `pages`) and examples updated in `README.md`.
- `CONTIRBUTING.md` and `SECURITY.MD`

<!-- end Unreleased -->

## [0.8.0] - 2026/08/28

- Dependency security scanning in CI (`npm audit`)

## [0.7.5] - 2026/08/27

### Added

- `.env.example` and secrets handling guidelines (`README.md` section "Secrets & .env files").
- Framework self-tests (`tests/self/`) running in a dedicated Playwright project (`self`), executed only via `npm run selftest`; validates the `testData` fixture and the reporter's `onBegin`/`onEnd` lifecycle.
- CI: new `selftest` job runs before the main `test` job and uploads the generated `report/` as an artifact (`self-report`).
- Reporter: failed-test screenshots/videos are copied to `report/attachments/<testId>/`; `report/attachments/` is wiped and recreated on every run (`onBegin`), alongside `report/data/`.
- Reporter: small screenshots are additionally inlined as base64 in the per-test metadata so they render reliably even when `report/index.html` is opened directly via `file://`.
- Reporter: logger output captured during a test and failed assertions are recorded as `steps`, shown in the expandable test panel alongside timestamps.
- Reporter: clicking a test row expands a panel showing steps followed by screenshot/video attachments as thumbnails; clicking a thumbnail opens it in a lightbox overlay.
- Reporter: overall success percentage displayed next to the pie chart in the run summary.

### Changed

- Reporter UI polish: larger attachment thumbnails, hover effects, refreshed color palette and spacing.
- Reporter: internal `test-metadata` attachments are filtered out of the displayed attachments list.

### Removed

- `generate-report` helper script.

## [0.6.0] - 2026/08/25

### Added

- Per-test data management: `src/data/loader.js` loads JSON fixtures by `testId` from `src/data/e2e/*.json` and `src/data/api/*.json`; wired into the `testData` fixture.
- Custom standalone HTML report (`src/reporters/customizeReport.reporter.js`), replacing the built-in Playwright `html` reporter:
  - Fresh `report/data/` on every run (`onBegin`).
  - Aggregates per-test metadata written by the `testData` fixture.
  - Filters out tests that did not run.
  - Run title with date and time (`dd/mm/yyyy HH:mm`).
  - Inline pie chart (Passed/Failed/Skipped) with legend, no "other" category.
  - Test list and expandable step details with **bold, color-coded status** (green/red/yellow).
  - Inlined CSS and logo, no external dependencies.
- Element highlighting during interactions: `BasePage.highlight()`, `highlightAndClick()`, `highlightAndFill()`; adopted by `LoginPage`.

### Changed

- `playwright.config.js`: removed the built-in `html` reporter in favor of the custom reporter; `report/` output is git-ignored.

## [0.5.0] - 2026/08/18

### Added

- API Layer
- Fail's assertions
- Native Playwright project management

### Upgraded

- Framework tree structure
- Logical structure of the tests
- Page Object refactor

### Removed

- Script for managing suite runs
- Script for creating and deleting suites
- Report management script

## [0.3.0] - 2026/08/17

### Added

- GitHub Actions CI
- CI headless
- Smoke test convention

### Fixed

- Fixed no-useless-escape errors in run-suite.js.
- Applied ~287 automatic Prettier/ESLint fixes; removed unused imports and fixed empty blocks.

## [0.2.0] - 2026/08/11

### Added

- Environment management

## [0.1.0] - 2026-08-08

### Added

- Suite management
- Custom fixtures
- Logging
- Playwright HTML Report
- ESLint
- Prettier
