import type { GPUVegaCanvasContext } from '../types/context.js';
import type { BindingShape } from '../util/webgpu.js';
import type { ShaderBuilder } from './common.js';
import { blendCompositeShader } from './blendComposite.js';
import { curveShader } from './curve.js';
import { gradientFillShader } from './gradientFill.js';
import { imageShader } from './image.js';
import { maskCompositeShader } from './maskComposite.js';
import { rectShader } from './rect.js';
import { ruleShader } from './rule.js';
import { slineShader } from './sline.js';
import { solidFillShader } from './solidFill.js';
import { symbolShader } from './symbol.js';
import { symbolSdfShader } from './symbolSdf.js';
import { symbolShapeShader } from './symbolShape.js';
import { textShader } from './text.js';

/** Every shader source, by the name marks ask for. */
const BUILDERS = {
  BlendComposite: blendCompositeShader,
  Curve: curveShader,
  GradientFill: gradientFillShader,
  Image: imageShader,
  MaskComposite: maskCompositeShader,
  Rect: rectShader,
  Rule: ruleShader,
  SLine: slineShader,
  SolidFill: solidFillShader,
  Symbol: symbolShader,
  SymbolSdf: symbolSdfShader,
  SymbolShape: symbolShapeShader,
  Text: textShader,
} satisfies Record<string, ShaderBuilder>;

/** A builder name, optionally followed by a sub-variant after a colon. */
export type ShaderKey = keyof typeof BUILDERS | `${keyof typeof BUILDERS}:${string}`;

/**
 * The pipeline layout each shader is built with, which has to match the groups
 * its source declares. Every builder is listed, so a new shader does not
 * compile until it names one.
 */
const SHAPES: Record<keyof typeof BUILDERS, BindingShape> = {
  BlendComposite: 'composite',
  Curve: 'mark',
  GradientFill: 'gradient',
  Image: 'texture',
  MaskComposite: 'mask',
  Rect: 'mark',
  Rule: 'mark',
  SLine: 'mark',
  SolidFill: 'mark',
  Symbol: 'mark',
  SymbolSdf: 'mark',
  SymbolShape: 'mark',
  Text: 'texture',
};

/**
 * The pipeline layout a shader variant is built with. A fragment entry that
 * samples a ramp is the only one that reaches group 1 in a shader whose other
 * entries do not, which is how the segment and rect shaders draw a gradient.
 */
export function bindingShape(key: ShaderKey, fragmentEntryPoint?: string): BindingShape {
  if (fragmentEntryPoint === 'main_fragment_gradient') {
    return 'gradient';
  }
  const sep = key.indexOf(':');
  return SHAPES[(sep < 0 ? key : key.slice(0, sep)) as keyof typeof BUILDERS];
}

/**
 * The compiled module for one shader variant, built on first use and cached on
 * the context for the life of the device. `key` names a builder, optionally
 * followed by a sub-variant after a colon.
 *
 * Building on demand rather than up front matters: a chart uses a handful of
 * these, and compiling every blend mode of every shader would put the cost of
 * shaders nobody draws into the first frame.
 */
export function shaderModule(
  ctx: GPUVegaCanvasContext,
  device: GPUDevice,
  key: ShaderKey,
  blend: string,
): GPUShaderModule {
  const cacheKey = `${key}|${blend}`;
  const cached = ctx._shaderCache[cacheKey];
  if (cached) {
    return cached;
  }
  const sep = key.indexOf(':');
  const build = BUILDERS[(sep < 0 ? key : key.slice(0, sep)) as keyof typeof BUILDERS];
  const shader = device.createShaderModule({
    code: build(blend, sep < 0 ? undefined : key.slice(sep + 1)),
    label: `${cacheKey} Shader`,
  });
  ctx._shaderCache[cacheKey] = shader;
  return shader;
}
