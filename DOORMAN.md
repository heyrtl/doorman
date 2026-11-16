# Implement Doorman in this website

Use `@heyrtl/doorman` to serve a faithful Markdown representation of public content at its existing URL when the request prefers `text/markdown`. Keep the website's normal HTML experience. Complete the implementation and verification, rather than only suggesting changes.

## 1. Inspect the project

Read the project's instructions and installed framework docs. Identify the framework/version, server entry point, deployment host, public routes (including dynamic routes), redirects, locale handling, authentication boundaries, and content sources. Check for existing negotiation before adding another layer.

Map each public content route family to its source and a Markdown renderer. Include at least one concrete dynamic route per family. Classify excluded routes such as APIs, assets, admin pages, authenticated pages, and interactive experiences without a meaningful text equivalent. Record coverage and exclusions in the website's docs; do not claim the entire site is covered if it isn't.

## 2. Reuse the content

Read the same Markdown/MDX, CMS record, structured object, or data service as the HTML UI. For hardcoded component copy, extract a shared content module used by both renderers. Do not maintain an independent hand-written copy of each page.

Include the page title, meaningful headings, main text, links, lists, tables, image descriptions, and fenced code where applicable. Preserve language, published status, canonical paths, and content order. Use a maintained converter if the source is HTML; remove scripts and styles, and preserve code/tables with relevant tests. Do not treat the SPA's initial HTML shell as rendered content. Do not add an LLM dependency or a browser-per-request scraper.

For browser-only content, move/share the public data access into server-safe code or generate Markdown from the same source at build time. Never copy localStorage data, secrets, private CMS fields, or drafts into public Markdown. If content cannot be obtained outside the browser, state the missing integration instead of fabricating a summary.

## 3. Wire negotiation into the host

Install the package using the README's GitHub or local archive instructions until it has a registry release. Import `createDoorman` from `@heyrtl/doorman` and provide an explicit public-route resolver. Return `{ markdown, status?, headers? }`, or `null` to fall through. Keep the original request URL, query semantics, redirects, and missing-page behavior.

Wrap the existing Fetch handler where possible. In Next.js, consult that version's proxy/middleware docs and preserve the existing proxy's behavior. `NextResponse.next()` can supply the fallback, but verify the FINAL response headers: framework internals may append or replace headers after the proxy. Do not replace existing auth, routing, or locale logic. A static export needs host-level request negotiation or a function/server; a static Markdown file alone does not implement this.

Run authorization BEFORE Doorman or share the same authorization logic in the resolver. A Markdown hit bypasses the HTML handler. Only map public published pages by default. For translated responses, share the language resolver, add `Accept-Language` to `vary`, and set `Content-Language`. Preserve existing cache dimensions and private/cookie policies.

Doorman requires explicit Markdown acceptance, respects relative quality weights, chooses Markdown on a tie, defaults to HTML for wildcards, and supports GET/HEAD. Do not switch formats based on User-Agent, create public `.md` aliases, or add `llms.txt` as a substitute.

## 4. Verify caching and errors

Keep Markdown's default `no-store` until representation separation is verified. Preserve/merge `Vary: Accept` on both negotiated representations and any language dimension. Some CDNs ignore arbitrary Vary values; check the host's docs and configure cache keys or bypass rules. Purge stale entries when deploying.

Use representation-specific validators if enabling conditional caching. Do not reuse HTML ETags, Content-Length, Content-Encoding, or digest headers for Markdown. Content source failures must follow the host's error policy; do not silently turn a failed fetch into a successful empty page.

## 5. Test and report

Add tests in the website's existing test framework. Test actual integration as well as helpers:

- Same URL: browser Accept → HTML; Markdown Accept → Markdown with the expected page's real content.
- Missing Accept and wildcard-only Accept → existing HTML behavior.
- Markdown q=0/invalid → HTML; higher HTML q → HTML; equal q → Markdown.
- HEAD → correct headers and no body; POST/actions/API/assets → existing behavior.
- Static page, dynamic page, missing page, trailing slash/redirect behavior, and any supported locales.
- Shared content edits appear in both representations, including headings, links, code, tables, and image descriptions where present.
- Existing Vary values survive; appropriate language/cache headers are present; private/draft content remains inaccessible.
- Resolver failures follow the app's error behavior.

Run relevant checks and a local HTTP smoke test. After an authorized deployment, test HTML → Markdown → HTML and Markdown → HTML → Markdown through the CDN, checking body AND headers. Local tests alone do not establish deployed cache correctness.

Report files changed, route coverage/exclusions, tests run, and unresolved deployment requirements. Do not promise every AI tool will request Markdown or improved search rankings. No Docker is needed when integrating with an existing runtime; propose one only if the project actually needs a standalone server.
