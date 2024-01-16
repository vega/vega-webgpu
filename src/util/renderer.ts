


export class Renderer {

	private static _queue: QueueElement[] = [];
	private static _bundles: GPURenderBundle[] = [];
	public static colorFormat: GPUTextureFormat = 'bgra8unorm';
	public static depthFormat: GPUTextureFormat = 'depth24plus';

	static startFrame() {
		Renderer._queue = [];
		Renderer._bundles = [];
	}

	static render2(
		device: GPUDevice,
		pipeline: GPURenderPipeline,
		renderPassDescriptor: GPURenderPassDescriptor,
		drawCounts: {
			vertexCount: GPUSize32,
			instanceCount?: GPUSize32,
			firstVertex?: GPUSize32,
			firstInstance?: GPUSize32,
		} | [vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number],
		vertexBuffers: GPUBuffer[],
		bindGroups: GPUBindGroup[],
		submit: boolean = true
	): null | GPUCommandBuffer {
		return Renderer.render(
			{
				device,
				pipeline,
				renderPassDescriptor,
				drawCounts,
				vertexBuffers,
				bindGroups,
			},
			submit
		)
	}

	static render(queueElement: QueueElement, submit: boolean = true): null | GPUCommandBuffer {
		const q = queueElement;
		const commandEncoder = q.device.createCommandEncoder();
		const passEncoder = commandEncoder.beginRenderPass(q.renderPassDescriptor);
		passEncoder.setPipeline(q.pipeline);
		for (let i = 0; i < q.vertexBuffers.length; i++) {
			passEncoder.setVertexBuffer(i, q.vertexBuffers[i]);
		}
		for (let i = 0; i < q.bindGroups.length; i++) {
			passEncoder.setBindGroup(i, q.bindGroups[i]);
		}
		if (q.drawCounts instanceof Array) {
			passEncoder.draw(q.drawCounts[0], q.drawCounts[1] ?? 1, q.drawCounts[2] ?? 0, q.drawCounts[3] ?? 0);
		} else {
			passEncoder.draw(q.drawCounts.vertexCount, q.drawCounts.instanceCount ?? 1, q.drawCounts.firstVertex ?? 0, q.drawCounts.firstInstance ?? 0);
		}
		passEncoder.end();
		if (submit) {
			q.device.queue.submit([commandEncoder.finish()]);
		} else {
			return commandEncoder.finish();
		}
	}

	static queue2(
		device: GPUDevice,
		pipeline: GPURenderPipeline,
		renderPassDescriptor: GPURenderPassDescriptor,
		drawCounts: {
			vertexCount: GPUSize32,
			instanceCount?: GPUSize32,
			firstVertex?: GPUSize32,
			firstInstance?: GPUSize32,
		} | [vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number],
		vertexBuffers: GPUBuffer[],
		bindGroups: GPUBindGroup[]
	) {
		Renderer.queue(
			{
				device,
				pipeline,
				renderPassDescriptor,
				drawCounts,
				vertexBuffers,
				bindGroups,
			}
		)
	}

	static queue(queueElement: QueueElement) {
		Renderer._queue.push(queueElement);
	}

	static bundle2(
		device: GPUDevice,
		pipeline: GPURenderPipeline,
		drawCounts: {
			vertexCount: GPUSize32,
			instanceCount?: GPUSize32,
			firstVertex?: GPUSize32,
			firstInstance?: GPUSize32,
		} | [vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number],
		vertexBuffers: GPUBuffer[],
		bindGroups: GPUBindGroup[]
	) {
		Renderer.bundle(
			device,
			{
				pipeline,
				drawCounts,
				vertexBuffers,
				bindGroups,
			}
		)
	}

	static bundle(device: GPUDevice, bundleElement: BundleElement): GPURenderBundle {
		const b = bundleElement;
		const encoder = device.createRenderBundleEncoder({
			colorFormats: [Renderer.colorFormat],
			depthStencilFormat: Renderer.depthFormat
		});
		encoder.setPipeline(b.pipeline);
		for (let i = 0, length = b.vertexBuffers.length; i < length; i++) {
			encoder.setVertexBuffer(i, b.vertexBuffers[i]);
		}
		for (let i = 0, length = b.bindGroups.length; i < length; i++) {
			encoder.setBindGroup(i, b.bindGroups[i]);
		}
		if (b.drawCounts instanceof Array) {
			encoder.draw(b.drawCounts[0], b.drawCounts[1] ?? 1, b.drawCounts[2] ?? 0, b.drawCounts[3] ?? 0);
		} else {
			encoder.draw(b.drawCounts.vertexCount, b.drawCounts.instanceCount ?? 1, b.drawCounts.firstVertex ?? 0, b.drawCounts.firstInstance ?? 0);
		}
		const bundle = encoder.finish();
    bundle.label = bundleElement.pipeline.label + " Bundler";
		Renderer._bundles.push(bundle);
		return bundle;
	}

	static clearQueue() {
		Renderer._queue = [];
	}

	static clearBundles() {
		Renderer._bundles = [];
	}

	static async submitQueue(device?: GPUDevice) {
		const commands: GPUCommandBuffer[] = [];
		for (let i = 0; i < Renderer._queue.length; i++) {
			const q = Renderer._queue[i];
			if (device) {
				commands.push(Renderer.render(q, false));
			} else {
				Renderer.render(q);
			}
		}
		if (device && commands.length > 0) {
			device.queue.submit(commands);
		}
	}

