# Design notes

## Starting point: ratulnext

Inspected locally on November 16, 2026. No changes were made to that project.

- `src/proxy.ts` negotiates on Accept and covers home, projects, blog, and contact. It serves Markdown directly at the original URL.
- `src/lib/markdown.ts` renders per-route content, shares project constants, converts blog HTML with Turndown, and selects a supported language.
- Blog Markdown uses `fetchBlogPosts()` on the server. The UI normally loads posts in the client, illustrating how a separate representation avoids needing the reader to execute JavaScript.
- Existing unit tests cover route output, supported languages, and basic Markdown acceptance.

Generalization opportunities: home/contact copy is duplicated between the UI and Markdown renderer; acceptance checks positive Markdown quality without comparing HTML quality; Vary is assigned rather than merged; method behavior is not guarded in the proxy. Blog source selection can differ because the browser can choose a repository through localStorage while the server uses the public default. These are observations from source inspection, not verified production failures.

## V1 boundary

The library owns HTTP format selection and response construction. The website owns content, route matching, permissions, language selection, and rendering into Markdown. The agent instructions bridge those responsibilities. This preserves the useful part of the original implementation without baking personal-site routes or a particular framework into the package.

The core has three exports: `createDoorman`, `prefersMarkdown`, and `mergeVary`. It accepts standard Fetch APIs, includes TypeScript declarations, and has no runtime or development dependencies/build step. A Node demo provides a runnable HTTP boundary. Framework adapters should only be added with integration tests for that framework.

The package is ESM-only and currently unpublished. It uses the owner's npm scope, `@heyrtl/doorman`, and is licensed under MIT. See `docs/publishing.md` for the release procedure.

## Deliberately deferred

No automatic crawling, injected browser renderer, universal content extraction, new sitemap protocol, CLI installer, or Docker service. Those add operational cost without eliminating the need to identify authoritative content sources. A static hosting adapter may be a useful next addition if a real target project requires it.

## Research

[Vercel](https://vercel.com/blog/making-agent-friendly-pages-with-content-negotiation) and [Cloudflare](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) already implement same-URL Markdown negotiation. Doorman's differentiation is lightweight source integration plus agent guidance, not a new HTTP technique.

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) defines relative quality weights and Vary semantics. Doorman uses a documented policy for HTML and Markdown: require explicit Markdown, compare quality weights, and prefer Markdown on ties. It is not a complete generic negotiation implementation; media parameters other than q are ignored.

[Cloudflare's cache documentation](https://developers.cloudflare.com/cache/concepts/cache-control/) says arbitrary Vary dimensions are not used in caching decisions by default. This motivates conservative Markdown caching and deployment checks. [Next.js static export documentation](https://nextjs.org/docs/app/guides/static-exports) lists proxy functionality as unsupported. Both show why an npm library alone cannot guarantee behavior on every host.

[Google Search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) says special Markdown and AI text files are unnecessary for its generative Search features. Avoid positioning Doorman as an indexing requirement or claiming Google endorsement of this implementation.
