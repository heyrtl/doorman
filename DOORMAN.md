# Implement Doorman in this website

Use `@heyrtl/doorman` to serve a faithful Markdown representation of public content at its existing URL when the request prefers `text/markdown`. Keep the website's normal HTML experience. Complete the implementation and verification, then open a pull request in the target website's repository explaining the changes and their purpose. A plan alone is not the deliverable.

## 1. Inspect the project

Read the project's instructions and installed framework docs. Identify the framework/version, server entry point, deployment host, public routes (including dynamic routes), redirects, locale handling, authentication boundaries, and content sources. Check for existing negotiation before adding another layer.

Inspect Git status and the repository's contribution conventions. Create a working branch from the appropriate base while preserving existing user changes. Keep commits focused on the integration and avoid including unrelated work.

Map each public content route family to its source and a Markdown renderer. Include at least one concrete dynamic route per family. Classify excluded routes such as APIs, assets, admin pages, authenticated pages, and interactive experiences without a meaningful text equivalent. Record coverage and exclusions in the website's docs; do not claim the entire site is covered if it isn't.

## 2. Reuse the content

Build a clear, faithful Markdown reading view from the website's source content. Work inside the repository: inspect components, routes, content files, assets, and data models to understand what the page communicates. The Markdown should be organized for reading without requiring the reader to reconstruct the visual layout.

Read the same Markdown/MDX, CMS record, structured object, or data service as the HTML UI. For hardcoded component copy, extract a shared content module used by both renderers. Do not maintain an independent hand-written copy of each page.

You may reorganize headings, flatten columns and cards into sections or lists, expand ambiguous link labels, and omit navigation controls, repeated interface chrome, and decorative elements. Preserve substantive content, facts, qualifications, relationships, language, published status, and canonical paths. Keep a logical reading order, including sequences that carry meaning. Do not invent claims, silently summarize substantive text, or change its meaning. For example, a price described as "from $9/month, billed annually" must retain both qualifications.

Include the page title, meaningful headings, main text, links, lists, tables, and fenced code where applicable. For informative images, charts, and diagrams, use existing accurate alt text, captions, underlying data, or context verified by inspecting the asset. Preserve labels, units, and relevant relationships. Do not invent descriptions for uninspected assets; record missing descriptions as an integration gap. Omit purely decorative visuals.

Keep each reading view scoped to its page by default. An overview may intentionally include related public content, such as project data from another route, but label that section, link to its source page, reuse the same data, and document the decision in the site's integration notes. Do not silently turn every page into a site-wide summary.

The coding agent builds the renderer during integration; requests then use ordinary code and shared data. Use a maintained converter when HTML is the authoritative source, preserving links, code, and tables while removing scripts and styles. Do not treat the SPA's initial HTML shell as rendered content. Do not add an LLM dependency or a browser-per-request scraper.

For browser-only content, move/share the public data access into server-safe code or generate Markdown from the same source at build time. Never copy localStorage data, secrets, private CMS fields, or drafts into public Markdown. If content cannot be obtained outside the browser, state the missing integration instead of fabricating a summary.

## 3. Wire negotiation into the host

Install `@heyrtl/doorman` using the project's package manager (for npm, `npm install @heyrtl/doorman`). Import `createDoorman` from `@heyrtl/doorman` and provide an explicit public-route resolver. Return `{ markdown, status?, headers? }`, or `null` to fall through. Keep the original request URL, query semantics, redirects, and missing-page behavior.

Wrap the existing Fetch handler where possible. In Next.js, consult that version's proxy/middleware docs and preserve the existing proxy's behavior. `NextResponse.next()` can supply the fallback, but verify the FINAL response headers: framework internals may append or replace headers after the proxy. Do not replace existing auth, routing, or locale logic. A static export needs host-level request negotiation or a function/server; a static Markdown file alone does not implement this.

Run authorization BEFORE Doorman or share the same authorization logic in the resolver. A Markdown hit bypasses the HTML handler. Only map public published pages by default. For translated responses, share the language resolver, add `Accept-Language` to `vary`, and set `Content-Language`. Preserve existing cache dimensions and private/cookie policies.

