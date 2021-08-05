// source: https://alain.xyz/blog/raw-webgpu
export function createBuffer(device: GPUDevice, arr: Uint16Array | Float32Array, usage: GPUBufferUsageFlags) {
  let desc = {size: (arr.byteLength + 3) & ~3, usage, mappedAtCreation: true};
  let buffer = device.createBuffer(desc);

  const writeArray =
    arr instanceof Uint16Array ? new Uint16Array(buffer.getMappedRange()) : new Float32Array(buffer.getMappedRange());
  writeArray.set(arr);
  buffer.unmap();
  return buffer;
}

export const quadVertex = Float32Array.from([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
