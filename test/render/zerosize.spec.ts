import { expect, test, type Page } from '@playwright/test';
import { harnessUrl, waitForRender, type Capture, type HarnessWindow } from './drive.js';

/**
 * A view with no size, which is what the vega editor's empty spec compiles to.
 * A texture cannot be empty, so a frame drawn at 0x0 failed validation on every
 * attachment it made and Chrome logged each of them, every frame. Canvas draws
 * nothing there and logs nothing, so both are taken through the same steps and
 * held to the same silence.
 *
 * The rect fills the view, so the step in between shows drawing comes back once
 * the view has a size again.
 */
const SPEC = {
  autosize: 'none',
  width: 0,
  height: 0,
  marks: [
    {
      type: 'rect',
      encode: {
        update: {
          width: { signal: 'width' },
          height: { signal: 'height' },
          fill: { value: 'steelblue' },
        },
      },
    },
  ],
};

/** Chrome on Windows says it ignores this on every adapter request, crbug.com/369219127. */
const IGNORED = /powerPreference/;

interface Step {
  step: string;
  width: number;
  height: number;
  ink: number;
  error?: string;
}

interface TestRenderer {
  wgOptions?: { offscreen: boolean };
  captureFrame?: () => Promise<Capture>;
  canvas(): HTMLCanvasElement;
  render(scene: unknown): unknown;
  renderAsync(scene: unknown): Promise<unknown>;
  finalize?: () => void;
}

interface TestView {
  width(value: number): unknown;
  height(value: number): unknown;
  runAsync(): Promise<unknown>;
  finalize(): void;
  scenegraph(): { root: unknown };
  _renderer: TestRenderer;
}

/** Console warnings and errors from here on, uncaptured GPU errors among them. */
function listen(page: Page): string[] {
  const seen: string[] = [];
  page.on('pageerror', e => seen.push(String(e)));
  page.on('console', m => {
    if ((m.type() === 'error' || m.type() === 'warning') && !IGNORED.test(m.text())) {
      seen.push(m.text());
    }
  });
  return seen;
}

/** Takes one view from 0x0 to a size and back, reading the frame at each step. */
function drive(page: Page, renderer: 'canvas' | 'webgpu'): Promise<Step[]> {
  return page.evaluate(
    async ({ spec, renderer }) => {
      const w = window as unknown as HarnessWindow & { vega: Record<string, (...a: unknown[]) => unknown> };
      const el = document.createElement('div');
      document.body.appendChild(el);
      const view = new (w.vega.View as unknown as new (runtime: unknown, options: unknown) => TestView)(
        w.vega.parse(spec),
        { renderer, container: el },
      );
      const r = view._renderer;
      if (r.wgOptions) {
        r.wgOptions.offscreen = true;
      }

      const shoot = async (): Promise<Capture> => {
        if (r.captureFrame) {
          return r.captureFrame();
        }
        const c = r.canvas();
        if (!c.width || !c.height) {
          return { width: c.width, height: c.height, data: new Uint8Array(0) };
        }
        const img = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
        return { width: img.width, height: img.height, data: new Uint8Array(img.data.buffer) };
      };
      const steps: Step[] = [];
      const take = async (step: string) => {
        try {
          const shot = await shoot();
          steps.push({ step, width: shot.width, height: shot.height, ink: shot.data.length ? w.__ink(shot) : 0 });
        } catch (err) {
          steps.push({ step, width: -1, height: -1, ink: 0, error: String(err) });
        }
      };
      const size = async (width: number, height: number) => {
        view.width(width);
        view.height(height);
        await view.runAsync();
      };

      await view.runAsync();
      await take('0x0');
      await size(200, 100);
      await take('200x100');
      await size(0, 0);
      await take('0x0 again');

      // the editor draws onto the canvas, which would ask it for a 0x0 swapchain texture
      if (r.wgOptions) {
        r.wgOptions.offscreen = false;
      }
      // back to back, so a skipped frame that kept the render lock leaves the second one waiting forever
      const root = view.scenegraph().root;
      r.render(root);
      await r.renderAsync(root);
      await take('0x0 onto the canvas');

      // an uncaptured error arrives after the frame that caused it
      await new Promise(res => setTimeout(res, 200));
      view.finalize();
      r.finalize?.();
      return steps;
    },
    { spec: SPEC, renderer },
  );
}

test('a view with no size draws nothing and logs nothing', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    // wrapped before anything loads, since a view's first frame is what makes its device
    if (typeof GPUAdapter === 'undefined') {
      return;
    }
    const requestDevice = GPUAdapter.prototype.requestDevice;
    GPUAdapter.prototype.requestDevice = async function (this: GPUAdapter, descriptor?: GPUDeviceDescriptor) {
      const device = await requestDevice.call(this, descriptor);
      device.addEventListener('uncapturederror', event => {
        event.preventDefault();
        console.error(`GPU error: ${(event as GPUUncapturedErrorEvent).error.message}`);
      });
      return device;
    };
  });
  await page.goto(harnessUrl('spec', 'bar'));
  await waitForRender(page);
  const dpr = await page.evaluate(() => window.devicePixelRatio);
  const seen = listen(page);

  for (const renderer of ['canvas', 'webgpu'] as const) {
    const from = seen.length;
    const steps = await drive(page, renderer);
    const said = seen.slice(from);

    for (const s of steps) {
      expect(s.error, `${renderer} could not read the frame at ${s.step}`).toBeUndefined();
    }
    expect(
      steps.map(s => `${s.step}: ${s.width}x${s.height}`),
      `${renderer} drew at the wrong size`,
    ).toEqual(['0x0: 0x0', `200x100: ${200 * dpr}x${100 * dpr}`, '0x0 again: 0x0', '0x0 onto the canvas: 0x0']);
    expect(steps[1].ink, `${renderer} drew nothing once the view had a size`).toBeGreaterThan(0.9);
    expect(said, `${renderer} logged while the view had no size`).toEqual([]);
  }
});
