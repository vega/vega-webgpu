import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectPageErrors } from './drive.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The builds the pickers offer, newest first, as site/versions.js lists them. */
const published = [...readFileSync(join(root, 'site', 'versions.js'), 'utf8').matchAll(/'([^']+)'/g)].map(m => m[1]);

const cdn = (v: string) => `https://cdn.jsdelivr.net/npm/vega-webgpu@${v}/build/vega-webgpu-renderer.js`;

/**
 * The suite must not need the network, so jsDelivr answers with the local
 * build: what is under test is that a page asks for the package at the right
 * version and runs what comes back, not the bytes npm holds for it. A version
 * in `missing` answers 404, the way jsDelivr does for one npm does not have.
 * Anything else outside the test server is refused and recorded.
 */
async function offlineCdn(page: Page, missing: string[] = []) {
  const asked: string[] = [];
  const offline: string[] = [];
  await page.route(/^https?:\/\//, route => {
    const url = route.request().url();
    if (new URL(url).hostname === '127.0.0.1') {
      return route.continue();
    }
    if (url.startsWith('https://cdn.jsdelivr.net/npm/vega-webgpu@')) {
      asked.push(url);
      if (missing.some(v => url === cdn(v))) {
        return route.fulfill({ status: 404, body: 'Not found' });
      }
      return route.fulfill({ path: join(root, 'build', 'vega-webgpu-renderer.js'), contentType: 'text/javascript' });
    }
    offline.push(url);
    return route.abort();
  });
  return { asked, offline };
}

test('a published build loads from jsdelivr', async ({ page }) => {
  test.setTimeout(120_000);
  expect(published.length, 'site/versions.js lists at least one build').toBeGreaterThan(0);
  const version = published[0];
  const errors = collectPageErrors(page);
  const { asked, offline } = await offlineCdn(page);

  await page.goto(`/site/marks.html?build=${version}&view=canvas&mark=rect`);
  await page.waitForFunction(
    () => ((window as unknown as { __views?: unknown[] }).__views?.length ?? 0) >= 1,
    undefined,
    { timeout: 60_000 },
  );
  await page.waitForTimeout(800);
  const out = await page.evaluate(() => ({
    hasWebgpu: !!(window as unknown as { vega: { renderModule: (s: string) => unknown } }).vega.renderModule('webgpu'),
    build: (document.getElementById('build') as HTMLSelectElement).value,
    banner: document.getElementById('error')!.textContent!.slice(0, 90),
    bannerClass: document.getElementById('error')!.className,
  }));
  console.log(JSON.stringify(out));

  expect(asked).toEqual([cdn(version)]);
  expect(offline, 'nothing else went to the network').toEqual([]);
  expect(out.build).toBe(version);
  // The banner has three states. A published build has to reach the one that
  // says which build is on, not the one that says nothing could be loaded.
  expect(out.bannerClass, `banner said: ${out.banner}`).toContain('warn');
  expect(out.banner, 'and it names the build').toContain(version);
  expect(out.hasWebgpu).toBe(true);
  expect(errors).toEqual([]);
});

/**
 * The release commit lists a version a few minutes before npm has it, and an
 * old link can name one npm never had. The demo page falls back to the newest
 * published build and says so, rather than staying blank.
 */
test('the demo page falls back when npm does not have the version', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectPageErrors(page);
  const missing = '9.9.9';
  const { asked, offline } = await offlineCdn(page, [missing]);

  await page.goto(`/test/?spec=bar&renderer=canvas&version=${missing}`);
  await page.waitForFunction(() => document.querySelectorAll('#versions option').length > 0, undefined, {
    timeout: 60_000,
  });
  const out = await page.evaluate(() => ({
    rendererVersion: (window as unknown as { __rendererVersion: string }).__rendererVersion,
    picked: (document.getElementById('versions') as HTMLSelectElement).value,
    hasWebgpu: !!(window as unknown as { vega: { renderModule: (s: string) => unknown } }).vega.renderModule('webgpu'),
  }));
  console.log(JSON.stringify(out));

  expect(asked).toEqual([cdn(missing), cdn(published[0])]);
  expect(offline, 'nothing else went to the network').toEqual([]);
  expect(out.rendererVersion).toBe(published[0]);
  expect(out.picked).toBe(published[0]);
  expect(out.hasWebgpu).toBe(true);
  expect(errors).toEqual([]);
});
