# Doorman roadmap

The npm package serves HTML and Markdown from the same URL. The CLI verifies that contract and will help install it. The implementation guide stays with the package so people and coding agents can use the same workflow. Model credentials, where supported, are for assisted setup. Serving responses and checking a site use ordinary code.

| Version goal | What ships together | Ready when |
| --- | --- | --- |
| **0.1.4 · Verify a site** | An installable `doorman check` command, HTML and Markdown response checks, optional content assertions, JSON and CI exit codes, and a runnable demo. | Shipped. A clean install exposes the CLI, the demo passes, and the checker catches missing text and HTML served to Markdown requests. |
| **0.1.5 · Integrate Next.js** | A tested App Router integration, a fixture with a dynamic route backed by shared public data, and stack-specific guidance for the runtime package. | Shipped. The production build and public demo passed the checker for both formats. Tests cover redirects and a route that rejects anonymous requests. |
| **0.2.0 · Generate a Next.js integration** | A local setup command, one coding-agent runner using supported local auth, route coverage output, and a reviewable, tested diff. | It produces a working patch in a real Next.js site beyond the fixture. Unsupported layouts are reported clearly. The generated site can serve both formats without model credentials. |
| **0.2.1 · Support React/Vite on one host** | A Vite build-time content export, one host adapter for same-URL negotiation, and a working deployment example. | A real deployment passes the checker, including a client-routed page and a missing page. Hosts without a request handler get a clear compatibility result. |
| **0.3.0 · Support WordPress** | A WordPress integration for public posts and pages, plus the same npm CLI for verification across stacks. | A test site serves published content with both formats at the same URL. Drafts and password-protected content remain protected. |

Later candidates include discovery checks for sitemaps and canonical links, another agent runner or bring-your-own-key setup, a GitHub App that opens draft PRs, and read-only tools such as docs search. Revisit Laravel when there is a real target app. Versions from `0.2.0` onward are targets and can move as integrations are validated.

## Show HN launch target

The public demo, copyable HTTP requests, checker command, and tested Next.js example are available with `0.1.5`. Before posting, have someone unfamiliar with Doorman try the demo and follow the setup on a fresh checkout. Ask where the setup breaks or feels unclear.

## Release practice

Develop on feature branches. Merge a version bump to `main` when the release's acceptance criteria pass. The workflow stages new versions after CI passes, and a maintainer approves them in npm before they go public. Approved versions then sync to GitHub Packages and Releases. See [the publishing guide](publishing.md).
