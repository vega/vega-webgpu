/**
 * Writes what the site says about a release:
 *   node scripts/prepare-release.mjs 2.0.0 [--notes "release notes html"]
 *   node scripts/prepare-release.mjs --pages
 *
 * - records the notes in site/releases.json
 * - writes the version's page to site/<x_y_z>/index.html
 * - regenerates site/versions.js, the list both version pickers offer, and the
 *   version table in index.html
 *
 * The bundles themselves are on npm and load from jsDelivr, so nothing here
 * needs a build. Run by scripts/release.mjs before it tags; safe to run any time.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './paths.mjs';

const siteDir = join(root, 'site');
const releasesJsonPath = join(siteDir, 'releases.json');

const args = process.argv.slice(2);
/** Rebuilds the pages from releases.json without cutting a release. */
const pagesOnly = args[0] === '--pages';
const version = pagesOnly ? '' : (args[0] ?? '').replace(/^v/, '');
if (!pagesOnly && !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error(`Usage: node scripts/prepare-release.mjs <version> [--notes "..."]\nGot version: '${version}'`);
  process.exit(1);
}
const notesIndex = args.indexOf('--notes');
const notes = notesIndex !== -1 ? (args[notesIndex + 1] ?? '') : '';

const packageVersion = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
if (!pagesOnly && packageVersion !== version) {
  console.error(`Version mismatch: package.json has ${packageVersion}, release is ${version}.`);
  process.exit(1);
}

// 1. record release notes
const releases = JSON.parse(readFileSync(releasesJsonPath, 'utf8'));
/** 2.0.0-rc1 is a candidate for 2.0.0, and carries whatever 2.0.0 says. */
const base = v => v.split('-')[0];
/** An entry is `{summary, features, performance, fixes, vega}`; a bare string is the old shape. */
const entry = v => {
  const raw = releases[v] ?? releases[base(v)];
  return typeof raw === 'string' ? { summary: raw } : (raw ?? {});
};
if (!pagesOnly && (notes || (releases[version] === undefined && releases[base(version)] === undefined))) {
  releases[version] = {
    vega: Number(version.split('.')[0]) >= 2 ? 6 : 5,
    summary: '',
    features: [],
    performance: [],
    fixes: [],
    ...(typeof releases[version] === 'object' ? releases[version] : {}),
    ...(notes ? { summary: notes } : {}),
  };
}
writeFileSync(releasesJsonPath, `${JSON.stringify(releases, null, 2)}\n`);

const escapeHtml = s =>
  String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Release notes are escaped, then the two tags the existing notes use are let back through. */
const notesHtml = s =>
  escapeHtml(s)
    .replace(/&lt;br\s*\/?&gt;/g, '<br />')
    .replace(/&lt;(\/?)code&gt;/g, '<$1code>');

/** Replaces what sits between `<!-- name:start -->` and `<!-- name:end -->`. */
const splice = (text, path, name, body) => {
  const open = `<!-- ${name}:start -->`;
  const close = `<!-- ${name}:end -->`;
  const a = text.indexOf(open);
  const b = text.indexOf(close);
  if (a < 0 || b < 0 || b < a) {
    throw new Error(`${path} is missing the ${open} ... ${close} markers`);
  }
  return text.slice(0, a + open.length) + body + text.slice(b);
};

// Number() on a prerelease segment like 'rc1' is NaN, which compares equal and
// leaves 2.0.0-rc1 and 2.0.0-rc2 in arbitrary order. Compare those as strings.
const byVersionDesc = (a, b) => {
  const pa = a.split(/[-.]/);
  const pb = b.split(/[-.]/);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    // A missing segment means no prerelease suffix, which outranks one that
    // has it: 2.0.0 is newer than 2.0.0-rc1.
    if (pa[i] === undefined) return -1;
    if (pb[i] === undefined) return 1;
    const na = Number(pa[i]);
    const nb = Number(pb[i]);
    if (Number.isNaN(na) || Number.isNaN(nb)) {
      // numeric: true keeps rc10 above rc2
      const d = pb[i].localeCompare(pa[i], undefined, { numeric: true });
      if (d) return d;
      continue;
    }
    const d = nb - na;
    if (d) return d;
  }
  return 0;
};
/** a is the same version as b or a later one */
const atLeast = (a, b) => byVersionDesc(a, b) <= 0;

/**
 * Everything from 2.0.2 on is on npm, so jsDelivr serves it. The builds before
 * it were only ever hosted in the repository, which no longer carries them.
 */
