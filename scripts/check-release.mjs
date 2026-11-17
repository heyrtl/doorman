import { appendFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

function parseVersion(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`Automatic publishing requires a stable x.y.z version: ${version}`);
  }
  return version.split('.').map(Number);
}

async function registryVersion(name, version, fetcher) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/${version}?check=${Date.now()}`;
  const response = await fetcher(url, { signal: AbortSignal.timeout(30_000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`npm registry check failed: HTTP ${response.status}`);
  const result = await response.json();
  if (result.name !== name || typeof result.version !== 'string') {
    throw new Error('Unexpected npm registry response');
  }
  return result.version;
}

export async function shouldPublish({ name, version }, fetcher = fetch) {
  if (name !== '@heyrtl/doorman') throw new Error(`Unexpected package name: ${name}`);
  const target = parseVersion(version);
  const existing = await registryVersion(name, version, fetcher);
  if (existing !== null) {
    if (existing !== version) throw new Error('Registry version does not match requested version');
    return false;
  }
  const latest = await registryVersion(name, 'latest', fetcher);
  if (latest !== null) {
    const current = parseVersion(latest);
    const difference = target.map((value, index) => value - current[index]).find((value) => value !== 0) ?? 0;
    if (difference <= 0) throw new Error(`Refusing to move latest backward from ${latest} to ${version}`);
  }
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const publish = await shouldPublish(pkg);
  console.log(`${pkg.name}@${pkg.version}: ${publish ? 'ready to publish' : 'already published; skipping'}`);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `publish=${publish}\n`);
  }
}
