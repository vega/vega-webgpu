import resize from './util/resize';
import marks from './marks/index';

import {Bounds, Renderer, domClear} from 'vega-scenegraph';
import {canvas} from 'vega-canvas';
import {error, inherits} from 'vega-util';

export default function WebGPURenderer(loader) {
  Renderer.call(this, loader);
  this._options = {};
  this._redraw = false;
  this._dirty = new Bounds();
  this._tempb = new Bounds();
}

const base = Renderer.prototype;

const viewBounds = (origin, width, height) => new Bounds().set(0, 0, width, height).translate(-origin[0], -origin[1]);

inherits(WebGPURenderer, Renderer, {
  async wgpuInit() {
    //@ts-ignore
    this._adapter = await navigator.gpu.requestAdapter();
    this._device = await this._adapter.requestDevice();
    this._context = this._canvas.getContext('gpupresent');
  },

  initialize(el, width, height, origin, scaleFactor, options) {
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

  resize(width, height, origin, scaleFactor) {
    base.resize.call(this, width, height, origin, scaleFactor);

    if (this._canvas) {
      // configure canvas size and transform
      resize(this._canvas, this._width, this._height, this._origin, this._scale, this._options.context);
    } else {
      // external context needs to be scaled and positioned to origin
      const ctx = this._options.externalContext;
      if (!ctx) error('WebGPURenderer is missing a valid canvas or context.');
      //gl.scale(this._scale, this._scale);
      //gl.translate(this._origin[0], this._origin[1]);
    }

    this._redraw = true;
    return this;
  },

  canvas() {
    return this._canvas;
  },

  context() {
    return this._canvas ? this._canvas.getContext('gpupresent') : null;
  },

  device() {
    return this._device;
  },

  dirty(item) {
    const b = this._tempb.clear().union(item.bounds);
    let g = item.mark.group;

    while (g) {
      b.translate(g.x || 0, g.y || 0);
      g = g.mark.group;
    }

    this._dirty.union(b);
  },

  _render(scene) {
    let c = this._canvas,
      o = this._origin,
      w = this._width,
      h = this._height,
      db = this._dirty,
      vb = this._origin;

    const ctx = this.context();
    if (ctx) {
      this._swapChainFormat = 'bgra8unorm';
      this._uniforms = {
        resolution: [w, h],
        origin: [o],
        dpi: window.devicePixelRatio || 1
      };
      this.draw(ctx, scene, vb);
    }

    return this;
  },

  draw(ctx, scene, transform) {
    const mark = marks[scene.marktype];
    mark.draw.call(this, ctx, scene, transform);
  }
});
