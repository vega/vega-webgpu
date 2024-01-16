import { Bounds, SceneGroup, Scene, SceneItem, Renderer } from 'vega-typings';



export type GPUSceneGroup = SceneGroup & {
  group?: GPUSceneGroup;
  items: SceneItem[];
}

export type GPUVegaScene = Scene & {
  group: GPUSceneGroup
  items: SceneItem[];
  _format: GPUTextureFormat;
  _pipeline?: GPURenderPipeline;
  _geometryBuffer?: GPUBuffer; // geometry to be instanced
  _instanceBuffer?: GPUBuffer; // attributes for each instance
  _uniformsBuffer?: GPUBuffer;
  _frameBuffer?: GPUBuffer; // writebuffer to be used for each frame
  _uniformsBindGroup?: GPUBindGroup;
  zindex: number;
};

export type WebGPURenderer = Renderer & {
  wgOptions: GPUVegaOptions,
}

export type GPUVegaCanvasContext = GPUCanvasContext & {
  background: GPUColor,
  depthTexture: GPUTexture,
  _tx: number,
  _ty: number,
  _shaderCache: { [key: string]: GPUShaderModule },
  _textContext: CanvasRenderingContext2D,
  _renderer: WebGPURenderer,
  _uniforms: {
    resolution: [width: number, height: number],
    origin: [x: number, y: number],
    dpi: number
  },
  _pathCache: {},
  _pathCacheSize: number,
  _geometryCache: {},
  _geometryCacheSize: number,
  _shapeCache: {},
  _shapeCacheSize: number,
  _shapeCacheMiss: number,
};

export type GPUVegaOptions = {
  simpleLine: boolean,
  cacheShapes: boolean,
  debugLog: boolean,
};