const FIRST_ON_NPM = '2.0.2';
/** The release workflow has attached the bundles to a GitHub release since 2.0.1. */
const FIRST_GITHUB_RELEASE = '2.0.1';
const onNpm = v => atLeast(v, FIRST_ON_NPM);
const cdn = v => `https://cdn.jsdelivr.net/npm/vega-webgpu@${v}/build`;
const githubRelease = v => `https://github.com/vega/vega-webgpu/releases/tag/v${v}`;
const dirOf = v => v.replaceAll('.', '_');

// A version's page is the record that it was released, the way its bundle
// folder used to be. releases.json can carry notes for a version long before
// it ships, and a row for it would point at a package that is not there yet.
const released = v => v === version || existsSync(join(siteDir, dirOf(v), 'index.html'));
/**
 * Versions with a page on disk. An rc has no entry of its own, so its page is
 * the only record that it went out. The folder name swaps dots for
 * underscores, and a prerelease suffix never contains one.
 */
const releasedDirs = () =>
  readdirSync(siteDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(siteDir, d.name, 'index.html')))
    .map(d => d.name.replaceAll('_', '.'));
const prerelease = v => v.includes('-');
const all = [...new Set(Object.keys(releases).concat(releasedDirs(), version ? [version] : []))].sort(byVersionDesc);
const versions = all.filter(released);
/**
 * An rc is a throwaway for checking the pipeline, so the table lists only the
 * newest one for a version, and none at all once that version has shipped.
 */
const listed = versions.filter(v => {
  if (!prerelease(v)) {
    return true;
  }
  if (versions.includes(base(v))) {
    return false;
  }
  return versions.find(o => prerelease(o) && base(o) === base(v)) === v;
});
/** Written up but not released, which is what the note under the table says. */
const pending = Object.keys(releases)
  .filter(v => !released(v) && !versions.some(h => base(h) === v))
  .sort(byVersionDesc);

// 2. the builds both pickers offer, newest first, which is every listed one npm has
writeFileSync(
  join(siteDir, 'versions.js'),
  `const vegaWebGPURendererVersions = [${listed
    .filter(onNpm)
    .map(v => `'${v}'`)
    .join(', ')}];\n`,
);

// 3. splice the version rows and the date into index.html
// The page is hand written, so only the marked regions are generated.
const files = v => {
  if (onNpm(v)) {
    return `<a href="${cdn(v)}/vega-webgpu-renderer.js">js</a> <a href="${cdn(v)}/vega-webgpu-renderer.min.js">min</a> <a href="https://www.npmjs.com/package/vega-webgpu/v/${v}">npm</a>`;
  }
  if (atLeast(v, FIRST_GITHUB_RELEASE)) {
    return `<a href="${githubRelease(v)}">GitHub release</a>`;
  }
  return '<em>not on npm</em>';
};
const rows = listed
  .map(v => {
    const e = entry(v);
    return `              <tr>
                <td><a href="./site/${dirOf(v)}/">${v}</a></td>
                <td>${notesHtml(e.summary ?? '')}${prerelease(v) ? ' <em>(prerelease)</em>' : ''}${
                  e.vega === 5 ? ' <em>(needs Vega 5)</em>' : ''
                }</td>
                <td>${files(v)}</td>
              </tr>`;
  })
  .join('\n');

// the project page is the site's front page, so it sits at the repo root
const indexPath = join(root, 'index.html');
let page = readFileSync(indexPath, 'utf8');
page = splice(
  page,
  indexPath,
  'versions',
  `
${rows}
              `,
);
const pendingNote = pending.length
  ? `
        <p class="note">
          ${pending.join(' and ')} ${pending.length > 1 ? 'are' : 'is'} written up but not
          released yet. Build from source with the steps above to try ${pending.length > 1 ? 'them' : 'it'}.
        </p>
      `
  : '\n      ';
page = splice(page, indexPath, 'pending', pendingNote);
page = splice(page, indexPath, 'updated', new Date().toISOString().slice(0, 10));
writeFileSync(indexPath, page);

// 4. one page per release, so a version in the table has somewhere to point
const list = (title, items) =>
  items?.length
    ? [`        <h2>${title}</h2>`, '        <ul>']
        .concat(items.map(i => `          <li>${notesHtml(i)}</li>`))
        .concat('        </ul>')
        .join('\n')
    : '';

/**
 * pages.yml keeps the gallery run at a release's tag: every full release, and
 * the newest rc until the next one. Nothing before this version has a run.
 */
const GALLERY_SINCE = '2.0.0';
const newestRc = versions.find(prerelease);
const keepsGallery = v => atLeast(v, GALLERY_SINCE) && (!prerelease(v) || v === newestRc);

