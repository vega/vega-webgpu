import bezier from 'adaptive-bezier-curve';
import simplify from 'simplify-path';
import triangulate from 'triangulate-contours';
import { pathParse, pathRender } from 'vega-scenegraph';
import type { GPUVegaCanvasContext } from '../types/context.js';
import type { PathGeometry, Point } from '../types/geometry.js';
import { setMeasures } from '../util/dash.js';
import { setVariant } from '../util/lru.js';
import { warnOnce } from '../util/warn.js';

const EMPTY: PathGeometry = { lines: [], triangles: [] };

/**
 * An svg path as polyline contours, flattening the curves and leaving the
 * straight runs alone.
 *
 * The commands come from vega's own path renderer, which is what the canvas
 * `path` mark draws with, so its reading of a path is ours. That matters
 * because it is not the specified one in three places, and a conforming parser
 * disagrees with it in each: `S` reflects the running control point whatever
 * came before, `T` does too while its relative form `t` checks, and an arc with
 * a zero radius is dropped where the spec draws a line to its end. Reading the
 * same commands is the only way the two renderers agree on those.
 *
 * A straight run keeps its two points at any flatness. The flattener this
 * replaced normalized every command to a cubic first, so a lineTo arrived as a
 * bezier with its control points on its own ends and was subdivided like any
 * other curve. The subdivision does not land on the ends, so the corners moved:
 * at a fine setting a step line's corner at (256.5, 65) came back as
 * (256.5, 64.93) and the join built there lost its tip.
 *
 * `subdivideStraight` gives back what that flattener produced, redundant points
 * and repeats and all, for the one caller that wants it: see the fallback in
 * geometryForPath.
 */
function contoursOf(path: string, scale: number, subdivideStraight = false, scaleX = 1, scaleY = 1): Point[][] {
  const out: Point[][] = [];
  let points: Point[] = [];
  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;

  const flush = (): void => {
    if (points.length > 0) {
      out.push(points);
      points = [];
    }
  };

  const curve = (x1: number, y1: number, x2: number, y2: number, x: number, y: number): void => {
    const from = points.length;
    bezier([px, py], [x1, y1], [x2, y2], [x, y], scale, points);
    // Both ends come back, so the point shared with the previous segment
    // repeats. The subdivided form keeps those on purpose, since it exists to
    // hand tess2 the shape the old flattener did, down to the repeats.
    if (!subdivideStraight && from > 0 && samePoint(points[from - 1], points[from])) {
      points.splice(from, 1);
    }
    px = x;
    py = y;
  };

  const line = (x: number, y: number): void => {
    if (subdivideStraight) {
      curve(px, py, x, y, x, y);
      return;
    }
    pushPoint(points, px, py);
    pushPoint(points, x, y);
    px = x;
    py = y;
  };

  let commands;
  try {
    commands = pathParse(path);
  } catch {
    warnOnce('path', '[vega-webgpu] An svg path could not be parsed and is not drawn.');
    return out;
  }

  pathRender(
    {
      moveTo(x, y) {
        flush();
        px = sx = x;
        py = sy = y;
      },
      lineTo: line,
      bezierCurveTo: curve,
      quadraticCurveTo(cx, cy, x, y) {
        // the cubic a quadratic raises to, which is what the old parser emitted
        curve(px + (2 / 3) * (cx - px), py + (2 / 3) * (cy - py), x + (2 / 3) * (cx - x), y + (2 / 3) * (cy - y), x, y);
      },
      closePath() {
        line(sx, sy);
      },
    },
    commands,
    0,
    0,
    scaleX,
    scaleY,
  );
  flush();
  return out;
}

function samePoint(a: Point, b: Point): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function pushPoint(points: Point[], x: number, y: number): void {
  const last = points[points.length - 1];
  if (!last || last[0] !== x || last[1] !== y) {
    points.push([x, y]);
  }
}

/**
 * Skia's measuring tolerance at a scale of one, in the max norm: how far a
 * cubic's inner control points may sit from its chord's third points before
 * SkContourMeasure halves it.
 */
