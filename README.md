# Doorman

Same URL. HTML for browsers. Markdown for clients that ask for it.

Doorman is a small, dependency-free JavaScript library that serves Markdown when a request explicitly accepts `text/markdown`. It includes instructions for a coding agent to connect it to your website's content sources, including sites whose pages render in JavaScript.

```http
GET /blog/hello
Accept: text/markdown

HTTP/1.1 200 OK
Content-Type: text/markdown; charset=utf-8
Vary: Accept

# Hello
```

The same URL returns your existing HTML for a browser. No public `.md` URLs, user-agent sniffing, or `llms.txt` required.

## Install

Requires Node.js 22+ for development. The core uses standard `Request`, `Response`, and `Headers` APIs with no Node imports. Other Fetch runtimes need integration testing on their deployment platform.

This is an unpublished v0.1 package. Install from GitHub:

```sh
npm install github:heyrtl/doorman
```

Or build and install a local archive:

```sh
# In the Doorman checkout
npm pack
# In your website (replace the path)
npm install /path/to/heyrtl-doorman-0.1.0.tgz
```

The package import is `@heyrtl/doorman`. The npm registry name is provisional; there is no registry release yet.

## Connect your content

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

For localized content, set `vary: ['Accept-Language']`, resolve the language from the request, and return a matching `Content-Language` header. If locale comes from cookies, follow the site's cookie/private caching policy instead.

There is no crawler, browser automation, AI API, or HTML converter in the library. Markdown/MDX sites can reuse their source. CMS sites can serialize public CMS records. A JavaScript SPA can share its content/data module with a server or a build step. Doorman supplies HTTP negotiation; the agent connects the content.

## Use with a coding agent

Copy [DOORMAN.md](DOORMAN.md) to the website's root, or point your agent at the installed copy:

> Read node_modules/@heyrtl/doorman/DOORMAN.md and implement Doorman for this site. Cover all public content routes, reuse their content sources, and run the tests.

The instructions cover route discovery, framework integration, source parity, deployment, and verification. They don't overwrite your existing `AGENTS.md` or `CLAUDE.md`.

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

```sh
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

## Scope

This helps readers that request Markdown fetch public content without running its UI JavaScript. It does not force tools to send that header, make inaccessible/private data public, guarantee search indexing/citations, or represent interactive app state automatically. Google says special Markdown files and `llms.txt` are not required for its Search AI features.

The mechanism already exists; Doorman packages it as a small library and an agent implementation workflow. See [the implementation notes](docs/design.md).

## References

- [HTTP semantics: negotiation and Vary (RFC 9110)](https://www.rfc-editor.org/rfc/rfc9110.html)
- [Vercel: making agent-friendly pages with content negotiation](https://vercel.com/blog/making-agent-friendly-pages-with-content-negotiation)
- [Cloudflare: Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)
- [Cloudflare: origin cache control and Vary](https://developers.cloudflare.com/cache/concepts/cache-control/)
- [Next.js: static exports and unsupported features](https://nextjs.org/docs/app/guides/static-exports)
- [Google: optimizing for AI features in Search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
