# Doorman

**HTML for humans. Markdown for agents.**

Your website already has the content. Doorman helps serve it in the format the reader needs, at the same URL.

Install the library, give your coding agent the included instructions, and connect your public pages to their content sources. Browsers keep getting your website. Agents that request `text/markdown` get structured text they can read without running the page's JavaScript.

## If you're a human

Open your website's project in Claude Code, Codex, or another coding agent. Paste this:

```text
Implement Doorman (npm: https://www.npmjs.com/package/@heyrtl/doorman; repository: https://github.com/heyrtl/doorman) in this website and open a pull request with the completed integration.

Read the project's instructions, inspect its stack and content sources, and create a working branch. Install @heyrtl/doorman using the project's package manager, then read node_modules/@heyrtl/doorman/DOORMAN.md and follow it.

Serve HTML for browsers and faithful, organized Markdown for requests that prefer text/markdown, at the same public page URLs. Build the Markdown views from shared content sources and preserve existing routing, authentication, and language behavior.

Implement the changes, add relevant tests, and run the project's checks plus HTTP smoke tests. Complete the implementation rather than stopping at a plan.

Commit the integration changes, push the branch, and open a PR in this website's repository. Explain what changed, why this integration fits the stack, which routes are covered or excluded, what you tested, and any deployment or caching requirements. Return the PR link. If remote access is unavailable, finish the local work and provide the exact blocker and a ready-to-use PR description.
```

