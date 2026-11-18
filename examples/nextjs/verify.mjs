import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { checkSite } from '../../src/check.js';
import { getArticle, home } from './content.js';

const slug = 'getting-started';
const article = getArticle(slug);
const port = process.env.DOORMAN_DEMO_PORT ?? '3210';
const publicUrl = process.env.DOORMAN_DEMO_URL;
const base = new URL(publicUrl ?? `http://127.0.0.1:${port}`);
let server;

before(async () => {
  if (publicUrl) return;
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', port], {
    cwd: new URL('.', import.meta.url),
    stdio: 'inherit',
  });
  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null) throw new Error('Next.js exited before startup.');
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(500) });
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // Allow the production server to start.
    }
    await setTimeout(200);
  }
  throw new Error('Next.js did not become ready.');
});

after(async () => {
  if (server && server.exitCode === null && server.signalCode === null) {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
});

function request(path, accept, method = 'GET') {
  return fetch(new URL(path, base), { headers: { Accept: accept }, method, redirect: 'manual', signal: AbortSignal.timeout(10_000) });
}

test('static homepage and dynamic guide negotiate at their canonical URLs', async () => {
  for (const [path, title, html] of [
    ['/', home.title, home.title],
    [`/docs/${slug}`, article.title, 'Loading guide'],
  ]) {
    const report = await checkSite(new URL(path, base), { expect: `# ${title}`, expectHtml: html });
    assert.equal(report.ok, true, JSON.stringify(report));
  }

  const path = `/docs/${slug}`;
  const html = await request(path, 'text/html');
  assert.ok(!(await html.text()).includes(article.text));
  const markdown = await request(path, 'text/markdown');
  assert.equal(await markdown.text(), `# ${article.title}\n\n${article.text}\n`);
  const head = await request(path, 'text/markdown', 'HEAD');
  assert.equal(head.status, 200);
  assert.match(head.headers.get('content-type'), /^text\/markdown/);
  assert.equal(await head.text(), '');
});

test('redirects, missing pages, the public API and protected routes keep their existing behavior', async () => {
  for (const accept of ['text/html', 'text/markdown']) {
    const redirect = await request('/guide', accept);
    assert.equal(redirect.status, 308);
    assert.equal(new URL(redirect.headers.get('location'), base).pathname, `/docs/${slug}`);
    assert.equal((await request('/docs/missing-guide', accept)).status, 404);
    const privateResponse = await request('/private', accept);
    assert.equal(privateResponse.status, 401);
    assert.deepEqual(await privateResponse.json(), { error: 'Sign in required' });
    const api = await request(`/api/docs/${slug}`, accept);
    assert.equal(api.status, 200);
    assert.deepEqual(await api.json(), article);
  }
});
