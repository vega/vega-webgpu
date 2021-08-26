import resize from './util/resize';
import marks from './marks/index';

import {Bounds, Renderer, domClear} from 'vega-scenegraph';
import {canvas} from 'vega-canvas';
import {error, inherits} from 'vega-util';

export default function WebGPURenderer(loader: unknown) {
  Renderer.call(this, loader);
  this._options = {};
  this._redraw = false;
  this._dirty = new Bounds();
  this._tempb = new Bounds();
}

const base = Renderer.prototype;

const viewBounds = (origin: [number, number], width: number, height: number) =>
  new Bounds().set(0, 0, width, height).translate(-origin[0], -origin[1]);

inherits(WebGPURenderer, Renderer, {
  async wgpuInit() {
    //@ts-ignore
    this._adapter = await navigator.gpu.requestAdapter();
    this._device = await this._adapter.requestDevice();
    this._context = this._canvas.getContext('webgpu');
  },

  initialize(
    el: HTMLCanvasElement,
    width: number,
    height: number,
    origin: [number, number],
    scaleFactor: number,
    options: unknown
  ) {
    this._options = options || {};

    this._canvas = canvas(1, 1, this._options.type); // instantiate a small canvas
    //@ts-ignore
    if (!navigator.gpu) {
      error('WebGPU is not available or enabled on this device.');
    } else {
      this.wgpuInit();
    }

    if (el && this._canvas) {
      domClear(el, 0).appendChild(this._canvas);
      this._canvas.setAttribute('class', 'marks');
    }

    // this method will invoke resize to size the canvas appropriately
    return base.initialize.call(this, el, width, height, origin, scaleFactor);
  },

  resize(width: number, height: number, origin: [number, number], scaleFactor: number) {
    base.resize.call(this, width, height, origin, scaleFactor);

    if (this._canvas) {
      // configure canvas size and transform
      resize(this._canvas, this._width, this._height, this._origin, this._scale, this._options.context);
    } else {
      // external context needs to be scaled and positioned to origin
      const ctx = this._options.externalContext;
      if (!ctx) error('WebGPURenderer is missing a valid canvas or context.');
    }

    this._redraw = true;
    return this;
  },

  canvas() {
    return this._canvas;
  },

  context() {
    return this._canvas ? this._canvas.getContext('webgpu') : null;
  },

  device() {
    return this._device;
  },

  dirty(item: {bounds: Bounds; mark: {group: {x?: number; y?: number; mark?: {group: unknown}}}}) {
    const b = this._tempb.clear().union(item.bounds);
    let g = item.mark.group;

    while (g) {
      b.translate(g.x || 0, g.y || 0);
      g = g.mark.group;
    }

    this._dirty.union(b);
  },

  _render(scene: unknown) {
    let o = this._origin,
      w = this._width,
      h = this._height,
      // db = this._dirty,
      vb = viewBounds(o, w, h);

    const ctx = this.context();
    if (ctx) {
      (async () => {
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        this._device = device;
        this._swapChainFormat = 'bgra8unorm';
        ctx.configure({
          device,
          format: this._swapChainFormat,
          compositingAlphaMode: 'premultiplied'
        });
        this._uniforms = {
          resolution: [w, h],
          origin: o,
          //@ts-ignore
          dpi: window.devicePixelRatio || 1
        };
        this.draw(ctx, scene, vb);
      })();
    }

    return this;
  },

  draw(ctx: unknown, scene: {marktype: string}, transform: unknown) {
    const mark = marks[scene.marktype];
    mark.draw.call(this, ctx, scene, transform);
  }
});
