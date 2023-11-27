import { color } from 'd3-color';
import { Bounds, Renderer, domClear as clear } from 'vega-scenegraph';
import resize from './util/resize';
import marks from './marks/index';
import { error, inherits } from 'vega-util';


export default function WebGPURenderer(loader: unknown) {
  Renderer.call(this, loader);
  this._options = {};
  this._redraw = false;
  this._dirty = new Bounds();
  this._tempb = new Bounds();
}

let base = Renderer.prototype;

const viewBounds = (origin: [number, number], width: number, height: number) =>
  new Bounds().set(0, 0, width, height).translate(-origin[0], -origin[1]);

inherits(WebGPURenderer, Renderer, {
  initialize(el: HTMLCanvasElement, width: number, height: number, origin: [number, number]) {
    this._canvas = document.createElement('canvas'); // instantiate a small canvas
    this._ctx = this._canvas.getContext('webgpu');
    if (el) {
      clear(el, 0).appendChild(this._canvas);
      this._canvas.setAttribute('class', 'marks');
    }
    const textCanvas = document.createElement('canvas');
    this._canvas._textCanvas = textCanvas
    this._textCanvas = textCanvas;
    this._textContext = textCanvas.getContext('2d');
    this._bgcolor = "#ff44ee";

    this._uniforms = {
      resolution: [width, height],
      origin: origin,
      dpi: window.devicePixelRatio || 1,
    };

    // this method will invoke resize to size the canvas appropriately
    return base.initialize.call(this, el, width, height, origin);
  },

  resize(width: number, height: number, origin: [number, number]) {
    base.resize.call(this, width, height, origin);

    resize(this._canvas, this._width, this._height, this._origin, this._textCanvas, this._textContext);

    this._redraw = true;
    return this;
  },

  canvas() {
    return this._canvas;
  },

  textCanvas() {
    return this._textCanvas;
  },

  context() {
    return this._ctx ? this._ctx : null;
  },

  textContext() {
    return this._textContext ? this._textContext : null;
  },

  device() {
    return this._device ? this._device : null;
  },

  clear() {
    const device = this.device();
    const depthTexture = device.createTexture({
      size: { width: this._canvas.width, height: this._canvas.height, depthOrArrayLayers: 1 },
      format: "depth24plus-stencil8", // You can choose an appropriate depth format
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const commandEncoder = device.createCommandEncoder();
    //@ts-ignore
    const textureView = this._ctx.getCurrentTexture().createView();
    const renderPassDescriptor = {
      label: 'Background',
      colorAttachments: [
        {
          view: textureView,
          loadValue: [0.0, 1.0, 1.0, 1.0] as GPUColor,
          storeOp: 'store',
          loadOp: 'clear',
          clearValue: [0.0, 1.0, 1.0, 1.0] as GPUColor,
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthLoadValue: 1.0,
        depthClearValue: 1.0,
        depthStoreOp: 'store',
        depthLoadOp: 'clear',
        stencilLoadValue: 0,
        stencilStoreOp: 'store',
        stencilLoadOp: 'clear',
        depthReadOnly: false,
      },
    };
    const textContext = this.textContext();;
    textContext.save();
    textContext.setTransform(1, 0, 0, 1, 0, 0);
    textContext.clearRect(0, 0, this.textCanvas().width, this.textCanvas().height);
    textContext.restore();

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  },

  dirty(item: { bounds: Bounds; mark: { group: { x?: number; y?: number; mark?: { group: unknown } } } }) {
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
    const device = this.device();

    if (ctx && device) {
      this.draw(device, ctx, scene, vb);
    } else {
      (async () => {
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        this._device = device;
        this._ctx = this._canvas.getContext('webgpu');
        // @ts-ignore
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        this._ctx.configure({
          device,
          format: presentationFormat,
          alphaMode: 'premultiplied',
        });
        this.draw(device, this._ctx, scene, vb);
      })();
    }
    return this;
  },

  draw(device: GPUDevice, ctx: GPUCanvasContext, scene: { marktype: string }, transform: Bounds) {
    const mark = marks[scene.marktype];
    if (mark == null) {
      console.error(`Unknown mark type: '${scene.marktype}'`)
    } else {
      mark.draw.call(this, device, ctx, scene, transform);
    }
  },
});
