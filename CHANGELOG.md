# Changelog

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
