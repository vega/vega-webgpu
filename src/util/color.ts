import type { SceneColor, SceneGradient } from '../types/scene.js';
import { warnOnce } from './warn.js';

export type RGBA = [r: number, g: number, b: number, a: number];

const TRANSPARENT: RGBA = [0, 0, 0, 0];
/** Drawn for a gradient on an item without bounds, which has nothing to map the ramp onto. */
const GRADIENT_FALLBACK: RGBA = [0.5, 1.0, 1.0, 1.0];

export function isGradient(value: SceneColor | null | undefined): value is SceneGradient {
  return typeof value === 'object' && value !== null && ('gradient' in value || 'id' in value);
}

/** Parses a CSS color string to premultiplication-ready normalized RGBA. */
function parse(value: string): RGBA {
  const c = cssColor(value);
  if (c === null) {
    warnOnce('color', `[vega-webgpu] Could not parse color '${value}'.`);
    return TRANSPARENT;
  }
  return [c[0] / 255, c[1] / 255, c[2] / 255, c[3]];
}

/** Channels 0 to 255, alpha 0 to 1. */
export type CssColor = [r: number, g: number, b: number, a: number];

type Probe = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

let probe: Probe | null | undefined;
const cssCache = new Map<string, CssColor | null>();

/**
 * A 2D context to parse colours with. A worker has no document, but it can
 * have an OffscreenCanvas. Where there is neither, the renderer has no canvas
 * to draw into either, so nothing is lost by having no parser there.
 */
function probeContext(): Probe | null {
  if (probe !== undefined) {
    return probe;
  }
  const options: CanvasRenderingContext2DSettings = { willReadFrequently: true };
  let ctx: Probe | null = null;
  if (typeof document !== 'undefined') {
    ctx = document.createElement('canvas').getContext('2d', options);
  } else if (typeof OffscreenCanvas !== 'undefined') {
    ctx = new OffscreenCanvas(1, 1).getContext('2d', options) as OffscreenCanvasRenderingContext2D | null;
  } else {
    warnOnce('colorProbe', '[vega-webgpu] Colours need a 2D canvas to be parsed, and there is none here.');
  }
  probe = ctx;
  return ctx;
}

/**
 * A colour as canvas parses it, or null when it does not. Setting fillStyle and
 * reading it back is the parser the canvas renderer draws with, so the two
 * cannot disagree about a colour. That includes the channels of a colour at zero
 * alpha, which a gradient interpolates through: rgba(255,0,0,0) fades from red.
 */
export function cssColor(value: string): CssColor | null {
  let parsed = cssCache.get(value);
  if (parsed === undefined) {
    parsed = parseCss(value);
    cssCache.set(value, parsed);
  }
  return parsed;
}

/**
 * The forms vega's scales write a colour in. Canvas reads these as exactly the
 * numbers written, so they skip the round trip, which costs three times what
 * d3-color did on a colour seen for the first time.
 */
const PLAIN = /^(?:#[0-9a-f]{6}|rgb\(\d{1,3}, ?\d{1,3}, ?\d{1,3}\))$/i;

function parseCss(value: string): CssColor | null {
  if (PLAIN.test(value)) {
    const plain = readCss(value);
    // canvas clamps a channel past 255, so only an in-range one is the same either way
    if (plain && plain[0] <= 255 && plain[1] <= 255 && plain[2] <= 255) {
      return plain;
    }
  }
  const ctx = probeContext();
  if (!ctx) {
    return null;
  }
  // an invalid colour leaves fillStyle as it was, so two starting points differ
  ctx.fillStyle = '#000000';
  ctx.fillStyle = value;
  const read = String(ctx.fillStyle);
  ctx.fillStyle = '#ffffff';
  ctx.fillStyle = value;
  if (String(ctx.fillStyle) !== read) {
    return null;
  }
  return readCss(read) ?? readPixel(ctx, read);
}

/**
 * A colour canvas serializes in another form than the two sRGB ones, such as
 * one written in a wider gamut, drawn and read back as the sRGB pixel canvas
 * would put on screen.
 */
function readPixel(ctx: Probe, value: string): CssColor {
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}

/** The two forms canvas serializes an sRGB colour in. */
function readCss(s: string): CssColor | null {
  if (/^#[0-9a-f]{6}$/i.test(s)) {
    return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 1];
  }
  const rgba = /^rgba?\(([^)]*)\)$/.exec(s);
  if (!rgba) {
    return null;
  }
  const [r, g, b, a = 1] = rgba[1].split(',').map(Number);
  return [r, g, b, a].every(Number.isFinite) ? [r, g, b, a] : null;
}

export class Color {
  private static cache: Record<string, RGBA> = {};

  /** The colour's unscaled rgba, cached per string. */
  private static resolve(value: SceneColor | null | undefined): RGBA {
    if (value == null || value === 'transparent') {
      return TRANSPARENT;
    }
    if (isGradient(value)) {
      warnOnce('gradient', '[vega-webgpu] A gradient on an item without bounds is drawn as a flat colour.');
      return GRADIENT_FALLBACK;
    }
    let rgba = Color.cache[value];
    if (rgba === undefined) {
      rgba = parse(value);
      Color.cache[value] = rgba;
    }
    return rgba;
  }

  /**
   * A scenegraph colour as normalized rgba, with the item's opacity and its
   * fill or stroke opacity applied. Unset becomes transparent.
   */
  static from(value: SceneColor | null | undefined, opacity = 1.0, fsOpacity = 1.0): RGBA {
    const [r, g, b, a] = Color.resolve(value);
    return [r, g, b, a * opacity * fsOpacity];
  }

  /**
   * Writes the colour straight into `out` at `index`, which is what a per item
   * attribute loop wants: `from` allocates a fresh array on every call, and a
   * mark resolves a fill and a stroke for each of its items on every frame.
   */
  static write(
    out: Float32Array,
    index: number,
    value: SceneColor | null | undefined,
    opacity = 1.0,
    fsOpacity = 1.0,
  ): void {
    const rgba = Color.resolve(value);
    out[index] = rgba[0];
    out[index + 1] = rgba[1];
    out[index + 2] = rgba[2];
    out[index + 3] = rgba[3] * opacity * fsOpacity;
  }
}
