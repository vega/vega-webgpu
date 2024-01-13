import { color, ColorSpaceObject, ColorCommonInstance } from 'd3-color';

export class Color {
  private static cache = {};
  private values: number[] = [0, 0, 0, 1];

  constructor(r: number, g: number, b: number, a: number = 1) {
    this.values[0] = r;
    this.values[1] = g;
    this.values[2] = b;
    this.values[3] = a;
  }

  static from(value: string | ColorSpaceObject | ColorCommonInstance | Color, opacity = 1.0, fsOpacity = 1.0): Color | null {
    if (!value) {
      return new Color(0, 0, 0, 0);
    }
    if (value instanceof Color) {
      return value;
    }
    if (value === 'transparent') {
      return new Color(0, 0, 0, 0);
    }
    if ((value as any).id || (value as any).gradient) {
      // TODO: support gradients
      console.warn("Gradient not supported yet!")
      return new Color(0.5, 1.0, 1.0, 1.0 * opacity * fsOpacity);
    }
    let rgba = { r: 255, g: 255, b: 255, a: 255 };
    if (typeof value === 'string') {
      let c = color(value).rgb();
      rgba = { r: c.r, g: c.g, b: c.b, a: c.opacity, };
    } else {
      let c = color(value).rgb();
      rgba = { r: c.r, g: c.g, b: c.b, a: c.opacity, };
    }
    let colorValue = new Color(rgba.r / 255, rgba.g / 255, rgba.b / 255, rgba.a * opacity * fsOpacity);
    return colorValue;
  }

  static _cache = {}
  static from2(value: string | ColorSpaceObject | ColorCommonInstance | Color, opacity = 1.0, fsOpacity = 1.0): [r: number, g: number, b: number, a: number] {
    if (!value) {
      return [0, 0, 0, 0];
    }
    const entry = Color._cache[value as any];
    if(entry) {
      return [entry[0], entry[1], entry[2], entry[3] * opacity * fsOpacity];
    }
    if (value instanceof Color) {
      return [value.r, value.g, value.b, value.a];
    }
    if (value === 'transparent') {
      return [0, 0, 0, 0];
    }
    if ((value as any).id || (value as any).gradient) {
      // TODO: support gradients
      console.warn("Gradient not supported yet!")
      return [0.5, 1.0, 1.0, 1.0 * opacity * fsOpacity];
    }
    if (typeof value === 'string') {
      const c = color(value).rgb();
      const ret = [c.r / 255, c.g / 255, c.b / 255, c.opacity * opacity * fsOpacity];
      Color._cache[value as any] = [ret[0], ret[1], ret[2], c.opacity];
      return ret as any;
    } else {
      const c = color(value).rgb();
      const ret = [c.r / 255, c.g / 255, c.b / 255, c.opacity * opacity * fsOpacity];
      Color._cache[value as any] = [ret[0], ret[1], ret[2], c.opacity];
      return ret as any;
    }
  }

  *[Symbol.iterator](): Generator<number> {
    for (const value of this.values) {
      yield value;
    }
  }

  get rgba(): number[] {
    return [this.values[0], this.values[1], this.values[2], this.values[3]];
  }

  set rgba(values: number[]) {
    this.values[0] = values[0];
    this.values[1] = values[1];
    this.values[2] = values[2];
    this.values[3] = values[3];
  }

  get 0(): number {
    return this.values[0];
  }

  set 0(value: number) {
    this.values[0] = value;
  }

  get r(): number {
    return this.values[0];
  }

  set r(value: number) {
    this.values[0] = value;
  }

  get 1(): number {
    return this.values[1];
  }

  set 1(value: number) {
    this.values[1] = value;
  }

  get g(): number {
    return this.values[1];
  }

  set g(value: number) {
    this.values[1] = value;
  }

  get 2(): number {
    return this.values[2];
  }

  set 2(value: number) {
    this.values[2] = value;
  }

  get b(): number {
    return this.values[2];
  }

  set b(value: number) {
    this.values[2] = value;
  }

  get 3(): number {
    return this.values[3];
  }

  set 3(value: number) {
    this.values[3] = value;
  }

  get a(): number {
    return this.values[3];
  }

  set a(value: number) {
    this.values[3] = value;
  }
}

