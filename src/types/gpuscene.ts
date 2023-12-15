import { Bounds, SceneGroup, Scene, SceneItem } from 'vega-typings';



export type GPUSceneGroup = SceneGroup & {
  group?: GPUSceneGroup;
  items: SceneItem[];
}

export type GPUScene = Scene & {
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