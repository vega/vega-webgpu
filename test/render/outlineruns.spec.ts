import { expect, test, type Page } from '@playwright/test';
import { harnessUrl, waitForRender } from './drive.js';

/** The renderer the scene harness publishes, as far as these tests reach into it. */
interface SceneRenderer {
  frame(): unknown;
  _renderPromise: Promise<void>;
  _lastRender: { scene: { items: { items: { items: unknown[] }[] }[] } };
}

/**
 * Draw calls in one more frame of a fixture, and how many items its one mark
 * has. The pixels are scene.spec's to check: these fixtures cross outlines
 * with the fills and rect rules between them, so a run closed in the wrong
 * place shows there as a crossing in the wrong order.
 */
async function drawsPerFrame(page: Page, scene: string): Promise<{ draws: number; items: number }> {
  await page.goto(harnessUrl('scene', scene));
  await waitForRender(page);
  return page.evaluate(async () => {
    const r = (window as unknown as { renderer: SceneRenderer }).renderer;
    let draws = 0;
    const draw = GPURenderPassEncoder.prototype.draw;
    GPURenderPassEncoder.prototype.draw = function (...a: Parameters<GPURenderPassEncoder['draw']>) {
      draws++;
      return draw.apply(this, a);
    };
    try {
      r.frame();
      await r._renderPromise;
    } finally {
      GPURenderPassEncoder.prototype.draw = draw;
    }
    return { draws, items: r._lastRender.scene.items[0].items[0].items.length };
  });
}

/**
 * A network's links are paths with a stroke and no fill, and each one was a
 * draw of its own, with a buffer and a bind group to go with it. A force
 * layout moves every link on every tick, so that was hundreds of each a frame.
 * In the fixture the outlines between a fill, a gradient stroke and a change of
 * blend share a draw, which makes 8 draws of its 35 paths.
 */
test('consecutive path outlines share one draw', async ({ page }) => {
  const { draws, items } = await drawsPerFrame(page, 'path-outline-runs');
  console.log(`path-outline-runs: ${items} items, ${draws} draws`);
  expect(items).toBe(35);
  expect(draws, 'one draw per outline is what this replaced').toBeLessThan(items / 2);
});
