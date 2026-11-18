# Doorman on Next.js App Router

This example installs the published Doorman runtime. The homepage is prerendered. The guide at `/docs/getting-started` loads its body in the browser through a JSON endpoint. The JSON endpoint and Markdown renderer both read the same public record in `content.js`.

From the Doorman repository root, using Node.js 22 or later:

```sh
npm ci --prefix examples/nextjs
npm run --prefix examples/nextjs build
npm run --prefix examples/nextjs verify
```

The verifier starts the production server on port `3210`. Use `DOORMAN_DEMO_PORT` to override the port or set `DOORMAN_DEMO_URL` to check a deployed copy instead. The checks cover both formats, the client-rendered guide, HEAD, an existing redirect, a missing guide, the JSON API, and a route that rejects anonymous requests.

To explore manually, run `npm run --prefix examples/nextjs start`. Open `/docs/getting-started` in a browser, then request its reading view:

```sh
curl -i -H 'Accept: text/markdown' http://localhost:3000/docs/getting-started
```

For your own site, adapt `proxy.js` to your existing public page matcher and content loader. Keep authorization in front of negotiation. This file-backed example keeps the loader cheap enough to run in Proxy. For a slow CMS or a database-backed site, consider routing Markdown to a server-side handler and apply the same access rules there.

The example opts the negotiated page responses out of caching with `Cache-Control: no-store`. The tested Next.js version emits its own `Vary` values on App Router HTML and can drop a custom `Vary: Accept`. The checker accepts the no-store policy while still checking the actual responses in both orders. If you enable caching, verify that your host varies the cache on `Accept` and preserves the framework's existing variation headers. A static file export needs host-level request handling.
