import { formatElementCount, formatSize } from "./formatSize.js";

export class VertexBufferManager {
  private vertexFormats: GPUVertexFormat[] = [];
  private instanceFormats: GPUVertexFormat[] = [];
  private vertexLayout?: GPUVertexBufferLayout | null = null;
  private instanceLayout?: GPUVertexBufferLayout | null = null;
  private vertexLength?: number | null = null;
  private instanceLength?: number | null = null;
  private dirtyFlag: boolean = true;
  vertexLocationOffset: number;
  instanceLocationOffset: number;

  constructor(
    vertexFormats: GPUVertexFormat[] = [],
    instanceFormats: GPUVertexFormat[] = [],
    vertexLocationOffset: number | null = null,
    instanceLocationOffset: number | null = null,
  ) {
    this.vertexLocationOffset = vertexLocationOffset | 0;
    this.instanceLocationOffset = instanceLocationOffset | vertexLocationOffset + vertexFormats.length;
    this.vertexFormats = vertexFormats;
    this.instanceFormats = instanceFormats;
  }

  private calculateLayouts(stepMode: GPUVertexStepMode): GPUVertexBufferLayout {
    const attributes: GPUVertexAttribute[] = [];
    let totalOffset = 0;
    let formats = stepMode === "vertex" ? this.vertexFormats : this.instanceFormats;
    let locationOffset = stepMode === "vertex" ? this.vertexLocationOffset : this.instanceLocationOffset;
    formats.forEach((format, index) => {
      const size = formatSize(format);

      if (size > 0) {
        attributes.push({
          shaderLocation: index + locationOffset,
          offset: totalOffset,
          format,
        });

        totalOffset += size;
      } else {
        console.error(`Unsupported format: ${format}`);
      }
    });

    return {
      arrayStride: totalOffset,
      stepMode,
      attributes: attributes,
    };
  }
  private calculateLength(stepMode: GPUVertexStepMode): number {
    let formats = stepMode === "vertex" ? this.vertexFormats : this.instanceFormats;
    let totalLength = 0;
    formats.forEach((format, index) => {
      totalLength += formatElementCount(format);
    });
    return totalLength;
  }

  private setDirty(): void {
    this.dirtyFlag = true;
  }

  pushFormat(stepMode: GPUVertexStepMode, format: GPUVertexFormat): void {
    let existingFormats = stepMode === "vertex" ? this.vertexFormats : this.instanceFormats;
    existingFormats.push(format);
    this.setDirty();
  }

  pushFormats(stepMode: GPUVertexStepMode, formats: GPUVertexFormat[]): void {
    let existingFormats = stepMode === "vertex" ? this.vertexFormats : this.instanceFormats;
    existingFormats.push(...formats);
    this.setDirty();
  }

  clear(): void {
    this.vertexFormats = [];
    this.instanceFormats = [];
    this.vertexLayout = null;
    this.instanceLayout = null;
    this.setDirty();
  }

  process(): void {
    if (this.dirtyFlag) {
      this.vertexLayout = this.calculateLayouts("vertex");
      this.instanceLayout = this.calculateLayouts("instance");
      this.vertexLength = this.calculateLength("vertex");
      this.instanceLength = this.calculateLength("instance");
      this.dirtyFlag = false;
    }
  }


  getBuffers(): Iterable<GPUVertexBufferLayout | null> {
    this.process();
    var buffers = [];
    if (this.vertexLength && this.vertexLayout)
      buffers.push(this.vertexLayout);
    if (this.instanceLength && this.instanceLayout)
      buffers.push(this.instanceLayout);
    return buffers;
  }

  getVertexBuffer(): GPUVertexBufferLayout {
    this.process();
    return this.vertexLayout;
  }

  getInstanceBuffer(): GPUVertexBufferLayout {
    this.process();
    return this.instanceLayout;
  }

  getVertexLength(): number {
    this.process();
    return this.vertexLength;
  }

  getInstanceLength(): number {
    this.process();
    return this.instanceLength;
  }
}