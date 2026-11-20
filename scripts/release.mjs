/**
 * Cuts a release. See Release.md, or run `npm run release -- --help`.
 *
 * The point of this script is that a tag is never the first thing that finds a
 * mistake. It bumps package.json for you, refuses to go on until releases.json
 * describes the version, runs the suite, and commits and pushes what it
 * changed before the tag exists at all.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { join } from 'node:path';
import { root } from './paths.mjs';

const args = process.argv.slice(2);
const has = flag => args.includes(flag);

const HELP = `
  npm run release [-- <version>] [options]

  Cuts a release: bumps package.json, checks the notes, runs the suite,
  writes the version's page and table row, commits and pushes what changed,
  then tags and pushes the tag. The workflow the tag starts builds the bundles,
  creates the GitHub release and publishes to npm.

  <version>        2.1.0 or 2.1.0-rc1. Defaults to the version in package.json.
                   An explicit one that differs is written to package.json.

  --check          Stop before writing the site or committing anything.
                   Everything else still runs.
  --skip-tests     Do not run the suite.
  --yes            Answer the "the suite is red, continue?" prompt with yes.
  --help           This.

  A prerelease (2.1.0-rc1) is installable as @next and is labelled on the
  version table. The front page snippet loads vega-webgpu@2, which never
  resolves to one.
`;

if (has('--help') || has('-h')) {
  console.log(HELP);
  process.exit(0);
}

const checkOnly = has('--check');
const assumeYes = has('--yes');
const skipTests = has('--skip-tests');

const pkgPath = join(root, 'package.json');
const releasesJsonPath = join(root, 'site', 'releases.json');
const packageVersion = JSON.parse(readFileSync(pkgPath, 'utf8')).version;
const asked = args.find(a => !a.startsWith('-'));
const version = (asked ?? packageVersion).replace(/^v/, '');
const isPrerelease = version.includes('-');
const tag = `v${version}`;

const say = (...lines) => console.log(`  ${lines.join('\n  ')}`);
const die = (...lines) => {
  console.error(`\n  ${lines.join('\n  ')}\n`);
  process.exit(1);
};
const gitRaw = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8' });
const git = (...a) => gitRaw(...a).trim();
/**
 * npm and npx are .cmd shims on Windows and will not spawn without a shell.
 * Nothing else gets one: a shell concatenates the arguments without quoting
 * them, which splits any argument holding a space. A commit message and a tag
 * message both hold spaces.
 */
const run = (cmd, cmdArgs) => {
  const shim = process.platform === 'win32' && (cmd === 'npm' || cmd === 'npx');
  return spawnSync(cmd, cmdArgs, { cwd: root, stdio: 'inherit', shell: shim });
};

async function confirm(question) {
  if (assumeYes) {
    return true;
  }
  if (!process.stdin.isTTY) {
    say('Not a terminal and no --yes, so stopping here.');
    return false;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`  ${question} [y/N] `)).trim().toLowerCase();
  rl.close();
  return answer === 'y' || answer === 'yes';
}

/** The files this script is allowed to have dirty, because it commits them. */
const OWNED = ['package.json', 'package-lock.json', 'site/releases.json'];
// Not git(): porcelain puts the status in the first two columns, so trimming
// the output eats the leading space of the first line and shifts the path.
const dirty = () =>
  gitRaw('status', '--porcelain', '--untracked-files=no')
    .split('\n')
    .filter(Boolean)
    .map(l => l.slice(3).trim());

if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(version)) {
  die(`'${version}' is not a version.`, 'Expected something like 2.0.0 or 2.1.0-rc1.');
}

// Anything the script does not own has to be dealt with first, or the tag ends
// up pointing at a tree that was never the one under test.
const strays = dirty().filter(f => !OWNED.includes(f));
if (strays.length) {
  die(
    'These are uncommitted, and this script will not tag over them:',
    '',
    ...strays.map(f => `    ${f}`),
    '',
    'Commit or stash them first.',
  );
}

if (git('tag', '--list', tag)) {
  die(`${tag} already exists locally.`, `Delete it if you mean to move it:  git tag -d ${tag}`);
}

// 1. an explicit version is written into package.json rather than refused
let bumped = false;
if (version !== packageVersion) {
  say(`package.json is on ${packageVersion}, moving it to ${version}.`);
  if (run('npm', ['version', version, '--no-git-tag-version', '--allow-same-version']).status !== 0) {
    die('npm version failed, so package.json was left alone.');
  }
  bumped = true;
  say('package.json is bumped and not committed yet. This script commits it before it tags.', '');
}

