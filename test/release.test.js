import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldPublish } from '../scripts/check-release.mjs';

const pkg = { name: '@heyrtl/doorman', version: '0.1.3' };
const result = (version) => new Response(JSON.stringify({ name: pkg.name, version }));

test('release check skips versions that are already published', async () => {
  assert.equal(await shouldPublish(pkg, async () => result('0.1.3')), false);
});

test('release check permits a new version newer than latest', async () => {
  assert.equal(await shouldPublish(pkg, async (url) => {
    return url.includes('/latest?') ? result('0.1.2') : new Response(null, { status: 404 });
  }), true);
});

test('release check prevents an unpublished older version becoming latest', async () => {
  await assert.rejects(shouldPublish(pkg, async (url) => {
    return url.includes('/latest?') ? result('0.2.0') : new Response(null, { status: 404 });
  }), /Refusing to move latest backward/);
});

test('release check fails closed on registry errors and malformed responses', async () => {
  await assert.rejects(shouldPublish(pkg, async () => new Response(null, { status: 503 })), /HTTP 503/);
  await assert.rejects(shouldPublish(pkg, async () => new Response('{}')), /Unexpected npm registry response/);
  await assert.rejects(shouldPublish(pkg, async () => { throw new Error('Network unavailable'); }), /Network unavailable/);
});

test('release check rejects another package name and prerelease versions', async () => {
  const unused = () => assert.fail('Should not contact the registry');
  await assert.rejects(shouldPublish({ ...pkg, name: 'other-package' }, unused), /Unexpected package name/);
  await assert.rejects(shouldPublish({ ...pkg, version: '0.1.3-beta.1' }, unused), /stable x.y.z/);
});
