# Contributing to JecoFramework

Thank you for contributing to JecoFramework! Following these guidelines helps maintain code quality and speeds up reviews.

## Contribution process

1. Fork the repository and create a descriptive branch name:
   - `feature/short-description` for new features
   - `fix/short-description` for bug fixes

2. Implement your change.

3. Run local checks before opening a PR:

```bash
npm ci
npm run lint:fix
npm run format
npm run selftest
npm test
```

4. Commit using Conventional Commits:
   - `feat(scope): short description`
   - `fix(scope): short description`
   - `chore(release): v1.0.0`

5. Open a Pull Request against `main` with a clear description and test results/screenshots if applicable.

## PR checklist

- [ ] Tests pass locally (`npm test`, `npm run selftest`)
- [ ] No ESLint warnings or they were fixed (`npm run lint:fix`)
- [ ] Documentation updated if necessary
- [ ] Commit messages follow the Conventional Commits format

## Reporting bugs and feature requests

Open an issue on GitHub including:
- A descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Framework version (see `CHANGELOG.md`)

## Code guidelines

- Follow the project's ESLint/Prettier rules.
- Keep functions small and testable.
- For significant changes, open an issue first to discuss the design.

Thanks for contributing — every PR is appreciated!