// 2. the notes, which the site and the GitHub release both read
const releases = JSON.parse(readFileSync(releasesJsonPath, 'utf8'));
// A candidate carries the notes of the version it is a candidate for: an rc
// exists to put the pipeline through its paces, not to be described twice.
const base = version.split('-')[0];
const raw = releases[version] ?? releases[base];
const entry = typeof raw === 'string' ? { summary: raw } : raw;
if (!entry) {
  die(
    `site/releases.json has nothing for ${base}, so there is nothing to release yet.`,
    ...(isPrerelease ? [`${version} is a candidate for ${base} and reads its notes.`] : []),
    'The version table, the release page and the GitHub release all read from it.',
    '',
    'Write this, then run the same command again:',
    '',
    `    "${base}": {`,
    `      "vega": ${Number(base.split('.')[0]) >= 2 ? 6 : 5},`,
    '      "summary": "One sentence on what this release is.",',
    '      "features": [],',
    '      "performance": [],',
    '      "fixes": []',
    '    }',
    ...(bumped ? ['', `package.json is already on ${version}, so leave it be.`] : []),
  );
}
const summary = (entry.summary ?? '').trim();
if (!summary) {
  die(`The ${version} entry has no summary.`, 'That sentence is the whole Changes column on the front page.');
}
const counts = ['features', 'performance', 'fixes'].map(k => (entry[k] ?? []).length);
if (counts.reduce((a, b) => a + b, 0) === 0 && !(isPrerelease && releases[base])) {
  const lines = [
    `The ${version} entry lists no features, performance work or fixes.`,
    'Its release page would be a heading and nothing else.',
  ];
  if (isPrerelease) {
    console.warn(`\n  Warning: ${lines.join('\n  ')}\n  Continuing because ${version} is a prerelease.`);
  } else {
    die(...lines, '', 'A prerelease may go out thin, a final release should not.');
  }
}

console.log(`\n  ${version}${isPrerelease ? `  (candidate for ${base})` : ''}`);
say(summary, `${counts[0]} features, ${counts[1]} performance notes, ${counts[2]} fixes`, '');

// 3. the suite
if (skipTests) {
  say('Skipping the suite because you asked.', '');
} else {
  // The suite loads build/, so without this it tests whatever build is lying
  // around, or fails everywhere when there is none.
  say('Building, then running the suite. This takes a few minutes.', '');
  if (run('npm', ['run', 'build']).status !== 0) {
    die('The build failed.', ...(bumped ? [`package.json is still on ${version}.`] : []));
  }
  if (run('npm', ['test']).status !== 0) {
    console.log('');
    if (!(await confirm(`The suite is red. Release ${version} anyway?`))) {
      die('Stopped. Nothing was committed or tagged.', ...(bumped ? [`package.json is still on ${version}.`] : []));
    }
    say('Continuing with a red suite.', '');
  }
}

if (checkOnly) {
  say(`Everything checks out. Drop --check to commit, tag ${tag} and push.`, '');
  process.exit(0);
}

// 4. the version's page, its table row and its slot in the pickers. They go out
// in the same commit as the tag, so the site lists a version from its release on.
if (run('node', ['scripts/prepare-release.mjs', version]).status !== 0) {
  die('Writing the version into the site failed.', 'Nothing was committed or tagged.');
}

// 5. commit and push what changed, so the tag lands on a commit the remote has.
// A run after a failed tag push finds all of it committed already. Every page
// goes in, not only the new one: a new rc takes the gallery button off the one
// before it, and a notes fix for an older version rewrites that version's page.
const written = [
  'package.json',
  'package-lock.json',
  'index.html',
  'site/releases.json',
  'site/versions.js',
  ':(glob)site/*/index.html',
];
if (run('git', ['add', ...written]).status !== 0) {
  die('Staging the release files failed.', 'Nothing was committed or tagged.');
}
const staged = git('diff', '--cached', '--name-only').split('\n').filter(Boolean);
if (staged.length) {
  say('Committing:', ...staged.map(f => `    ${f}`), '');
  if (run('git', ['commit', '-m', `release: ${version}`]).status !== 0) {
    die('The commit failed.');
  }
}
if (run('git', ['push', 'origin', 'HEAD']).status !== 0) {
  die('Pushing the branch failed, so nothing was tagged.');
}

// 6. the tag, last, once everything it points at is on the remote
say('', `Tagging ${tag}.`, '');
run('git', ['tag', '-a', tag, '-m', summary]);
if (run('git', ['push', 'origin', tag]).status !== 0) {
  run('git', ['tag', '-d', tag]);
  die('Pushing the tag failed, so the tag was removed again.', 'The commit is pushed, so just run this again.');
}

console.log(
  [
    '',
    `  ${tag} is pushed.`,
    '',
    '  .github/workflows/release.yml now builds the bundles, creates the GitHub',
    '  release, and publishes to npm.',
    '',
    '    gh run watch',
    '',
  ].join('\n'),
);