for (const v of versions) {
  const e = entry(v);
  const dir = dirOf(v);
  const body = [list('Features', e.features), list('Performance', e.performance), list('Fixes', e.fixes)]
    .filter(Boolean)
    .join('\n\n');
  const vegaMajor = e.vega ?? (Number(v.split('.')[0]) >= 2 ? 6 : 5);
  const npm = onNpm(v);
  const gallery = keepsGallery(v) ? `<a class="btn" href="../../gallery/?run=${v}">Render gallery</a>` : '';
  const actions = npm
    ? `<a class="btn primary" href="${cdn(v)}/vega-webgpu-renderer.js">vega-webgpu-renderer.js</a>
          <a class="btn" href="${cdn(v)}/vega-webgpu-renderer.min.js">vega-webgpu-renderer.min.js</a>
          <a class="btn" href="${cdn(v)}/vega-webgpu-renderer.module.js">ESM build</a>
          <a class="btn" href="https://www.npmjs.com/package/vega-webgpu/v/${v}">npm</a>
          <a class="btn" href="../marks.html?build=${v}">Try it</a>
          ${gallery}`
    : `${atLeast(v, FIRST_GITHUB_RELEASE) ? `<a class="btn" href="${githubRelease(v)}">GitHub release</a>` : ''}
          ${gallery}`;
  const load = npm
    ? `        <h2>Load it</h2>
        <p>
          This build targets <strong>Vega ${vegaMajor}</strong>. Loaded next to a different major version of Vega it
          throws when it registers itself.
        </p>
        <pre><code>&lt;script src="https://cdn.jsdelivr.net/npm/vega@${vegaMajor}/build/vega.min.js"&gt;&lt;/script&gt;
&lt;script src="${cdn(v)}/vega-webgpu-renderer.min.js"&gt;&lt;/script&gt;</code></pre>
        <p>Or from npm:</p>
        <pre><code>npm install vega-webgpu@${v}</code></pre>`
    : `        <h2>Get it</h2>
        <p>
          This build targets <strong>Vega ${vegaMajor}</strong>. It came out before vega-webgpu was published to npm,
          so there is no package for it. ${
            atLeast(v, FIRST_GITHUB_RELEASE)
              ? `The bundles are attached to its <a href="${githubRelease(v)}">GitHub release</a>.`
              : 'Every release from 2.0.2 on is on npm.'
          }
        </p>`;
  const sub = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="../../favicon.ico" sizes="any" />
    <link rel="stylesheet" href="../index.css" />
    <title>vega-webgpu ${v}</title>
  </head>
  <body>
    <header class="slim">
      <div class="wrap">
        <p class="eyebrow"><a href="../../">vega-webgpu</a></p>
        <h1>Version ${v}</h1>
        <p class="lede">${notesHtml(e.summary ?? '')}</p>
        ${actions.trim() ? `<p class="actions">${actions}</p>` : ''}
      </div>
    </header>

    <main class="wrap">
      <section>
${load}
      </section>

      <section>
${body || '        <p class="note">Nothing further was recorded for this release.</p>'}
      </section>
    </main>

    <footer>
      <div class="wrap">
        <p>
          <a href="../../">Project page</a>
          <a href="../../#versions">All versions</a>
          <a href="../marks.html${npm ? `?build=${v}` : ''}">Mark playground</a>
          <a href="https://github.com/vega/vega-webgpu">GitHub</a>
        </p>
        <p class="madewith">
          Built to show the work and to be useful, with the help of
          <a href="https://claude.com/claude-code">Claude</a>.
        </p>
      </div>
    </footer>
  </body>
</html>
`;
  mkdirSync(join(siteDir, dir), { recursive: true });
  writeFileSync(join(siteDir, dir, 'index.html'), sub);
}

// Prettier over the generated html, so a run never leaves the tree dirty.
try {
  // releases.json and versions.js too: this script writes LF and the repo
  // keeps CRLF in the working tree, so without prettier they always read dirty
  const targets = ['index.html', 'site/releases.json', 'site/versions.js'].concat(
    versions.map(v => `site/${dirOf(v)}/index.html`),
  );
  // npx is a .cmd shim on Windows, so it needs a shell. Every argument here is
  // a path without spaces, which a shell would otherwise split.
  execFileSync('npx', ['prettier', '--write', '--log-level', 'warn', ...targets], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
} catch {
  console.warn('prettier is not available, the generated html is left unformatted');
}

console.log(
  pagesOnly
    ? `Rebuilt pages for ${versions.length} versions`
    : `Prepared release ${version}: site/${dirOf(version)}/index.html and the version table`,
);
