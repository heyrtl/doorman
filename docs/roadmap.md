# Doorman roadmap

Doorman helps people make websites readable by agents from the application's own content sources. The npm package provides the HTTP runtime and the implementation guide. The CLI builds on both and will verify and eventually help produce the integration. Sites can use the runtime on its own. Model credentials will be used only during assisted setup.

## In progress

- [x] Add `doorman check` to the npm package. Probe both representations at the same URL and optionally assert literal Markdown text. Produce JSON for CI and future integration tools.
- [ ] Use the checker against a real deployed site and a Next.js preview. Capture both responses for a dynamic route whose content loads in the browser.
- [ ] Build a Next.js App Router fixture and adapter. Reuse the site's public content loader and preserve redirects, authorization, and existing middleware. Verify actual production build behavior.

## Next

- [ ] Prototype a local integration command for Next.js with one supported coding agent. Start from the implementation guide, detect the project and host, propose public routes, make a reviewable diff, and run the checker. Use existing local agent authentication where supported. Add bring-your-own-key support after proving the workflow.
- [ ] Support React/Vite on one host with build-time Markdown and a host function for negotiation. Treat static-only hosting as an explicit constraint and report it before making changes.
- [ ] Prototype WordPress support using published posts and pages. Evaluate Laravel separately once there is a real target project. Reuse the CLI's HTTP expectations across stacks.
- [ ] Add discovery checks for canonical links and sitemaps, then let teams run their route checks in preview and production CI.
- [ ] Evaluate a GitHub App that creates draft PRs once the local workflow is useful across real projects. Explore read-only tools such as docs search after discovery and reading work reliably.

## Release practice

Develop on feature branches and use draft PRs for review. Keep release-ready changes together and bump the npm version deliberately when merging a release to `main`. A version already published is skipped by the release workflow. A new stable version on `main` is staged on npm after checks pass. Maintainer approval makes it public, after which it syncs to GitHub Packages and Releases. See [the publishing guide](publishing.md).