Doorman requires explicit Markdown acceptance, respects relative quality weights, chooses Markdown on a tie, defaults to HTML for wildcards, and supports GET/HEAD. Do not switch formats based on User-Agent, create public `.md` aliases, or add `llms.txt` as a substitute.

## 4. Verify caching and errors

Keep Markdown's default `no-store` until representation separation is verified. Preserve/merge `Vary: Accept` on both negotiated representations and any language dimension. Some CDNs ignore arbitrary Vary values; check the host's docs and configure cache keys or bypass rules. Purge stale entries when deploying.

Use representation-specific validators if enabling conditional caching. Do not reuse HTML ETags, Content-Length, Content-Encoding, or digest headers for Markdown. Content source failures must follow the host's error policy; do not silently turn a failed fetch into a successful empty page.

For Next.js App Router, see the [production-tested example](https://github.com/heyrtl/doorman/tree/main/examples/nextjs). If the framework or host drops `Vary: Accept` on the final response, either configure the cache to distinguish the representations and preserve the header, or disable caching on both representations with `Cache-Control: no-store`. Confirm the result against the deployed URL.

## 5. Test and report

Add tests in the website's existing test framework. Test actual integration as well as helpers:

- Same URL: browser Accept → HTML; Markdown Accept → Markdown with the expected page's real content.
- Missing Accept and wildcard-only Accept → existing HTML behavior.
- Markdown q=0/invalid → HTML; higher HTML q → HTML; equal q → Markdown.
- HEAD → correct headers and no body; POST/actions/API/assets → existing behavior.
- Static page, dynamic page, missing page, trailing slash/redirect behavior, and any supported locales.
- Shared content edits appear in both representations, including headings, links, code, tables, and image descriptions where present.
- Reorganized reading views retain substantive details, qualifications, and meaningful relationships; informative visual descriptions have a verified source, and any cross-page additions are labeled and documented.
- Existing Vary values survive; appropriate language/cache headers are present; private/draft content remains inaccessible.
- Resolver failures follow the app's error behavior.

Run the project's tests and use Doorman's CLI for a local HTTP smoke test. Replace the URL and expected text with one of the site's real routes and a stable phrase from its Markdown:

```sh
npm exec -- doorman check http://localhost:3000/docs/getting-started \
  --expect 'Getting started' --json
```

The checker requests both formats at the same URL and checks status, content type, cache headers, and optional text. Use `--expect-html` to assert text in the raw HTML response too. For a client-rendered page, assert a stable HTML marker and check the rendered content separately in the browser. Run the same command against the deployed URL after an authorized deployment. Test redirects, missing pages, permissions, and request methods separately using the checks above.

Report files changed, route coverage/exclusions, tests run, and unresolved deployment requirements. Do not promise every AI tool will request Markdown or improved search rankings. No Docker is needed when integrating with an existing runtime; propose one only if the project actually needs a standalone server.

## 6. Open a pull request

Review the diff, commit the integration changes, push the working branch, and open a pull request against the appropriate base branch of the target website's repository. Follow its PR template and contribution conventions. This is a PR for the website being integrated, not for the Doorman library. Leave merging and deployment to the project's normal review process unless separately requested.

Use a concrete title that describes the resulting behavior. The description must explain:

- What changed: the request-handling integration, shared content sources, and Markdown reading views.
- Why: the problem being solved and why the chosen integration fits this stack and hosting setup.
- Coverage: public routes and locales supported, intentional exclusions, and any labeled cross-page additions.
- Validation: checks actually run, their results, and reproducible HTTP examples for HTML and Markdown at the same URL. Distinguish local checks from deployed CDN verification.
- Remaining requirements: cache configuration, hosting changes, or known limitations that need attention before rollout.

Return the PR URL and a concise implementation summary. If Git hosting authentication, permissions, or a missing remote prevents pushing or opening the PR, finish all unblocked local work, report the specific blocker, and provide a ready-to-use PR title and description. Do not claim a PR or deployment exists unless it was successfully created.
