# Changelog

## [1.0.2] - 2026/08/29

Stable package

### Fixed

- Removed the stray `template/.env` file so scaffolded projects no longer receive a duplicate of `.env.example`.
- Renamed `template/.gitignore` to `template/gitignore` and mapped it back to `.gitignore` in `bin/create.js`, since npm always strips files literally named `.gitignore` from published tarballs; scaffolded projects now correctly receive a `.gitignore`.

## [1.0.1] - 2026/08/28

Fixed some package.json creation and alignment bugs

## [1.0.0] - 2026/08/28

CLI scaffold tool for JecoFramework. Bootstraps a new Playwright automation project from the framework template.