const MEASURE_TOLERANCE = 0.5;

/** Points a measured chord is drawn with, so the dash follows the curve rather than the chord. */
const CHORD_SAMPLES = 4;

/** Skia's limit on halving, in its fixed point t: past this depth a piece is taken as it is. */
const MAX_T = 0x3fffffff;

/**
 * A path as contours to be dashed, each point carrying how far along its
 * contour canvas measures it to be.
 *
 * Canvas does not dash along the curve. Skia measures a contour as the chords
 * of its own subdivision (SkContourMeasure), halving a cubic while either inner
 * control point sits further than MEASURE_TOLERANCE over the device scale from
 * the chord's third points, and a dash lands where those chords add up to. The
 * chords are a little shorter than the curve, so measured along the curve the
 * pattern ran ahead of canvas, a little more after every curve it passed. A
 * straight run measures the same either way.
 *
 * The points still follow the curve, CHORD_SAMPLES to a chord and spaced as
 * Skia spaces a distance within one, so only where the pattern falls is taken
 * from the chords and the stroke itself is not drawn faceted.
 */
function measuredContoursOf(path: string, tolerance: number, scaleX: number, scaleY: number): Point[][] {
  const out: Point[][] = [];
  let points: Point[] = [];
  let along: number[] = [];
  let m = 0;
  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;

  const flush = (): void => {
    if (points.length > 1) {
      out.push(points);
      setMeasures(points, Float64Array.from(along));
    }
    points = [];
    along = [];
    m = 0;
  };
  const push = (x: number, y: number): void => {
    const last = points[points.length - 1];
    if (!last || last[0] !== x || last[1] !== y) {
      points.push([x, y]);
      along.push(m);
    }
  };
  const line = (x: number, y: number): void => {
    push(px, py);
    m += Math.hypot(x - px, y - py);
    push(x, y);
    px = x;
    py = y;
  };
  // a chord of the subdivision: its length goes into the measure, and its piece of the curve is drawn
  const chord = (c: readonly number[]): void => {
    const start = m;
    const length = Math.hypot(c[6] - c[0], c[7] - c[1]);
    for (let i = 1; i <= CHORD_SAMPLES; i++) {
      const t = i / CHORD_SAMPLES;
      m = start + length * t;
      const [x, y] = cubicAt(c, t);
      push(x, y);
    }
  };
  // a quadratic piece raised to the cubic it is, to be drawn the same way
  const quadChord = (q: readonly number[]): void =>
    chord([
      q[0],
      q[1],
      q[0] + (2 / 3) * (q[2] - q[0]),
      q[1] + (2 / 3) * (q[3] - q[1]),
      q[4] + (2 / 3) * (q[2] - q[4]),
      q[5] + (2 / 3) * (q[3] - q[5]),
      q[4],
      q[5],
    ]);

  let commands;
  try {
    commands = pathParse(path);
  } catch {
    warnOnce('path', '[vega-webgpu] An svg path could not be parsed and is not drawn.');
    return out;
  }
  pathRender(
    {
      moveTo(x, y) {
        flush();
        px = sx = x;
        py = sy = y;
      },
      lineTo: line,
      bezierCurveTo(x1, y1, x2, y2, x, y) {
        push(px, py);
        measureCubic([px, py, x1, y1, x2, y2, x, y], tolerance, 0, MAX_T, chord);
        px = x;
        py = y;
      },
      quadraticCurveTo(cx, cy, x, y) {
        push(px, py);
        measureQuad([px, py, cx, cy, x, y], tolerance, 0, MAX_T, quadChord);
        px = x;
        py = y;
      },
      closePath() {
        line(sx, sy);
      },
    },
    commands,
    0,
    0,
    scaleX,
    scaleY,
  );
  flush();
  return out;
}

