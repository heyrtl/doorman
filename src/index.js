// Split outside quoted parameter values (which can contain commas/semicolons).
function split(value, separator) {
  const parts = [];
  let start = 0;
  let quoted = false;
  for (let i = 0; i < value.length; i++) {
    if (quoted && value[i] === '\\') { i++; continue; }
    if (value[i] === '"') quoted = !quoted;
    if (!quoted && value[i] === separator) {
      parts.push(value.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function ranges(header) {
  return split(header.toLowerCase(), ',').flatMap((entry) => {
    const [raw, ...params] = split(entry, ';');
    const type = raw.trim();
    if (!/^(?:[a-z0-9!#$%&'*+.^_`|~-]+|\*)\/(?:[a-z0-9!#$%&'*+.^_`|~-]+|\*)$/.test(type)) return [];
    let quality = 1;
    let seenQ = false;
    for (const param of params) {
      const [name, ...rest] = param.trim().split('=');
      if (name.trim() !== 'q') continue;
      const value = rest.join('=').trim();
      if (seenQ || !/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value)) return [];
      quality = Number(value);
      seenQ = true;
    }
    return [{ type, quality }];
  });
}

/** Require an explicit Markdown range; prefer HTML if its quality is higher. */
export function prefersMarkdown(accept) {
  if (!accept) return false;
  const values = ranges(accept);
  const markdown = values.find(({ type }) => type === 'text/markdown');
  if (!markdown || markdown.quality === 0) return false;
  const html = ['text/html', 'text/*', '*/*']
    .map((type) => values.find((item) => item.type === type))
    .find(Boolean);
  return markdown.quality >= (html?.quality ?? 0);
}

/** Add dimensions without overwriting framework/cache Vary values. */
export function mergeVary(headers, ...dimensions) {
  const values = (headers.get('vary') ?? '').split(',').map((v) => v.trim()).filter(Boolean);
  if (values.includes('*')) return;
  for (const dimension of dimensions) {
    if (!values.some((v) => v.toLowerCase() === dimension.toLowerCase())) values.push(dimension);
  }
  if (values.length) headers.set('vary', values.join(', '));
}

/** Wrap a Fetch-style handler. The resolver owns route coverage and access control. */
export function createDoorman({ resolve, vary = [] }) {
  return async function doorman(request, next) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return next(request);
    if (prefersMarkdown(request.headers.get('accept'))) {
      const page = await resolve(request);
      if (page != null) {
        const headers = new Headers(page.headers);
        headers.set('content-type', 'text/markdown; charset=utf-8');
        if (!headers.has('cache-control')) headers.set('cache-control', 'no-store');
        mergeVary(headers, 'Accept', ...vary);
        return new Response(request.method === 'HEAD' ? null : page.markdown, {
          status: page.status ?? 200,
          headers,
        });
      }
    }
    const response = await next(request);
    // Non-HTML assets, APIs, redirects, etc. pass through untouched.
    if (!/^text\/html(?:;|$)/i.test(response.headers.get('content-type') ?? '')) return response;
    const headers = new Headers(response.headers);
    mergeVary(headers, 'Accept', ...vary);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
