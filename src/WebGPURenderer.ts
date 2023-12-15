import { color } from 'd3-color';
import { Bounds, Renderer, domClear as clear } from 'vega-scenegraph';
import resize from './util/resize';
import marks from './marks/index';
import { error, inherits } from 'vega-util';
import { drawCanvas } from './util/image';


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
    this._textCanvas = document.createElement('canvas');
    this._textContext = this._textCanvas.getContext('2d');
    if (el) {
      el.setAttribute('style', 'position: relative;');
      this._canvas.setAttribute('class', 'marks');
      this._textCanvas.setAttribute('class', 'textCanvas');
      clear(el, 0);
      el.appendChild(this._canvas);
      el.appendChild(this._textCanvas);
    }
    this._canvas._textCanvas = this._textCanvas
    this._ctx._textContext = this._textContext;
    this._ctx._renderer = this;
    this._bgcolor = "#ffffff";

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

    resize(this._canvas, this._ctx, this._width, this._height, this._origin, this._textCanvas, this._textContext);

    const ratio = window.devicePixelRatio || 1;
    if (ratio !== 1) {
      this._textCanvas.style.width = width + 'px';
      this._textCanvas.style.height = height + 'px';
    }
    this._uniforms = {
      resolution: [width, height],
      origin: origin,
      dpi: window.devicePixelRatio || 1,
    };

    return this._redraw = true, this;
  },

  canvas(): HTMLCanvasElement {
    return this._canvas;
  },

  textCanvas(): HTMLCanvasElement {
    return this._textCanvas;
  },

  context(): GPUCanvasContext {
    return this._ctx ? this._ctx : null;
  },

  textContext(): CanvasRenderingContext2D {
    return this._textContext ? this._textContext : null;
  },

  device(): GPUDevice {
    return this._device ? this._device : null;
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
    ctx._tx = 0;
    ctx._ty = 0;

    const device = this.device();

    this._textContext.save();
    this._textContext.setTransform(1, 0, 0, 1, 0, 0);
    this._textContext.clearRect(0, 0, this._textCanvas.width + 300, this._textCanvas.height + 300);
    this._textContext.restore();
    if (device) {
      this.draw(device, ctx, scene, vb);
      // await drawCanvas(device, this.context(), this.textCanvas(), this.prefferedFormat());
    } else {
      (async () => {
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        this._adapter = adapter;
        this._device = device;
        this._ctx = this._canvas.getContext('webgpu');
        // @ts-ignore
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat() as GPUTextureFormat;
        this._prefferedFormat = presentationFormat;
        this._ctx.configure({
          device,
          format: presentationFormat,
          alphaMode: 'premultiplied',
        });
        this.draw(device, this._ctx, scene, vb);
        // await drawCanvas(device, this.context(), this.textCanvas(), this.prefferedFormat());
      })();
    }
    return this;
  },

  frame() {
    if (this._lastScene) {
      this._render(this._lastScene, []);
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

  clear() {
    return;
    const device = this.device();
    const depthTexture = device.createTexture({
      size: { width: this._canvas.width, height: this._canvas.height, depthOrArrayLayers: 1 },
      format: "depth24plus",
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
          loadValue: this.clearColor(),
          storeOp: 'store',
          loadOp: 'clear',
          clearValue: this.clearColor(),
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
    const textContext = this.textContext();
    textContext.save();
    textContext.setTransform(1, 0, 0, 1, 0, 0);
    textContext.clearRect(0, 0, this.textCanvas().width, this.textCanvas().height);
    textContext.restore();

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  },

  depthTexture(): GPUTexture {
    if (this._depthTexture != null) {
      return this._depthTexture;
    }
    this._depthTexture = this.device().createTexture({
      size: [this.canvas().width, this.canvas().height, 1],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    } as GPUTextureDescriptor);
    return this._depthTexture;
  },

  clearColor(): GPUColor {
    return (this._bgcolor ? color(this._bgcolor) : { r: 1.0, g: 1.0, b: 1.0, a: 1.0 }) as GPUColor;
  },

  prefferedFormat(): GPUTextureFormat {
    return this._prefferedFormat != null ? this._prefferedFormat : null;
  },
});
