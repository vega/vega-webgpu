/**
 * Cuts a release in two steps. See Release.md, or run `npm run release -- --help`.
 *
 * The point of this script is that a tag is never the first thing that finds a
 * mistake. It bumps package.json for you, refuses to go on until releases.json
 * describes the version, runs the suite, and puts all of it up as a pull
 * request. The tag only comes once that pull request is merged.
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
  npm run release:tag [-- <version>]

  Cuts a release in two steps.

  npm run release bumps package.json, checks the notes, runs the suite and
  writes the version's page and table row. It commits that to a release-v<version>
  branch, pushes it and prints the link to open the pull request.

  npm run release:tag tags the merged release commit on main and pushes the tag.
  The workflow the tag starts builds the bundles, creates the GitHub release and
  publishes to npm.

  <version>        2.1.0 or 2.1.0-rc1. Defaults to the version in package.json,
                   and for release:tag to the one on main.
                   An explicit one that differs is written to package.json.

  --check          Stop before writing the site or committing anything.
                   Everything else still runs.
  --skip-tests     Do not run the suite.
  --yes            Answer the "the suite is red, continue?" prompt with yes.
  --tag            What release:tag runs.
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
const tagOnly = has('--tag');

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

const pkgPath = join(root, 'package.json');
const releasesJsonPath = join(root, 'site', 'releases.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const packageVersion = pkg.version;
const repoUrl = pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
const asked = args.find(a => !a.startsWith('-'));

// Both steps start from what is on origin, not from the local main.
if (run('git', ['fetch', '--quiet', '--tags', 'origin', 'main']).status !== 0) {
  die('Fetching origin failed.');
}
const mainVersion = () => JSON.parse(git('show', 'origin/main:package.json')).version;
const version = (asked ?? (tagOnly ? mainVersion() : packageVersion)).replace(/^v/, '');
const isPrerelease = version.includes('-');
const tag = `v${version}`;
const branch = `release-${tag}`;
const title = `chore: release ${tag}`;

if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(version)) {
  die(`'${version}' is not a version.`, 'Expected something like 2.0.0 or 2.1.0-rc1.');
}

if (git('tag', '--list', tag)) {
  die(`${tag} already exists.`, `Delete it if you mean to move it:  git tag -d ${tag}`);
}

if (tagOnly) {
  tagMergedRelease();
  process.exit(0);
}

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

// Anything the script does not own has to be dealt with first, or the tag ends
// up pointing at a tree that was never the one under test.
const strays = dirty().filter(f => !OWNED.includes(f));
if (strays.length) {
  die(
    'These are uncommitted, and this script will not release over them:',
    '',
    ...strays.map(f => `    ${f}`),
    '',
    'Commit or stash them first.',
  );
}

// The release pull request carries the release commit and nothing else.
if (!checkOnly && git('rev-parse', 'HEAD') !== git('rev-parse', 'origin/main')) {
  die('HEAD is not origin/main.', 'Start from an up to date main:  git switch main && git pull');
}
if (!checkOnly && git('branch', '--list', branch)) {
  die(`The branch ${branch} already exists.`, `Delete it if it is left over:  git branch -D ${branch}`);
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
  say(`Everything checks out. Drop --check to put ${tag} up as a pull request.`, '');
  process.exit(0);
}

// 4. the version's page, its table row and its slot in the pickers. They go out
// in the release commit, so the site lists a version from its release on.
if (run('node', ['scripts/prepare-release.mjs', version]).status !== 0) {
  die('Writing the version into the site failed.', 'Nothing was committed.');
}

// 5. commit it on a branch of its own and push that. Every page goes in, not
// only the new one: a new rc takes the gallery button off the one before it,
// and a notes fix for an older version rewrites that version's page.
const written = [
  'package.json',
  'package-lock.json',
  'index.html',
  'site/releases.json',
  'site/versions.js',
  ':(glob)site/*/index.html',
];
if (run('git', ['switch', '--quiet', '-c', branch]).status !== 0) {
  die(`Creating ${branch} failed.`, 'Nothing was committed.');
}
if (run('git', ['add', ...written]).status !== 0) {
  die('Staging the release files failed.', 'Nothing was committed.');
}
const staged = git('diff', '--cached', '--name-only').split('\n').filter(Boolean);
if (!staged.length) {
  die(`main already has everything ${version} would change, so there is nothing to put up.`);
}
say('Committing:', ...staged.map(f => `    ${f}`), '');
if (run('git', ['commit', '--quiet', '-m', title]).status !== 0) {
  die('The commit failed.', `The release files are staged on ${branch}.`);
}
if (run('git', ['push', '--quiet', '-u', 'origin', branch]).status !== 0) {
  die(`Pushing ${branch} failed.`, `The commit is on ${branch}, push it with:  git push -u origin ${branch}`);
}
// back to main, which the release only reaches through the pull request
run('git', ['switch', '--quiet', '-']);

console.log(
  [
    '',
    `  ${branch} is pushed. Open the pull request:`,
    '',
    `    ${repoUrl}/compare/main...${branch}?expand=1&title=${encodeURIComponent(title)}`,
    '',
    '  Once it is merged, tag it:',
    '',
    '    npm run release:tag',
    '',
  ].join('\n'),
);

/**
 * The second step. Finds the merged release commit on origin/main, tags it with
 * the version's summary and pushes the tag, which starts release.yml.
 */
function tagMergedRelease() {
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // a squash merge puts the pull request number after the title
  const sha = git('log', 'origin/main', '-n', '1', '--format=%H', '-E', `--grep=^${escape(title)}( \\(#[0-9]+\\))?$`);
  if (!sha) {
    die(`main has no "${title}" commit.`, 'Merge the release pull request first, then run this again.');
  }
  const short = sha.slice(0, 7);
  const released = JSON.parse(git('show', `${sha}:package.json`)).version;
  if (released !== version) {
    die(`${short} is "${title}", but package.json there is on ${released}.`);
  }
  const notes = JSON.parse(git('show', `${sha}:site/releases.json`));
  const raw = notes[version] ?? notes[version.split('-')[0]];
  const message = (typeof raw === 'string' ? raw : (raw?.summary ?? '')).trim();
  if (!message) {
    die(`site/releases.json at ${short} has no summary for ${version}.`);
  }

  say(`Tagging ${short} as ${tag}.`, '');
  if (run('git', ['tag', '-a', tag, '-m', message, sha]).status !== 0) {
    die('Tagging failed.');
  }
  if (run('git', ['push', 'origin', tag]).status !== 0) {
    run('git', ['tag', '-d', tag]);
    die('Pushing the tag failed, so the tag was removed again.', 'Just run this again.');
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
  if (git('rev-parse', 'origin/main') !== sha) {
    say(
      `main has moved on since ${short}. The release goes out all the same, but its`,
      'gallery run is only kept while it is one of the last ten.',
      '',
    );
  }
}
