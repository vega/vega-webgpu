import { expect, test } from '@playwright/test';
import { harnessUrl, waitForRender } from './drive.js';

/** LruMap as the page reaches it, through the path cache it backs. */
type LruCtor = new (max: number, onEvict?: (value: number, key: number) => void) => Map<number, number>;

/**
 * The cache keeps its least recently used order through every way it is
 * touched. Eviction holds an iterator between calls, and an entry that is
 * read moves past it, so a reference list is replayed alongside: reads,
 * writes, deletes from outside and a clear, on caches from no room at all to
 * more room than the keys need.
 */
test('LruMap drops the least recently used entry', async ({ page }) => {
  await page.goto(harnessUrl('scene', 'path-outline-runs'));
  await waitForRender(page);
  const out = await page.evaluate(() => {
    const w = window as unknown as { renderer: { _ctx: { _pathCache: { constructor: unknown } } } };
    const Lru = w.renderer._ctx._pathCache.constructor as LruCtor;
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const failures: string[] = [];
    let evictions = 0;
    for (const max of [0, 1, 3, 50]) {
      const dropped: number[] = [];
      const lru = new Lru(max, (_v, k) => dropped.push(k));
      let ref: number[] = [];
      const refDropped: number[] = [];
      for (let step = 0; step < 5000 && failures.length === 0; step++) {
        const r = rnd();
        const k = Math.floor(rnd() * (max * 3 + 2));
        if (r < 0.45) {
          lru.set(k, k);
          ref = ref.filter(x => x !== k);
          ref.push(k);
          if (ref.length > max) {
            refDropped.push(ref.shift()!);
          }
        } else if (r < 0.85) {
          const hit = lru.get(k) !== undefined;
          const i = ref.indexOf(k);
          if (hit !== i >= 0) {
            failures.push(`max ${max} step ${step}: get ${k} hit ${hit}`);
          }
          if (i >= 0) {
            ref.splice(i, 1);
            ref.push(k);
          }
        } else if (r < 0.98) {
          lru.delete(k);
          ref = ref.filter(x => x !== k);
        } else {
          lru.clear();
          ref = [];
        }
        const keys = [...lru.keys()].join();
        if (keys !== ref.join()) {
          failures.push(`max ${max} step ${step}: [${keys}] where [${ref.join()}]`);
        }
      }
      if (dropped.join() !== refDropped.join()) {
        failures.push(`max ${max}: dropped [${dropped.join()}] where [${refDropped.join()}]`);
      }
      evictions += dropped.length;
    }
    return { failures, evictions };
  });
  expect(out.failures).toEqual([]);
  expect(out.evictions, 'the replay has to evict to test anything').toBeGreaterThan(1000);
});

/**
 * The held iterator keeps every table V8 rebuilds while it stands still, and
 * reading a full cache rebuilds it without evicting anything, so a settled
 * scene grew the path cache's memory on every frame. The heap cannot be read
 * here, so this holds the iterator to being let go after as many changes as
 * the cache holds, and checks that eviction is still right afterwards.
 */
test('LruMap lets go of its iterator when it only reads', async ({ page }) => {
  await page.goto(harnessUrl('scene', 'path-outline-runs'));
  await waitForRender(page);
  const out = await page.evaluate(() => {
    const w = window as unknown as { renderer: { _ctx: { _pathCache: { constructor: unknown } } } };
    const Lru = w.renderer._ctx._pathCache.constructor as LruCtor;
    const dropped: number[] = [];
    const lru = new Lru(4, (_v, k) => dropped.push(k));
    for (let k = 0; k < 5; k++) {
      lru.set(k, k);
    }
    const held = (lru as unknown as { oldest: unknown }).oldest !== null;
    for (let i = 0; i < 5; i++) {
      lru.get(1 + (i % 4));
    }
    const released = (lru as unknown as { oldest: unknown }).oldest === null;
    lru.get(2);
    lru.set(9, 9);
    return { held, released, dropped, keys: [...lru.keys()] };
  });
  expect(out.held, 'an eviction holds the iterator').toBe(true);
  expect(out.released, 'five reads of a cache of four let it go').toBe(true);
  // read 1 2 3 4 1 2 leaves 3 the oldest
  expect(out.dropped).toEqual([0, 3]);
  expect(out.keys).toEqual([4, 1, 2, 9]);
});

/**
 * A full cache that takes a new key every time, which is what the path cache
 * does under a force layout. Eviction started from the front of the map each
 * time, and V8 leaves every deleted entry there until it rebuilds the table, so
 * the cost of an eviction grew with the size of the cache: at 10000 entries it
 * was more than ten times what it is at 500. Held, it does not depend on the
 * size.
 */
test('LruMap evicts in about the same time at any size', async ({ page }) => {
  await page.goto(harnessUrl('scene', 'path-outline-runs'));
  await waitForRender(page);
  const out = await page.evaluate(() => {
    const w = window as unknown as { renderer: { _ctx: { _pathCache: { constructor: unknown } } } };
    const Lru = w.renderer._ctx._pathCache.constructor as unknown as new (max: number) => Map<string, number>;
    const perInsert = (max: number): number => {
      const lru = new Lru(max);
      let n = 0;
      for (let i = 0; i < max; i++) {
        lru.set(`k${n++}`, 1);
      }
      // the best of three, so one collection does not decide it
      let best = Infinity;
      for (let round = 0; round < 3; round++) {
        const t = performance.now();
        for (let i = 0; i < 20000; i++) {
          lru.set(`k${n++}`, 1);
        }
        best = Math.min(best, (performance.now() - t) / 20000);
      }
      return best;
    };
    perInsert(500);
    return { small: perInsert(500), large: perInsert(10000) };
  });
  console.log(`per insert: ${(out.small * 1000).toFixed(2)} us at 500, ${(out.large * 1000).toFixed(2)} us at 10000`);
  expect(out.large / out.small).toBeLessThan(4);
});
