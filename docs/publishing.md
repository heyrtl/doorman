# Releasing Doorman

This guide is for maintainers publishing `@heyrtl/doorman`. Users can install the library with `npm install @heyrtl/doorman`; publishing is not part of website integration.

## Prepare a release

Use Node.js 22+ and a current npm CLI. Start from an up-to-date, clean checkout of `main`, and review the changes since the previous release. Choose a new version using semantic versioning: patches for compatible fixes, minor versions for compatible additions, and major versions for breaking changes. While the package is below 1.0, describe API compatibility changes explicitly in release notes.

Update `package.json` to the new version, commit the change, and run:

```sh
npm test
npm publish --dry-run
```

Review the package name, version, license, public visibility, and file list. The npm archive should contain only the library, TypeScript declarations, README, agent instructions, package metadata, and MIT license. Maintainer documentation, internal design notes, examples, tests, and CI configuration are excluded from the npm archive.

## Publish

Publishing requires an npm account with access to the `@heyrtl/doorman` package. Authenticate through npm's browser login when publishing from a terminal:

```sh
npm login --registry https://registry.npmjs.org/ --auth-type=web
npm whoami --registry https://registry.npmjs.org/
npm publish
```

Complete npm's browser or two-factor verification when prompted. Credentials belong in npm's authentication configuration, never in the repository. The package sets public access and the official registry in `publishConfig`, and its `prepublishOnly` hook runs the tests. A dry run does not upload or reserve a version.

## Verify the release

Check that npm reports the intended version:

```sh
npm view @heyrtl/doorman version
```

Install that exact version in a fresh project and verify the exports, types, and bundled `DOORMAN.md`. After publication succeeds, tag the release commit as `v<version>`, push the tag, and create release notes. Published versions cannot be overwritten; corrections require a new version.

## Automated releases

For CI-based releases, use [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) with GitHub Actions. Configure the publisher in the npm package settings and use the repository's release process. Trusted publishing uses short-lived credentials and supports provenance without storing a long-lived npm token. This repository currently tests changes in CI but does not publish automatically.

See [npm's public scoped package guide](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/) and [publish command reference](https://docs.npmjs.com/commands/npm-publish/).
