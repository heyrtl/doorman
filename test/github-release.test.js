import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { approvedVersions, mirrorManifest, verifyTarball } from '../scripts/sync-github-release.mjs';

const pkg = (version) => ({
  name: '@heyrtl/doorman', version, gitHead: 'a'.repeat(40),
  repository: { url: 'git+https://github.com/heyrtl/doorman.git' },
  dist: { tarball: `https://registry.npmjs.org/@heyrtl/doorman/-/doorman-${version}.tgz` },
});

test('GitHub sync excludes staging placeholders and prereleases and sorts stable versions', () => {
  const versions = ['0.1.10', '0.0.0-stage', '0.1.2', '0.2.0-beta.1'].map(pkg);
  assert.deepEqual(approvedVersions({ versions: Object.fromEntries(versions.map((p) => [p.version, p])) }).map((p) => p.version), ['0.1.2', '0.1.10']);
});

test('GitHub sync rejects unidentifiable source commits and foreign artifacts', () => {
  for (const invalid of [{ ...pkg('0.1.0'), gitHead: undefined }, { ...pkg('0.1.0'), repository: { url: 'https://example.com' } }, { ...pkg('0.1.0'), dist: { tarball: 'https://example.com/file.tgz' } }]) {
    assert.throws(() => approvedVersions({ versions: { '0.1.0': invalid } }));
  }
});

test('GitHub sync checks the original npm artifact integrity', () => {
  const data = Buffer.from('approved package');
  const integrity = `sha512-${createHash('sha512').update(data).digest('base64')}`;
  verifyTarball(data, integrity);
  assert.throws(() => verifyTarball(Buffer.from('changed package'), integrity), /integrity mismatch/);
});

test('GitHub mirror changes publishing metadata while preserving the approved manifest fields', () => {
  const original = { ...pkg('0.1.3'), scripts: { test: 'node --test' }, publishConfig: { access: 'public', registry: 'https://registry.npmjs.org/' } };
  const mirrored = mirrorManifest(original, '0.1.3');
  assert.equal(mirrored.publishConfig.registry, 'https://npm.pkg.github.com/');
  assert.equal(mirrored.publishConfig.access, 'public');
  assert.deepEqual(mirrored.scripts, original.scripts);
  assert.equal(original.publishConfig.registry, 'https://registry.npmjs.org/');
  assert.throws(() => mirrorManifest(original, '0.1.4'), /identity mismatch/);
});