	static async submitBundles(device: GPUDevice, renderPassDescriptor: GPURenderPassDescriptor) {
		if (device && Renderer._bundles.length > 0) {
			const commandEncoder = device.createCommandEncoder();
			const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
			passEncoder.executeBundles(Renderer._bundles);
			passEncoder.end();
			device.queue.submit([commandEncoder.finish()]);
      Renderer._bundles = [];
		}
	}

	static createRenderPipeline(
		name: string,
		device: GPUDevice,
		shader: GPUShaderModule,
		format: GPUTextureFormat,
		buffers: Iterable<GPUVertexBufferLayout | null>,
		bindGroupLayout?: GPUPipelineLayout
	): GPURenderPipeline {
		return device.createRenderPipeline({
			label: name + ' Render Pipeline',
			layout: bindGroupLayout ?? 'auto',
			vertex: {
				module: shader,
				entryPoint: 'main_vertex',
				buffers
			},
			fragment: {
				module: shader,
				entryPoint: 'main_fragment',
				targets: [
					{
						format,
						blend: {
							alpha: {
								srcFactor: 'one',
								dstFactor: 'one-minus-src-alpha',
								operation: 'add',
							},
							color: {
								srcFactor: 'src-alpha',
								dstFactor: 'one-minus-src-alpha',
								operation: 'add',
							},
						} as GPUBlendState,
					},
				],
			},
			primitive: {
				topology: 'triangle-list',
			},
			depthStencil: {
				format: 'depth24plus',
				depthCompare: 'less-equal',
				depthWriteEnabled: true,
			},
		});
	}

	static createPipelineLayout(name: string, device: GPUDevice, bindGroupLayouts: GPUBindGroupLayout[]) {
		return device.createPipelineLayout({
			label: name + ' Pipeline Layout',
			bindGroupLayouts
		});
	}

	static createUniformBindGroupLayout(name: string, device: GPUDevice) {
		return device.createBindGroupLayout({
			label: name + ' Uniform Bind Group Layout',
			entries: [{
				binding: 0,
				visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
				buffer: {
					type: "uniform",
				},
			}] as Iterable<GPUBindGroupLayoutEntry>
		});
	}

	static createUniformBindGroup(name: string, device: GPUDevice, pipeline: GPURenderPipeline, uniform: GPUBuffer, binding: number = 0) {
		return device.createBindGroup({
			label: name + ' Uniform Bind Group',
			layout: pipeline.getBindGroupLayout(binding),
			entries: [
				{
					binding,
					resource: {
						buffer: uniform,
					},
				},
			],
		});
	}

	static createBindGroup(
		name: string,
		device: GPUDevice,
		pipeline: GPURenderPipeline,
		buffers: GPUBuffer[],
		bindGroupLayout?: GPUBindGroupLayout,
		groupId: number = 0,
	) {
		var entries = [];
		for (let i = 0; i < buffers.length; i++) {
			entries.push({
				binding: i,
				resource: {
					buffer: buffers[i],
				}
			});
		}
		return device.createBindGroup({
			label: name + ' Custom Bind Group',
			layout: bindGroupLayout ?? pipeline.getBindGroupLayout(groupId),
			entries
		});
	}

	static createBindGroupLayout(
		name: string,
		device: GPUDevice,
		bindGroupLayoutEntries: BindGroupLayoutEntry[],
	) {
		let entries: GPUBindGroupLayoutEntry[] = [];
		for (let i = 0; i < bindGroupLayoutEntries.length; i++) {
			entries.push({
				binding: i,
				visibility: bindGroupLayoutEntries[i].visibility,
				buffer: bindGroupLayoutEntries[i].buffer,
			})
		}
		return device.createBindGroupLayout({
			label: name + ' Custom Bind Group Layout',
			entries,
		});
	}

	static createRenderPassDescriptor(name: string, clearColor: GPUColor, depthTextureView: GPUTextureView) {
		const renderPassDescriptor: GPURenderPassDescriptor = {
			label: name + ' Render Pass Descriptor',
			colorAttachments: [
				{
					view: undefined, // Assigned later
					clearValue: clearColor,
					loadOp: 'load',
					storeOp: 'store',
				} as GPURenderPassColorAttachment,
			],
			depthStencilAttachment: {
				view: depthTextureView,
				depthClearValue: 1.0,
				depthLoadOp: 'clear',
				depthStoreOp: 'store',
			},
		};
		return renderPassDescriptor;
	}
}

export interface QueueElement {
	device: GPUDevice,
	pipeline: GPURenderPipeline,
	renderPassDescriptor: GPURenderPassDescriptor,
	drawCounts: {
		vertexCount: GPUSize32,
		instanceCount?: GPUSize32,
		firstVertex?: GPUSize32,
		firstInstance?: GPUSize32,
	} | [vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number],
	vertexBuffers: GPUBuffer[],
	bindGroups: GPUBindGroup[],
}

export interface BundleElement {
	pipeline: GPURenderPipeline,
	drawCounts: {
		vertexCount: GPUSize32,
		instanceCount?: GPUSize32,
		firstVertex?: GPUSize32,
		firstInstance?: GPUSize32,
	} | [vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number],
	vertexBuffers: GPUBuffer[],
	bindGroups: GPUBindGroup[],
}

export interface BindGroupLayoutEntry {
	visibility: GPUShaderStageFlags,
	buffer: GPUBufferBindingLayout,
}