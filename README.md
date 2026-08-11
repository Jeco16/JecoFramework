# JecoFramework - Enterprise Playwright Automation Platform

![Version](https://img.shields.io/github/v/release/Jeco16/JecoFramework)
![Playwright](https://img.shields.io/badge/Playwright-8A2BE2)
![Node](https://img.shields.io/badge/Node.js-green)
![License](https://img.shields.io/badge/license-Apache%202.0-orange)
![Logo](https://img.shields.io/badge/github-Jeco16/JecoFramework-blue?logo=github)

JecoFramework is an enterprise Playwright-based automation framework
designed to provide:

- Suite-based execution
- Page Object Model
- Fixtures
- Logging
- Reporting
- Multi-environment support

Licensed under Apache 2.0.

## Quick Start

```bash
git clone https://github.com/Jeco16/JecoFramework

npm install

npm run test -- --suite=suiteTemplate
```
Commands for creating and deleting new suites

```bash
npm run create-suite

npm run delete-suite
```

## Features

✅ Playwright

✅ JavaScript (ES Modules)

✅ Node.js

✅ Suite-based architecture

✅ Page Object Model

✅ Custom Fixtures

✅ Environment management

✅ Logging

✅ HTML Reporting with Playwright-Report

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
├──🗄️ artifacts → Folder where all run artifacts (screenshots, videos, traces) will be saved
│
├──🗄️ node_modules → Node file installation folder
│
├──🗄️ playwright-report → Folder where the HTML execution reports will be saved
│
├── 📁 scripts
│   │
│   └── 🟦 frameworkScripts → Scripts that handle the framework's core functionalities
│
├── 📁 src
│   │
│   ├── 🟦 pages
│   │   │
│   │   ├── 🟩 frameworkPages → It Contains the generic POM for the framework's core functionalities
│   │   │
│   │   └── 🟩 templatePages → It contains the pages for managing the template suite's POM
│   │
│   └── 🟦 utils
│       │
│       ├── 🟩 images → Image source for the README
│       │
│       └── 🟩 frameworkUtils → Includes log management and configuration for ESLint/Prettier services
│
├── 📁 tests
│   │
│   ├── 🟦 e2e
│   │   │
│   │   └── 🟩 suiteTemplate → Sample suite
│   │       │
│   │       ├── 📄 Test001_Login.spec.js → Sample automated test
│   │       │
│   │       └── 📄 suite.config.js → Example of a configuration file for the suite
│   │
│   └── 🟦 fixtures
│       │
│       └── 📄 fixtures.js → Generic fixture file defining the functionalities to be called in the test scripts
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
├── 📄 playwright.config.js
│
└── 📄 README.md
```

## Suites and tests

### Suites

The newly downloaded framework comes with a single sample suite: **suiteTemplate**.

The suite consists of two files:

- **suite.config.js**
  - Configuration file where all parameters required as input by the suite's tests are defined, such as URLs, local variables, environment management and execution browsers.
- **Test001_Login.spec.js**
  - An example of a simple test that performs login and logout on a web page by calling the fixture file and the template POM.

### Creation of a new suite

1. Run the following command

```bash
npm run create-suite
```

2. Select the suite name (If the entered name corresponds to an existing suite, you will be asked whether or not to overwrite it)

```powershell
New suite name: suite01
```

A new suite folder will be created at the path **tests/e2e/suite01**.

The new suite will contain the following files:

- **suite.config.js**
  - Default configuration file with fields to be filled in
- **TestTemplate001.spec.js**
  - Sample test file to configure

### Cancellation of a suite

1. Run the following command:

```bash
npm run delete-suite
```

2. Select the suite to delete.

```powershell
# Step 1
Name of the suite to delete: suite01

# Step 2
Confirm irreversible deletion of "suite01"? Type "yes" to confirm: yes

# Step 3
Suite removed: C:\JecoFramework\tests\e2e\suite01
No related report found in playwright-report for this suite.
```

Upon deletion, the suite folder and the reports folder (if present) will be removed.

### Tests

1. Run tests

```bash
npm run test
npm run test:headed
```

2. Run a single suite

```powershell
# run by suite name
npm run test -- --suite=suiteName

# or set env var for the session
$env:SUITE_NAME='suiteName'; npm run test
```

## Environment management

The following environments are present in the template suite's suite.config.js file:

```javascript
 tags: ['env:dev'],
  env: {
    credentials: {
      USER_1: 'standard_user',
      USER_2: 'locked_out_user',
      USER_3: 'problem_user',
      USER_4: 'performance_glitch_user',
      USER_5: 'error_user',
      USER_6: 'visual_user',
      PASSWORD: 'secret_sauce',
    },
    dev: {
      baseURL: 'https://www.saucedemo.com/',
    },
    qa: {
      baseURL: 'https://www.saucedemo.com/',
    },
    prod: {
      baseURL: 'https://www.saucedemo.com/',
    },
    preprod: {
      baseURL: 'https://www.saucedemo.com/',    
    },
  },
```

Each environment has a URL, and to let the test know which environment to run on, you'll need to specify the correct environment in the tags. 

```javascript
tags: ['env.<name>']
```

The define property method then, based on the selected environment, sets the global baseUrl parameter with the URL corresponding to the environment.

```javascript
Object.defineProperty(suite, 'baseURL', {
  get() {
    const env = (process.env.ENV || process.env.NODE_ENV || 'dev');
    const e = this.env && this.env[env];
    return (e && e.baseURL) || (this.env && this.env.dev && this.env.dev.baseURL) || 'https://www.saucedemo.com/';
  },
  enumerable: true,
});
```

These mechanisms can obviously be customized as desired, in fact when a new suite is created, the suite.config.js file will have by default the structure to manage the environment configuration.

## Report

This framework implements the **Playwright-report** reporting service.
When a test is launched, the scripts located in **scripts\frameworkScripts** are activated.

The logical flow is as follows:

1. Execution of test 001 of the template suite

2. Check if the `playwright-report` folder exists; otherwise, it is created.

3. In `playwright-report`, it checks whether the folder corresponding to the running suite exists; if not, it is created (in this case, `suiteTemplate`).

4. The `index.html` file, which will contain the execution report, is created or overwritten within the suite's folder.

This is an example of report:

![Playwright report example](src/utils/images/report.png)

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

Current version: 0.2.0

For more information, consult the **CHANGELOG.md** file.

## Roadmap

### v0.3.0

- GitHub Actions

### v0.4.0

- Docker

### v0.5.0

- API layer

### v1.0.0

- Stable public release
