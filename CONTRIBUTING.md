# Contributing to Doorman

Use [GitHub Issues](https://github.com/heyrtl/doorman/issues/new/choose) for bugs and ideas. Use the [security policy](SECURITY.md) for private reports.

Create a branch and keep the change focused. Run `npm test` on Node.js 22 or 24 and `npm pack --dry-run` to check what users receive. For integration changes, include a local or preview URL example and the expected HTML and Markdown responses.

Open a pull request against `main`. Describe what changed, how you verified it, and any host-specific limitations. The required CI gate must pass before merge. Maintainers coordinate version bumps and npm approval. See the [release guide](docs/publishing.md).
