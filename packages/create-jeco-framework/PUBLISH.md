Publishing `create-jeco-framework`

1. Add `NPM_TOKEN` to repository Secrets (GitHub Settings -> Secrets -> Actions).

2. Verify package version in `packages/create-jeco-framework/package.json`.

3. Test publish locally with dry-run:

```bash
cd packages/create-jeco-framework
npm publish --dry-run
```

4. When ready, push to `main`. The workflow `.github/workflows/publish-create-package.yml` will publish automatically using `NPM_TOKEN`.

Notes:

- The package will be published with `--access public`. Make sure the npm account has rights.
- If you prefer manual publishing, run `npm publish` locally after configuring `NODE_AUTH_TOKEN`.
