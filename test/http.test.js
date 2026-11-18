import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { createDemoServer } from '../examples/server.mjs';

test('real HTTP: HTML and Markdown share a URL, HEAD and fallthrough work', async (t) => {
  const server = createDemoServer();
  t.after(() => new Promise((resolve, reject) => {
    server.closeAllConnections();
    server.close((error) => error ? reject(error) : resolve());
  }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/`;
  for (const accept of ['text/html', 'text/markdown', 'text/html', 'text/markdown']) {
    const response = await fetch(url, { headers: { accept } });
    assert.equal(response.status, 200);
    assert.equal(response.url, url);
    assert.equal(response.headers.get('vary'), 'Accept');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = await response.text();
    assert.match(body, /Hello from Doorman/);
    assert.match(body, /This content is rendered by JavaScript in the browser/);
    if (accept === 'text/markdown') {
      assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8');
      assert.match(body, /^# Hello from Doorman/);
      assert.doesNotMatch(body, /<script>/);
    } else {
      assert.match(response.headers.get('content-type'), /^text\/html/);
      assert.match(body, /<main id="content"><\/main><script>/);
    }
  }
  const head = await fetch(url, { method: 'HEAD', headers: { accept: 'text/markdown' } });
  assert.equal(head.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.equal(await head.text(), '');
  const missing = await fetch(`${url}missing`, { headers: { accept: 'text/markdown' } });
  assert.equal(missing.status, 404);
  const post = await fetch(url, { method: 'POST', headers: { accept: 'text/markdown' } });
  assert.equal(post.status, 405);
});

test('checker CLI verifies real responses and fails on missing Markdown content', async (t) => {
  const server = createDemoServer();
  t.after(() => new Promise((resolve) => server.close(resolve)));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/`;
  const run = promisify(execFile);
  const cli = fileURLToPath(new URL('../bin/doorman.js', import.meta.url));
  const args = [cli, 'check', url, '--json', '--expect'];
  const { stdout } = await run(process.execPath, [...args, 'Hello from Doorman', '--expect-html', '<main id="content">']);
  const report = JSON.parse(stdout);
  assert.equal(report.ok, true);
  assert.deepEqual(report.checks.map(({ format }) => format), ['html', 'markdown', 'markdown', 'html']);

  await assert.rejects(run(process.execPath, [...args, 'absent phrase']), (error) => {
    assert.equal(error.code, 1);
    const failures = JSON.parse(error.stdout).checks.filter(({ errors }) => errors.length);
    assert.equal(failures.length, 2);
    assert.ok(failures.every(({ format, errors }) => format === 'markdown' && errors[0].includes('Expected text')));
    return true;
  });
});

test('checker flags HTML served to Markdown requests and a missing Accept cache dimension', async (t) => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html', Vary: 'Accept-Encoding' });
    response.end('<h1>HTML for every request</h1>');
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const cli = fileURLToPath(new URL('../bin/doorman.js', import.meta.url));
  const url = `http://127.0.0.1:${server.address().port}/`;
  await assert.rejects(promisify(execFile)(process.execPath, [cli, 'check', url, '--json']), (error) => {
    assert.equal(error.code, 1);
    const { checks } = JSON.parse(error.stdout);
    assert.ok(checks.every(({ errors }) => errors.includes('Expected Vary to include Accept or *, or Cache-Control: no-store.')));
    const markdown = checks.filter(({ format }) => format === 'markdown');
    assert.equal(markdown.length, 2);
    assert.ok(markdown.every(({ errors }) => errors.includes('Expected Content-Type: text/markdown.')));
    return true;
  });
});
