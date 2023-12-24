
export class BufferManager {
  private device?: GPUDevice;
  private bufferName: string = "Unknown";
  private resolution: [width: number, height: number];
  private offset: [x: number, y: number];

  constructor(device?: GPUDevice, bufferName?: string, resolution?: [width: number, height: number], offset?: [x: number, y: number]) {
    this.device = device || null;
    this.bufferName = bufferName || "Unknown";
    this.resolution = resolution || [0, 0];
    this.offset = offset || [0, 0];
  }

  createUniformBuffer(data?: Float32Array, usage: GPUBufferUsageFlags = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST) {
    data = data != null ? data : new Float32Array([...this.resolution, ...this.offset]);
    return this.createBuffer(this.bufferName + ' Uniform Buffer', data, usage);
  }

  createGeometryBuffer(data: Float32Array, usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST) {
    return this.createBuffer(this.bufferName + ' Geometry Buffer', data, usage);
  }
  
  createInstanceBuffer(data: Float32Array, usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST) {
    return this.createBuffer(this.bufferName + ' Instance Buffer', data, usage);
  }

  createVertexBuffer(data: Float32Array, usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST) {
    return this.createBuffer(this.bufferName + ' Vertex Buffer', data, usage);
  }

  createFrameBuffer(size: number, usage: GPUBufferUsageFlags = GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE) {
    let desc = { name: this.bufferName + ' Frame Buffer', size, usage, mappedAtCreation: true };
    let buffer = this.device.createBuffer(desc);
    buffer.unmap();
    return buffer;
  }

  // source: https://alain.xyz/blog/raw-webgpu
  createBuffer(name: string, data: Uint16Array | Float32Array, usage: GPUBufferUsageFlags) {
    let desc = { name, size: (data.byteLength + 3) & ~3, usage, mappedAtCreation: true };
    let buffer = this.device.createBuffer(desc);

    const writeArray =
      data instanceof Uint16Array ? new Uint16Array(buffer.getMappedRange()) : new Float32Array(buffer.getMappedRange());
    writeArray.set(data);
    buffer.unmap();
    return buffer;
  }

  // Getter methods
  getDevice(): GPUDevice {
    return this.device;
  }

  getBufferName(): string {
    return this.bufferName;
  }

  getResolution(): [width: number, height: number] {
    return this.resolution;
  }

  getOffset(): [x: number, y: number] {
    return this.offset;
  }

  // Setter methods
  setDevice(device: GPUDevice): void {
    this.device = device;
  }

  setBufferName(bufferName: string): void {
    this.bufferName = bufferName;
  }

  setResolution(resolution: [width: number, height: number]): void {
    this.resolution = resolution;
  }

  setOffset(offset: [x: number, y: number]): void {
    this.offset = offset;
  }
}