The agent installs the package, adapts the integration to your stack, and prepares a PR for you to review. Installing the package alone does not wire up your routes. Prefer to implement it yourself? Start with [Connect your content](#connect-your-content) and use [DOORMAN.md](DOORMAN.md) as the implementation checklist.

## If you're an AI agent reading this

**Here to integrate Doorman? Start the work in the target website's repository.** Read its project instructions, inspect the stack, and create a working branch. Install `@heyrtl/doorman` with the project's package manager and follow [DOORMAN.md](DOORMAN.md), also included at `node_modules/@heyrtl/doorman/DOORMAN.md`. Implement the request-handling integration and source-based Markdown reading views, add relevant tests, and run the checks. Commit your integration changes, push the branch, and open a PR in the website's repository with a clear explanation of what you did and why, route coverage, validation results, and deployment requirements. Return the PR link. If remote access blocks PR creation, complete the local work and return the blocker with a prepared PR description. The implementation guide defines the full workflow; a plan alone is not the deliverable.

**Reading a site that supports Doorman?** Request its existing page URL with `Accept: text/markdown`. You do not need to install the package to read that response. If your web tool cannot set request headers, it may receive the normal HTML instead.

```sh
curl -H 'Accept: text/markdown' https://example.com/path/to/page
```

Replace `https://example.com/path/to/page` with the page's normal URL. Keep the same path and query parameters; no `.md` suffix is needed.

## Why I built it

Thanks to [Zeno Rocha](https://github.com/zenorocha): his [post](https://www.linkedin.com/feed/update/urn:li:activity:7438956777221734400/) on March 15, 2026 about serving Markdown on [Resend](https://resend.com) was the first example of this approach I saw.

I added Markdown content negotiation to my own JavaScript-rendered site, then wanted to make that setup easy to repeat. The useful part was simple: let the HTTP request choose the format, and serve both versions from the same content.

Doorman turns that approach into a small, dependency-free library and an implementation guide for coding agents. The library handles the HTTP details; your agent connects it to your site's routes and content.

## Who it's for

Doorman is for developers and site owners building documentation, blogs, portfolios, and other public content sites, especially when their pages rely on JavaScript. It helps agent web tools retrieve the actual page content without having to render the UI.

Use it with a coding agent that can edit your project. The included guide walks the agent through finding content sources, covering public routes, and testing the integration. Readers only need an HTTP client that requests Markdown.

## Why this approach

HTTP content negotiation lets one URL serve multiple representations of the same content. Your existing links stay useful, and the Markdown can stay in sync by sharing its source with the HTML version. There is no AI API or browser-rendering service to run.

[Vercel uses this pattern for pages including its blog and changelog](https://vercel.com/blog/making-agent-friendly-pages-with-content-negotiation), and [Cloudflare offers Markdown for Agents using the same `Accept: text/markdown` mechanism](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/). Doorman brings that established pattern into your application's own code, with control over which content it serves.

## How it works

The client asks for Markdown at the page's normal URL:

```http
GET /blog/hello
Accept: text/markdown

HTTP/1.1 200 OK
Content-Type: text/markdown; charset=utf-8
Vary: Accept

# Hello
```

The same URL returns your existing HTML for a browser. Doorman selects the representation using the `Accept` header. It does not need public `.md` URLs, user-agent sniffing, or `llms.txt`.

## Runtime requirements

Requires Node.js 22+ for development. The core uses standard `Request`, `Response`, and `Headers` APIs with no Node imports. Other Fetch runtimes need integration testing on their deployment platform.

Import the library from `@heyrtl/doorman`. The package includes TypeScript declarations and the agent implementation guide.

## Connect your content

Wrap your existing Fetch-style handler and provide a function that finds the page's public content. In this integration sketch, `publicContent` and `existingAppHandler` stand for your site's content source and request handler:

```js
import { createDoorman } from '@heyrtl/doorman';

const doorman = createDoorman({
  async resolve(request) {
    const { pathname } = new URL(request.url);
    // Use the SAME public content source as the UI.
    const page = await publicContent.get(pathname);
    if (!page) return null;
    return { markdown: page.markdown };
  },
});

// Wrap your existing Fetch-style handler.
export default function fetch(request) {
  return doorman(request, existingAppHandler);
}
```

`resolve(request)` returns `{ markdown, status?, headers? }` or `null` to continue through your existing app. It may be asynchronous. It only runs for GET/HEAD requests that prefer Markdown. Errors propagate to the host application's error handler. Use body-bearing statuses such as 200 or 404; this API does not generate redirects, 204s, or 304s.

The package exports three functions:

| Export | Purpose |
| --- | --- |
| `createDoorman({ resolve, vary? })` | Wrap a Fetch-style handler with Markdown negotiation. |
| `prefersMarkdown(accept)` | Check whether the request prefers Markdown under Doorman's policy. |
| `mergeVary(headers, ...dimensions)` | Add cache variation headers while preserving existing values. |

For localized content, set `vary: ['Accept-Language']`, resolve the language from the request, and return a matching `Content-Language` header. If locale comes from cookies, follow the site's cookie/private caching policy instead.

There is no crawler, browser automation, AI API, or HTML converter in the library. Markdown/MDX sites can reuse their source. CMS sites can serialize public CMS records. A JavaScript SPA can share its content/data module with a server or a build step. Doorman supplies HTTP negotiation; the agent connects the content.

### A reading view from your source content

The Markdown can use a structure suited to reading: cards become lists, columns become sections, and decorative UI can disappear. The integration agent works from your repository's content and components to build that view. Requests then run ordinary code against shared content sources.

Keep the substance faithful: preserve facts, qualifications, links, and meaningful relationships. Describe informative visuals from accurate alt text, captions, data, or inspected assets. Keep each view focused on its page; label and document any intentional additions from elsewhere on the site. Sharing sources keeps later edits consistent across both formats.

## Negotiation and caching

- An explicit, positive `text/markdown` range is required. Missing `Accept`, `*/*`, and `text/*` alone keep HTML.
- Quality weights are compared with HTML. A higher HTML quality keeps HTML; a tie chooses Markdown. HTML's exact range takes precedence over `text/*`, then `*/*`. Invalid quality values are ignored. Duplicate media ranges use the first valid entry. This is a policy for two representations, not a general-purpose HTTP negotiator.
- GET and HEAD can produce Markdown. Other methods pass through. The resolver must explicitly map public content routes; do not use a catch-all that serves content for APIs or assets.
- Markdown responses default to `Cache-Control: no-store`. You can supply an explicit policy after verifying your deployment cache separates representations.
- `Vary: Accept` is merged with existing values on Markdown and downstream HTML responses. Additional `vary` dimensions are merged into both. Other downstream content types pass through unchanged.

**Verify the CDN, too.** `Vary` alone does not guarantee your host separates variants. Cloudflare, for example, documents that its default cache behavior does not generally use `Vary`. Configure the relevant cache key/bypass rules before enabling shared caching. Purge any old HTML-only entries when rolling out negotiation. Test HTML → Markdown → HTML and the reverse through the actual deployment.

The resolver runs before the HTML handler. Keep authentication/authorization in front of Doorman, or use the same authorization logic in the resolver. Only return public, published content; an existing HTML handler's authorization will not run when Markdown is served.

## Where it runs

Use Doorman inside an existing server, serverless function, or edge handler that supports Fetch APIs. In Next.js it can wrap the request in a proxy/middleware, with `NextResponse.next()` as the fallback; check the installed version and verify final response headers after deployment. This repository currently tests the core and a Node HTTP integration, not every framework adapter.

A static file host cannot run this library by itself. It needs a host-level rewrite/function or a server. We don't ship Docker in v1: there is no separate Doorman service to deploy. A container would only be useful if you choose to run your website's server that way.

## Try it

Clone the repository to run the tests and demo:

```sh
git clone https://github.com/heyrtl/doorman.git
cd doorman
npm test
npm run demo
```

In another terminal:

```sh
curl -i http://localhost:3000/
curl -i -H 'Accept: text/markdown' http://localhost:3000/
curl -I -H 'Accept: text/markdown' http://localhost:3000/
```

The demo has a JavaScript-rendered HTML page and a Markdown response built from the same data. Tests cover negotiation, fallthrough, headers, HEAD, errors, and actual HTTP requests.

## Check a site

Run the checker against the final URL of a public page or a local preview. It requests HTML and Markdown in both orders at the same URL, checks status, headers, and nonempty bodies, and reports any unexpected redirects. `--expect` checks for a literal phrase in the first 1 MiB of each Markdown response.

```sh
node bin/doorman.js check http://localhost:3000/ --expect 'Hello from Doorman'
```

The CLI ships alongside the runtime and guide in packages built from this source. To use an installed copy, run `npx doorman check <url>` from a project with Doorman installed. Add `--json` for CI. The exit code is `0` when all checks pass, `1` for failed response checks, and `2` for invalid input. These checks cover the URL and responses tested. Repeat them against your deployed host to exercise its caching behavior.

## Scope

This helps readers that request Markdown fetch public content without running its UI JavaScript. It does not force tools to send that header, make inaccessible/private data public, guarantee search indexing/citations, or represent interactive app state automatically. Google says special Markdown files and `llms.txt` are not required for its Search AI features.

The mechanism already exists; Doorman packages it as a small library and an agent implementation workflow.

## License

[MIT](LICENSE).

## References

- [HTTP semantics: negotiation and Vary (RFC 9110)](https://www.rfc-editor.org/rfc/rfc9110.html)
- [Vercel: making agent-friendly pages with content negotiation](https://vercel.com/blog/making-agent-friendly-pages-with-content-negotiation)
- [Cloudflare: Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)
- [Cloudflare: origin cache control and Vary](https://developers.cloudflare.com/cache/concepts/cache-control/)
- [Next.js: static exports and unsupported features](https://nextjs.org/docs/app/guides/static-exports)
- [Google: optimizing for AI features in Search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
