import { color, RGBColor, HSLColor } from 'd3-color';

var cache = {};

export default function (value): Color | null {
  if (!value) {
    return null;
  }
  if (value === 'transparent') {
    return new Color(0, 0, 0, 0);
  }
  if (value.id) {
    // TODO: support gradients
    return new Color(0.5, 1.0, 1.0, 1.0);
  }
  if (cache[value]) {
    return cache[value];
  }
  var rgb = color(value).rgb();
  var colorValue = new Color(rgb.r / 255, rgb.g/ 255, rgb.b / 255, rgb.opacity / 255);
  cache[value] = colorValue;
  return colorValue;
}

class Color {
  private values: number[] = [0, 0, 0, 1];

  constructor(r: number, g: number, b: number, a: number = 1) {
    this.values[0] = r;
    this.values[1] = g;
    this.values[2] = b;
    this.values[3] = a;
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

