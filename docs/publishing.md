# Publishing

The first npm release is not published yet. The package is `@heyrtl/doorman`, matching the owner's npm username, and is MIT licensed. Verify that `npm whoami` returns `heyrtl` before publishing.

## First release from your terminal

Use Node 22+ and a current npm CLI. Authenticate interactively; never put a password, token, or one-time code in repository files:

```sh
npm login --registry https://registry.npmjs.org/ --auth-type=web
npm whoami --registry https://registry.npmjs.org/
```

From a clean checkout of the commit being released:

```sh
npm test
npm publish --dry-run
```

Review the listed package files, name, version, license, and public access setting. The `files` allowlist includes the library, types, README, design notes, and agent instructions. Demo/test files and CI configuration stay in GitHub. npm also automatically includes a root license file when present.

When ready to make the release public:

```sh
npm publish
```

The `prepublishOnly` hook runs the tests before publishing. `publishConfig` sets public visibility and the official registry. Complete any browser/2FA verification npm requires. A dry run checks packaging and tests, but does not prove the account has publish access or reserve the package name.

After publication, verify the registry version and install into a fresh project. Update the README's install instructions to the registry command and remove the unpublished notice. Tag the actual release commit only after confirming success.

## Later releases

Prefer [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) from GitHub Actions if you automate releases. It uses short-lived credentials and generates provenance for supported public repositories. Configure it in the npm package settings after the initial package exists; no long-lived npm token needs to be committed or stored in this repo. This repository does not currently have an automatic publication workflow.

See [npm's scoped public package guide](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/) and [publish command reference](https://docs.npmjs.com/commands/npm-publish/).
