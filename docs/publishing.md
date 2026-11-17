# Releasing Doorman

Doorman publishes through GitHub Actions using npm trusted publishing (OIDC). No npm token is stored in GitHub. The workflow is `.github/workflows/publish.yml`.

## One-time npm setup

In the npm package's Trusted Publisher settings, create this connection:

| Field | Value |
| --- | --- |
| Publisher | GitHub Actions |
| Label | Doorman GitHub Actions (optional) |
| Organization or user | `heyrtl` |
| Repository | `doorman` |
| Workflow filename | `publish.yml` |
| Environment name | Leave empty |
| Allow npm publish | Checked |
| Allow npm dist-tag | Unchecked |

Enter the workflow filename only, without `.github/workflows/`. Save the connection. Complete the first successful publish within two days of creating it; npm expires an unvalidated connection after that window. If it expires, delete and recreate it.

## Ship a release

Choose the next stable version using semantic versioning, then update it without creating a local Git tag:

```sh
npm version patch --no-git-tag-version
```

Use `minor` or `major` instead when the change warrants it. Commit the version change along with the release's changes and push or merge to `main`. Published versions cannot be overwritten.

A push that changes `package.json` triggers the Publish workflow. It:

1. Runs the tests and checks package contents on Node 22 and 24.
2. Checks npm to see whether that exact version already exists. Existing versions are skipped, making reruns safe. Registry failures stop the release, and an older unpublished version cannot replace a newer `latest` version.
3. Publishes an unpublished stable version through OIDC after the checks pass. npm also runs the `prepublishOnly` test hook before upload. npm generates provenance for this public package and repository.

Source or documentation commits without a version bump are not releases. The workflow does not choose a version or create commits automatically. Prerelease versions need a separate release policy and are rejected by this workflow.

## Verify or retry

Follow the [Publish workflow](https://github.com/heyrtl/doorman/actions/workflows/publish.yml) to completion. Check the published version with:

```sh
npm view @heyrtl/doorman version
```

Verify a fresh installation of the released version. npm's public metadata and download endpoints may take a few minutes to catch up after publication. After success, tag the release commit as `v<version>` and push the tag if a Git release tag is wanted; tags do not trigger publication.

If a run fails, fix the issue and rerun it from GitHub Actions, or select Run workflow on `main`. A version already published is skipped. A failed registry check does not authorize publishing. No browser approval should be needed for routine releases after the trusted publisher is configured correctly.

The npm archive contains the library, types, README, agent instructions, package metadata, and MIT license. Release scripts, maintainer docs, tests, and workflow files stay in GitHub.

See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) for configuration and troubleshooting. The repository URL in `package.json` must continue to match this GitHub repository.
