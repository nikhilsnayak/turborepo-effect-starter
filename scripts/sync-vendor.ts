/* oxlint-disable effecttsgo/async-function, effecttsgo/global-console, effecttsgo/node-builtin-import -- Standalone Bun process adapter. */
import { existsSync } from 'node:fs';

import manifest from '../package.json' with { type: 'json' };

// A vendor is synced to the release tag of the version the root catalog installs.
type Vendor = {
  readonly repository: string;
  readonly dependency: keyof typeof manifest.catalog;
  readonly releaseTag: (version: string) => string;
  readonly prefix: string;
};

const vendors = {
  effect: {
    repository: 'https://github.com/Effect-TS/effect.git',
    dependency: 'effect',
    releaseTag: (version) => `effect@${version}`,
    prefix: 'vendor/effect',
  },
} satisfies Record<string, Vendor>;

type VendorName = keyof typeof vendors;

const run = async (command: ReadonlyArray<string>, cwd?: string) => {
  const child = Bun.spawn([...command], {
    ...(cwd === undefined ? {} : { cwd }),
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  return child.exited;
};

const output = async (command: ReadonlyArray<string>, cwd?: string) => {
  const child = Bun.spawn([...command], {
    ...(cwd === undefined ? {} : { cwd }),
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);

  return { exitCode, stdout: stdout.trim(), stderr: stderr.trim() };
};

export const parseSubtreeSplit = (message: string): string | undefined =>
  /^git-subtree-split: ([0-9a-f]{40})$/m.exec(message)?.[1];

// An annotated tag is listed twice; its peeled `^{}` entry names the commit.
export const parseTagCommit = (remoteOutput: string, tag: string): string | undefined => {
  const refs = new Map(
    remoteOutput
      .trim()
      .split('\n')
      .map((line) => {
        const [commit, ref] = line.trim().split(/\s+/);
        return [ref, commit] as const;
      }),
  );
  const commit = refs.get(`refs/tags/${tag}^{}`) ?? refs.get(`refs/tags/${tag}`);

  return /^[0-9a-f]{40}$/.test(commit ?? '') ? commit : undefined;
};

const installedVersion = (vendor: Vendor) => {
  const version = manifest.catalog[vendor.dependency];

  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(version)) {
    throw new Error(
      `The root catalog must pin ${vendor.dependency} to an exact version, not ${version}.`,
    );
  }

  return version;
};

const subtreeSplit = async (vendor: Vendor, root: string) => {
  const log = await output(
    [
      'git',
      'log',
      '-1',
      '--format=%B',
      '--fixed-strings',
      `--grep=git-subtree-dir: ${vendor.prefix}`,
      'HEAD',
    ],
    root,
  );

  if (log.exitCode !== 0) {
    return undefined;
  }

  return parseSubtreeSplit(log.stdout);
};

const resolveRemoteCommit = async (vendor: Vendor, tag: string, root: string) => {
  const remote = await output(
    [
      'git',
      'ls-remote',
      '--exit-code',
      vendor.repository,
      `refs/tags/${tag}`,
      `refs/tags/${tag}^{}`,
    ],
    root,
  );
  const commit = parseTagCommit(remote.stdout, tag);

  if (remote.exitCode !== 0 || commit === undefined) {
    throw new Error(`Could not resolve ${vendor.repository}#${tag}.`);
  }

  return commit;
};

const fetchRemoteCommit = async (vendor: Vendor, commit: string, root: string) => {
  const fetched = await run(['git', 'fetch', '--no-tags', vendor.repository, commit], root);

  if (fetched !== 0) {
    throw new Error(`Could not fetch ${vendor.repository} at ${commit}.`);
  }

  const resolved = await output(['git', 'rev-parse', '--verify', `${commit}^{commit}`], root);
  if (resolved.exitCode !== 0 || resolved.stdout !== commit) {
    throw new Error(`Fetching ${vendor.repository} did not provide commit ${commit}.`);
  }
};

const assertNoGitlinks = async (vendor: Vendor, root: string) => {
  const files = await output(['git', 'ls-files', '--stage', '--', vendor.prefix], root);
  const gitlinks = files.stdout
    .split('\n')
    .filter((line) => line.startsWith('160000 '))
    .map((line) => line.slice(line.indexOf('\t') + 1));

  if (gitlinks.length > 0) {
    throw new Error(`Nested gitlinks found:\n${gitlinks.join('\n')}`);
  }
};

const sync = async (name: VendorName, root: string) => {
  const vendor = vendors[name];
  const prefixExists = existsSync(`${root}/${vendor.prefix}`);
  const existingSplit = await subtreeSplit(vendor, root);

  if (prefixExists && existingSplit === undefined) {
    throw new Error(
      `${vendor.prefix} exists without git subtree metadata. Remove the copied directory in a clean commit before retrying.`,
    );
  }

  const tag = vendor.releaseTag(installedVersion(vendor));
  const remoteCommit = await resolveRemoteCommit(vendor, tag, root);
  await fetchRemoteCommit(vendor, remoteCommit, root);

  const operation = prefixExists ? 'merge' : 'add';
  console.log(
    `${operation === 'add' ? 'Adding' : 'Syncing'} ${name} from ${vendor.repository}#${tag}`,
  );

  const exitCode = await run(
    ['git', 'subtree', operation, `--prefix=${vendor.prefix}`, remoteCommit, '--squash'],
    root,
  );

  if (exitCode !== 0) {
    throw new Error(
      `Could not ${operation} ${name}. Confirm git-subtree is installed and resolve the Git state before retrying.`,
    );
  }

  const syncedSplit = await subtreeSplit(vendor, root);
  if (syncedSplit !== remoteCommit) {
    throw new Error(
      `The ${name} subtree recorded ${syncedSplit ?? 'no split commit'} instead of ${remoteCommit}.`,
    );
  }

  await assertNoGitlinks(vendor, root);
};

const main = async () => {
  const requested = Bun.argv[2];
  const names = Object.keys(vendors) as Array<VendorName>;

  if (requested === '--help' || requested === '-h') {
    console.log(`Usage: bun run vendor:sync <${names.join('|')}|all>`);
    return;
  }

  if (requested !== 'all' && !names.includes(requested as VendorName)) {
    throw new Error(`Usage: bun run vendor:sync <${names.join('|')}|all>`);
  }

  const root = await output(['git', 'rev-parse', '--show-toplevel']);
  if (root.exitCode !== 0 || root.stdout === '') {
    throw new Error('Run vendor sync inside a Git repository with an initial commit.');
  }

  const head = await output(['git', 'rev-parse', '--verify', 'HEAD'], root.stdout);
  if (head.exitCode !== 0) {
    throw new Error('Create the initial commit before syncing vendored repositories.');
  }

  const status = await output(['git', 'status', '--porcelain'], root.stdout);
  if (status.stdout !== '') {
    throw new Error('The worktree must be clean before syncing vendored repositories.');
  }

  for (const name of requested === 'all' ? names : [requested as VendorName]) {
    await sync(name, root.stdout);
  }
};

if (import.meta.main) {
  await main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
