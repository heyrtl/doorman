# Releasing Doorman

GitHub Actions tests and stages each Doorman release using npm trusted publishing (OIDC). A maintainer reviews and approves it on npm before it goes live. No npm token is stored in GitHub. The workflow is `.github/workflows/publish.yml`.

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
| Allow npm publish | Unchecked |
| Allow npm dist-tag | Unchecked |

Enter the workflow filename only, without `.github/workflows/`. Save the connection. Complete the first release through this connection within two days of creating it; npm expires an unvalidated connection after that window. If it expires, delete and recreate it.

## Ship a release

Choose the next stable version using semantic versioning, then update it without creating a local Git tag:

```sh
npm version patch --no-git-tag-version
```

Use `minor` or `major` instead when the change warrants it. Commit the version change along with the release's changes and push or merge to `main`. Published versions cannot be overwritten.

A push that changes `package.json` triggers the Publish workflow. It:

1. Runs the tests and checks package contents on Node 22 and 24.
2. Checks npm to see whether that exact version already exists. Versions already public are skipped. Registry failures stop the release, and an older unpublished version cannot replace a newer `latest` version.
3. Uploads an unpublished stable version with `npm stage publish` through OIDC after the checks pass. The runner installs npm 11.15.0 or newer, as required for staging. The version waits on npm for maintainer review; the workflow cannot publish it directly.

Source or documentation commits without a version bump are not releases. The workflow does not choose a version or create commits automatically. Prerelease versions need a separate release policy and are rejected by this workflow.

## Review and approve

Open the Staged Packages tab on npm, inspect the release and its package contents, and approve it with your account's two-factor verification. Approval is what makes the version publicly available. From a current npm CLI, the equivalent commands are:

```sh
npm stage list @heyrtl/doorman
npm stage view <stage-id>
npm stage approve <stage-id>
```

You can reject a staged release instead if it is incorrect. Stage-only permissions limit the workflow to preparing releases; they do not allow it to bypass your approval. Trusted publishing supports provenance for this public package and repository.

## Verify or retry

Follow the [Stage npm release workflow](https://github.com/heyrtl/doorman/actions/workflows/publish.yml) to completion. Check the published version with:

```sh
npm view @heyrtl/doorman version
```

Verify a fresh installation of the released version. npm's public metadata and download endpoints may take a few minutes to catch up after publication. After approval, the GitHub sync workflow creates a matching release page and tag automatically; tags do not trigger npm publication.

If a run fails, fix the issue and rerun it from GitHub Actions, or select Run workflow on `main`. A version already public is skipped. A version already staged also reserves that version number: if a rerun reports it exists, review and approve the existing staged release rather than trying to overwrite it. Registry errors stop the workflow. Staging needs no browser approval, but each release requires your review and approval on npm before publication.

The npm archive contains the library, types, README, agent instructions, package metadata, and MIT license. Release scripts, maintainer docs, tests, and workflow files stay in GitHub.

See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) for configuration and troubleshooting. The repository URL in `package.json` must continue to match this GitHub repository.

See [npm staged publishing](https://docs.npmjs.com/staged-publishing/) for the approval workflow.

## GitHub Packages and release pages

The separate `.github/workflows/github-release.yml` workflow mirrors public, stable npm versions to GitHub Packages and creates matching GitHub release pages. npm remains the primary registry and its maintainer approval remains the release gate.

The sync runs after a successful staging workflow, hourly to detect later npm approvals, when its own implementation changes on `main`, or manually through GitHub Actions. It backfills missing versions and skips package/release pairs already present. To sync immediately after approving a release, run:

```sh
gh workflow run github-release.yml --repo heyrtl/doorman
```

Only versions present in the public npm registry are eligible. The sync checks npm's published source commit against this repository's `main` history, verifies the original archive against npm's SHA-512 integrity, and uses that artifact for the mirror. It adapts only the extracted manifest's registry/provenance publishing settings for GitHub Packages, without running package scripts. Existing tags must match the published source commit.

Each release page is tagged at the published commit, includes generated change notes, and attaches the original npm archive. The GitHub workflow uses the built-in `GITHUB_TOKEN` with package and repository write permissions; no extra stored token is required.

GitHub initially makes new packages private. After the first mirror, set the package's visibility to Public in its Package settings if it is not already public. Repository linkage and access inheritance are provided by the package's existing `repository` field. GitHub's registry requires authentication for package installation even for public npm packages, so the README continues to recommend the public npm registry for users.

If an npm archive is still processing or a sync step fails, rerun the workflow after the issue clears. Package publication and release-page creation are independently checked, so a retry can finish a partially completed sync.
