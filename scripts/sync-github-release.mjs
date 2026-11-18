import { execFileSync } from 'node:child_process';
import { createHash, timingSafeEqual } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const name = '@heyrtl/doorman';
const repo = 'heyrtl/doorman';
const githubRegistry = 'https://npm.pkg.github.com/';
const repositoryUrl = `git+https://github.com/${repo}.git`;
const run = (command, args, options = {}) => execFileSync(command, args, {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options,
});

export function approvedVersions(metadata) {
  return Object.values(metadata.versions).filter((pkg) => /^\d+\.\d+\.\d+$/.test(pkg.version)).map((pkg) => {
    if (pkg.name !== name || pkg.repository?.url !== repositoryUrl || !/^[a-f0-9]{40}$/.test(pkg.gitHead)) {
      throw new Error(`Cannot identify the published source for ${pkg.version}`);
    }
    if (!pkg.dist?.tarball || new URL(pkg.dist.tarball).origin !== 'https://registry.npmjs.org') {
      throw new Error(`Unexpected tarball source for ${pkg.version}`);
    }
    return pkg;
  }).sort((a, b) => {
    const left = a.version.split('.').map(Number);
    const right = b.version.split('.').map(Number);
    return left.map((v, i) => v - right[i]).find((v) => v !== 0) ?? 0;
  });
}

export function verifyTarball(data, integrity) {
  const [algorithm, expected] = integrity.split('-');
  if (algorithm !== 'sha512' || !expected) throw new Error('Expected npm SHA-512 integrity');
  const actual = createHash('sha512').update(data).digest();
  const wanted = Buffer.from(expected, 'base64');
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) throw new Error('Tarball integrity mismatch');
}

export function mirrorManifest(manifest, version) {
  if (manifest.name !== name || manifest.version !== version) throw new Error('Tarball package identity mismatch');
  return { ...manifest, publishConfig: { ...manifest.publishConfig, registry: githubRegistry, provenance: false } };
}

async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status} from ${url}`);
  return response;
}

function packageExists(version) {
  try {
    const existing = JSON.parse(run('npm', ['view', `${name}@${version}`, 'version', '--json', '--registry', githubRegistry]));
    if (existing !== version) throw new Error('Unexpected GitHub Packages version response');
    return true;
  } catch (error) {
    let details;
    try { details = JSON.parse(error.stdout); } catch { throw error; }
    if (details.error?.code === 'E404') return false;
    throw error;
  }
}

async function sync() {
  if (!process.env.GH_TOKEN || !process.env.NODE_AUTH_TOKEN) throw new Error('GitHub workflow credentials required');
  const metadata = await (await get('https://registry.npmjs.org/@heyrtl%2fdoorman')).json();
  const versions = approvedVersions(metadata);
  const releases = JSON.parse(run('gh', ['release', 'list', '--repo', repo, '--limit', '1000', '--json', 'tagName']));
  const existingReleases = new Set(releases.map((release) => release.tagName));

  for (const pkg of versions) {
    const tag = `v${pkg.version}`;
    run('git', ['merge-base', '--is-ancestor', pkg.gitHead, 'origin/main']);
    // Existing tags must identify exactly the source npm says was published.
    let taggedCommit;
    try { taggedCommit = run('git', ['rev-parse', '--verify', `${tag}^{commit}`]).trim(); } catch { /* New tag. */ }
    if (taggedCommit && taggedCommit !== pkg.gitHead) throw new Error(`Source mismatch for ${tag}`);
    const mirrored = packageExists(pkg.version);
    if (mirrored && existingReleases.has(tag)) continue;

    const directory = await mkdtemp(join(tmpdir(), 'doorman-github-release-'));
    try {
      const data = Buffer.from(await (await get(pkg.dist.tarball)).arrayBuffer());
      verifyTarball(data, pkg.dist.integrity);
      const tarball = join(directory, `heyrtl-doorman-${pkg.version}.tgz`);
      await writeFile(tarball, data);
      if (!mirrored) {
        run('tar', ['-xzf', tarball, '-C', directory]);
        const packageDirectory = join(directory, 'package');
        const manifestPath = join(packageDirectory, 'package.json');
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
        // Keep the approved files; only adapt publishing metadata for the second registry.
        await writeFile(manifestPath, `${JSON.stringify(mirrorManifest(manifest, pkg.version), null, 2)}\n`);
        console.log(run('npm', ['publish', '--ignore-scripts', '--registry', githubRegistry], { cwd: packageDirectory }));
      }
      if (!existingReleases.has(tag)) {
        const notes = join(directory, 'notes.md');
        await writeFile(notes, `Published as [${name}@${pkg.version}](https://www.npmjs.com/package/${name}/v/${pkg.version}).\n\nInstall from npm:\n\n\`\`\`sh\nnpm install ${name}@${pkg.version}\n\`\`\`\n\nThe attached archive is the original approved npm artifact, verified against npm's SHA-512 integrity. GitHub Packages hosts the same files with registry-specific publishing metadata.\n`);
        console.log(run('gh', ['release', 'create', tag, tarball, '--repo', repo, '--target', pkg.gitHead,
          '--title', `Doorman ${tag}`, '--notes-file', notes, '--generate-notes',
          `--latest=${pkg.version === metadata['dist-tags'].latest}`]));
      }
      console.log(`Synced ${tag}`);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await sync();
