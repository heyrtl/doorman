import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDoorman, mergeVary, prefersMarkdown } from '../src/index.js';

const cases = [
  [null, false], ['', false], ['*/*', false], ['text/*', false],
  ['text/html,application/xhtml+xml,*/*;q=0.8', false],
  ['text/markdown', true], ['TEXT/MARKDOWN; charset=utf-8', true],
  ['text/markdown, text/html, */*', true],
  ['text/html, text/markdown;q=0.9', false],
  ['text/html;q=0.2, text/markdown;q=0.8', true],
  ['text/markdown;q=0', false], ['text/markdown;q=bogus', false],
  ['text/markdown;q=2', false], ['text/markdown;q=-1', false],
  ['text/markdown;q=0.1234', false], ['text/markdown;q=1e0', false],
  ['text/markdown;q=0;q=1', false], ['text/markdown-ish', false],
  ['text/markdown;q=0.8, text/*;q=1, text/html;q=0.5', true],
  ['text/markdown;q=0.8, */*;q=1', false],
  ['text/markdown;note="x,y;z";q=0.5,text/html;q=1', false],
];
for (const [accept, expected] of cases) {
  test(`Accept ${JSON.stringify(accept)} => ${expected}`, () => {
    assert.equal(prefersMarkdown(accept), expected);
  });
}

const request = (path = '/', accept = 'text/markdown', method = 'GET') =>
  new Request(`https://example.com${path}`, { method, headers: { accept } });
const html = () => new Response('<h1>Public content</h1>', {
  headers: { 'content-type': 'text/html; charset=utf-8', vary: 'Accept-Encoding', 'set-cookie': 'locale=en' },
});

test('same URL serves Markdown without invoking the HTML renderer', async () => {
  const handler = createDoorman({ resolve: (req) => ({ markdown: `# ${new URL(req.url).pathname}\n` }) });
  const response = await handler(request('/article?ref=demo'), () => assert.fail('rendered HTML'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('vary'), 'Accept');
  assert.equal(await response.text(), '# /article\n');
});

test('browser response preserves body, cookies, and existing Vary; resolver is skipped', async () => {
  const handler = createDoorman({ resolve: () => assert.fail('resolved Markdown'), vary: ['Accept-Language'] });
  const response = await handler(request('/', 'text/html'), html);
  assert.equal(await response.text(), '<h1>Public content</h1>');
  assert.equal(response.headers.get('set-cookie'), 'locale=en');
  assert.equal(response.headers.get('vary'), 'Accept-Encoding, Accept, Accept-Language');
});

test('unmapped Markdown route falls through to the original 404', async () => {
  const handler = createDoorman({ resolve: () => null });
  const response = await handler(request('/missing'), () => new Response('Missing', {
    status: 404, headers: { 'content-type': 'text/html' },
  }));
  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Missing');
  assert.equal(response.headers.get('vary'), 'Accept');
});

test('resolver can return localized Markdown, error status, and explicit cache policy', async () => {
  const handler = createDoorman({ vary: ['Accept-Language'], resolve: async () => ({
    markdown: '# Ei löytynyt\n', status: 404,
    headers: { 'content-language': 'fi', 'cache-control': 'private, no-store', vary: 'Origin' },
  }) });
  const response = await handler(request(), html);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('content-language'), 'fi');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('vary'), 'Origin, Accept, Accept-Language');
});

test('HEAD gets Markdown headers without a body', async () => {
  const handler = createDoorman({ resolve: () => ({ markdown: '# Hello' }) });
  const response = await handler(request('/', 'text/markdown', 'HEAD'), html);
  assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.equal(await response.text(), '');
});

test('POST and assets pass through unchanged', async () => {
  const handler = createDoorman({ resolve: () => null });
  const asset = new Response('bytes', { headers: { 'content-type': 'image/png' } });
  assert.equal(await handler(request('/logo.png'), () => asset), asset);
  const postHandler = createDoorman({ resolve: () => assert.fail('intercepted POST') });
  assert.equal(await postHandler(request('/', 'text/markdown', 'POST'), () => asset), asset);
});

test('resolver errors propagate so the host app can handle failures', async () => {
  const handler = createDoorman({ resolve: () => { throw new Error('CMS unavailable'); } });
  await assert.rejects(handler(request(), html), /CMS unavailable/);
});

test('Vary merging is case insensitive and preserves wildcard', () => {
  const headers = new Headers({ vary: 'accept, Accept-Encoding' });
  mergeVary(headers, 'Accept', 'Accept-Language');
  assert.equal(headers.get('vary'), 'accept, Accept-Encoding, Accept-Language');
  headers.set('vary', '*');
  mergeVary(headers, 'Accept');
  assert.equal(headers.get('vary'), '*');
});

test('immutable upstream response headers can be wrapped', async () => {
  const handler = createDoorman({ resolve: () => null });
  const upstream = await fetch('data:text/html,<h1>Hello</h1>');
  const response = await handler(request('/', 'text/html'), () => upstream);
  assert.equal(response.headers.get('vary'), 'Accept');
  assert.equal(await response.text(), '<h1>Hello</h1>');
});
