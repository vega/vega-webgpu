import { Color } from './util/color';
import { Bounds, Renderer, domClear as clear } from 'vega-scenegraph';
import resize from './util/resize';
import marks from './marks/index';
import { inherits } from 'vega-util';
import { drawCanvas } from './util/image';
import { Renderer as RendererFunctions } from './util/renderer';
import { GPUScene } from './types/gpuscene.js';


import symbolShader from './shaders/symbol.wgsl';
import lineShader from './shaders/line.wgsl';
import slineShader from './shaders/sline.wgsl';
import triangleShader from './shaders/triangles.wgsl';
import rectShader from './shaders/rect.wgsl';
import arcShader from './shaders/arc.wgsl';
import shapeShader from './shaders/shape.wgsl';
import areaShader from './shaders/area.wgsl';


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
      this._textCanvas.style.position = 'absolute';
      this._textCanvas.style.top = '0';
      this._textCanvas.style.left = '0';
      this._textCanvas.style.zIndex = '10';
      this._textCanvas.style.pointerEvents = 'none';
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
    this._ctx._uniforms = this._uniforms;

    this._ctx._pathCache = {};
    this._ctx._pathCacheSize = 0;
    this._ctx._geometryCache = {};
    this._ctx._geometryCacheSize = 0;

    this.simpleLine = true;
    this.debugLog = false;

    this._renderCount = 0;

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
    this._ctx._uniforms = this._uniforms;

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

  async _reinit() {
    let device = this.device();
    let ctx = this.context();
    if (!device || !ctx) {
      const adapter = await navigator.gpu.requestAdapter();
      device = await adapter.requestDevice();
      this._adapter = adapter;
      this._device = device;
      const presentationFormat = navigator.gpu.getPreferredCanvasFormat() as GPUTextureFormat;
      this._prefferedFormat = presentationFormat;
      ctx = this._canvas.getContext('webgpu');
      this._ctx.configure({
        device,
        format: presentationFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
        alphaMode: 'premultiplied',
      });
      this._ctx = ctx;
      this.cacheShaders();
    }
    return { device, ctx };
  },

  _render(scene: GPUScene) {
    (async () => {
      let { device, ctx } = await this._reinit();
      RendererFunctions.clearQueue();
      let o = this._origin,
        w = this._width,
        h = this._height,
        // db = this._dirty,
        vb = viewBounds(o, w, h);

      ctx._tx = 0;
      ctx._ty = 0;

      this.clear();
      const t1 = performance.now();
      this.draw(device, ctx, scene, vb);
      const t2 = performance.now();
      RendererFunctions.submitQueue(device);
      device.queue.onSubmittedWorkDone().then(() => {
        if (this.debugLog == true) {
          const t3 = performance.now();
          console.log(`Render Time (${this._renderCount++}): ${((t3 - t1) / 1).toFixed(3)}ms (Draw: ${((t2 - t1) / 1).toFixed(3)}ms, WebGPU: ${((t3 - t2) / 1).toFixed(3)}ms)`);
        }
      });
    })();

    return this;
  },

  frame() {
    if (this._lastScene) {
      this._render(this._lastScene, []);
    }
    return this;
  },

  draw(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene & { marktype: string }, transform: Bounds) {
    const mark = marks[scene.marktype];
    if (mark == null) {
      console.error(`Unknown mark type: '${scene.marktype}'`)
    } else {
      // ToDo: Set Options
      scene._format = this.prefferedFormat();
      mark.draw.call(this, device, ctx, scene, transform);
    }
  },

  clear() {
    const device = this.device() as GPUDevice;
    const context = this.context() as GPUCanvasContext;
    const textureView = context.getCurrentTexture().createView();
    const renderPassDescriptor = {
      label: 'Background',
      colorAttachments: [
        {
          view: textureView,
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: this.clearColor(),
        },
      ]
    } as GPURenderPassDescriptor;

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);

    const textContext = this.textContext();
    textContext.save();
    textContext.setTransform(1, 0, 0, 1, 0, 0);
    textContext.clearRect(0, 0, this.textCanvas().width, this.textCanvas().height);
    textContext.restore();
  },

  depthTexture(): GPUTexture {
    if (this._depthTexture != null) {
      if (this._depthTexture.device === this._device
        && this._depthTexture.width === this.canvas().width
        && this._depthTexture.height === this.canvas().height)
        return this._depthTexture;
    }
    this._depthTexture = this.device().createTexture({
      size: [this.canvas().width, this.canvas().height, 1],
      format: 'depth24plus',
      dimension: '2d',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    } as GPUTextureDescriptor);
    this._depthTexture.device = this._device;
    return this._depthTexture;
  },

  clearColor(): GPUColor {
    return (this._bgcolor ? Color.from(this._bgcolor) : { r: 1.0, g: 1.0, b: 1.0, a: 1.0 }) as GPUColor;
  },

  prefferedFormat(): GPUTextureFormat {
    return this._prefferedFormat != null ? this._prefferedFormat : null;
  },


  cacheShaders() {
    const device: GPUDevice = this.device();
    const context = this.context();
    context._shaderCache = {};
    context._shaderCache["Symbol"] = device.createShaderModule({ code: symbolShader, label: 'Symbol Shader' });
    context._shaderCache["Line"] = device.createShaderModule({ code: lineShader, label: 'Line Shader' });
    context._shaderCache["SLine"] = device.createShaderModule({ code: slineShader, label: 'SLine Shader' });
    context._shaderCache["Path"] = device.createShaderModule({ code: triangleShader, label: 'Triangle Shader' });
    context._shaderCache["Rect"] = device.createShaderModule({ code: rectShader, label: 'Rect Shader' });
    context._shaderCache["Arc"] = device.createShaderModule({ code: arcShader, label: 'Arc Shader' });
    context._shaderCache["Shape"] = device.createShaderModule({ code: shapeShader, label: 'Shape Shader' });
    context._shaderCache["Area"] = device.createShaderModule({ code: areaShader, label: 'Area Shader' });
  },
});