/** Halves a cubic the way SkContourMeasure does, handing each piece it keeps to `take`. */
function measureCubic(
  c: readonly number[],
  tolerance: number,
  mint: number,
  maxt: number,
  take: (piece: readonly number[]) => void,
): void {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = c;
  const far = (x: number, y: number, t: number): boolean =>
    Math.max(Math.abs(x0 + (x3 - x0) * t - x), Math.abs(y0 + (y3 - y0) * t - y)) > tolerance;
  if ((maxt - mint) >> 10 === 0 || !(far(x1, y1, 1 / 3) || far(x2, y2, 2 / 3))) {
    take(c);
    return;
  }
  const abx = (x0 + x1) / 2;
  const aby = (y0 + y1) / 2;
  const bcx = (x1 + x2) / 2;
  const bcy = (y1 + y2) / 2;
  const cdx = (x2 + x3) / 2;
  const cdy = (y2 + y3) / 2;
  const abcx = (abx + bcx) / 2;
  const abcy = (aby + bcy) / 2;
  const bcdx = (bcx + cdx) / 2;
  const bcdy = (bcy + cdy) / 2;
  const mx = (abcx + bcdx) / 2;
  const my = (abcy + bcdy) / 2;
  const half = (mint + maxt) >> 1;
  measureCubic([x0, y0, abx, aby, abcx, abcy, mx, my], tolerance, mint, half, take);
  measureCubic([mx, my, bcdx, bcdy, cdx, cdy, x3, y3], tolerance, half, maxt, take);
}

/** The same for a quadratic, which Skia tests by how far its control point bows the chord. */
function measureQuad(
  q: readonly number[],
  tolerance: number,
  mint: number,
  maxt: number,
  take: (piece: readonly number[]) => void,
): void {
  const [x0, y0, x1, y1, x2, y2] = q;
  const bow = Math.max(Math.abs(x1 / 2 - (x0 + x2) / 4), Math.abs(y1 / 2 - (y0 + y2) / 4));
  if ((maxt - mint) >> 10 === 0 || bow <= tolerance) {
    take(q);
    return;
  }
  const ax = (x0 + x1) / 2;
  const ay = (y0 + y1) / 2;
  const bx = (x1 + x2) / 2;
  const by = (y1 + y2) / 2;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const half = (mint + maxt) >> 1;
  measureQuad([x0, y0, ax, ay, mx, my], tolerance, mint, half, take);
  measureQuad([mx, my, bx, by, x2, y2], tolerance, half, maxt, take);
}

function cubicAt(c: readonly number[], t: number): [number, number] {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return [a * c[0] + b * c[2] + d * c[4] + e * c[6], a * c[1] + b * c[3] + d * c[5] + e * c[7]];
}

/** Contours to be dashed, held like any other trace of the path. */
function measuredGeometry(
  context: GPUVegaCanvasContext,
  path: string,
  tolerance: number,
  scaleX: number,
  scaleY: number,
): PathGeometry {
  const variant = `measured|${tolerance}|${scaleX}|${scaleY}`;
  const cached = context._pathCache.get(path)?.get(variant);
  if (cached !== undefined) {
    return cached;
  }
  // only ever stroked, so there is nothing to triangulate
  const geom: PathGeometry = { lines: measuredContoursOf(path, tolerance, scaleX, scaleY), triangles: [] };
  setVariant(context._pathCache, path, variant, geom);
  return geom;
}

/** Triangulates contours, or null when tess2 cannot. */
function tessellate(lines: Point[][]): ReturnType<typeof triangulate> | null {
  try {
    return triangulate(lines, { windingRule: WINDING_NONZERO });
  } catch {
    return null;
  }
}

// tess2's WINDING_NONZERO. canvas fills nonzero, and triangulate-contours asks
// for even-odd, which leaves the middle of a self-intersecting path hollow.
const WINDING_NONZERO = 1;

/**
 * Asks geometryForPath for contours to be dashed, measured the way canvas
 * measures them rather than flattened at a flatness. See measuredContoursOf.
 */
export const DASH_FLATNESS = 1;

const CURVE_FLATNESS = 4;
/** Douglas-Peucker tolerance in pixels. At 1.0 a gentle curve visibly facets. */
const CURVE_TOLERANCE = 0.1;

