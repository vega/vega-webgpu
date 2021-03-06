export type Matrix = [
  a00: number,
  a01: number,
  a02: number,
  a03: number,
  a10: number,
  a11: number,
  a12: number,
  a13: number,
  a20: number,
  a21: number,
  a22: number,
  a23: number,
  a30: number,
  a31: number,
  a32: number,
  a33: number,
];

export function multiply(a: Matrix, b: Matrix): Matrix {
  const ind = [
    0, 0, 4, 1, 8, 2, 12, 3, 1, 0, 5, 1, 9, 2, 13, 3, 2, 0, 6, 1, 10, 2, 14, 3, 3, 0, 7, 1, 11, 2, 15, 3, 0, 4, 4, 5, 8,
    6, 12, 7, 1, 4, 5, 5, 9, 6, 13, 7, 2, 4, 6, 5, 10, 6, 14, 7, 3, 4, 7, 5, 11, 6, 15, 7, 0, 8, 4, 9, 8, 10, 12, 11, 1,
    8, 5, 9, 9, 10, 13, 11, 2, 8, 6, 9, 10, 10, 14, 11, 3, 8, 7, 9, 11, 10, 15, 11, 0, 12, 4, 13, 8, 14, 12, 15, 1, 12,
    5, 13, 9, 14, 13, 15, 2, 12, 6, 13, 10, 14, 14, 15, 3, 12, 7, 13, 11, 14, 15, 15,
  ];
  const c: Matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < ind.length / 2; i++) {
    c[Math.floor(i / 4)] += a[ind[2 * i]] * b[ind[2 * i + 1]];
  }
  return c;
}

export function perspective(fieldOfViewInRadians: number, aspect: number, near: number, far: number): number[] {
  var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
  var rangeInv = 1.0 / (near - far);

  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (near + far) * rangeInv, -1, 0, 0, near * far * rangeInv * 2, 0];
}

export function rotateX(a: number): Matrix {
  return [1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1];
}

export function rotateY(a: number): Matrix {
  return [Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1];
}

export function rotateZ(a: number): Matrix {
  return [Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

export function translate(x: number, y: number, z: number): Matrix {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}
