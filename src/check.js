const formats = {
  html: 'text/html',
  markdown: 'text/markdown',
};

const bodyLimit = 1024 * 1024;

async function readSample(response) {
  if (!response.body) return { body: '', truncated: false };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let remaining = bodyLimit;
  let body = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return { body: body + decoder.decode(), truncated: false };
      body += decoder.decode(value.subarray(0, remaining), { stream: true });
      remaining -= value.length;
      if (remaining < 0) return { body, truncated: true };
    }
  } finally {
    await reader.cancel();
  }
}

export async function checkSite(input, { expect, fetcher = fetch } = {}) {
  const target = new URL(input);
  if (!['https:', 'http:'].includes(target.protocol) || target.username || target.password || target.hash) {
    throw new Error('Provide an HTTP(S) page URL without credentials or a fragment.');
  }

  const checks = [];
  // Exercise requests in both orders at the same URL, without cache-busting.
  for (const format of ['html', 'markdown', 'markdown', 'html']) {
    const errors = [];
    const check = { format, errors };
    checks.push(check);
    try {
      const response = await fetcher(target, {
        headers: { Accept: formats[format] },
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
      });
      check.status = response.status;
      check.contentType = response.headers.get('content-type');
      check.vary = response.headers.get('vary');
      if (response.status !== 200) {
        errors.push(response.status >= 300 && response.status < 400
          ? `HTTP ${response.status} redirect. Check the final page URL directly.`
          : `Expected HTTP 200, received ${response.status}.`);
      }
      const mediaType = check.contentType?.split(';')[0].trim().toLowerCase();
      if (mediaType !== formats[format]) errors.push(`Expected Content-Type: ${formats[format]}.`);
      const vary = check.vary?.toLowerCase().split(',').map((value) => value.trim()) ?? [];
      if (!vary.includes('accept') && !vary.includes('*')) errors.push('Expected Vary to include Accept or *.');

      if (errors.length) {
        await response.body?.cancel();
        continue;
      }
      const { body, truncated } = await readSample(response);
      if (!body.trim()) errors.push(truncated ? 'The first 1 MiB has no visible text.' : 'Response body is empty.');
      if (expect && format === 'markdown' && !body.includes(expect)) {
        errors.push(truncated ? 'Expected text was not found in the first 1 MiB of Markdown.' : 'Expected text was not found in the Markdown.');
      }
    } catch (error) {
      errors.push(`Request failed: ${error.message}`);
    }
  }
  return { url: target.href, ok: checks.every(({ errors }) => errors.length === 0), checks };
}