/**
 * Triangulates an SVG path string into fill triangles and outline contours.
 * Results are cached on the context, keyed by the path string.
 *
 * `scale` is how finely a bezier is flattened. The default follows the curve
 * closely, which is what every consumer wants but one: `arc-shapes` goes from
 * 0.211% of pixels to 0.058%, `gradient-strokes` 0.161% to 0.054%,
 * `path-shapes` 0.034% to 0.005% and `trail` 0.016% to 0.009%.
 *
 * Four rather than more. It is where the gain flattens out, and past it the
 * extra vertices start costing: at 8 a nearly straight run picks up enough
 * near-collinear joints that one of them loses a pixel, which took `line-shapes`
 * at dpr 2 from worst channel 71 to 134 while its pixel count did not move.
 *
 * A dash is the exception and takes DASH_FLATNESS instead, which hands back
 * contours that carry the distance canvas measures along them, see
 * measuredContoursOf.
 */
export default function geometryForPath(
  context: GPUVegaCanvasContext,
  path: string | null | undefined,
  scale?: number,
  scaleX = 1,
  scaleY = 1,
): PathGeometry {
  if (!path) {
    return EMPTY;
  }

  // A chord's error is bounded in path units, so the same contour sits twice as
  // far from its own curve on a grid twice as fine, and the flatness follows
  // the ratio. So does Skia's measuring tolerance, which is in device pixels.
  const dpi = context._uniforms.dpi || 1;
  if (scale === DASH_FLATNESS) {
    return measuredGeometry(context, path, MEASURE_TOLERANCE / dpi, scaleX, scaleY);
  }
  const flatness = scale ?? CURVE_FLATNESS * dpi;

  const variant = `${flatness}|${scaleX}|${scaleY}`;
  const cached = context._pathCache.get(path)?.get(variant);
  if (cached !== undefined) {
    return cached;
  }

  // get a list of polylines/contours from svg contents
  const flat = contoursOf(path, flatness, false, scaleX, scaleY);
  let lines = flat.map(contour => simplify(contour, CURVE_TOLERANCE));

  // Simplifying can nudge a contour into a self intersection, which tess2
  // reaches an undefined identifier on and throws. Dropping the shape there
  // loses it silently, and a county went missing off the choropleth that way,
  // so fall back to the contour as traced.
  let tri = tessellate(lines);
  if (tri === null) {
    lines = flat;
    tri = tessellate(lines);
  }
  if (tri === null) {
    // tess2 reaches an undefined identifier on outlines it does not like, and
    // an exact one is more likely to be among them than the same shape carrying
    // redundant points along its straight runs. A county of four contours went
    // missing off the choropleth that way: exact it throws at 19/9/18/137
    // points, and the flattener's own shape simplified to 19/9/18/143 gives 188
    // triangles. So the last try before giving up is that shape.
    lines = contoursOf(path, flatness, true, scaleX, scaleY).map(contour => simplify(contour, CURVE_TOLERANCE));
    tri = tessellate(lines);
  }
  for (let coarse = flatness / 2; tri === null && coarse >= flatness / 8; coarse /= 2) {
    // A coarser curve is a shape it takes where the fine one throws, and giving
    // up curve accuracy beats giving up the mark: the second ribbon of `trail`
    // went missing at dpr 2, where the flatness is twice what it is at dpr 1.
    lines = contoursOf(path, coarse, false, scaleX, scaleY).map(contour => simplify(contour, CURVE_TOLERANCE));
    tri = tessellate(lines);
  }
  if (tri === null) {
    tri = { positions: [], cells: [] };
    warnOnce('tessellation', '[vega-webgpu] A path could not be tessellated and is not drawn.');
  }

  const triangles: number[] = [];
  const { cells, positions } = tri;
  for (let ci = 0; ci < cells.length; ci++) {
    const cell = cells[ci];
    const p1 = positions[cell[0]];
    const p2 = positions[cell[1]];
    const p3 = positions[cell[2]];
    triangles.push(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
  }

  const geom: PathGeometry = {
    lines,
    triangles,
    // geometryForItem caches on this, and the flatness and scale shape it too
    key: { path, variant },
  };
  setVariant(context._pathCache, path, variant, geom);
  return geom;
}
