# create-jeco-framework

![npm](https://img.shields.io/npm/v/create-jeco-framework)
![License](https://img.shields.io/badge/license-Apache%202.0-orange)

CLI scaffold tool for [JecoFramework](https://github.com/Jeco16/JecoFramework). Bootstraps a new Playwright automation project from the framework template.

## Usage

Scaffold a new project (no local install required):

```bash
npx create-jeco-framework my-app
cd my-app
npm install
npm run selftest
```

Preview which files would be created, without writing anything:

```bash
npx create-jeco-framework --dry-run my-app
```

## Local development

From a checkout of this repository:

```bash
node bin/create.js --dry-run my-app
node bin/create.js my-app
```

The `template/` folder is generated from the main repository sources via `scripts/export-template.js` — see `PUBLISH.md` for the release process.
