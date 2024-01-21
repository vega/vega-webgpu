(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-scenegraph'), require('d3-color')) :
    typeof define === 'function' && define.amd ? define(['exports', 'vega-scenegraph', 'd3-color'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.WevGPURenderer = {}, global.vega, global.d3));
})(this, (function (exports, vegaScenegraph, d3Color) { 'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol */


    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (g && (g = 0, op[0] && (_ = 0)), _) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    var Color = /** @class */ (function () {
        function Color(r, g, b, a) {
            if (a === void 0) { a = 1; }
            this.values = [0, 0, 0, 1];
            this.values[0] = r;
            this.values[1] = g;
            this.values[2] = b;
            this.values[3] = a;
        }
        Color.from = function (value, opacity, fsOpacity) {
            if (opacity === void 0) { opacity = 1.0; }
            if (fsOpacity === void 0) { fsOpacity = 1.0; }
            if (!value) {
                return new Color(0, 0, 0, 0);
            }
            if (value instanceof Color) {
                return value;
            }
            if (value === 'transparent') {
                return new Color(0, 0, 0, 0);
            }
            if (value.id || value.gradient) {
                // TODO: support gradients
                console.warn("Gradient not supported yet!");
                return new Color(0.5, 1.0, 1.0, 1.0 * opacity * fsOpacity);
            }
            var rgba = { r: 255, g: 255, b: 255, a: 255 };
            if (typeof value === 'string') {
                var c = d3Color.color(value).rgb();
                rgba = { r: c.r, g: c.g, b: c.b, a: c.opacity, };
            }
            else {
                var c = d3Color.color(value).rgb();
                rgba = { r: c.r, g: c.g, b: c.b, a: c.opacity, };
            }
            var colorValue = new Color(rgba.r / 255, rgba.g / 255, rgba.b / 255, rgba.a * opacity * fsOpacity);
            return colorValue;
        };
        Color.from2 = function (value, opacity, fsOpacity) {
            if (opacity === void 0) { opacity = 1.0; }
            if (fsOpacity === void 0) { fsOpacity = 1.0; }
            if (!value) {
                return [0, 0, 0, 0];
            }
            var entry = Color._cache[value];
            if (entry) {
                return [entry[0], entry[1], entry[2], entry[3] * opacity * fsOpacity];
            }
            if (value instanceof Color) {
                return [value.r, value.g, value.b, value.a];
            }
            if (value === 'transparent') {
                return [0, 0, 0, 0];
            }
            if (value.id || value.gradient) {
                // TODO: support gradients
                console.warn("Gradient not supported yet!");
                return [0.5, 1.0, 1.0, 1.0 * opacity * fsOpacity];
            }
            if (typeof value === 'string') {
                var c = d3Color.color(value).rgb();
                var ret = [c.r / 255, c.g / 255, c.b / 255, c.opacity * opacity * fsOpacity];
                Color._cache[value] = [ret[0], ret[1], ret[2], c.opacity];
                return ret;
            }
            else {
                var c = d3Color.color(value).rgb();
                var ret = [c.r / 255, c.g / 255, c.b / 255, c.opacity * opacity * fsOpacity];
                Color._cache[value] = [ret[0], ret[1], ret[2], c.opacity];
                return ret;
            }
        };
        Color.prototype[Symbol.iterator] = function () {
            var _a, _b, value, e_1_1;
            var e_1, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 5, 6, 7]);
                        _a = __values(this.values), _b = _a.next();
                        _d.label = 1;
                    case 1:
                        if (!!_b.done) return [3 /*break*/, 4];
                        value = _b.value;
                        return [4 /*yield*/, value];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _b = _a.next();
                        return [3 /*break*/, 1];
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 7];
                    case 6:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        };
        Object.defineProperty(Color.prototype, "rgba", {
            get: function () {
                return [this.values[0], this.values[1], this.values[2], this.values[3]];
            },
            set: function (values) {
                this.values[0] = values[0];
                this.values[1] = values[1];
                this.values[2] = values[2];
                this.values[3] = values[3];
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Color.prototype, 0, {
            get: function () {
                return this.values[0];
            },
            set: function (value) {
                this.values[0] = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "r", {
            get: function () {
                return this.values[0];
            },
            set: function (value) {
                this.values[0] = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Color.prototype, 1, {
            get: function () {
                return this.values[1];
            },
            set: function (value) {
                this.values[1] = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "g", {
            get: function () {
                return this.values[1];
            },
            set: function (value) {
                this.values[1] = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Color.prototype, 2, {
            get: function () {
                return this.values[2];
            },
            set: function (value) {
                this.values[2] = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "b", {
            get: function () {
                return this.values[2];
            },
            set: function (value) {
                this.values[2] = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Color.prototype, 3, {
            get: function () {
                return this.values[3];
            },
            set: function (value) {
                this.values[3] = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "a", {
            get: function () {
                return this.values[3];
            },
            set: function (value) {
                this.values[3] = value;
            },
            enumerable: false,
            configurable: true
        });
        Color.cache = {};
        Color._cache = {};
        return Color;
    }());

    function resize (canvas, context, width, height, origin, textCanvas, textContext) {
        var scale = typeof HTMLElement !== 'undefined'
            && canvas instanceof HTMLElement
            && canvas.parentNode != null;
        var ratio = scale ? window.devicePixelRatio : 1;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        textCanvas.width = width * ratio;
        textCanvas.height = height * ratio;
        //@ts-ignore
        textContext.pixelRatio = ratio;
        textContext.setTransform(ratio, 0, 0, ratio, ratio * origin[0], ratio * origin[1]);
        if (ratio !== 1) {
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
        }
        context._lineWidth = ratio;
        context._viewport = {
            x: 0,
            y: 0,
            width: width,
            height: height,
            minDepth: 0,
            maxDepth: 1,
        };
        context._origin = origin;
        context._ratio = ratio;
        context._clip = [0, 0, canvas.width / context._ratio, canvas.height / context._ratio];
        return canvas;
    }

    function formatElementCount(format) {
        switch (format) {
            case "float32":
            case "uint32":
            case "sint32":
                return 1;
            case "uint8x2":
            case "sint8x2":
            case "unorm8x2":
            case "snorm8x2":
            case "uint16x2":
            case "sint16x2":
            case "unorm16x2":
            case "snorm16x2":
            case "float16x2":
            case "float32x2":
            case "uint32x2":
            case "sint32x2":
                return 2;
            case "float32x3":
            case "uint32x3":
            case "sint32x3":
                return 3;
            case "uint8x4":
            case "sint8x4":
            case "unorm8x4":
            case "snorm8x4":
            case "uint16x4":
            case "sint16x4":
            case "unorm16x4":
            case "snorm16x4":
            case "float16x4":
            case "float32x4":
            case "uint32x4":
            case "sint32x4":
                return 4;
            default:
                return 0; // Unsupported format
        }
    }
    function formatSize(format) {
        switch (format) {
            case "float16x2":
                return 2 * 2;
            case "float16x4":
                return 2 * 4;
            case "float32":
                return Float32Array.BYTES_PER_ELEMENT;
            case "float32x2":
                return Float32Array.BYTES_PER_ELEMENT * 2;
            case "float32x3":
                return Float32Array.BYTES_PER_ELEMENT * 3;
            case "float32x4":
                return Float32Array.BYTES_PER_ELEMENT * 4;
            case "sint8x2":
            case "snorm8x2":
                return Int8Array.BYTES_PER_ELEMENT * 2;
            case "sint8x4":
            case "snorm8x4":
                return Int8Array.BYTES_PER_ELEMENT * 4;
            case "sint16x2":
            case "snorm16x2":
                return Int16Array.BYTES_PER_ELEMENT * 2;
            case "sint16x4":
            case "snorm16x4":
                return Int16Array.BYTES_PER_ELEMENT * 4;
            case "sint32":
                return Int32Array.BYTES_PER_ELEMENT;
            case "sint32x2":
                return Int32Array.BYTES_PER_ELEMENT * 2;
            case "sint32x3":
                return Int32Array.BYTES_PER_ELEMENT * 3;
            case "sint32x4":
                return Int32Array.BYTES_PER_ELEMENT * 4;
            case "uint32":
                return Uint32Array.BYTES_PER_ELEMENT;
            case "uint32x2":
                return Uint32Array.BYTES_PER_ELEMENT * 2;
            case "uint32x3":
                return Uint32Array.BYTES_PER_ELEMENT * 3;
            case "uint32x4":
                return Uint32Array.BYTES_PER_ELEMENT * 4;
            case "uint8x2":
            case "unorm8x2":
                return Uint8Array.BYTES_PER_ELEMENT * 2;
            case "uint8x4":
            case "unorm8x4":
                return Uint8Array.BYTES_PER_ELEMENT * 4;
            case "uint16x2":
            case "unorm16x2":
                return Uint16Array.BYTES_PER_ELEMENT * 2;
            case "uint16x4":
            case "unorm16x4":
                return Uint16Array.BYTES_PER_ELEMENT * 4;
            case "unorm10-10-10-2":
                return 4; // (10 + 10 + 10 + 2) / 8
            default:
                return 0;
        }
    }

    var VertexBufferManager = /** @class */ (function () {
        function VertexBufferManager(vertexFormats, instanceFormats, vertexLocationOffset, instanceLocationOffset) {
            if (vertexFormats === void 0) { vertexFormats = []; }
            if (instanceFormats === void 0) { instanceFormats = []; }
            if (vertexLocationOffset === void 0) { vertexLocationOffset = null; }
            if (instanceLocationOffset === void 0) { instanceLocationOffset = null; }
            this.vertexFormats = [];
            this.instanceFormats = [];
            this.vertexLayout = null;
            this.instanceLayout = null;
            this.vertexLength = null;
            this.instanceLength = null;
            this.dirtyFlag = true;
            this.vertexLocationOffset = vertexLocationOffset | 0;
            this.instanceLocationOffset = instanceLocationOffset | vertexLocationOffset + vertexFormats.length;
            this.vertexFormats = vertexFormats;
            this.instanceFormats = instanceFormats;
        }
        VertexBufferManager.prototype.calculateLayouts = function (stepMode) {
            var attributes = [];
            var totalOffset = 0;
            var formats = stepMode === "vertex" ? this.vertexFormats : this.instanceFormats;
            var locationOffset = stepMode === "vertex" ? this.vertexLocationOffset : this.instanceLocationOffset;
            formats.forEach(function (format, index) {
                var size = formatSize(format);
                if (size > 0) {
                    attributes.push({
                        shaderLocation: index + locationOffset,
                        offset: totalOffset,
                        format: format,
                    });
                    totalOffset += size;
                }
                else {
                    console.error("Unsupported format: ".concat(format));
                }
            });
            return {
                arrayStride: totalOffset,
                stepMode: stepMode,
                attributes: attributes,
            };
        };
        VertexBufferManager.prototype.calculateLength = function (stepMode) {
            var formats = stepMode === "vertex" ? this.vertexFormats : this.instanceFormats;
            var totalLength = 0;
            formats.forEach(function (format, index) {
                totalLength += formatElementCount(format);
            });
            return totalLength;
        };
        VertexBufferManager.prototype.setDirty = function () {
            this.dirtyFlag = true;
        };
        VertexBufferManager.prototype.pushFormat = function (stepMode, format) {
            var existingFormats = stepMode === "vertex" ? this.vertexFormats : this.instanceFormats;
            existingFormats.push(format);
            this.setDirty();
        };
        VertexBufferManager.prototype.pushFormats = function (stepMode, formats) {
            var existingFormats = stepMode === "vertex" ? this.vertexFormats : this.instanceFormats;
            existingFormats.push.apply(existingFormats, __spreadArray([], __read(formats), false));
            this.setDirty();
        };
        VertexBufferManager.prototype.clear = function () {
            this.vertexFormats = [];
            this.instanceFormats = [];
            this.vertexLayout = null;
            this.instanceLayout = null;
            this.setDirty();
        };
        VertexBufferManager.prototype.process = function () {
            if (this.dirtyFlag) {
                this.vertexLayout = this.calculateLayouts("vertex");
                this.instanceLayout = this.calculateLayouts("instance");
                this.vertexLength = this.calculateLength("vertex");
                this.instanceLength = this.calculateLength("instance");
                this.dirtyFlag = false;
            }
        };
        VertexBufferManager.prototype.getBuffers = function () {
            this.process();
            var buffers = [];
            if (this.vertexLength && this.vertexLayout)
                buffers.push(this.vertexLayout);
            if (this.instanceLength && this.instanceLayout)
                buffers.push(this.instanceLayout);
            return buffers;
        };
        VertexBufferManager.prototype.getVertexBuffer = function () {
            this.process();
            return this.vertexLayout;
        };
        VertexBufferManager.prototype.getInstanceBuffer = function () {
            this.process();
            return this.instanceLayout;
        };
        VertexBufferManager.prototype.getVertexLength = function () {
            this.process();
            return this.vertexLength;
        };
        VertexBufferManager.prototype.getInstanceLength = function () {
            this.process();
            return this.instanceLength;
        };
        return VertexBufferManager;
    }());

    var BufferManager = /** @class */ (function () {
        function BufferManager(device, bufferName, resolution, offset) {
            this.bufferName = "Unknown";
            this.device = device || null;
            this.bufferName = bufferName || "Unknown";
            this.resolution = resolution || [0, 0];
            this.offset = offset || [0, 0];
        }
        BufferManager.prototype.createUniformBuffer = function (data, usage) {
            if (usage === void 0) { usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST; }
            data = data != null ? data : new Float32Array(__spreadArray(__spreadArray([], __read(this.resolution), false), __read(this.offset), false));
            return this.createBuffer(this.bufferName + ' Uniform Buffer', data, usage);
        };
        BufferManager.prototype.createGeometryBuffer = function (data, usage) {
            if (usage === void 0) { usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST; }
            return this.createBuffer(this.bufferName + ' Geometry Buffer', data, usage);
        };
        BufferManager.prototype.createInstanceBuffer = function (data, usage) {
            if (usage === void 0) { usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST; }
            return this.createBuffer(this.bufferName + ' Instance Buffer', data, usage);
        };
        BufferManager.prototype.createVertexBuffer = function (data, usage) {
            if (usage === void 0) { usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST; }
            return this.createBuffer(this.bufferName + ' Vertex Buffer', data, usage);
        };
        BufferManager.prototype.createFrameBuffer = function (size, usage) {
            if (usage === void 0) { usage = GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE; }
            var desc = { name: this.bufferName + ' Frame Buffer', size: size, usage: usage, mappedAtCreation: true };
            var buffer = this.device.createBuffer(desc);
            buffer.unmap();
            return buffer;
        };
        // source: https://alain.xyz/blog/raw-webgpu
        BufferManager.prototype.createBuffer = function (name, data, usage) {
            var desc = { label: name, size: (data.byteLength + 3) & ~3, usage: usage, mappedAtCreation: true };
            var buffer = this.device.createBuffer(desc);
            var writeArray;
            if (data instanceof Uint16Array)
                writeArray = new Uint16Array(buffer.getMappedRange());
            if (data instanceof Uint32Array)
                writeArray = writeArray = new Uint32Array(buffer.getMappedRange());
            if (data instanceof Float32Array)
                writeArray = new Float32Array(buffer.getMappedRange());
            writeArray.set(data);
            buffer.unmap();
            return buffer;
        };
        // Getter methods
        BufferManager.prototype.getDevice = function () {
            return this.device;
        };
        BufferManager.prototype.getBufferName = function () {
            return this.bufferName;
        };
        BufferManager.prototype.getResolution = function () {
            return this.resolution;
        };
        BufferManager.prototype.getOffset = function () {
            return this.offset;
        };
        // Setter methods
        BufferManager.prototype.setDevice = function (device) {
            this.device = device;
        };
        BufferManager.prototype.setBufferName = function (bufferName) {
            this.bufferName = bufferName;
        };
        BufferManager.prototype.setResolution = function (resolution) {
            this.resolution = resolution;
        };
        BufferManager.prototype.setOffset = function (offset) {
            this.offset = offset;
        };
        return BufferManager;
    }());

    var Renderer = /** @class */ (function () {
        function Renderer() {
        }
        Renderer.startFrame = function () {
            Renderer._queue = [];
            Renderer._bundles = [];
        };
        Renderer.render2 = function (device, pipeline, renderPassDescriptor, drawCounts, vertexBuffers, bindGroups, submit) {
            if (submit === void 0) { submit = true; }
            return Renderer.render({
                device: device,
                pipeline: pipeline,
                renderPassDescriptor: renderPassDescriptor,
                drawCounts: drawCounts,
                vertexBuffers: vertexBuffers,
                bindGroups: bindGroups,
            }, submit);
        };
        Renderer.render = function (queueElement, submit) {
            var _a, _b, _c, _d, _e, _f;
            if (submit === void 0) { submit = true; }
            var q = queueElement;
            var commandEncoder = q.device.createCommandEncoder();
            var passEncoder = commandEncoder.beginRenderPass(q.renderPassDescriptor);
            passEncoder.setPipeline(q.pipeline);
            for (var i = 0; i < q.vertexBuffers.length; i++) {
                passEncoder.setVertexBuffer(i, q.vertexBuffers[i]);
            }
            for (var i = 0; i < q.bindGroups.length; i++) {
                passEncoder.setBindGroup(i, q.bindGroups[i]);
            }
            if (q.drawCounts instanceof Array) {
                passEncoder.draw(q.drawCounts[0], (_a = q.drawCounts[1]) !== null && _a !== void 0 ? _a : 1, (_b = q.drawCounts[2]) !== null && _b !== void 0 ? _b : 0, (_c = q.drawCounts[3]) !== null && _c !== void 0 ? _c : 0);
            }
            else {
                passEncoder.draw(q.drawCounts.vertexCount, (_d = q.drawCounts.instanceCount) !== null && _d !== void 0 ? _d : 1, (_e = q.drawCounts.firstVertex) !== null && _e !== void 0 ? _e : 0, (_f = q.drawCounts.firstInstance) !== null && _f !== void 0 ? _f : 0);
            }
            passEncoder.end();
            if (submit) {
                q.device.queue.submit([commandEncoder.finish()]);
            }
            else {
                return commandEncoder.finish();
            }
        };
        Renderer.queue2 = function (device, pipeline, renderPassDescriptor, drawCounts, vertexBuffers, bindGroups) {
            Renderer.queue({
                device: device,
                pipeline: pipeline,
                renderPassDescriptor: renderPassDescriptor,
                drawCounts: drawCounts,
                vertexBuffers: vertexBuffers,
                bindGroups: bindGroups,
            });
        };
        Renderer.queue = function (queueElement) {
            Renderer._queue.push(queueElement);
        };
        Renderer.bundle2 = function (device, pipeline, drawCounts, vertexBuffers, bindGroups) {
            Renderer.bundle(device, {
                pipeline: pipeline,
                drawCounts: drawCounts,
                vertexBuffers: vertexBuffers,
                bindGroups: bindGroups,
            });
        };
        Renderer.bundle = function (device, bundleElement) {
            var _a, _b, _c, _d, _e, _f;
            var b = bundleElement;
            var encoder = device.createRenderBundleEncoder({
                colorFormats: [Renderer.colorFormat],
                depthStencilFormat: Renderer.depthFormat
            });
            encoder.setPipeline(b.pipeline);
            for (var i = 0, length_1 = b.vertexBuffers.length; i < length_1; i++) {
                encoder.setVertexBuffer(i, b.vertexBuffers[i]);
            }
            for (var i = 0, length_2 = b.bindGroups.length; i < length_2; i++) {
                encoder.setBindGroup(i, b.bindGroups[i]);
            }
            if (b.drawCounts instanceof Array) {
                encoder.draw(b.drawCounts[0], (_a = b.drawCounts[1]) !== null && _a !== void 0 ? _a : 1, (_b = b.drawCounts[2]) !== null && _b !== void 0 ? _b : 0, (_c = b.drawCounts[3]) !== null && _c !== void 0 ? _c : 0);
            }
            else {
                encoder.draw(b.drawCounts.vertexCount, (_d = b.drawCounts.instanceCount) !== null && _d !== void 0 ? _d : 1, (_e = b.drawCounts.firstVertex) !== null && _e !== void 0 ? _e : 0, (_f = b.drawCounts.firstInstance) !== null && _f !== void 0 ? _f : 0);
            }
            var bundle = encoder.finish();
            bundle.label = bundleElement.pipeline.label + " Bundler";
            Renderer._bundles.push(bundle);
            return bundle;
        };
        Renderer.clearQueue = function () {
            Renderer._queue = [];
        };
        Renderer.clearBundles = function () {
            Renderer._bundles = [];
        };
        Renderer.submitQueue = function (device) {
            return __awaiter(this, void 0, void 0, function () {
                var commands, i, q;
                return __generator(this, function (_a) {
                    commands = [];
                    for (i = 0; i < Renderer._queue.length; i++) {
                        q = Renderer._queue[i];
                        if (device) {
                            commands.push(Renderer.render(q, false));
                        }
                        else {
                            Renderer.render(q);
                        }
                    }
                    if (device && commands.length > 0) {
                        device.queue.submit(commands);
                    }
                    return [2 /*return*/];
                });
            });
        };
        Renderer.submitBundles = function (device, renderPassDescriptor) {
            return __awaiter(this, void 0, void 0, function () {
                var commandEncoder, passEncoder;
                return __generator(this, function (_a) {
                    if (device && Renderer._bundles.length > 0) {
                        commandEncoder = device.createCommandEncoder();
                        passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
                        passEncoder.executeBundles(Renderer._bundles);
                        passEncoder.end();
                        device.queue.submit([commandEncoder.finish()]);
                        Renderer._bundles = [];
                    }
                    return [2 /*return*/];
                });
            });
        };
        Renderer.createRenderPipeline = function (name, device, shader, format, buffers, bindGroupLayout) {
            return device.createRenderPipeline({
                label: name + ' Render Pipeline',
                layout: bindGroupLayout !== null && bindGroupLayout !== void 0 ? bindGroupLayout : 'auto',
                vertex: {
                    module: shader,
                    entryPoint: 'main_vertex',
                    buffers: buffers
                },
                fragment: {
                    module: shader,
                    entryPoint: 'main_fragment',
                    targets: [
                        {
                            format: format,
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
                            },
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
        };
        Renderer.createPipelineLayout = function (name, device, bindGroupLayouts) {
            return device.createPipelineLayout({
                label: name + ' Pipeline Layout',
                bindGroupLayouts: bindGroupLayouts
            });
        };
        Renderer.createUniformBindGroupLayout = function (name, device) {
            return device.createBindGroupLayout({
                label: name + ' Uniform Bind Group Layout',
                entries: [{
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
                        buffer: {
                            type: "uniform",
                        },
                    }]
            });
        };
        Renderer.createUniformBindGroup = function (name, device, pipeline, uniform, binding) {
            if (binding === void 0) { binding = 0; }
            return device.createBindGroup({
                label: name + ' Uniform Bind Group',
                layout: pipeline.getBindGroupLayout(binding),
                entries: [
                    {
                        binding: binding,
                        resource: {
                            buffer: uniform,
                        },
                    },
                ],
            });
        };
        Renderer.createBindGroup = function (name, device, pipeline, buffers, bindGroupLayout, groupId) {
            if (groupId === void 0) { groupId = 0; }
            var entries = [];
            for (var i = 0; i < buffers.length; i++) {
                entries.push({
                    binding: i,
                    resource: {
                        buffer: buffers[i],
                    }
                });
            }
            return device.createBindGroup({
                label: name + ' Custom Bind Group',
                layout: bindGroupLayout !== null && bindGroupLayout !== void 0 ? bindGroupLayout : pipeline.getBindGroupLayout(groupId),
                entries: entries
            });
        };
        Renderer.createBindGroupLayout = function (name, device, bindGroupLayoutEntries) {
            var entries = [];
            for (var i = 0; i < bindGroupLayoutEntries.length; i++) {
                entries.push({
                    binding: i,
                    visibility: bindGroupLayoutEntries[i].visibility,
                    buffer: bindGroupLayoutEntries[i].buffer,
                });
            }
            return device.createBindGroupLayout({
                label: name + ' Custom Bind Group Layout',
                entries: entries,
            });
        };
        Renderer.createRenderPassDescriptor = function (name, clearColor, depthTextureView) {
            var renderPassDescriptor = {
                label: name + ' Render Pass Descriptor',
                colorAttachments: [
                    {
                        view: undefined, // Assigned later
                        clearValue: clearColor,
                        loadOp: 'load',
                        storeOp: 'store',
                    },
                ],
                depthStencilAttachment: {
                    view: depthTextureView,
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            };
            return renderPassDescriptor;
        };
        Renderer._queue = [];
        Renderer._bundles = [];
        Renderer.colorFormat = 'bgra8unorm';
        Renderer.depthFormat = 'depth24plus';
        return Renderer;
    }());

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    var parseSvgPath = parse;

    /**
     * expected argument lengths
     * @type {Object}
     */

    var length = {a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0};

    /**
     * segment pattern
     * @type {RegExp}
     */

    var segment = /([astvzqmhlc])([^astvzqmhlc]*)/ig;

    /**
     * parse an svg path data string. Generates an Array
     * of commands where each command is an Array of the
     * form `[command, arg1, arg2, ...]`
     *
     * @param {String} path
     * @return {Array}
     */

    function parse(path) {
    	var data = [];
    	path.replace(segment, function(_, command, args){
    		var type = command.toLowerCase();
    		args = parseValues(args);

    		// overloaded moveTo
    		if (type == 'm' && args.length > 2) {
    			data.push([command].concat(args.splice(0, 2)));
    			type = 'l';
    			command = command == 'm' ? 'l' : 'L';
    		}

    		while (true) {
    			if (args.length == length[type]) {
    				args.unshift(command);
    				return data.push(args)
    			}
    			if (args.length < length[type]) throw new Error('malformed path data')
    			data.push([command].concat(args.splice(0, length[type])));
    		}
    	});
    	return data
    }

    var number$1 = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/ig;

    function parseValues(args) {
    	var numbers = args.match(number$1);
    	return numbers ? numbers.map(Number) : []
    }

    var parse$1 = /*@__PURE__*/getDefaultExportFromCjs(parseSvgPath);

    var simplifyPath = {exports: {}};

    function getSqDist(p1, p2) {
        var dx = p1[0] - p2[0],
            dy = p1[1] - p2[1];

        return dx * dx + dy * dy;
    }

    // basic distance-based simplification
    var radialDistance = function simplifyRadialDist(points, tolerance) {
        if (points.length<=1)
            return points;
        tolerance = typeof tolerance === 'number' ? tolerance : 1;
        var sqTolerance = tolerance * tolerance;
        
        var prevPoint = points[0],
            newPoints = [prevPoint],
            point;

        for (var i = 1, len = points.length; i < len; i++) {
            point = points[i];

            if (getSqDist(point, prevPoint) > sqTolerance) {
                newPoints.push(point);
                prevPoint = point;
            }
        }

        if (prevPoint !== point) newPoints.push(point);

        return newPoints;
    };

    // square distance from a point to a segment
    function getSqSegDist(p, p1, p2) {
        var x = p1[0],
            y = p1[1],
            dx = p2[0] - x,
            dy = p2[1] - y;

        if (dx !== 0 || dy !== 0) {

            var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

            if (t > 1) {
                x = p2[0];
                y = p2[1];

            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }

        dx = p[0] - x;
        dy = p[1] - y;

        return dx * dx + dy * dy;
    }

    function simplifyDPStep(points, first, last, sqTolerance, simplified) {
        var maxSqDist = sqTolerance,
            index;

        for (var i = first + 1; i < last; i++) {
            var sqDist = getSqSegDist(points[i], points[first], points[last]);

            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }

        if (maxSqDist > sqTolerance) {
            if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
            simplified.push(points[index]);
            if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
        }
    }

    // simplification using Ramer-Douglas-Peucker algorithm
    var douglasPeucker = function simplifyDouglasPeucker(points, tolerance) {
        if (points.length<=1)
            return points;
        tolerance = typeof tolerance === 'number' ? tolerance : 1;
        var sqTolerance = tolerance * tolerance;
        
        var last = points.length - 1;

        var simplified = [points[0]];
        simplifyDPStep(points, 0, last, sqTolerance, simplified);
        simplified.push(points[last]);

        return simplified;
    };

    var simplifyRadialDist = radialDistance;
    var simplifyDouglasPeucker = douglasPeucker;

    //simplifies using both algorithms
    simplifyPath.exports = function simplify(points, tolerance) {
        points = simplifyRadialDist(points, tolerance);
        points = simplifyDouglasPeucker(points, tolerance);
        return points;
    };

    simplifyPath.exports.radialDistance = simplifyRadialDist;
    simplifyPath.exports.douglasPeucker = simplifyDouglasPeucker;

    var simplifyPathExports = simplifyPath.exports;
    var simplify = /*@__PURE__*/getDefaultExportFromCjs(simplifyPathExports);

    function clone$1(point) { //TODO: use gl-vec2 for this
        return [point[0], point[1]]
    }

    function vec2(x, y) {
        return [x, y]
    }

    var _function = function createBezierBuilder(opt) {
        opt = opt||{};

        var RECURSION_LIMIT = typeof opt.recursion === 'number' ? opt.recursion : 8;
        var FLT_EPSILON = typeof opt.epsilon === 'number' ? opt.epsilon : 1.19209290e-7;
        var PATH_DISTANCE_EPSILON = typeof opt.pathEpsilon === 'number' ? opt.pathEpsilon : 1.0;

        var curve_angle_tolerance_epsilon = typeof opt.angleEpsilon === 'number' ? opt.angleEpsilon : 0.01;
        var m_angle_tolerance = opt.angleTolerance || 0;
        var m_cusp_limit = opt.cuspLimit || 0;

        return function bezierCurve(start, c1, c2, end, scale, points) {
            if (!points)
                points = [];

            scale = typeof scale === 'number' ? scale : 1.0;
            var distanceTolerance = PATH_DISTANCE_EPSILON / scale;
            distanceTolerance *= distanceTolerance;
            begin(start, c1, c2, end, points, distanceTolerance);
            return points
        }


        ////// Based on:
        ////// https://github.com/pelson/antigrain/blob/master/agg-2.4/src/agg_curves.cpp

        function begin(start, c1, c2, end, points, distanceTolerance) {
            points.push(clone$1(start));
            var x1 = start[0],
                y1 = start[1],
                x2 = c1[0],
                y2 = c1[1],
                x3 = c2[0],
                y3 = c2[1],
                x4 = end[0],
                y4 = end[1];
            recursive(x1, y1, x2, y2, x3, y3, x4, y4, points, distanceTolerance, 0);
            points.push(clone$1(end));
        }

        function recursive(x1, y1, x2, y2, x3, y3, x4, y4, points, distanceTolerance, level) {
            if(level > RECURSION_LIMIT) 
                return

            var pi = Math.PI;

            // Calculate all the mid-points of the line segments
            //----------------------
            var x12   = (x1 + x2) / 2;
            var y12   = (y1 + y2) / 2;
            var x23   = (x2 + x3) / 2;
            var y23   = (y2 + y3) / 2;
            var x34   = (x3 + x4) / 2;
            var y34   = (y3 + y4) / 2;
            var x123  = (x12 + x23) / 2;
            var y123  = (y12 + y23) / 2;
            var x234  = (x23 + x34) / 2;
            var y234  = (y23 + y34) / 2;
            var x1234 = (x123 + x234) / 2;
            var y1234 = (y123 + y234) / 2;

            if(level > 0) { // Enforce subdivision first time
                // Try to approximate the full cubic curve by a single straight line
                //------------------
                var dx = x4-x1;
                var dy = y4-y1;

                var d2 = Math.abs((x2 - x4) * dy - (y2 - y4) * dx);
                var d3 = Math.abs((x3 - x4) * dy - (y3 - y4) * dx);

                var da1, da2;

                if(d2 > FLT_EPSILON && d3 > FLT_EPSILON) {
                    // Regular care
                    //-----------------
                    if((d2 + d3)*(d2 + d3) <= distanceTolerance * (dx*dx + dy*dy)) {
                        // If the curvature doesn't exceed the distanceTolerance value
                        // we tend to finish subdivisions.
                        //----------------------
                        if(m_angle_tolerance < curve_angle_tolerance_epsilon) {
                            points.push(vec2(x1234, y1234));
                            return
                        }

                        // Angle & Cusp Condition
                        //----------------------
                        var a23 = Math.atan2(y3 - y2, x3 - x2);
                        da1 = Math.abs(a23 - Math.atan2(y2 - y1, x2 - x1));
                        da2 = Math.abs(Math.atan2(y4 - y3, x4 - x3) - a23);
                        if(da1 >= pi) da1 = 2*pi - da1;
                        if(da2 >= pi) da2 = 2*pi - da2;

                        if(da1 + da2 < m_angle_tolerance) {
                            // Finally we can stop the recursion
                            //----------------------
                            points.push(vec2(x1234, y1234));
                            return
                        }

                        if(m_cusp_limit !== 0.0) {
                            if(da1 > m_cusp_limit) {
                                points.push(vec2(x2, y2));
                                return
                            }

                            if(da2 > m_cusp_limit) {
                                points.push(vec2(x3, y3));
                                return
                            }
                        }
                    }
                }
                else {
                    if(d2 > FLT_EPSILON) {
                        // p1,p3,p4 are collinear, p2 is considerable
                        //----------------------
                        if(d2 * d2 <= distanceTolerance * (dx*dx + dy*dy)) {
                            if(m_angle_tolerance < curve_angle_tolerance_epsilon) {
                                points.push(vec2(x1234, y1234));
                                return
                            }

                            // Angle Condition
                            //----------------------
                            da1 = Math.abs(Math.atan2(y3 - y2, x3 - x2) - Math.atan2(y2 - y1, x2 - x1));
                            if(da1 >= pi) da1 = 2*pi - da1;

                            if(da1 < m_angle_tolerance) {
                                points.push(vec2(x2, y2));
                                points.push(vec2(x3, y3));
                                return
                            }

                            if(m_cusp_limit !== 0.0) {
                                if(da1 > m_cusp_limit) {
                                    points.push(vec2(x2, y2));
                                    return
                                }
                            }
                        }
                    }
                    else if(d3 > FLT_EPSILON) {
                        // p1,p2,p4 are collinear, p3 is considerable
                        //----------------------
                        if(d3 * d3 <= distanceTolerance * (dx*dx + dy*dy)) {
                            if(m_angle_tolerance < curve_angle_tolerance_epsilon) {
                                points.push(vec2(x1234, y1234));
                                return
                            }

                            // Angle Condition
                            //----------------------
                            da1 = Math.abs(Math.atan2(y4 - y3, x4 - x3) - Math.atan2(y3 - y2, x3 - x2));
                            if(da1 >= pi) da1 = 2*pi - da1;

                            if(da1 < m_angle_tolerance) {
                                points.push(vec2(x2, y2));
                                points.push(vec2(x3, y3));
                                return
                            }

                            if(m_cusp_limit !== 0.0) {
                                if(da1 > m_cusp_limit)
                                {
                                    points.push(vec2(x3, y3));
                                    return
                                }
                            }
                        }
                    }
                    else {
                        // Collinear case
                        //-----------------
                        dx = x1234 - (x1 + x4) / 2;
                        dy = y1234 - (y1 + y4) / 2;
                        if(dx*dx + dy*dy <= distanceTolerance) {
                            points.push(vec2(x1234, y1234));
                            return
                        }
                    }
                }
            }

            // Continue subdivision
            //----------------------
            recursive(x1, y1, x12, y12, x123, y123, x1234, y1234, points, distanceTolerance, level + 1); 
            recursive(x1234, y1234, x234, y234, x34, y34, x4, y4, points, distanceTolerance, level + 1); 
        }
    };

    var adaptiveBezierCurve = _function();

    var absSvgPath = absolutize;

    /**
     * redefine `path` with absolute coordinates
     *
     * @param {Array} path
     * @return {Array}
     */

    function absolutize(path){
    	var startX = 0;
    	var startY = 0;
    	var x = 0;
    	var y = 0;

    	return path.map(function(seg){
    		seg = seg.slice();
    		var type = seg[0];
    		var command = type.toUpperCase();

    		// is relative
    		if (type != command) {
    			seg[0] = command;
    			switch (type) {
    				case 'a':
    					seg[6] += x;
    					seg[7] += y;
    					break
    				case 'v':
    					seg[1] += y;
    					break
    				case 'h':
    					seg[1] += x;
    					break
    				default:
    					for (var i = 1; i < seg.length;) {
    						seg[i++] += x;
    						seg[i++] += y;
    					}
    			}
    		}

    		// update cursor state
    		switch (command) {
    			case 'Z':
    				x = startX;
    				y = startY;
    				break
    			case 'H':
    				x = seg[1];
    				break
    			case 'V':
    				y = seg[1];
    				break
    			case 'M':
    				x = startX = seg[1];
    				y = startY = seg[2];
    				break
    			default:
    				x = seg[seg.length - 2];
    				y = seg[seg.length - 1];
    		}

    		return seg
    	})
    }

    var π = Math.PI;
    var _120 = radians(120);

    var normalizeSvgPath = normalize;

    /**
     * describe `path` in terms of cubic bézier 
     * curves and move commands
     *
     * @param {Array} path
     * @return {Array}
     */

    function normalize(path){
    	// init state
    	var prev;
    	var result = [];
    	var bezierX = 0;
    	var bezierY = 0;
    	var startX = 0;
    	var startY = 0;
    	var quadX = null;
    	var quadY = null;
    	var x = 0;
    	var y = 0;

    	for (var i = 0, len = path.length; i < len; i++) {
    		var seg = path[i];
    		var command = seg[0];
    		switch (command) {
    			case 'M':
    				startX = seg[1];
    				startY = seg[2];
    				break
    			case 'A':
    				seg = arc$2(x, y,seg[1],seg[2],radians(seg[3]),seg[4],seg[5],seg[6],seg[7]);
    				// split multi part
    				seg.unshift('C');
    				if (seg.length > 7) {
    					result.push(seg.splice(0, 7));
    					seg.unshift('C');
    				}
    				break
    			case 'S':
    				// default control point
    				var cx = x;
    				var cy = y;
    				if (prev == 'C' || prev == 'S') {
    					cx += cx - bezierX; // reflect the previous command's control
    					cy += cy - bezierY; // point relative to the current point
    				}
    				seg = ['C', cx, cy, seg[1], seg[2], seg[3], seg[4]];
    				break
    			case 'T':
    				if (prev == 'Q' || prev == 'T') {
    					quadX = x * 2 - quadX; // as with 'S' reflect previous control point
    					quadY = y * 2 - quadY;
    				} else {
    					quadX = x;
    					quadY = y;
    				}
    				seg = quadratic(x, y, quadX, quadY, seg[1], seg[2]);
    				break
    			case 'Q':
    				quadX = seg[1];
    				quadY = seg[2];
    				seg = quadratic(x, y, seg[1], seg[2], seg[3], seg[4]);
    				break
    			case 'L':
    				seg = line$1(x, y, seg[1], seg[2]);
    				break
    			case 'H':
    				seg = line$1(x, y, seg[1], y);
    				break
    			case 'V':
    				seg = line$1(x, y, x, seg[1]);
    				break
    			case 'Z':
    				seg = line$1(x, y, startX, startY);
    				break
    		}

    		// update state
    		prev = command;
    		x = seg[seg.length - 2];
    		y = seg[seg.length - 1];
    		if (seg.length > 4) {
    			bezierX = seg[seg.length - 4];
    			bezierY = seg[seg.length - 3];
    		} else {
    			bezierX = x;
    			bezierY = y;
    		}
    		result.push(seg);
    	}

    	return result
    }

    function line$1(x1, y1, x2, y2){
    	return ['C', x1, y1, x2, y2, x2, y2]
    }

    function quadratic(x1, y1, cx, cy, x2, y2){
    	return [
    		'C',
    		x1/3 + (2/3) * cx,
    		y1/3 + (2/3) * cy,
    		x2/3 + (2/3) * cx,
    		y2/3 + (2/3) * cy,
    		x2,
    		y2
    	]
    }

    // This function is ripped from 
    // github.com/DmitryBaranovskiy/raphael/blob/4d97d4/raphael.js#L2216-L2304 
    // which references w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
    // TODO: make it human readable

    function arc$2(x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
    	if (!recursive) {
    		var xy = rotate(x1, y1, -angle);
    		x1 = xy.x;
    		y1 = xy.y;
    		xy = rotate(x2, y2, -angle);
    		x2 = xy.x;
    		y2 = xy.y;
    		var x = (x1 - x2) / 2;
    		var y = (y1 - y2) / 2;
    		var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
    		if (h > 1) {
    			h = Math.sqrt(h);
    			rx = h * rx;
    			ry = h * ry;
    		}
    		var rx2 = rx * rx;
    		var ry2 = ry * ry;
    		var k = (large_arc_flag == sweep_flag ? -1 : 1)
    			* Math.sqrt(Math.abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x)));
    		if (k == Infinity) k = 1; // neutralize
    		var cx = k * rx * y / ry + (x1 + x2) / 2;
    		var cy = k * -ry * x / rx + (y1 + y2) / 2;
    		var f1 = Math.asin(((y1 - cy) / ry).toFixed(9));
    		var f2 = Math.asin(((y2 - cy) / ry).toFixed(9));

    		f1 = x1 < cx ? π - f1 : f1;
    		f2 = x2 < cx ? π - f2 : f2;
    		if (f1 < 0) f1 = π * 2 + f1;
    		if (f2 < 0) f2 = π * 2 + f2;
    		if (sweep_flag && f1 > f2) f1 = f1 - π * 2;
    		if (!sweep_flag && f2 > f1) f2 = f2 - π * 2;
    	} else {
    		f1 = recursive[0];
    		f2 = recursive[1];
    		cx = recursive[2];
    		cy = recursive[3];
    	}
    	// greater than 120 degrees requires multiple segments
    	if (Math.abs(f2 - f1) > _120) {
    		var f2old = f2;
    		var x2old = x2;
    		var y2old = y2;
    		f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
    		x2 = cx + rx * Math.cos(f2);
    		y2 = cy + ry * Math.sin(f2);
    		var res = arc$2(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
    	}
    	var t = Math.tan((f2 - f1) / 4);
    	var hx = 4 / 3 * rx * t;
    	var hy = 4 / 3 * ry * t;
    	var curve = [
    		2 * x1 - (x1 + hx * Math.sin(f1)),
    		2 * y1 - (y1 - hy * Math.cos(f1)),
    		x2 + hx * Math.sin(f2),
    		y2 - hy * Math.cos(f2),
    		x2,
    		y2
    	];
    	if (recursive) return curve
    	if (res) curve = curve.concat(res);
    	for (var i = 0; i < curve.length;) {
    		var rot = rotate(curve[i], curve[i+1], angle);
    		curve[i++] = rot.x;
    		curve[i++] = rot.y;
    	}
    	return curve
    }

    function rotate(x, y, rad){
    	return {
    		x: x * Math.cos(rad) - y * Math.sin(rad),
    		y: x * Math.sin(rad) + y * Math.cos(rad)
    	}
    }

    function radians(degress){
    	return degress * (π / 180)
    }

    var vec2Copy = function vec2Copy(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        return out
    };

    var bezier = adaptiveBezierCurve;
    var abs$1 = absSvgPath;
    var norm = normalizeSvgPath;
    var copy$1 = vec2Copy;

    function set(out, x, y) {
        out[0] = x;
        out[1] = y;
        return out
    }

    var tmp1 = [0,0],
        tmp2 = [0,0],
        tmp3 = [0,0];

    function bezierTo(points, scale, start, seg) {
        bezier(start, 
            set(tmp1, seg[1], seg[2]), 
            set(tmp2, seg[3], seg[4]),
            set(tmp3, seg[5], seg[6]), scale, points);
    }

    var svgPathContours = function contours(svg, scale) {
        var paths = [];

        var points = [];
        var pen = [0, 0];
        norm(abs$1(svg)).forEach(function(segment, i, self) {
            if (segment[0] === 'M') {
                copy$1(pen, segment.slice(1));
                if (points.length>0) {
                    paths.push(points);
                    points = [];
                }
            } else if (segment[0] === 'C') {
                bezierTo(points, scale, pen, segment);
                set(pen, segment[5], segment[6]);
            } else {
                throw new Error('illegal type in SVG: '+segment[0])
            }
        });
        if (points.length>0)
            paths.push(points);
        return paths
    };

    var contours = /*@__PURE__*/getDefaultExportFromCjs(svgPathContours);

    /*
    ** SGI FREE SOFTWARE LICENSE B (Version 2.0, Sept. 18, 2008) 
    ** Copyright (C) [dates of first publication] Silicon Graphics, Inc.
    ** All Rights Reserved.
    **
    ** Permission is hereby granted, free of charge, to any person obtaining a copy
    ** of this software and associated documentation files (the "Software"), to deal
    ** in the Software without restriction, including without limitation the rights
    ** to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
    ** of the Software, and to permit persons to whom the Software is furnished to do so,
    ** subject to the following conditions:
    ** 
    ** The above copyright notice including the dates of first publication and either this
    ** permission notice or a reference to http://oss.sgi.com/projects/FreeB/ shall be
    ** included in all copies or substantial portions of the Software. 
    **
    ** THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
    ** INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
    ** PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL SILICON GRAPHICS, INC.
    ** BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
    ** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
    ** OR OTHER DEALINGS IN THE SOFTWARE.
    ** 
    ** Except as contained in this notice, the name of Silicon Graphics, Inc. shall not
    ** be used in advertising or otherwise to promote the sale, use or other dealings in
    ** this Software without prior written authorization from Silicon Graphics, Inc.
    */

    	/* Public API */

    	var Tess2$1 = {};

    	var tess2$1 = Tess2$1;
    	
    	Tess2$1.WINDING_ODD = 0;
    	Tess2$1.WINDING_NONZERO = 1;
    	Tess2$1.WINDING_POSITIVE = 2;
    	Tess2$1.WINDING_NEGATIVE = 3;
    	Tess2$1.WINDING_ABS_GEQ_TWO = 4;

    	Tess2$1.POLYGONS = 0;
    	Tess2$1.CONNECTED_POLYGONS = 1;
    	Tess2$1.BOUNDARY_CONTOURS = 2;

    	Tess2$1.tesselate = function(opts) {
    		var debug =  opts.debug || false;
    		var tess = new Tesselator();
    		for (var i = 0; i < opts.contours.length; i++) {
    			tess.addContour(opts.vertexSize || 2, opts.contours[i]);
    		}
    		tess.tesselate(opts.windingRule || Tess2$1.WINDING_ODD,
    					   opts.elementType || Tess2$1.POLYGONS,
    					   opts.polySize || 3,
    					   opts.vertexSize || 2,
    					   opts.normal || [0,0,1]);
    		return {
    			vertices: tess.vertices,
    			vertexIndices: tess.vertexIndices,
    			vertexCount: tess.vertexCount,
    			elements: tess.elements,
    			elementCount: tess.elementCount,
    			mesh: debug ? tess.mesh : undefined
    		};
    	};

    	/* Internal */

    	var assert = function(cond) {
    		if (!cond) {
    			throw "Assertion Failed!";
    		}
    	};

    	/* The mesh structure is similar in spirit, notation, and operations
    	* to the "quad-edge" structure (see L. Guibas and J. Stolfi, Primitives
    	* for the manipulation of general subdivisions and the computation of
    	* Voronoi diagrams, ACM Transactions on Graphics, 4(2):74-123, April 1985).
    	* For a simplified description, see the course notes for CS348a,
    	* "Mathematical Foundations of Computer Graphics", available at the
    	* Stanford bookstore (and taught during the fall quarter).
    	* The implementation also borrows a tiny subset of the graph-based approach
    	* use in Mantyla's Geometric Work Bench (see M. Mantyla, An Introduction
    	* to Sold Modeling, Computer Science Press, Rockville, Maryland, 1988).
    	*
    	* The fundamental data structure is the "half-edge".  Two half-edges
    	* go together to make an edge, but they point in opposite directions.
    	* Each half-edge has a pointer to its mate (the "symmetric" half-edge Sym),
    	* its origin vertex (Org), the face on its left side (Lface), and the
    	* adjacent half-edges in the CCW direction around the origin vertex
    	* (Onext) and around the left face (Lnext).  There is also a "next"
    	* pointer for the global edge list (see below).
    	*
    	* The notation used for mesh navigation:
    	*  Sym   = the mate of a half-edge (same edge, but opposite direction)
    	*  Onext = edge CCW around origin vertex (keep same origin)
    	*  Dnext = edge CCW around destination vertex (keep same dest)
    	*  Lnext = edge CCW around left face (dest becomes new origin)
    	*  Rnext = edge CCW around right face (origin becomes new dest)
    	*
    	* "prev" means to substitute CW for CCW in the definitions above.
    	*
    	* The mesh keeps global lists of all vertices, faces, and edges,
    	* stored as doubly-linked circular lists with a dummy header node.
    	* The mesh stores pointers to these dummy headers (vHead, fHead, eHead).
    	*
    	* The circular edge list is special; since half-edges always occur
    	* in pairs (e and e->Sym), each half-edge stores a pointer in only
    	* one direction.  Starting at eHead and following the e->next pointers
    	* will visit each *edge* once (ie. e or e->Sym, but not both).
    	* e->Sym stores a pointer in the opposite direction, thus it is
    	* always true that e->Sym->next->Sym->next == e.
    	*
    	* Each vertex has a pointer to next and previous vertices in the
    	* circular list, and a pointer to a half-edge with this vertex as
    	* the origin (NULL if this is the dummy header).  There is also a
    	* field "data" for client data.
    	*
    	* Each face has a pointer to the next and previous faces in the
    	* circular list, and a pointer to a half-edge with this face as
    	* the left face (NULL if this is the dummy header).  There is also
    	* a field "data" for client data.
    	*
    	* Note that what we call a "face" is really a loop; faces may consist
    	* of more than one loop (ie. not simply connected), but there is no
    	* record of this in the data structure.  The mesh may consist of
    	* several disconnected regions, so it may not be possible to visit
    	* the entire mesh by starting at a half-edge and traversing the edge
    	* structure.
    	*
    	* The mesh does NOT support isolated vertices; a vertex is deleted along
    	* with its last edge.  Similarly when two faces are merged, one of the
    	* faces is deleted (see tessMeshDelete below).  For mesh operations,
    	* all face (loop) and vertex pointers must not be NULL.  However, once
    	* mesh manipulation is finished, TESSmeshZapFace can be used to delete
    	* faces of the mesh, one at a time.  All external faces can be "zapped"
    	* before the mesh is returned to the client; then a NULL face indicates
    	* a region which is not part of the output polygon.
    	*/

    	function TESSvertex() {
    		this.next = null;	/* next vertex (never NULL) */
    		this.prev = null;	/* previous vertex (never NULL) */
    		this.anEdge = null;	/* a half-edge with this origin */

    		/* Internal data (keep hidden) */
    		this.coords = [0,0,0];	/* vertex location in 3D */
    		this.s = 0.0;
    		this.t = 0.0;			/* projection onto the sweep plane */
    		this.pqHandle = 0;		/* to allow deletion from priority queue */
    		this.n = 0;				/* to allow identify unique vertices */
    		this.idx = 0;			/* to allow map result to original verts */
    	} 

    	function TESSface() {
    		this.next = null;		/* next face (never NULL) */
    		this.prev = null;		/* previous face (never NULL) */
    		this.anEdge = null;		/* a half edge with this left face */

    		/* Internal data (keep hidden) */
    		this.trail = null;		/* "stack" for conversion to strips */
    		this.n = 0;				/* to allow identiy unique faces */
    		this.marked = false;	/* flag for conversion to strips */
    		this.inside = false;	/* this face is in the polygon interior */
    	}
    	function TESShalfEdge(side) {
    		this.next = null;		/* doubly-linked list (prev==Sym->next) */
    		this.Sym = null;		/* same edge, opposite direction */
    		this.Onext = null;		/* next edge CCW around origin */
    		this.Lnext = null;		/* next edge CCW around left face */
    		this.Org = null;		/* origin vertex (Overtex too long) */
    		this.Lface = null;		/* left face */

    		/* Internal data (keep hidden) */
    		this.activeRegion = null;	/* a region with this upper edge (sweep.c) */
    		this.winding = 0;			/* change in winding number when crossing
    									   from the right face to the left face */
    		this.side = side;
    	}
    	TESShalfEdge.prototype = {
    		get Rface() { return this.Sym.Lface; },
    		set Rface(v) { this.Sym.Lface = v; },
    		get Dst() { return this.Sym.Org; },
    		set Dst(v) { this.Sym.Org = v; },
    		get Oprev() { return this.Sym.Lnext; },
    		set Oprev(v) { this.Sym.Lnext = v; },
    		get Lprev() { return this.Onext.Sym; },
    		set Lprev(v) { this.Onext.Sym = v; },
    		get Dprev() { return this.Lnext.Sym; },
    		set Dprev(v) { this.Lnext.Sym = v; },
    		get Rprev() { return this.Sym.Onext; },
    		set Rprev(v) { this.Sym.Onext = v; },
    		get Dnext() { return /*this.Rprev*/this.Sym.Onext.Sym; },  /* 3 pointers */
    		set Dnext(v) { /*this.Rprev*/this.Sym.Onext.Sym = v; },  /* 3 pointers */
    		get Rnext() { return /*this.Oprev*/this.Sym.Lnext.Sym; },  /* 3 pointers */
    		set Rnext(v) { /*this.Oprev*/this.Sym.Lnext.Sym = v; },  /* 3 pointers */
    	};



    	function TESSmesh() {
    		var v = new TESSvertex();
    		var f = new TESSface();
    		var e = new TESShalfEdge(0);
    		var eSym = new TESShalfEdge(1);

    		v.next = v.prev = v;
    		v.anEdge = null;

    		f.next = f.prev = f;
    		f.anEdge = null;
    		f.trail = null;
    		f.marked = false;
    		f.inside = false;

    		e.next = e;
    		e.Sym = eSym;
    		e.Onext = null;
    		e.Lnext = null;
    		e.Org = null;
    		e.Lface = null;
    		e.winding = 0;
    		e.activeRegion = null;

    		eSym.next = eSym;
    		eSym.Sym = e;
    		eSym.Onext = null;
    		eSym.Lnext = null;
    		eSym.Org = null;
    		eSym.Lface = null;
    		eSym.winding = 0;
    		eSym.activeRegion = null;

    		this.vHead = v;		/* dummy header for vertex list */
    		this.fHead = f;		/* dummy header for face list */
    		this.eHead = e;		/* dummy header for edge list */
    		this.eHeadSym = eSym;	/* and its symmetric counterpart */
    	}
    	/* The mesh operations below have three motivations: completeness,
    	* convenience, and efficiency.  The basic mesh operations are MakeEdge,
    	* Splice, and Delete.  All the other edge operations can be implemented
    	* in terms of these.  The other operations are provided for convenience
    	* and/or efficiency.
    	*
    	* When a face is split or a vertex is added, they are inserted into the
    	* global list *before* the existing vertex or face (ie. e->Org or e->Lface).
    	* This makes it easier to process all vertices or faces in the global lists
    	* without worrying about processing the same data twice.  As a convenience,
    	* when a face is split, the "inside" flag is copied from the old face.
    	* Other internal data (v->data, v->activeRegion, f->data, f->marked,
    	* f->trail, e->winding) is set to zero.
    	*
    	* ********************** Basic Edge Operations **************************
    	*
    	* tessMeshMakeEdge( mesh ) creates one edge, two vertices, and a loop.
    	* The loop (face) consists of the two new half-edges.
    	*
    	* tessMeshSplice( eOrg, eDst ) is the basic operation for changing the
    	* mesh connectivity and topology.  It changes the mesh so that
    	*  eOrg->Onext <- OLD( eDst->Onext )
    	*  eDst->Onext <- OLD( eOrg->Onext )
    	* where OLD(...) means the value before the meshSplice operation.
    	*
    	* This can have two effects on the vertex structure:
    	*  - if eOrg->Org != eDst->Org, the two vertices are merged together
    	*  - if eOrg->Org == eDst->Org, the origin is split into two vertices
    	* In both cases, eDst->Org is changed and eOrg->Org is untouched.
    	*
    	* Similarly (and independently) for the face structure,
    	*  - if eOrg->Lface == eDst->Lface, one loop is split into two
    	*  - if eOrg->Lface != eDst->Lface, two distinct loops are joined into one
    	* In both cases, eDst->Lface is changed and eOrg->Lface is unaffected.
    	*
    	* tessMeshDelete( eDel ) removes the edge eDel.  There are several cases:
    	* if (eDel->Lface != eDel->Rface), we join two loops into one; the loop
    	* eDel->Lface is deleted.  Otherwise, we are splitting one loop into two;
    	* the newly created loop will contain eDel->Dst.  If the deletion of eDel
    	* would create isolated vertices, those are deleted as well.
    	*
    	* ********************** Other Edge Operations **************************
    	*
    	* tessMeshAddEdgeVertex( eOrg ) creates a new edge eNew such that
    	* eNew == eOrg->Lnext, and eNew->Dst is a newly created vertex.
    	* eOrg and eNew will have the same left face.
    	*
    	* tessMeshSplitEdge( eOrg ) splits eOrg into two edges eOrg and eNew,
    	* such that eNew == eOrg->Lnext.  The new vertex is eOrg->Dst == eNew->Org.
    	* eOrg and eNew will have the same left face.
    	*
    	* tessMeshConnect( eOrg, eDst ) creates a new edge from eOrg->Dst
    	* to eDst->Org, and returns the corresponding half-edge eNew.
    	* If eOrg->Lface == eDst->Lface, this splits one loop into two,
    	* and the newly created loop is eNew->Lface.  Otherwise, two disjoint
    	* loops are merged into one, and the loop eDst->Lface is destroyed.
    	*
    	* ************************ Other Operations *****************************
    	*
    	* tessMeshNewMesh() creates a new mesh with no edges, no vertices,
    	* and no loops (what we usually call a "face").
    	*
    	* tessMeshUnion( mesh1, mesh2 ) forms the union of all structures in
    	* both meshes, and returns the new mesh (the old meshes are destroyed).
    	*
    	* tessMeshDeleteMesh( mesh ) will free all storage for any valid mesh.
    	*
    	* tessMeshZapFace( fZap ) destroys a face and removes it from the
    	* global face list.  All edges of fZap will have a NULL pointer as their
    	* left face.  Any edges which also have a NULL pointer as their right face
    	* are deleted entirely (along with any isolated vertices this produces).
    	* An entire mesh can be deleted by zapping its faces, one at a time,
    	* in any order.  Zapped faces cannot be used in further mesh operations!
    	*
    	* tessMeshCheckMesh( mesh ) checks a mesh for self-consistency.
    	*/

    	TESSmesh.prototype = {

    		/* MakeEdge creates a new pair of half-edges which form their own loop.
    		* No vertex or face structures are allocated, but these must be assigned
    		* before the current edge operation is completed.
    		*/
    		//static TESShalfEdge *MakeEdge( TESSmesh* mesh, TESShalfEdge *eNext )
    		makeEdge_: function(eNext) {
    			var e = new TESShalfEdge(0);
    			var eSym = new TESShalfEdge(1);

    			/* Make sure eNext points to the first edge of the edge pair */
    			if( eNext.Sym.side < eNext.side ) { eNext = eNext.Sym; }

    			/* Insert in circular doubly-linked list before eNext.
    			* Note that the prev pointer is stored in Sym->next.
    			*/
    			var ePrev = eNext.Sym.next;
    			eSym.next = ePrev;
    			ePrev.Sym.next = e;
    			e.next = eNext;
    			eNext.Sym.next = eSym;

    			e.Sym = eSym;
    			e.Onext = e;
    			e.Lnext = eSym;
    			e.Org = null;
    			e.Lface = null;
    			e.winding = 0;
    			e.activeRegion = null;

    			eSym.Sym = e;
    			eSym.Onext = eSym;
    			eSym.Lnext = e;
    			eSym.Org = null;
    			eSym.Lface = null;
    			eSym.winding = 0;
    			eSym.activeRegion = null;

    			return e;
    		},

    		/* Splice( a, b ) is best described by the Guibas/Stolfi paper or the
    		* CS348a notes (see mesh.h).  Basically it modifies the mesh so that
    		* a->Onext and b->Onext are exchanged.  This can have various effects
    		* depending on whether a and b belong to different face or vertex rings.
    		* For more explanation see tessMeshSplice() below.
    		*/
    		// static void Splice( TESShalfEdge *a, TESShalfEdge *b )
    		splice_: function(a, b) {
    			var aOnext = a.Onext;
    			var bOnext = b.Onext;
    			aOnext.Sym.Lnext = b;
    			bOnext.Sym.Lnext = a;
    			a.Onext = bOnext;
    			b.Onext = aOnext;
    		},

    		/* MakeVertex( newVertex, eOrig, vNext ) attaches a new vertex and makes it the
    		* origin of all edges in the vertex loop to which eOrig belongs. "vNext" gives
    		* a place to insert the new vertex in the global vertex list.  We insert
    		* the new vertex *before* vNext so that algorithms which walk the vertex
    		* list will not see the newly created vertices.
    		*/
    		//static void MakeVertex( TESSvertex *newVertex, TESShalfEdge *eOrig, TESSvertex *vNext )
    		makeVertex_: function(newVertex, eOrig, vNext) {
    			var vNew = newVertex;
    			assert(vNew !== null);

    			/* insert in circular doubly-linked list before vNext */
    			var vPrev = vNext.prev;
    			vNew.prev = vPrev;
    			vPrev.next = vNew;
    			vNew.next = vNext;
    			vNext.prev = vNew;

    			vNew.anEdge = eOrig;
    			/* leave coords, s, t undefined */

    			/* fix other edges on this vertex loop */
    			var e = eOrig;
    			do {
    				e.Org = vNew;
    				e = e.Onext;
    			} while(e !== eOrig);
    		},

    		/* MakeFace( newFace, eOrig, fNext ) attaches a new face and makes it the left
    		* face of all edges in the face loop to which eOrig belongs.  "fNext" gives
    		* a place to insert the new face in the global face list.  We insert
    		* the new face *before* fNext so that algorithms which walk the face
    		* list will not see the newly created faces.
    		*/
    		// static void MakeFace( TESSface *newFace, TESShalfEdge *eOrig, TESSface *fNext )
    		makeFace_: function(newFace, eOrig, fNext) {
    			var fNew = newFace;
    			assert(fNew !== null); 

    			/* insert in circular doubly-linked list before fNext */
    			var fPrev = fNext.prev;
    			fNew.prev = fPrev;
    			fPrev.next = fNew;
    			fNew.next = fNext;
    			fNext.prev = fNew;

    			fNew.anEdge = eOrig;
    			fNew.trail = null;
    			fNew.marked = false;

    			/* The new face is marked "inside" if the old one was.  This is a
    			* convenience for the common case where a face has been split in two.
    			*/
    			fNew.inside = fNext.inside;

    			/* fix other edges on this face loop */
    			var e = eOrig;
    			do {
    				e.Lface = fNew;
    				e = e.Lnext;
    			} while(e !== eOrig);
    		},

    		/* KillEdge( eDel ) destroys an edge (the half-edges eDel and eDel->Sym),
    		* and removes from the global edge list.
    		*/
    		//static void KillEdge( TESSmesh *mesh, TESShalfEdge *eDel )
    		killEdge_: function(eDel) {
    			/* Half-edges are allocated in pairs, see EdgePair above */
    			if( eDel.Sym.side < eDel.side ) { eDel = eDel.Sym; }

    			/* delete from circular doubly-linked list */
    			var eNext = eDel.next;
    			var ePrev = eDel.Sym.next;
    			eNext.Sym.next = ePrev;
    			ePrev.Sym.next = eNext;
    		},


    		/* KillVertex( vDel ) destroys a vertex and removes it from the global
    		* vertex list.  It updates the vertex loop to point to a given new vertex.
    		*/
    		//static void KillVertex( TESSmesh *mesh, TESSvertex *vDel, TESSvertex *newOrg )
    		killVertex_: function(vDel, newOrg) {
    			var eStart = vDel.anEdge;
    			/* change the origin of all affected edges */
    			var e = eStart;
    			do {
    				e.Org = newOrg;
    				e = e.Onext;
    			} while(e !== eStart);

    			/* delete from circular doubly-linked list */
    			var vPrev = vDel.prev;
    			var vNext = vDel.next;
    			vNext.prev = vPrev;
    			vPrev.next = vNext;
    		},

    		/* KillFace( fDel ) destroys a face and removes it from the global face
    		* list.  It updates the face loop to point to a given new face.
    		*/
    		//static void KillFace( TESSmesh *mesh, TESSface *fDel, TESSface *newLface )
    		killFace_: function(fDel, newLface) {
    			var eStart = fDel.anEdge;

    			/* change the left face of all affected edges */
    			var e = eStart;
    			do {
    				e.Lface = newLface;
    				e = e.Lnext;
    			} while(e !== eStart);

    			/* delete from circular doubly-linked list */
    			var fPrev = fDel.prev;
    			var fNext = fDel.next;
    			fNext.prev = fPrev;
    			fPrev.next = fNext;
    		},

    		/****************** Basic Edge Operations **********************/

    		/* tessMeshMakeEdge creates one edge, two vertices, and a loop (face).
    		* The loop consists of the two new half-edges.
    		*/
    		//TESShalfEdge *tessMeshMakeEdge( TESSmesh *mesh )
    		makeEdge: function() {
    			var newVertex1 = new TESSvertex();
    			var newVertex2 = new TESSvertex();
    			var newFace = new TESSface();
    			var e = this.makeEdge_( this.eHead);
    			this.makeVertex_( newVertex1, e, this.vHead );
    			this.makeVertex_( newVertex2, e.Sym, this.vHead );
    			this.makeFace_( newFace, e, this.fHead );
    			return e;
    		},

    		/* tessMeshSplice( eOrg, eDst ) is the basic operation for changing the
    		* mesh connectivity and topology.  It changes the mesh so that
    		*	eOrg->Onext <- OLD( eDst->Onext )
    		*	eDst->Onext <- OLD( eOrg->Onext )
    		* where OLD(...) means the value before the meshSplice operation.
    		*
    		* This can have two effects on the vertex structure:
    		*  - if eOrg->Org != eDst->Org, the two vertices are merged together
    		*  - if eOrg->Org == eDst->Org, the origin is split into two vertices
    		* In both cases, eDst->Org is changed and eOrg->Org is untouched.
    		*
    		* Similarly (and independently) for the face structure,
    		*  - if eOrg->Lface == eDst->Lface, one loop is split into two
    		*  - if eOrg->Lface != eDst->Lface, two distinct loops are joined into one
    		* In both cases, eDst->Lface is changed and eOrg->Lface is unaffected.
    		*
    		* Some special cases:
    		* If eDst == eOrg, the operation has no effect.
    		* If eDst == eOrg->Lnext, the new face will have a single edge.
    		* If eDst == eOrg->Lprev, the old face will have a single edge.
    		* If eDst == eOrg->Onext, the new vertex will have a single edge.
    		* If eDst == eOrg->Oprev, the old vertex will have a single edge.
    		*/
    		//int tessMeshSplice( TESSmesh* mesh, TESShalfEdge *eOrg, TESShalfEdge *eDst )
    		splice: function(eOrg, eDst) {
    			var joiningLoops = false;
    			var joiningVertices = false;

    			if( eOrg === eDst ) return;

    			if( eDst.Org !== eOrg.Org ) {
    				/* We are merging two disjoint vertices -- destroy eDst->Org */
    				joiningVertices = true;
    				this.killVertex_( eDst.Org, eOrg.Org );
    			}
    			if( eDst.Lface !== eOrg.Lface ) {
    				/* We are connecting two disjoint loops -- destroy eDst->Lface */
    				joiningLoops = true;
    				this.killFace_( eDst.Lface, eOrg.Lface );
    			}

    			/* Change the edge structure */
    			this.splice_( eDst, eOrg );

    			if( ! joiningVertices ) {
    				var newVertex = new TESSvertex();

    				/* We split one vertex into two -- the new vertex is eDst->Org.
    				* Make sure the old vertex points to a valid half-edge.
    				*/
    				this.makeVertex_( newVertex, eDst, eOrg.Org );
    				eOrg.Org.anEdge = eOrg;
    			}
    			if( ! joiningLoops ) {
    				var newFace = new TESSface();  

    				/* We split one loop into two -- the new loop is eDst->Lface.
    				* Make sure the old face points to a valid half-edge.
    				*/
    				this.makeFace_( newFace, eDst, eOrg.Lface );
    				eOrg.Lface.anEdge = eOrg;
    			}
    		},

    		/* tessMeshDelete( eDel ) removes the edge eDel.  There are several cases:
    		* if (eDel->Lface != eDel->Rface), we join two loops into one; the loop
    		* eDel->Lface is deleted.  Otherwise, we are splitting one loop into two;
    		* the newly created loop will contain eDel->Dst.  If the deletion of eDel
    		* would create isolated vertices, those are deleted as well.
    		*
    		* This function could be implemented as two calls to tessMeshSplice
    		* plus a few calls to memFree, but this would allocate and delete
    		* unnecessary vertices and faces.
    		*/
    		//int tessMeshDelete( TESSmesh *mesh, TESShalfEdge *eDel )
    		delete: function(eDel) {
    			var eDelSym = eDel.Sym;
    			var joiningLoops = false;

    			/* First step: disconnect the origin vertex eDel->Org.  We make all
    			* changes to get a consistent mesh in this "intermediate" state.
    			*/
    			if( eDel.Lface !== eDel.Rface ) {
    				/* We are joining two loops into one -- remove the left face */
    				joiningLoops = true;
    				this.killFace_( eDel.Lface, eDel.Rface );
    			}

    			if( eDel.Onext === eDel ) {
    				this.killVertex_( eDel.Org, null );
    			} else {
    				/* Make sure that eDel->Org and eDel->Rface point to valid half-edges */
    				eDel.Rface.anEdge = eDel.Oprev;
    				eDel.Org.anEdge = eDel.Onext;

    				this.splice_( eDel, eDel.Oprev );
    				if( ! joiningLoops ) {
    					var newFace = new TESSface();

    					/* We are splitting one loop into two -- create a new loop for eDel. */
    					this.makeFace_( newFace, eDel, eDel.Lface );
    				}
    			}

    			/* Claim: the mesh is now in a consistent state, except that eDel->Org
    			* may have been deleted.  Now we disconnect eDel->Dst.
    			*/
    			if( eDelSym.Onext === eDelSym ) {
    				this.killVertex_( eDelSym.Org, null );
    				this.killFace_( eDelSym.Lface, null );
    			} else {
    				/* Make sure that eDel->Dst and eDel->Lface point to valid half-edges */
    				eDel.Lface.anEdge = eDelSym.Oprev;
    				eDelSym.Org.anEdge = eDelSym.Onext;
    				this.splice_( eDelSym, eDelSym.Oprev );
    			}

    			/* Any isolated vertices or faces have already been freed. */
    			this.killEdge_( eDel );
    		},

    		/******************** Other Edge Operations **********************/

    		/* All these routines can be implemented with the basic edge
    		* operations above.  They are provided for convenience and efficiency.
    		*/


    		/* tessMeshAddEdgeVertex( eOrg ) creates a new edge eNew such that
    		* eNew == eOrg->Lnext, and eNew->Dst is a newly created vertex.
    		* eOrg and eNew will have the same left face.
    		*/
    		// TESShalfEdge *tessMeshAddEdgeVertex( TESSmesh *mesh, TESShalfEdge *eOrg );
    		addEdgeVertex: function(eOrg) {
    			var eNew = this.makeEdge_( eOrg );
    			var eNewSym = eNew.Sym;

    			/* Connect the new edge appropriately */
    			this.splice_( eNew, eOrg.Lnext );

    			/* Set the vertex and face information */
    			eNew.Org = eOrg.Dst;

    			var newVertex = new TESSvertex();
    			this.makeVertex_( newVertex, eNewSym, eNew.Org );

    			eNew.Lface = eNewSym.Lface = eOrg.Lface;

    			return eNew;
    		},


    		/* tessMeshSplitEdge( eOrg ) splits eOrg into two edges eOrg and eNew,
    		* such that eNew == eOrg->Lnext.  The new vertex is eOrg->Dst == eNew->Org.
    		* eOrg and eNew will have the same left face.
    		*/
    		// TESShalfEdge *tessMeshSplitEdge( TESSmesh *mesh, TESShalfEdge *eOrg );
    		splitEdge: function(eOrg, eDst) {
    			var tempHalfEdge = this.addEdgeVertex( eOrg );
    			var eNew = tempHalfEdge.Sym;

    			/* Disconnect eOrg from eOrg->Dst and connect it to eNew->Org */
    			this.splice_( eOrg.Sym, eOrg.Sym.Oprev );
    			this.splice_( eOrg.Sym, eNew );

    			/* Set the vertex and face information */
    			eOrg.Dst = eNew.Org;
    			eNew.Dst.anEdge = eNew.Sym;	/* may have pointed to eOrg->Sym */
    			eNew.Rface = eOrg.Rface;
    			eNew.winding = eOrg.winding;	/* copy old winding information */
    			eNew.Sym.winding = eOrg.Sym.winding;

    			return eNew;
    		},


    		/* tessMeshConnect( eOrg, eDst ) creates a new edge from eOrg->Dst
    		* to eDst->Org, and returns the corresponding half-edge eNew.
    		* If eOrg->Lface == eDst->Lface, this splits one loop into two,
    		* and the newly created loop is eNew->Lface.  Otherwise, two disjoint
    		* loops are merged into one, and the loop eDst->Lface is destroyed.
    		*
    		* If (eOrg == eDst), the new face will have only two edges.
    		* If (eOrg->Lnext == eDst), the old face is reduced to a single edge.
    		* If (eOrg->Lnext->Lnext == eDst), the old face is reduced to two edges.
    		*/

    		// TESShalfEdge *tessMeshConnect( TESSmesh *mesh, TESShalfEdge *eOrg, TESShalfEdge *eDst );
    		connect: function(eOrg, eDst) {
    			var joiningLoops = false;  
    			var eNew = this.makeEdge_( eOrg );
    			var eNewSym = eNew.Sym;

    			if( eDst.Lface !== eOrg.Lface ) {
    				/* We are connecting two disjoint loops -- destroy eDst->Lface */
    				joiningLoops = true;
    				this.killFace_( eDst.Lface, eOrg.Lface );
    			}

    			/* Connect the new edge appropriately */
    			this.splice_( eNew, eOrg.Lnext );
    			this.splice_( eNewSym, eDst );

    			/* Set the vertex and face information */
    			eNew.Org = eOrg.Dst;
    			eNewSym.Org = eDst.Org;
    			eNew.Lface = eNewSym.Lface = eOrg.Lface;

    			/* Make sure the old face points to a valid half-edge */
    			eOrg.Lface.anEdge = eNewSym;

    			if( ! joiningLoops ) {
    				var newFace = new TESSface();
    				/* We split one loop into two -- the new loop is eNew->Lface */
    				this.makeFace_( newFace, eNew, eOrg.Lface );
    			}
    			return eNew;
    		},

    		/* tessMeshZapFace( fZap ) destroys a face and removes it from the
    		* global face list.  All edges of fZap will have a NULL pointer as their
    		* left face.  Any edges which also have a NULL pointer as their right face
    		* are deleted entirely (along with any isolated vertices this produces).
    		* An entire mesh can be deleted by zapping its faces, one at a time,
    		* in any order.  Zapped faces cannot be used in further mesh operations!
    		*/
    		zapFace: function( fZap )
    		{
    			var eStart = fZap.anEdge;
    			var e, eNext, eSym;
    			var fPrev, fNext;

    			/* walk around face, deleting edges whose right face is also NULL */
    			eNext = eStart.Lnext;
    			do {
    				e = eNext;
    				eNext = e.Lnext;

    				e.Lface = null;
    				if( e.Rface === null ) {
    					/* delete the edge -- see TESSmeshDelete above */

    					if( e.Onext === e ) {
    						this.killVertex_( e.Org, null );
    					} else {
    						/* Make sure that e->Org points to a valid half-edge */
    						e.Org.anEdge = e.Onext;
    						this.splice_( e, e.Oprev );
    					}
    					eSym = e.Sym;
    					if( eSym.Onext === eSym ) {
    						this.killVertex_( eSym.Org, null );
    					} else {
    						/* Make sure that eSym->Org points to a valid half-edge */
    						eSym.Org.anEdge = eSym.Onext;
    						this.splice_( eSym, eSym.Oprev );
    					}
    					this.killEdge_( e );
    				}
    			} while( e != eStart );

    			/* delete from circular doubly-linked list */
    			fPrev = fZap.prev;
    			fNext = fZap.next;
    			fNext.prev = fPrev;
    			fPrev.next = fNext;
    		},

    		countFaceVerts_: function(f) {
    			var eCur = f.anEdge;
    			var n = 0;
    			do
    			{
    				n++;
    				eCur = eCur.Lnext;
    			}
    			while (eCur !== f.anEdge);
    			return n;
    		},

    		//int tessMeshMergeConvexFaces( TESSmesh *mesh, int maxVertsPerFace )
    		mergeConvexFaces: function(maxVertsPerFace) {
    			var f;
    			var eCur, eNext, eSym;
    			var vStart;
    			var curNv, symNv;

    			for( f = this.fHead.next; f !== this.fHead; f = f.next )
    			{
    				// Skip faces which are outside the result.
    				if( !f.inside )
    					continue;

    				eCur = f.anEdge;
    				vStart = eCur.Org;
    					
    				while (true)
    				{
    					eNext = eCur.Lnext;
    					eSym = eCur.Sym;

    					// Try to merge if the neighbour face is valid.
    					if( eSym && eSym.Lface && eSym.Lface.inside )
    					{
    						// Try to merge the neighbour faces if the resulting polygons
    						// does not exceed maximum number of vertices.
    						curNv = this.countFaceVerts_( f );
    						symNv = this.countFaceVerts_( eSym.Lface );
    						if( (curNv+symNv-2) <= maxVertsPerFace )
    						{
    							// Merge if the resulting poly is convex.
    							if( Geom.vertCCW( eCur.Lprev.Org, eCur.Org, eSym.Lnext.Lnext.Org ) &&
    								Geom.vertCCW( eSym.Lprev.Org, eSym.Org, eCur.Lnext.Lnext.Org ) )
    							{
    								eNext = eSym.Lnext;
    								this.delete( eSym );
    								eCur = null;
    								eSym = null;
    							}
    						}
    					}
    					
    					if( eCur && eCur.Lnext.Org === vStart )
    						break;
    						
    					// Continue to next edge.
    					eCur = eNext;
    				}
    			}
    			
    			return true;
    		},

    		/* tessMeshCheckMesh( mesh ) checks a mesh for self-consistency.
    		*/
    		check: function() {
    			var fHead = this.fHead;
    			var vHead = this.vHead;
    			var eHead = this.eHead;
    			var f, fPrev, v, vPrev, e, ePrev;

    			fPrev = fHead;
    			for( fPrev = fHead ; (f = fPrev.next) !== fHead; fPrev = f) {
    				assert( f.prev === fPrev );
    				e = f.anEdge;
    				do {
    					assert( e.Sym !== e );
    					assert( e.Sym.Sym === e );
    					assert( e.Lnext.Onext.Sym === e );
    					assert( e.Onext.Sym.Lnext === e );
    					assert( e.Lface === f );
    					e = e.Lnext;
    				} while( e !== f.anEdge );
    			}
    			assert( f.prev === fPrev && f.anEdge === null );

    			vPrev = vHead;
    			for( vPrev = vHead ; (v = vPrev.next) !== vHead; vPrev = v) {
    				assert( v.prev === vPrev );
    				e = v.anEdge;
    				do {
    					assert( e.Sym !== e );
    					assert( e.Sym.Sym === e );
    					assert( e.Lnext.Onext.Sym === e );
    					assert( e.Onext.Sym.Lnext === e );
    					assert( e.Org === v );
    					e = e.Onext;
    				} while( e !== v.anEdge );
    			}
    			assert( v.prev === vPrev && v.anEdge === null );

    			ePrev = eHead;
    			for( ePrev = eHead ; (e = ePrev.next) !== eHead; ePrev = e) {
    				assert( e.Sym.next === ePrev.Sym );
    				assert( e.Sym !== e );
    				assert( e.Sym.Sym === e );
    				assert( e.Org !== null );
    				assert( e.Dst !== null );
    				assert( e.Lnext.Onext.Sym === e );
    				assert( e.Onext.Sym.Lnext === e );
    			}
    			assert( e.Sym.next === ePrev.Sym
    				&& e.Sym === this.eHeadSym
    				&& e.Sym.Sym === e
    				&& e.Org === null && e.Dst === null
    				&& e.Lface === null && e.Rface === null );
    		}

    	};

    	var Geom = {};

    	Geom.vertEq = function(u,v) {
    		return (u.s === v.s && u.t === v.t);
    	};

    	/* Returns TRUE if u is lexicographically <= v. */
    	Geom.vertLeq = function(u,v) {
    		return ((u.s < v.s) || (u.s === v.s && u.t <= v.t));
    	};

    	/* Versions of VertLeq, EdgeSign, EdgeEval with s and t transposed. */
    	Geom.transLeq = function(u,v) {
    		return ((u.t < v.t) || (u.t === v.t && u.s <= v.s));
    	};

    	Geom.edgeGoesLeft = function(e) {
    		return Geom.vertLeq( e.Dst, e.Org );
    	};

    	Geom.edgeGoesRight = function(e) {
    		return Geom.vertLeq( e.Org, e.Dst );
    	};

    	Geom.vertL1dist = function(u,v) {
    		return (Math.abs(u.s - v.s) + Math.abs(u.t - v.t));
    	};

    	//TESSreal tesedgeEval( TESSvertex *u, TESSvertex *v, TESSvertex *w )
    	Geom.edgeEval = function( u, v, w ) {
    		/* Given three vertices u,v,w such that VertLeq(u,v) && VertLeq(v,w),
    		* evaluates the t-coord of the edge uw at the s-coord of the vertex v.
    		* Returns v->t - (uw)(v->s), ie. the signed distance from uw to v.
    		* If uw is vertical (and thus passes thru v), the result is zero.
    		*
    		* The calculation is extremely accurate and stable, even when v
    		* is very close to u or w.  In particular if we set v->t = 0 and
    		* let r be the negated result (this evaluates (uw)(v->s)), then
    		* r is guaranteed to satisfy MIN(u->t,w->t) <= r <= MAX(u->t,w->t).
    		*/
    		assert( Geom.vertLeq( u, v ) && Geom.vertLeq( v, w ));

    		var gapL = v.s - u.s;
    		var gapR = w.s - v.s;

    		if( gapL + gapR > 0.0 ) {
    			if( gapL < gapR ) {
    				return (v.t - u.t) + (u.t - w.t) * (gapL / (gapL + gapR));
    			} else {
    				return (v.t - w.t) + (w.t - u.t) * (gapR / (gapL + gapR));
    			}
    		}
    		/* vertical line */
    		return 0.0;
    	};

    	//TESSreal tesedgeSign( TESSvertex *u, TESSvertex *v, TESSvertex *w )
    	Geom.edgeSign = function( u, v, w ) {
    		/* Returns a number whose sign matches EdgeEval(u,v,w) but which
    		* is cheaper to evaluate.  Returns > 0, == 0 , or < 0
    		* as v is above, on, or below the edge uw.
    		*/
    		assert( Geom.vertLeq( u, v ) && Geom.vertLeq( v, w ));

    		var gapL = v.s - u.s;
    		var gapR = w.s - v.s;

    		if( gapL + gapR > 0.0 ) {
    			return (v.t - w.t) * gapL + (v.t - u.t) * gapR;
    		}
    		/* vertical line */
    		return 0.0;
    	};


    	/***********************************************************************
    	* Define versions of EdgeSign, EdgeEval with s and t transposed.
    	*/

    	//TESSreal testransEval( TESSvertex *u, TESSvertex *v, TESSvertex *w )
    	Geom.transEval = function( u, v, w ) {
    		/* Given three vertices u,v,w such that TransLeq(u,v) && TransLeq(v,w),
    		* evaluates the t-coord of the edge uw at the s-coord of the vertex v.
    		* Returns v->s - (uw)(v->t), ie. the signed distance from uw to v.
    		* If uw is vertical (and thus passes thru v), the result is zero.
    		*
    		* The calculation is extremely accurate and stable, even when v
    		* is very close to u or w.  In particular if we set v->s = 0 and
    		* let r be the negated result (this evaluates (uw)(v->t)), then
    		* r is guaranteed to satisfy MIN(u->s,w->s) <= r <= MAX(u->s,w->s).
    		*/
    		assert( Geom.transLeq( u, v ) && Geom.transLeq( v, w ));

    		var gapL = v.t - u.t;
    		var gapR = w.t - v.t;

    		if( gapL + gapR > 0.0 ) {
    			if( gapL < gapR ) {
    				return (v.s - u.s) + (u.s - w.s) * (gapL / (gapL + gapR));
    			} else {
    				return (v.s - w.s) + (w.s - u.s) * (gapR / (gapL + gapR));
    			}
    		}
    		/* vertical line */
    		return 0.0;
    	};

    	//TESSreal testransSign( TESSvertex *u, TESSvertex *v, TESSvertex *w )
    	Geom.transSign = function( u, v, w ) {
    		/* Returns a number whose sign matches TransEval(u,v,w) but which
    		* is cheaper to evaluate.  Returns > 0, == 0 , or < 0
    		* as v is above, on, or below the edge uw.
    		*/
    		assert( Geom.transLeq( u, v ) && Geom.transLeq( v, w ));

    		var gapL = v.t - u.t;
    		var gapR = w.t - v.t;

    		if( gapL + gapR > 0.0 ) {
    			return (v.s - w.s) * gapL + (v.s - u.s) * gapR;
    		}
    		/* vertical line */
    		return 0.0;
    	};


    	//int tesvertCCW( TESSvertex *u, TESSvertex *v, TESSvertex *w )
    	Geom.vertCCW = function( u, v, w ) {
    		/* For almost-degenerate situations, the results are not reliable.
    		* Unless the floating-point arithmetic can be performed without
    		* rounding errors, *any* implementation will give incorrect results
    		* on some degenerate inputs, so the client must have some way to
    		* handle this situation.
    		*/
    		return (u.s*(v.t - w.t) + v.s*(w.t - u.t) + w.s*(u.t - v.t)) >= 0.0;
    	};

    	/* Given parameters a,x,b,y returns the value (b*x+a*y)/(a+b),
    	* or (x+y)/2 if a==b==0.  It requires that a,b >= 0, and enforces
    	* this in the rare case that one argument is slightly negative.
    	* The implementation is extremely stable numerically.
    	* In particular it guarantees that the result r satisfies
    	* MIN(x,y) <= r <= MAX(x,y), and the results are very accurate
    	* even when a and b differ greatly in magnitude.
    	*/
    	Geom.interpolate = function(a,x,b,y) {
    		return (a = (a < 0) ? 0 : a, b = (b < 0) ? 0 : b, ((a <= b) ? ((b == 0) ? ((x+y) / 2) : (x + (y-x) * (a/(a+b)))) : (y + (x-y) * (b/(a+b)))));
    	};

    	/*
    	#ifndef FOR_TRITE_TEST_PROGRAM
    	#define Interpolate(a,x,b,y)	RealInterpolate(a,x,b,y)
    	#else

    	// Claim: the ONLY property the sweep algorithm relies on is that
    	// MIN(x,y) <= r <= MAX(x,y).  This is a nasty way to test that.
    	#include <stdlib.h>
    	extern int RandomInterpolate;

    	double Interpolate( double a, double x, double b, double y)
    	{
    		printf("*********************%d\n",RandomInterpolate);
    		if( RandomInterpolate ) {
    			a = 1.2 * drand48() - 0.1;
    			a = (a < 0) ? 0 : ((a > 1) ? 1 : a);
    			b = 1.0 - a;
    		}
    		return RealInterpolate(a,x,b,y);
    	}
    	#endif*/

    	Geom.intersect = function( o1, d1, o2, d2, v ) {
    		/* Given edges (o1,d1) and (o2,d2), compute their point of intersection.
    		* The computed point is guaranteed to lie in the intersection of the
    		* bounding rectangles defined by each edge.
    		*/
    		var z1, z2;
    		var t;

    		/* This is certainly not the most efficient way to find the intersection
    		* of two line segments, but it is very numerically stable.
    		*
    		* Strategy: find the two middle vertices in the VertLeq ordering,
    		* and interpolate the intersection s-value from these.  Then repeat
    		* using the TransLeq ordering to find the intersection t-value.
    		*/

    		if( ! Geom.vertLeq( o1, d1 )) { t = o1; o1 = d1; d1 = t; } //swap( o1, d1 ); }
    		if( ! Geom.vertLeq( o2, d2 )) { t = o2; o2 = d2; d2 = t; } //swap( o2, d2 ); }
    		if( ! Geom.vertLeq( o1, o2 )) { t = o1; o1 = o2; o2 = t; t = d1; d1 = d2; d2 = t; }//swap( o1, o2 ); swap( d1, d2 ); }

    		if( ! Geom.vertLeq( o2, d1 )) {
    			/* Technically, no intersection -- do our best */
    			v.s = (o2.s + d1.s) / 2;
    		} else if( Geom.vertLeq( d1, d2 )) {
    			/* Interpolate between o2 and d1 */
    			z1 = Geom.edgeEval( o1, o2, d1 );
    			z2 = Geom.edgeEval( o2, d1, d2 );
    			if( z1+z2 < 0 ) { z1 = -z1; z2 = -z2; }
    			v.s = Geom.interpolate( z1, o2.s, z2, d1.s );
    		} else {
    			/* Interpolate between o2 and d2 */
    			z1 = Geom.edgeSign( o1, o2, d1 );
    			z2 = -Geom.edgeSign( o1, d2, d1 );
    			if( z1+z2 < 0 ) { z1 = -z1; z2 = -z2; }
    			v.s = Geom.interpolate( z1, o2.s, z2, d2.s );
    		}

    		/* Now repeat the process for t */

    		if( ! Geom.transLeq( o1, d1 )) { t = o1; o1 = d1; d1 = t; } //swap( o1, d1 ); }
    		if( ! Geom.transLeq( o2, d2 )) { t = o2; o2 = d2; d2 = t; } //swap( o2, d2 ); }
    		if( ! Geom.transLeq( o1, o2 )) { t = o1; o1 = o2; o2 = t; t = d1; d1 = d2; d2 = t; } //swap( o1, o2 ); swap( d1, d2 ); }

    		if( ! Geom.transLeq( o2, d1 )) {
    			/* Technically, no intersection -- do our best */
    			v.t = (o2.t + d1.t) / 2;
    		} else if( Geom.transLeq( d1, d2 )) {
    			/* Interpolate between o2 and d1 */
    			z1 = Geom.transEval( o1, o2, d1 );
    			z2 = Geom.transEval( o2, d1, d2 );
    			if( z1+z2 < 0 ) { z1 = -z1; z2 = -z2; }
    			v.t = Geom.interpolate( z1, o2.t, z2, d1.t );
    		} else {
    			/* Interpolate between o2 and d2 */
    			z1 = Geom.transSign( o1, o2, d1 );
    			z2 = -Geom.transSign( o1, d2, d1 );
    			if( z1+z2 < 0 ) { z1 = -z1; z2 = -z2; }
    			v.t = Geom.interpolate( z1, o2.t, z2, d2.t );
    		}
    	};



    	function DictNode() {
    		this.key = null;
    		this.next = null;
    		this.prev = null;
    	}
    	function Dict(frame, leq) {
    		this.head = new DictNode();
    		this.head.next = this.head;
    		this.head.prev = this.head;
    		this.frame = frame;
    		this.leq = leq;
    	}
    	Dict.prototype = {
    		min: function() {
    			return this.head.next;
    		},

    		max: function() {
    			return this.head.prev;
    		},

    		insert: function(k) {
    			return this.insertBefore(this.head, k);
    		},

    		search: function(key) {
    			/* Search returns the node with the smallest key greater than or equal
    			* to the given key.  If there is no such key, returns a node whose
    			* key is NULL.  Similarly, Succ(Max(d)) has a NULL key, etc.
    			*/
    			var node = this.head;
    			do {
    				node = node.next;
    			} while( node.key !== null && ! this.leq(this.frame, key, node.key));

    			return node;
    		},

    		insertBefore: function(node, key) {
    			do {
    				node = node.prev;
    			} while( node.key !== null && ! this.leq(this.frame, node.key, key));

    			var newNode = new DictNode();
    			newNode.key = key;
    			newNode.next = node.next;
    			node.next.prev = newNode;
    			newNode.prev = node;
    			node.next = newNode;

    			return newNode;
    		},

    		delete: function(node) {
    			node.next.prev = node.prev;
    			node.prev.next = node.next;
    		}
    	};


    	function PQnode() {
    		this.handle = null;
    	}

    	function PQhandleElem() {
    		this.key = null;
    		this.node = null;
    	}

    	function PriorityQ(size, leq) {
    		this.size = 0;
    		this.max = size;

    		this.nodes = [];
    		this.nodes.length = size+1;
    		for (var i = 0; i < this.nodes.length; i++)
    			this.nodes[i] = new PQnode();

    		this.handles = [];
    		this.handles.length = size+1;
    		for (var i = 0; i < this.handles.length; i++)
    			this.handles[i] = new PQhandleElem();

    		this.initialized = false;
    		this.freeList = 0;
    		this.leq = leq;

    		this.nodes[1].handle = 1;	/* so that Minimum() returns NULL */
    		this.handles[1].key = null;
    	}
    	PriorityQ.prototype = {

    		floatDown_: function( curr )
    		{
    			var n = this.nodes;
    			var h = this.handles;
    			var hCurr, hChild;
    			var child;

    			hCurr = n[curr].handle;
    			for( ;; ) {
    				child = curr << 1;
    				if( child < this.size && this.leq( h[n[child+1].handle].key, h[n[child].handle].key )) {
    					++child;
    				}

    				assert(child <= this.max);

    				hChild = n[child].handle;
    				if( child > this.size || this.leq( h[hCurr].key, h[hChild].key )) {
    					n[curr].handle = hCurr;
    					h[hCurr].node = curr;
    					break;
    				}
    				n[curr].handle = hChild;
    				h[hChild].node = curr;
    				curr = child;
    			}
    		},

    		floatUp_: function( curr )
    		{
    			var n = this.nodes;
    			var h = this.handles;
    			var hCurr, hParent;
    			var parent;

    			hCurr = n[curr].handle;
    			for( ;; ) {
    				parent = curr >> 1;
    				hParent = n[parent].handle;
    				if( parent == 0 || this.leq( h[hParent].key, h[hCurr].key )) {
    					n[curr].handle = hCurr;
    					h[hCurr].node = curr;
    					break;
    				}
    				n[curr].handle = hParent;
    				h[hParent].node = curr;
    				curr = parent;
    			}
    		},

    		init: function() {
    			/* This method of building a heap is O(n), rather than O(n lg n). */
    			for( var i = this.size; i >= 1; --i ) {
    				this.floatDown_( i );
    			}
    			this.initialized = true;
    		},

    		min: function() {
    			return this.handles[this.nodes[1].handle].key;
    		},

    		isEmpty: function() {
    			this.size === 0;
    		},

    		/* really pqHeapInsert */
    		/* returns INV_HANDLE iff out of memory */
    		//PQhandle pqHeapInsert( TESSalloc* alloc, PriorityQHeap *pq, PQkey keyNew )
    		insert: function(keyNew)
    		{
    			var curr;
    			var free;

    			curr = ++this.size;
    			if( (curr*2) > this.max ) {
    				this.max *= 2;
    				var s;
    				s = this.nodes.length;
    				this.nodes.length = this.max+1;
    				for (var i = s; i < this.nodes.length; i++)
    					this.nodes[i] = new PQnode();

    				s = this.handles.length;
    				this.handles.length = this.max+1;
    				for (var i = s; i < this.handles.length; i++)
    					this.handles[i] = new PQhandleElem();
    			}

    			if( this.freeList === 0 ) {
    				free = curr;
    			} else {
    				free = this.freeList;
    				this.freeList = this.handles[free].node;
    			}

    			this.nodes[curr].handle = free;
    			this.handles[free].node = curr;
    			this.handles[free].key = keyNew;

    			if( this.initialized ) {
    				this.floatUp_( curr );
    			}
    			return free;
    		},

    		//PQkey pqHeapExtractMin( PriorityQHeap *pq )
    		extractMin: function() {
    			var n = this.nodes;
    			var h = this.handles;
    			var hMin = n[1].handle;
    			var min = h[hMin].key;

    			if( this.size > 0 ) {
    				n[1].handle = n[this.size].handle;
    				h[n[1].handle].node = 1;

    				h[hMin].key = null;
    				h[hMin].node = this.freeList;
    				this.freeList = hMin;

    				--this.size;
    				if( this.size > 0 ) {
    					this.floatDown_( 1 );
    				}
    			}
    			return min;
    		},

    		delete: function( hCurr ) {
    			var n = this.nodes;
    			var h = this.handles;
    			var curr;

    			assert( hCurr >= 1 && hCurr <= this.max && h[hCurr].key !== null );

    			curr = h[hCurr].node;
    			n[curr].handle = n[this.size].handle;
    			h[n[curr].handle].node = curr;

    			--this.size;
    			if( curr <= this.size ) {
    				if( curr <= 1 || this.leq( h[n[curr>>1].handle].key, h[n[curr].handle].key )) {
    					this.floatDown_( curr );
    				} else {
    					this.floatUp_( curr );
    				}
    			}
    			h[hCurr].key = null;
    			h[hCurr].node = this.freeList;
    			this.freeList = hCurr;
    		}
    	};


    	/* For each pair of adjacent edges crossing the sweep line, there is
    	* an ActiveRegion to represent the region between them.  The active
    	* regions are kept in sorted order in a dynamic dictionary.  As the
    	* sweep line crosses each vertex, we update the affected regions.
    	*/

    	function ActiveRegion() {
    		this.eUp = null;		/* upper edge, directed right to left */
    		this.nodeUp = null;	/* dictionary node corresponding to eUp */
    		this.windingNumber = 0;	/* used to determine which regions are
    								* inside the polygon */
    		this.inside = false;		/* is this region inside the polygon? */
    		this.sentinel = false;	/* marks fake edges at t = +/-infinity */
    		this.dirty = false;		/* marks regions where the upper or lower
    						* edge has changed, but we haven't checked
    						* whether they intersect yet */
    		this.fixUpperEdge = false;	/* marks temporary edges introduced when
    							* we process a "right vertex" (one without
    							* any edges leaving to the right) */
    	}
    	var Sweep = {};

    	Sweep.regionBelow = function(r) {
    		return r.nodeUp.prev.key;
    	};

    	Sweep.regionAbove = function(r) {
    		return r.nodeUp.next.key;
    	};

    	Sweep.debugEvent = function( tess ) {
    		// empty
    	};


    	/*
    	* Invariants for the Edge Dictionary.
    	* - each pair of adjacent edges e2=Succ(e1) satisfies EdgeLeq(e1,e2)
    	*   at any valid location of the sweep event
    	* - if EdgeLeq(e2,e1) as well (at any valid sweep event), then e1 and e2
    	*   share a common endpoint
    	* - for each e, e->Dst has been processed, but not e->Org
    	* - each edge e satisfies VertLeq(e->Dst,event) && VertLeq(event,e->Org)
    	*   where "event" is the current sweep line event.
    	* - no edge e has zero length
    	*
    	* Invariants for the Mesh (the processed portion).
    	* - the portion of the mesh left of the sweep line is a planar graph,
    	*   ie. there is *some* way to embed it in the plane
    	* - no processed edge has zero length
    	* - no two processed vertices have identical coordinates
    	* - each "inside" region is monotone, ie. can be broken into two chains
    	*   of monotonically increasing vertices according to VertLeq(v1,v2)
    	*   - a non-invariant: these chains may intersect (very slightly)
    	*
    	* Invariants for the Sweep.
    	* - if none of the edges incident to the event vertex have an activeRegion
    	*   (ie. none of these edges are in the edge dictionary), then the vertex
    	*   has only right-going edges.
    	* - if an edge is marked "fixUpperEdge" (it is a temporary edge introduced
    	*   by ConnectRightVertex), then it is the only right-going edge from
    	*   its associated vertex.  (This says that these edges exist only
    	*   when it is necessary.)
    	*/

    	/* When we merge two edges into one, we need to compute the combined
    	* winding of the new edge.
    	*/
    	Sweep.addWinding = function(eDst,eSrc) {
    		eDst.winding += eSrc.winding;
    		eDst.Sym.winding += eSrc.Sym.winding;
    	};


    	//static int EdgeLeq( TESStesselator *tess, ActiveRegion *reg1, ActiveRegion *reg2 )
    	Sweep.edgeLeq = function( tess, reg1, reg2 ) {
    		/*
    		* Both edges must be directed from right to left (this is the canonical
    		* direction for the upper edge of each region).
    		*
    		* The strategy is to evaluate a "t" value for each edge at the
    		* current sweep line position, given by tess->event.  The calculations
    		* are designed to be very stable, but of course they are not perfect.
    		*
    		* Special case: if both edge destinations are at the sweep event,
    		* we sort the edges by slope (they would otherwise compare equally).
    		*/
    		var ev = tess.event;
    		var t1, t2;

    		var e1 = reg1.eUp;
    		var e2 = reg2.eUp;

    		if( e1.Dst === ev ) {
    			if( e2.Dst === ev ) {
    				/* Two edges right of the sweep line which meet at the sweep event.
    				* Sort them by slope.
    				*/
    				if( Geom.vertLeq( e1.Org, e2.Org )) {
    					return Geom.edgeSign( e2.Dst, e1.Org, e2.Org ) <= 0;
    				}
    				return Geom.edgeSign( e1.Dst, e2.Org, e1.Org ) >= 0;
    			}
    			return Geom.edgeSign( e2.Dst, ev, e2.Org ) <= 0;
    		}
    		if( e2.Dst === ev ) {
    			return Geom.edgeSign( e1.Dst, ev, e1.Org ) >= 0;
    		}

    		/* General case - compute signed distance *from* e1, e2 to event */
    		var t1 = Geom.edgeEval( e1.Dst, ev, e1.Org );
    		var t2 = Geom.edgeEval( e2.Dst, ev, e2.Org );
    		return (t1 >= t2);
    	};


    	//static void DeleteRegion( TESStesselator *tess, ActiveRegion *reg )
    	Sweep.deleteRegion = function( tess, reg ) {
    		if( reg.fixUpperEdge ) {
    			/* It was created with zero winding number, so it better be
    			* deleted with zero winding number (ie. it better not get merged
    			* with a real edge).
    			*/
    			assert( reg.eUp.winding === 0 );
    		}
    		reg.eUp.activeRegion = null;
    		tess.dict.delete( reg.nodeUp );
    	};

    	//static int FixUpperEdge( TESStesselator *tess, ActiveRegion *reg, TESShalfEdge *newEdge )
    	Sweep.fixUpperEdge = function( tess, reg, newEdge ) {
    		/*
    		* Replace an upper edge which needs fixing (see ConnectRightVertex).
    		*/
    		assert( reg.fixUpperEdge );
    		tess.mesh.delete( reg.eUp );
    		reg.fixUpperEdge = false;
    		reg.eUp = newEdge;
    		newEdge.activeRegion = reg;
    	};

    	//static ActiveRegion *TopLeftRegion( TESStesselator *tess, ActiveRegion *reg )
    	Sweep.topLeftRegion = function( tess, reg ) {
    		var org = reg.eUp.Org;
    		var e;

    		/* Find the region above the uppermost edge with the same origin */
    		do {
    			reg = Sweep.regionAbove( reg );
    		} while( reg.eUp.Org === org );

    		/* If the edge above was a temporary edge introduced by ConnectRightVertex,
    		* now is the time to fix it.
    		*/
    		if( reg.fixUpperEdge ) {
    			e = tess.mesh.connect( Sweep.regionBelow(reg).eUp.Sym, reg.eUp.Lnext );
    			if (e === null) return null;
    			Sweep.fixUpperEdge( tess, reg, e );
    			reg = Sweep.regionAbove( reg );
    		}
    		return reg;
    	};

    	//static ActiveRegion *TopRightRegion( ActiveRegion *reg )
    	Sweep.topRightRegion = function( reg )
    	{
    		var dst = reg.eUp.Dst;
    		var reg = null;
    		/* Find the region above the uppermost edge with the same destination */
    		do {
    			reg = Sweep.regionAbove( reg );
    		} while( reg.eUp.Dst === dst );
    		return reg;
    	};

    	//static ActiveRegion *AddRegionBelow( TESStesselator *tess, ActiveRegion *regAbove, TESShalfEdge *eNewUp )
    	Sweep.addRegionBelow = function( tess, regAbove, eNewUp ) {
    		/*
    		* Add a new active region to the sweep line, *somewhere* below "regAbove"
    		* (according to where the new edge belongs in the sweep-line dictionary).
    		* The upper edge of the new region will be "eNewUp".
    		* Winding number and "inside" flag are not updated.
    		*/
    		var regNew = new ActiveRegion();
    		regNew.eUp = eNewUp;
    		regNew.nodeUp = tess.dict.insertBefore( regAbove.nodeUp, regNew );
    	//	if (regNew->nodeUp == NULL) longjmp(tess->env,1);
    		regNew.fixUpperEdge = false;
    		regNew.sentinel = false;
    		regNew.dirty = false;

    		eNewUp.activeRegion = regNew;
    		return regNew;
    	};

    	//static int IsWindingInside( TESStesselator *tess, int n )
    	Sweep.isWindingInside = function( tess, n ) {
    		switch( tess.windingRule ) {
    			case Tess2$1.WINDING_ODD:
    				return (n & 1) != 0;
    			case Tess2$1.WINDING_NONZERO:
    				return (n != 0);
    			case Tess2$1.WINDING_POSITIVE:
    				return (n > 0);
    			case Tess2$1.WINDING_NEGATIVE:
    				return (n < 0);
    			case Tess2$1.WINDING_ABS_GEQ_TWO:
    				return (n >= 2) || (n <= -2);
    		}
    		assert( false );
    		return false;
    	};

    	//static void ComputeWinding( TESStesselator *tess, ActiveRegion *reg )
    	Sweep.computeWinding = function( tess, reg ) {
    		reg.windingNumber = Sweep.regionAbove(reg).windingNumber + reg.eUp.winding;
    		reg.inside = Sweep.isWindingInside( tess, reg.windingNumber );
    	};


    	//static void FinishRegion( TESStesselator *tess, ActiveRegion *reg )
    	Sweep.finishRegion = function( tess, reg ) {
    		/*
    		* Delete a region from the sweep line.  This happens when the upper
    		* and lower chains of a region meet (at a vertex on the sweep line).
    		* The "inside" flag is copied to the appropriate mesh face (we could
    		* not do this before -- since the structure of the mesh is always
    		* changing, this face may not have even existed until now).
    		*/
    		var e = reg.eUp;
    		var f = e.Lface;

    		f.inside = reg.inside;
    		f.anEdge = e;   /* optimization for tessMeshTessellateMonoRegion() */
    		Sweep.deleteRegion( tess, reg );
    	};


    	//static TESShalfEdge *FinishLeftRegions( TESStesselator *tess, ActiveRegion *regFirst, ActiveRegion *regLast )
    	Sweep.finishLeftRegions = function( tess, regFirst, regLast ) {
    		/*
    		* We are given a vertex with one or more left-going edges.  All affected
    		* edges should be in the edge dictionary.  Starting at regFirst->eUp,
    		* we walk down deleting all regions where both edges have the same
    		* origin vOrg.  At the same time we copy the "inside" flag from the
    		* active region to the face, since at this point each face will belong
    		* to at most one region (this was not necessarily true until this point
    		* in the sweep).  The walk stops at the region above regLast; if regLast
    		* is NULL we walk as far as possible.  At the same time we relink the
    		* mesh if necessary, so that the ordering of edges around vOrg is the
    		* same as in the dictionary.
    		*/
    		var e, ePrev;
    		var reg = null;
    		var regPrev = regFirst;
    		var ePrev = regFirst.eUp;
    		while( regPrev !== regLast ) {
    			regPrev.fixUpperEdge = false;	/* placement was OK */
    			reg = Sweep.regionBelow( regPrev );
    			e = reg.eUp;
    			if( e.Org != ePrev.Org ) {
    				if( ! reg.fixUpperEdge ) {
    					/* Remove the last left-going edge.  Even though there are no further
    					* edges in the dictionary with this origin, there may be further
    					* such edges in the mesh (if we are adding left edges to a vertex
    					* that has already been processed).  Thus it is important to call
    					* FinishRegion rather than just DeleteRegion.
    					*/
    					Sweep.finishRegion( tess, regPrev );
    					break;
    				}
    				/* If the edge below was a temporary edge introduced by
    				* ConnectRightVertex, now is the time to fix it.
    				*/
    				e = tess.mesh.connect( ePrev.Lprev, e.Sym );
    	//			if (e == NULL) longjmp(tess->env,1);
    				Sweep.fixUpperEdge( tess, reg, e );
    			}

    			/* Relink edges so that ePrev->Onext == e */
    			if( ePrev.Onext !== e ) {
    				tess.mesh.splice( e.Oprev, e );
    				tess.mesh.splice( ePrev, e );
    			}
    			Sweep.finishRegion( tess, regPrev );	/* may change reg->eUp */
    			ePrev = reg.eUp;
    			regPrev = reg;
    		}
    		return ePrev;
    	};


    	//static void AddRightEdges( TESStesselator *tess, ActiveRegion *regUp, TESShalfEdge *eFirst, TESShalfEdge *eLast, TESShalfEdge *eTopLeft, int cleanUp )
    	Sweep.addRightEdges = function( tess, regUp, eFirst, eLast, eTopLeft, cleanUp ) {
    		/*
    		* Purpose: insert right-going edges into the edge dictionary, and update
    		* winding numbers and mesh connectivity appropriately.  All right-going
    		* edges share a common origin vOrg.  Edges are inserted CCW starting at
    		* eFirst; the last edge inserted is eLast->Oprev.  If vOrg has any
    		* left-going edges already processed, then eTopLeft must be the edge
    		* such that an imaginary upward vertical segment from vOrg would be
    		* contained between eTopLeft->Oprev and eTopLeft; otherwise eTopLeft
    		* should be NULL.
    		*/
    		var reg, regPrev;
    		var e, ePrev;
    		var firstTime = true;

    		/* Insert the new right-going edges in the dictionary */
    		e = eFirst;
    		do {
    			assert( Geom.vertLeq( e.Org, e.Dst ));
    			Sweep.addRegionBelow( tess, regUp, e.Sym );
    			e = e.Onext;
    		} while ( e !== eLast );

    		/* Walk *all* right-going edges from e->Org, in the dictionary order,
    		* updating the winding numbers of each region, and re-linking the mesh
    		* edges to match the dictionary ordering (if necessary).
    		*/
    		if( eTopLeft === null ) {
    			eTopLeft = Sweep.regionBelow( regUp ).eUp.Rprev;
    		}
    		regPrev = regUp;
    		ePrev = eTopLeft;
    		for( ;; ) {
    			reg = Sweep.regionBelow( regPrev );
    			e = reg.eUp.Sym;
    			if( e.Org !== ePrev.Org ) break;

    			if( e.Onext !== ePrev ) {
    				/* Unlink e from its current position, and relink below ePrev */
    				tess.mesh.splice( e.Oprev, e );
    				tess.mesh.splice( ePrev.Oprev, e );
    			}
    			/* Compute the winding number and "inside" flag for the new regions */
    			reg.windingNumber = regPrev.windingNumber - e.winding;
    			reg.inside = Sweep.isWindingInside( tess, reg.windingNumber );

    			/* Check for two outgoing edges with same slope -- process these
    			* before any intersection tests (see example in tessComputeInterior).
    			*/
    			regPrev.dirty = true;
    			if( ! firstTime && Sweep.checkForRightSplice( tess, regPrev )) {
    				Sweep.addWinding( e, ePrev );
    				Sweep.deleteRegion( tess, regPrev );
    				tess.mesh.delete( ePrev );
    			}
    			firstTime = false;
    			regPrev = reg;
    			ePrev = e;
    		}
    		regPrev.dirty = true;
    		assert( regPrev.windingNumber - e.winding === reg.windingNumber );

    		if( cleanUp ) {
    			/* Check for intersections between newly adjacent edges. */
    			Sweep.walkDirtyRegions( tess, regPrev );
    		}
    	};


    	//static void SpliceMergeVertices( TESStesselator *tess, TESShalfEdge *e1, TESShalfEdge *e2 )
    	Sweep.spliceMergeVertices = function( tess, e1, e2 ) {
    		/*
    		* Two vertices with idential coordinates are combined into one.
    		* e1->Org is kept, while e2->Org is discarded.
    		*/
    		tess.mesh.splice( e1, e2 ); 
    	};

    	//static void VertexWeights( TESSvertex *isect, TESSvertex *org, TESSvertex *dst, TESSreal *weights )
    	Sweep.vertexWeights = function( isect, org, dst ) {
    		/*
    		* Find some weights which describe how the intersection vertex is
    		* a linear combination of "org" and "dest".  Each of the two edges
    		* which generated "isect" is allocated 50% of the weight; each edge
    		* splits the weight between its org and dst according to the
    		* relative distance to "isect".
    		*/
    		var t1 = Geom.vertL1dist( org, isect );
    		var t2 = Geom.vertL1dist( dst, isect );
    		var w0 = 0.5 * t2 / (t1 + t2);
    		var w1 = 0.5 * t1 / (t1 + t2);
    		isect.coords[0] += w0*org.coords[0] + w1*dst.coords[0];
    		isect.coords[1] += w0*org.coords[1] + w1*dst.coords[1];
    		isect.coords[2] += w0*org.coords[2] + w1*dst.coords[2];
    	};


    	//static void GetIntersectData( TESStesselator *tess, TESSvertex *isect, TESSvertex *orgUp, TESSvertex *dstUp, TESSvertex *orgLo, TESSvertex *dstLo )
    	Sweep.getIntersectData = function( tess, isect, orgUp, dstUp, orgLo, dstLo ) {
    		 /*
    		 * We've computed a new intersection point, now we need a "data" pointer
    		 * from the user so that we can refer to this new vertex in the
    		 * rendering callbacks.
    		 */
    		isect.coords[0] = isect.coords[1] = isect.coords[2] = 0;
    		isect.idx = -1;
    		Sweep.vertexWeights( isect, orgUp, dstUp );
    		Sweep.vertexWeights( isect, orgLo, dstLo );
    	};

    	//static int CheckForRightSplice( TESStesselator *tess, ActiveRegion *regUp )
    	Sweep.checkForRightSplice = function( tess, regUp ) {
    		/*
    		* Check the upper and lower edge of "regUp", to make sure that the
    		* eUp->Org is above eLo, or eLo->Org is below eUp (depending on which
    		* origin is leftmost).
    		*
    		* The main purpose is to splice right-going edges with the same
    		* dest vertex and nearly identical slopes (ie. we can't distinguish
    		* the slopes numerically).  However the splicing can also help us
    		* to recover from numerical errors.  For example, suppose at one
    		* point we checked eUp and eLo, and decided that eUp->Org is barely
    		* above eLo.  Then later, we split eLo into two edges (eg. from
    		* a splice operation like this one).  This can change the result of
    		* our test so that now eUp->Org is incident to eLo, or barely below it.
    		* We must correct this condition to maintain the dictionary invariants.
    		*
    		* One possibility is to check these edges for intersection again
    		* (ie. CheckForIntersect).  This is what we do if possible.  However
    		* CheckForIntersect requires that tess->event lies between eUp and eLo,
    		* so that it has something to fall back on when the intersection
    		* calculation gives us an unusable answer.  So, for those cases where
    		* we can't check for intersection, this routine fixes the problem
    		* by just splicing the offending vertex into the other edge.
    		* This is a guaranteed solution, no matter how degenerate things get.
    		* Basically this is a combinatorial solution to a numerical problem.
    		*/
    		var regLo = Sweep.regionBelow(regUp);
    		var eUp = regUp.eUp;
    		var eLo = regLo.eUp;

    		if( Geom.vertLeq( eUp.Org, eLo.Org )) {
    			if( Geom.edgeSign( eLo.Dst, eUp.Org, eLo.Org ) > 0 ) return false;

    			/* eUp->Org appears to be below eLo */
    			if( ! Geom.vertEq( eUp.Org, eLo.Org )) {
    				/* Splice eUp->Org into eLo */
    				tess.mesh.splitEdge( eLo.Sym );
    				tess.mesh.splice( eUp, eLo.Oprev );
    				regUp.dirty = regLo.dirty = true;

    			} else if( eUp.Org !== eLo.Org ) {
    				/* merge the two vertices, discarding eUp->Org */
    				tess.pq.delete( eUp.Org.pqHandle );
    				Sweep.spliceMergeVertices( tess, eLo.Oprev, eUp );
    			}
    		} else {
    			if( Geom.edgeSign( eUp.Dst, eLo.Org, eUp.Org ) < 0 ) return false;

    			/* eLo->Org appears to be above eUp, so splice eLo->Org into eUp */
    			Sweep.regionAbove(regUp).dirty = regUp.dirty = true;
    			tess.mesh.splitEdge( eUp.Sym );
    			tess.mesh.splice( eLo.Oprev, eUp );
    		}
    		return true;
    	};

    	//static int CheckForLeftSplice( TESStesselator *tess, ActiveRegion *regUp )
    	Sweep.checkForLeftSplice = function( tess, regUp ) {
    		/*
    		* Check the upper and lower edge of "regUp", to make sure that the
    		* eUp->Dst is above eLo, or eLo->Dst is below eUp (depending on which
    		* destination is rightmost).
    		*
    		* Theoretically, this should always be true.  However, splitting an edge
    		* into two pieces can change the results of previous tests.  For example,
    		* suppose at one point we checked eUp and eLo, and decided that eUp->Dst
    		* is barely above eLo.  Then later, we split eLo into two edges (eg. from
    		* a splice operation like this one).  This can change the result of
    		* the test so that now eUp->Dst is incident to eLo, or barely below it.
    		* We must correct this condition to maintain the dictionary invariants
    		* (otherwise new edges might get inserted in the wrong place in the
    		* dictionary, and bad stuff will happen).
    		*
    		* We fix the problem by just splicing the offending vertex into the
    		* other edge.
    		*/
    		var regLo = Sweep.regionBelow(regUp);
    		var eUp = regUp.eUp;
    		var eLo = regLo.eUp;
    		var e;

    		assert( ! Geom.vertEq( eUp.Dst, eLo.Dst ));

    		if( Geom.vertLeq( eUp.Dst, eLo.Dst )) {
    			if( Geom.edgeSign( eUp.Dst, eLo.Dst, eUp.Org ) < 0 ) return false;

    			/* eLo->Dst is above eUp, so splice eLo->Dst into eUp */
    			Sweep.regionAbove(regUp).dirty = regUp.dirty = true;
    			e = tess.mesh.splitEdge( eUp );
    			tess.mesh.splice( eLo.Sym, e );
    			e.Lface.inside = regUp.inside;
    		} else {
    			if( Geom.edgeSign( eLo.Dst, eUp.Dst, eLo.Org ) > 0 ) return false;

    			/* eUp->Dst is below eLo, so splice eUp->Dst into eLo */
    			regUp.dirty = regLo.dirty = true;
    			e = tess.mesh.splitEdge( eLo );
    			tess.mesh.splice( eUp.Lnext, eLo.Sym );
    			e.Rface.inside = regUp.inside;
    		}
    		return true;
    	};


    	//static int CheckForIntersect( TESStesselator *tess, ActiveRegion *regUp )
    	Sweep.checkForIntersect = function( tess, regUp ) {
    		/*
    		* Check the upper and lower edges of the given region to see if
    		* they intersect.  If so, create the intersection and add it
    		* to the data structures.
    		*
    		* Returns TRUE if adding the new intersection resulted in a recursive
    		* call to AddRightEdges(); in this case all "dirty" regions have been
    		* checked for intersections, and possibly regUp has been deleted.
    		*/
    		var regLo = Sweep.regionBelow(regUp);
    		var eUp = regUp.eUp;
    		var eLo = regLo.eUp;
    		var orgUp = eUp.Org;
    		var orgLo = eLo.Org;
    		var dstUp = eUp.Dst;
    		var dstLo = eLo.Dst;
    		var tMinUp, tMaxLo;
    		var isect = new TESSvertex, orgMin;
    		var e;

    		assert( ! Geom.vertEq( dstLo, dstUp ));
    		assert( Geom.edgeSign( dstUp, tess.event, orgUp ) <= 0 );
    		assert( Geom.edgeSign( dstLo, tess.event, orgLo ) >= 0 );
    		assert( orgUp !== tess.event && orgLo !== tess.event );
    		assert( ! regUp.fixUpperEdge && ! regLo.fixUpperEdge );

    		if( orgUp === orgLo ) return false;	/* right endpoints are the same */

    		tMinUp = Math.min( orgUp.t, dstUp.t );
    		tMaxLo = Math.max( orgLo.t, dstLo.t );
    		if( tMinUp > tMaxLo ) return false;	/* t ranges do not overlap */

    		if( Geom.vertLeq( orgUp, orgLo )) {
    			if( Geom.edgeSign( dstLo, orgUp, orgLo ) > 0 ) return false;
    		} else {
    			if( Geom.edgeSign( dstUp, orgLo, orgUp ) < 0 ) return false;
    		}

    		/* At this point the edges intersect, at least marginally */
    		Sweep.debugEvent( tess );

    		Geom.intersect( dstUp, orgUp, dstLo, orgLo, isect );
    		/* The following properties are guaranteed: */
    		assert( Math.min( orgUp.t, dstUp.t ) <= isect.t );
    		assert( isect.t <= Math.max( orgLo.t, dstLo.t ));
    		assert( Math.min( dstLo.s, dstUp.s ) <= isect.s );
    		assert( isect.s <= Math.max( orgLo.s, orgUp.s ));

    		if( Geom.vertLeq( isect, tess.event )) {
    			/* The intersection point lies slightly to the left of the sweep line,
    			* so move it until it''s slightly to the right of the sweep line.
    			* (If we had perfect numerical precision, this would never happen
    			* in the first place).  The easiest and safest thing to do is
    			* replace the intersection by tess->event.
    			*/
    			isect.s = tess.event.s;
    			isect.t = tess.event.t;
    		}
    		/* Similarly, if the computed intersection lies to the right of the
    		* rightmost origin (which should rarely happen), it can cause
    		* unbelievable inefficiency on sufficiently degenerate inputs.
    		* (If you have the test program, try running test54.d with the
    		* "X zoom" option turned on).
    		*/
    		orgMin = Geom.vertLeq( orgUp, orgLo ) ? orgUp : orgLo;
    		if( Geom.vertLeq( orgMin, isect )) {
    			isect.s = orgMin.s;
    			isect.t = orgMin.t;
    		}

    		if( Geom.vertEq( isect, orgUp ) || Geom.vertEq( isect, orgLo )) {
    			/* Easy case -- intersection at one of the right endpoints */
    			Sweep.checkForRightSplice( tess, regUp );
    			return false;
    		}

    		if(    (! Geom.vertEq( dstUp, tess.event )
    			&& Geom.edgeSign( dstUp, tess.event, isect ) >= 0)
    			|| (! Geom.vertEq( dstLo, tess.event )
    			&& Geom.edgeSign( dstLo, tess.event, isect ) <= 0 ))
    		{
    			/* Very unusual -- the new upper or lower edge would pass on the
    			* wrong side of the sweep event, or through it.  This can happen
    			* due to very small numerical errors in the intersection calculation.
    			*/
    			if( dstLo === tess.event ) {
    				/* Splice dstLo into eUp, and process the new region(s) */
    				tess.mesh.splitEdge( eUp.Sym );
    				tess.mesh.splice( eLo.Sym, eUp );
    				regUp = Sweep.topLeftRegion( tess, regUp );
    	//			if (regUp == NULL) longjmp(tess->env,1);
    				eUp = Sweep.regionBelow(regUp).eUp;
    				Sweep.finishLeftRegions( tess, Sweep.regionBelow(regUp), regLo );
    				Sweep.addRightEdges( tess, regUp, eUp.Oprev, eUp, eUp, true );
    				return TRUE;
    			}
    			if( dstUp === tess.event ) {
    				/* Splice dstUp into eLo, and process the new region(s) */
    				tess.mesh.splitEdge( eLo.Sym );
    				tess.mesh.splice( eUp.Lnext, eLo.Oprev ); 
    				regLo = regUp;
    				regUp = Sweep.topRightRegion( regUp );
    				e = Sweep.regionBelow(regUp).eUp.Rprev;
    				regLo.eUp = eLo.Oprev;
    				eLo = Sweep.finishLeftRegions( tess, regLo, null );
    				Sweep.addRightEdges( tess, regUp, eLo.Onext, eUp.Rprev, e, true );
    				return true;
    			}
    			/* Special case: called from ConnectRightVertex.  If either
    			* edge passes on the wrong side of tess->event, split it
    			* (and wait for ConnectRightVertex to splice it appropriately).
    			*/
    			if( Geom.edgeSign( dstUp, tess.event, isect ) >= 0 ) {
    				Sweep.regionAbove(regUp).dirty = regUp.dirty = true;
    				tess.mesh.splitEdge( eUp.Sym );
    				eUp.Org.s = tess.event.s;
    				eUp.Org.t = tess.event.t;
    			}
    			if( Geom.edgeSign( dstLo, tess.event, isect ) <= 0 ) {
    				regUp.dirty = regLo.dirty = true;
    				tess.mesh.splitEdge( eLo.Sym );
    				eLo.Org.s = tess.event.s;
    				eLo.Org.t = tess.event.t;
    			}
    			/* leave the rest for ConnectRightVertex */
    			return false;
    		}

    		/* General case -- split both edges, splice into new vertex.
    		* When we do the splice operation, the order of the arguments is
    		* arbitrary as far as correctness goes.  However, when the operation
    		* creates a new face, the work done is proportional to the size of
    		* the new face.  We expect the faces in the processed part of
    		* the mesh (ie. eUp->Lface) to be smaller than the faces in the
    		* unprocessed original contours (which will be eLo->Oprev->Lface).
    		*/
    		tess.mesh.splitEdge( eUp.Sym );
    		tess.mesh.splitEdge( eLo.Sym );
    		tess.mesh.splice( eLo.Oprev, eUp );
    		eUp.Org.s = isect.s;
    		eUp.Org.t = isect.t;
    		eUp.Org.pqHandle = tess.pq.insert( eUp.Org );
    		Sweep.getIntersectData( tess, eUp.Org, orgUp, dstUp, orgLo, dstLo );
    		Sweep.regionAbove(regUp).dirty = regUp.dirty = regLo.dirty = true;
    		return false;
    	};

    	//static void WalkDirtyRegions( TESStesselator *tess, ActiveRegion *regUp )
    	Sweep.walkDirtyRegions = function( tess, regUp ) {
    		/*
    		* When the upper or lower edge of any region changes, the region is
    		* marked "dirty".  This routine walks through all the dirty regions
    		* and makes sure that the dictionary invariants are satisfied
    		* (see the comments at the beginning of this file).  Of course
    		* new dirty regions can be created as we make changes to restore
    		* the invariants.
    		*/
    		var regLo = Sweep.regionBelow(regUp);
    		var eUp, eLo;

    		for( ;; ) {
    			/* Find the lowest dirty region (we walk from the bottom up). */
    			while( regLo.dirty ) {
    				regUp = regLo;
    				regLo = Sweep.regionBelow(regLo);
    			}
    			if( ! regUp.dirty ) {
    				regLo = regUp;
    				regUp = Sweep.regionAbove( regUp );
    				if( regUp == null || ! regUp.dirty ) {
    					/* We've walked all the dirty regions */
    					return;
    				}
    			}
    			regUp.dirty = false;
    			eUp = regUp.eUp;
    			eLo = regLo.eUp;

    			if( eUp.Dst !== eLo.Dst ) {
    				/* Check that the edge ordering is obeyed at the Dst vertices. */
    				if( Sweep.checkForLeftSplice( tess, regUp )) {

    					/* If the upper or lower edge was marked fixUpperEdge, then
    					* we no longer need it (since these edges are needed only for
    					* vertices which otherwise have no right-going edges).
    					*/
    					if( regLo.fixUpperEdge ) {
    						Sweep.deleteRegion( tess, regLo );
    						tess.mesh.delete( eLo );
    						regLo = Sweep.regionBelow( regUp );
    						eLo = regLo.eUp;
    					} else if( regUp.fixUpperEdge ) {
    						Sweep.deleteRegion( tess, regUp );
    						tess.mesh.delete( eUp );
    						regUp = Sweep.regionAbove( regLo );
    						eUp = regUp.eUp;
    					}
    				}
    			}
    			if( eUp.Org !== eLo.Org ) {
    				if(    eUp.Dst !== eLo.Dst
    					&& ! regUp.fixUpperEdge && ! regLo.fixUpperEdge
    					&& (eUp.Dst === tess.event || eLo.Dst === tess.event) )
    				{
    					/* When all else fails in CheckForIntersect(), it uses tess->event
    					* as the intersection location.  To make this possible, it requires
    					* that tess->event lie between the upper and lower edges, and also
    					* that neither of these is marked fixUpperEdge (since in the worst
    					* case it might splice one of these edges into tess->event, and
    					* violate the invariant that fixable edges are the only right-going
    					* edge from their associated vertex).
    					*/
    					if( Sweep.checkForIntersect( tess, regUp )) {
    						/* WalkDirtyRegions() was called recursively; we're done */
    						return;
    					}
    				} else {
    					/* Even though we can't use CheckForIntersect(), the Org vertices
    					* may violate the dictionary edge ordering.  Check and correct this.
    					*/
    					Sweep.checkForRightSplice( tess, regUp );
    				}
    			}
    			if( eUp.Org === eLo.Org && eUp.Dst === eLo.Dst ) {
    				/* A degenerate loop consisting of only two edges -- delete it. */
    				Sweep.addWinding( eLo, eUp );
    				Sweep.deleteRegion( tess, regUp );
    				tess.mesh.delete( eUp );
    				regUp = Sweep.regionAbove( regLo );
    			}
    		}
    	};


    	//static void ConnectRightVertex( TESStesselator *tess, ActiveRegion *regUp, TESShalfEdge *eBottomLeft )
    	Sweep.connectRightVertex = function( tess, regUp, eBottomLeft ) {
    		/*
    		* Purpose: connect a "right" vertex vEvent (one where all edges go left)
    		* to the unprocessed portion of the mesh.  Since there are no right-going
    		* edges, two regions (one above vEvent and one below) are being merged
    		* into one.  "regUp" is the upper of these two regions.
    		*
    		* There are two reasons for doing this (adding a right-going edge):
    		*  - if the two regions being merged are "inside", we must add an edge
    		*    to keep them separated (the combined region would not be monotone).
    		*  - in any case, we must leave some record of vEvent in the dictionary,
    		*    so that we can merge vEvent with features that we have not seen yet.
    		*    For example, maybe there is a vertical edge which passes just to
    		*    the right of vEvent; we would like to splice vEvent into this edge.
    		*
    		* However, we don't want to connect vEvent to just any vertex.  We don''t
    		* want the new edge to cross any other edges; otherwise we will create
    		* intersection vertices even when the input data had no self-intersections.
    		* (This is a bad thing; if the user's input data has no intersections,
    		* we don't want to generate any false intersections ourselves.)
    		*
    		* Our eventual goal is to connect vEvent to the leftmost unprocessed
    		* vertex of the combined region (the union of regUp and regLo).
    		* But because of unseen vertices with all right-going edges, and also
    		* new vertices which may be created by edge intersections, we don''t
    		* know where that leftmost unprocessed vertex is.  In the meantime, we
    		* connect vEvent to the closest vertex of either chain, and mark the region
    		* as "fixUpperEdge".  This flag says to delete and reconnect this edge
    		* to the next processed vertex on the boundary of the combined region.
    		* Quite possibly the vertex we connected to will turn out to be the
    		* closest one, in which case we won''t need to make any changes.
    		*/
    		var eNew;
    		var eTopLeft = eBottomLeft.Onext;
    		var regLo = Sweep.regionBelow(regUp);
    		var eUp = regUp.eUp;
    		var eLo = regLo.eUp;
    		var degenerate = false;

    		if( eUp.Dst !== eLo.Dst ) {
    			Sweep.checkForIntersect( tess, regUp );
    		}

    		/* Possible new degeneracies: upper or lower edge of regUp may pass
    		* through vEvent, or may coincide with new intersection vertex
    		*/
    		if( Geom.vertEq( eUp.Org, tess.event )) {
    			tess.mesh.splice( eTopLeft.Oprev, eUp );
    			regUp = Sweep.topLeftRegion( tess, regUp );
    			eTopLeft = Sweep.regionBelow( regUp ).eUp;
    			Sweep.finishLeftRegions( tess, Sweep.regionBelow(regUp), regLo );
    			degenerate = true;
    		}
    		if( Geom.vertEq( eLo.Org, tess.event )) {
    			tess.mesh.splice( eBottomLeft, eLo.Oprev );
    			eBottomLeft = Sweep.finishLeftRegions( tess, regLo, null );
    			degenerate = true;
    		}
    		if( degenerate ) {
    			Sweep.addRightEdges( tess, regUp, eBottomLeft.Onext, eTopLeft, eTopLeft, true );
    			return;
    		}

    		/* Non-degenerate situation -- need to add a temporary, fixable edge.
    		* Connect to the closer of eLo->Org, eUp->Org.
    		*/
    		if( Geom.vertLeq( eLo.Org, eUp.Org )) {
    			eNew = eLo.Oprev;
    		} else {
    			eNew = eUp;
    		}
    		eNew = tess.mesh.connect( eBottomLeft.Lprev, eNew );

    		/* Prevent cleanup, otherwise eNew might disappear before we've even
    		* had a chance to mark it as a temporary edge.
    		*/
    		Sweep.addRightEdges( tess, regUp, eNew, eNew.Onext, eNew.Onext, false );
    		eNew.Sym.activeRegion.fixUpperEdge = true;
    		Sweep.walkDirtyRegions( tess, regUp );
    	};

    	/* Because vertices at exactly the same location are merged together
    	* before we process the sweep event, some degenerate cases can't occur.
    	* However if someone eventually makes the modifications required to
    	* merge features which are close together, the cases below marked
    	* TOLERANCE_NONZERO will be useful.  They were debugged before the
    	* code to merge identical vertices in the main loop was added.
    	*/
    	//#define TOLERANCE_NONZERO	FALSE

    	//static void ConnectLeftDegenerate( TESStesselator *tess, ActiveRegion *regUp, TESSvertex *vEvent )
    	Sweep.connectLeftDegenerate = function( tess, regUp, vEvent ) {
    		/*
    		* The event vertex lies exacty on an already-processed edge or vertex.
    		* Adding the new vertex involves splicing it into the already-processed
    		* part of the mesh.
    		*/
    		var e, eTopLeft, eTopRight, eLast;
    		var reg;

    		e = regUp.eUp;
    		if( Geom.vertEq( e.Org, vEvent )) {
    			/* e->Org is an unprocessed vertex - just combine them, and wait
    			* for e->Org to be pulled from the queue
    			*/
    			assert( false /*TOLERANCE_NONZERO*/ );
    			Sweep.spliceMergeVertices( tess, e, vEvent.anEdge );
    			return;
    		}

    		if( ! Geom.vertEq( e.Dst, vEvent )) {
    			/* General case -- splice vEvent into edge e which passes through it */
    			tess.mesh.splitEdge( e.Sym );
    			if( regUp.fixUpperEdge ) {
    				/* This edge was fixable -- delete unused portion of original edge */
    				tess.mesh.delete( e.Onext );
    				regUp.fixUpperEdge = false;
    			}
    			tess.mesh.splice( vEvent.anEdge, e );
    			Sweep.sweepEvent( tess, vEvent );	/* recurse */
    			return;
    		}

    		/* vEvent coincides with e->Dst, which has already been processed.
    		* Splice in the additional right-going edges.
    		*/
    		assert( false /*TOLERANCE_NONZERO*/ );
    		regUp = Sweep.topRightRegion( regUp );
    		reg = Sweep.regionBelow( regUp );
    		eTopRight = reg.eUp.Sym;
    		eTopLeft = eLast = eTopRight.Onext;
    		if( reg.fixUpperEdge ) {
    			/* Here e->Dst has only a single fixable edge going right.
    			* We can delete it since now we have some real right-going edges.
    			*/
    			assert( eTopLeft !== eTopRight );   /* there are some left edges too */
    			Sweep.deleteRegion( tess, reg );
    			tess.mesh.delete( eTopRight );
    			eTopRight = eTopLeft.Oprev;
    		}
    		tess.mesh.splice( vEvent.anEdge, eTopRight );
    		if( ! Geom.edgeGoesLeft( eTopLeft )) {
    			/* e->Dst had no left-going edges -- indicate this to AddRightEdges() */
    			eTopLeft = null;
    		}
    		Sweep.addRightEdges( tess, regUp, eTopRight.Onext, eLast, eTopLeft, true );
    	};


    	//static void ConnectLeftVertex( TESStesselator *tess, TESSvertex *vEvent )
    	Sweep.connectLeftVertex = function( tess, vEvent ) {
    		/*
    		* Purpose: connect a "left" vertex (one where both edges go right)
    		* to the processed portion of the mesh.  Let R be the active region
    		* containing vEvent, and let U and L be the upper and lower edge
    		* chains of R.  There are two possibilities:
    		*
    		* - the normal case: split R into two regions, by connecting vEvent to
    		*   the rightmost vertex of U or L lying to the left of the sweep line
    		*
    		* - the degenerate case: if vEvent is close enough to U or L, we
    		*   merge vEvent into that edge chain.  The subcases are:
    		*	- merging with the rightmost vertex of U or L
    		*	- merging with the active edge of U or L
    		*	- merging with an already-processed portion of U or L
    		*/
    		var regUp, regLo, reg;
    		var eUp, eLo, eNew;
    		var tmp = new ActiveRegion();

    		/* assert( vEvent->anEdge->Onext->Onext == vEvent->anEdge ); */

    		/* Get a pointer to the active region containing vEvent */
    		tmp.eUp = vEvent.anEdge.Sym;
    		/* __GL_DICTLISTKEY */ /* tessDictListSearch */
    		regUp = tess.dict.search( tmp ).key;
    		regLo = Sweep.regionBelow( regUp );
    		if( !regLo ) {
    			// This may happen if the input polygon is coplanar.
    			return;
    		}
    		eUp = regUp.eUp;
    		eLo = regLo.eUp;

    		/* Try merging with U or L first */
    		if( Geom.edgeSign( eUp.Dst, vEvent, eUp.Org ) === 0.0 ) {
    			Sweep.connectLeftDegenerate( tess, regUp, vEvent );
    			return;
    		}

    		/* Connect vEvent to rightmost processed vertex of either chain.
    		* e->Dst is the vertex that we will connect to vEvent.
    		*/
    		reg = Geom.vertLeq( eLo.Dst, eUp.Dst ) ? regUp : regLo;

    		if( regUp.inside || reg.fixUpperEdge) {
    			if( reg === regUp ) {
    				eNew = tess.mesh.connect( vEvent.anEdge.Sym, eUp.Lnext );
    			} else {
    				var tempHalfEdge = tess.mesh.connect( eLo.Dnext, vEvent.anEdge);
    				eNew = tempHalfEdge.Sym;
    			}
    			if( reg.fixUpperEdge ) {
    				Sweep.fixUpperEdge( tess, reg, eNew );
    			} else {
    				Sweep.computeWinding( tess, Sweep.addRegionBelow( tess, regUp, eNew ));
    			}
    			Sweep.sweepEvent( tess, vEvent );
    		} else {
    			/* The new vertex is in a region which does not belong to the polygon.
    			* We don''t need to connect this vertex to the rest of the mesh.
    			*/
    			Sweep.addRightEdges( tess, regUp, vEvent.anEdge, vEvent.anEdge, null, true );
    		}
    	};


    	//static void SweepEvent( TESStesselator *tess, TESSvertex *vEvent )
    	Sweep.sweepEvent = function( tess, vEvent ) {
    		/*
    		* Does everything necessary when the sweep line crosses a vertex.
    		* Updates the mesh and the edge dictionary.
    		*/

    		tess.event = vEvent;		/* for access in EdgeLeq() */
    		Sweep.debugEvent( tess );

    		/* Check if this vertex is the right endpoint of an edge that is
    		* already in the dictionary.  In this case we don't need to waste
    		* time searching for the location to insert new edges.
    		*/
    		var e = vEvent.anEdge;
    		while( e.activeRegion === null ) {
    			e = e.Onext;
    			if( e == vEvent.anEdge ) {
    				/* All edges go right -- not incident to any processed edges */
    				Sweep.connectLeftVertex( tess, vEvent );
    				return;
    			}
    		}

    		/* Processing consists of two phases: first we "finish" all the
    		* active regions where both the upper and lower edges terminate
    		* at vEvent (ie. vEvent is closing off these regions).
    		* We mark these faces "inside" or "outside" the polygon according
    		* to their winding number, and delete the edges from the dictionary.
    		* This takes care of all the left-going edges from vEvent.
    		*/
    		var regUp = Sweep.topLeftRegion( tess, e.activeRegion );
    		assert( regUp !== null );
    	//	if (regUp == NULL) longjmp(tess->env,1);
    		var reg = Sweep.regionBelow( regUp );
    		var eTopLeft = reg.eUp;
    		var eBottomLeft = Sweep.finishLeftRegions( tess, reg, null );

    		/* Next we process all the right-going edges from vEvent.  This
    		* involves adding the edges to the dictionary, and creating the
    		* associated "active regions" which record information about the
    		* regions between adjacent dictionary edges.
    		*/
    		if( eBottomLeft.Onext === eTopLeft ) {
    			/* No right-going edges -- add a temporary "fixable" edge */
    			Sweep.connectRightVertex( tess, regUp, eBottomLeft );
    		} else {
    			Sweep.addRightEdges( tess, regUp, eBottomLeft.Onext, eTopLeft, eTopLeft, true );
    		}
    	};


    	/* Make the sentinel coordinates big enough that they will never be
    	* merged with real input features.
    	*/

    	//static void AddSentinel( TESStesselator *tess, TESSreal smin, TESSreal smax, TESSreal t )
    	Sweep.addSentinel = function( tess, smin, smax, t ) {
    		/*
    		* We add two sentinel edges above and below all other edges,
    		* to avoid special cases at the top and bottom.
    		*/
    		var reg = new ActiveRegion();
    		var e = tess.mesh.makeEdge();
    	//	if (e == NULL) longjmp(tess->env,1);

    		e.Org.s = smax;
    		e.Org.t = t;
    		e.Dst.s = smin;
    		e.Dst.t = t;
    		tess.event = e.Dst;		/* initialize it */

    		reg.eUp = e;
    		reg.windingNumber = 0;
    		reg.inside = false;
    		reg.fixUpperEdge = false;
    		reg.sentinel = true;
    		reg.dirty = false;
    		reg.nodeUp = tess.dict.insert( reg );
    	//	if (reg->nodeUp == NULL) longjmp(tess->env,1);
    	};


    	//static void InitEdgeDict( TESStesselator *tess )
    	Sweep.initEdgeDict = function( tess ) {
    		/*
    		* We maintain an ordering of edge intersections with the sweep line.
    		* This order is maintained in a dynamic dictionary.
    		*/
    		tess.dict = new Dict( tess, Sweep.edgeLeq );
    	//	if (tess->dict == NULL) longjmp(tess->env,1);

    		var w = (tess.bmax[0] - tess.bmin[0]);
    		var h = (tess.bmax[1] - tess.bmin[1]);

    		var smin = tess.bmin[0] - w;
    		var smax = tess.bmax[0] + w;
    		var tmin = tess.bmin[1] - h;
    		var tmax = tess.bmax[1] + h;

    		Sweep.addSentinel( tess, smin, smax, tmin );
    		Sweep.addSentinel( tess, smin, smax, tmax );
    	};


    	Sweep.doneEdgeDict = function( tess )
    	{
    		var reg;
    		var fixedEdges = 0;

    		while( (reg = tess.dict.min().key) !== null ) {
    			/*
    			* At the end of all processing, the dictionary should contain
    			* only the two sentinel edges, plus at most one "fixable" edge
    			* created by ConnectRightVertex().
    			*/
    			if( ! reg.sentinel ) {
    				assert( reg.fixUpperEdge );
    				assert( ++fixedEdges == 1 );
    			}
    			assert( reg.windingNumber == 0 );
    			Sweep.deleteRegion( tess, reg );
    			/*    tessMeshDelete( reg->eUp );*/
    		}
    	//	dictDeleteDict( &tess->alloc, tess->dict );
    	};


    	Sweep.removeDegenerateEdges = function( tess ) {
    		/*
    		* Remove zero-length edges, and contours with fewer than 3 vertices.
    		*/
    		var e, eNext, eLnext;
    		var eHead = tess.mesh.eHead;

    		/*LINTED*/
    		for( e = eHead.next; e !== eHead; e = eNext ) {
    			eNext = e.next;
    			eLnext = e.Lnext;

    			if( Geom.vertEq( e.Org, e.Dst ) && e.Lnext.Lnext !== e ) {
    				/* Zero-length edge, contour has at least 3 edges */
    				Sweep.spliceMergeVertices( tess, eLnext, e );	/* deletes e->Org */
    				tess.mesh.delete( e ); /* e is a self-loop */
    				e = eLnext;
    				eLnext = e.Lnext;
    			}
    			if( eLnext.Lnext === e ) {
    				/* Degenerate contour (one or two edges) */
    				if( eLnext !== e ) {
    					if( eLnext === eNext || eLnext === eNext.Sym ) { eNext = eNext.next; }
    					tess.mesh.delete( eLnext );
    				}
    				if( e === eNext || e === eNext.Sym ) { eNext = eNext.next; }
    				tess.mesh.delete( e );
    			}
    		}
    	};

    	Sweep.initPriorityQ = function( tess ) {
    		/*
    		* Insert all vertices into the priority queue which determines the
    		* order in which vertices cross the sweep line.
    		*/
    		var pq;
    		var v, vHead;
    		var vertexCount = 0;
    		
    		vHead = tess.mesh.vHead;
    		for( v = vHead.next; v !== vHead; v = v.next ) {
    			vertexCount++;
    		}
    		/* Make sure there is enough space for sentinels. */
    		vertexCount += 8; //MAX( 8, tess->alloc.extraVertices );
    		
    		pq = tess.pq = new PriorityQ( vertexCount, Geom.vertLeq );
    	//	if (pq == NULL) return 0;

    		vHead = tess.mesh.vHead;
    		for( v = vHead.next; v !== vHead; v = v.next ) {
    			v.pqHandle = pq.insert( v );
    	//		if (v.pqHandle == INV_HANDLE)
    	//			break;
    		}

    		if (v !== vHead) {
    			return false;
    		}

    		pq.init();

    		return true;
    	};


    	Sweep.donePriorityQ = function( tess ) {
    		tess.pq = null;
    	};


    	Sweep.removeDegenerateFaces = function( tess, mesh ) {
    		/*
    		* Delete any degenerate faces with only two edges.  WalkDirtyRegions()
    		* will catch almost all of these, but it won't catch degenerate faces
    		* produced by splice operations on already-processed edges.
    		* The two places this can happen are in FinishLeftRegions(), when
    		* we splice in a "temporary" edge produced by ConnectRightVertex(),
    		* and in CheckForLeftSplice(), where we splice already-processed
    		* edges to ensure that our dictionary invariants are not violated
    		* by numerical errors.
    		*
    		* In both these cases it is *very* dangerous to delete the offending
    		* edge at the time, since one of the routines further up the stack
    		* will sometimes be keeping a pointer to that edge.
    		*/
    		var f, fNext;
    		var e;

    		/*LINTED*/
    		for( f = mesh.fHead.next; f !== mesh.fHead; f = fNext ) {
    			fNext = f.next;
    			e = f.anEdge;
    			assert( e.Lnext !== e );

    			if( e.Lnext.Lnext === e ) {
    				/* A face with only two edges */
    				Sweep.addWinding( e.Onext, e );
    				tess.mesh.delete( e );
    			}
    		}
    		return true;
    	};

    	Sweep.computeInterior = function( tess ) {
    		/*
    		* tessComputeInterior( tess ) computes the planar arrangement specified
    		* by the given contours, and further subdivides this arrangement
    		* into regions.  Each region is marked "inside" if it belongs
    		* to the polygon, according to the rule given by tess->windingRule.
    		* Each interior region is guaranteed be monotone.
    		*/
    		var v, vNext;

    		/* Each vertex defines an event for our sweep line.  Start by inserting
    		* all the vertices in a priority queue.  Events are processed in
    		* lexicographic order, ie.
    		*
    		*	e1 < e2  iff  e1.x < e2.x || (e1.x == e2.x && e1.y < e2.y)
    		*/
    		Sweep.removeDegenerateEdges( tess );
    		if ( !Sweep.initPriorityQ( tess ) ) return false; /* if error */
    		Sweep.initEdgeDict( tess );

    		while( (v = tess.pq.extractMin()) !== null ) {
    			for( ;; ) {
    				vNext = tess.pq.min();
    				if( vNext === null || ! Geom.vertEq( vNext, v )) break;

    				/* Merge together all vertices at exactly the same location.
    				* This is more efficient than processing them one at a time,
    				* simplifies the code (see ConnectLeftDegenerate), and is also
    				* important for correct handling of certain degenerate cases.
    				* For example, suppose there are two identical edges A and B
    				* that belong to different contours (so without this code they would
    				* be processed by separate sweep events).  Suppose another edge C
    				* crosses A and B from above.  When A is processed, we split it
    				* at its intersection point with C.  However this also splits C,
    				* so when we insert B we may compute a slightly different
    				* intersection point.  This might leave two edges with a small
    				* gap between them.  This kind of error is especially obvious
    				* when using boundary extraction (TESS_BOUNDARY_ONLY).
    				*/
    				vNext = tess.pq.extractMin();
    				Sweep.spliceMergeVertices( tess, v.anEdge, vNext.anEdge );
    			}
    			Sweep.sweepEvent( tess, v );
    		}

    		/* Set tess->event for debugging purposes */
    		tess.event = tess.dict.min().key.eUp.Org;
    		Sweep.debugEvent( tess );
    		Sweep.doneEdgeDict( tess );
    		Sweep.donePriorityQ( tess );

    		if ( !Sweep.removeDegenerateFaces( tess, tess.mesh ) ) return false;
    		tess.mesh.check();

    		return true;
    	};


    	function Tesselator() {

    		/*** state needed for collecting the input data ***/
    		this.mesh = null;		/* stores the input contours, and eventually
    							the tessellation itself */

    		/*** state needed for projecting onto the sweep plane ***/

    		this.normal = [0.0, 0.0, 0.0];	/* user-specified normal (if provided) */
    		this.sUnit = [0.0, 0.0, 0.0];	/* unit vector in s-direction (debugging) */
    		this.tUnit = [0.0, 0.0, 0.0];	/* unit vector in t-direction (debugging) */

    		this.bmin = [0.0, 0.0];
    		this.bmax = [0.0, 0.0];

    		/*** state needed for the line sweep ***/
    		this.windingRule = Tess2$1.WINDING_ODD;	/* rule for determining polygon interior */

    		this.dict = null;		/* edge dictionary for sweep line */
    		this.pq = null;		/* priority queue of vertex events */
    		this.event = null;		/* current sweep event being processed */

    		this.vertexIndexCounter = 0;
    		
    		this.vertices = [];
    		this.vertexIndices = [];
    		this.vertexCount = 0;
    		this.elements = [];
    		this.elementCount = 0;
    	}
    	Tesselator.prototype = {

    		dot_: function(u, v) {
    			return (u[0]*v[0] + u[1]*v[1] + u[2]*v[2]);
    		},

    		normalize_: function( v ) {
    			var len = v[0]*v[0] + v[1]*v[1] + v[2]*v[2];
    			assert( len > 0.0 );
    			len = Math.sqrt( len );
    			v[0] /= len;
    			v[1] /= len;
    			v[2] /= len;
    		},

    		longAxis_: function( v ) {
    			var i = 0;
    			if( Math.abs(v[1]) > Math.abs(v[0]) ) { i = 1; }
    			if( Math.abs(v[2]) > Math.abs(v[i]) ) { i = 2; }
    			return i;
    		},

    		computeNormal_: function( norm )
    		{
    			var v, v1, v2;
    			var c, tLen2, maxLen2;
    			var maxVal = [0,0,0], minVal = [0,0,0], d1 = [0,0,0], d2 = [0,0,0], tNorm = [0,0,0];
    			var maxVert = [null,null,null], minVert = [null,null,null];
    			var vHead = this.mesh.vHead;
    			var i;

    			v = vHead.next;
    			for( i = 0; i < 3; ++i ) {
    				c = v.coords[i];
    				minVal[i] = c;
    				minVert[i] = v;
    				maxVal[i] = c;
    				maxVert[i] = v;
    			}

    			for( v = vHead.next; v !== vHead; v = v.next ) {
    				for( i = 0; i < 3; ++i ) {
    					c = v.coords[i];
    					if( c < minVal[i] ) { minVal[i] = c; minVert[i] = v; }
    					if( c > maxVal[i] ) { maxVal[i] = c; maxVert[i] = v; }
    				}
    			}

    			/* Find two vertices separated by at least 1/sqrt(3) of the maximum
    			* distance between any two vertices
    			*/
    			i = 0;
    			if( maxVal[1] - minVal[1] > maxVal[0] - minVal[0] ) { i = 1; }
    			if( maxVal[2] - minVal[2] > maxVal[i] - minVal[i] ) { i = 2; }
    			if( minVal[i] >= maxVal[i] ) {
    				/* All vertices are the same -- normal doesn't matter */
    				norm[0] = 0; norm[1] = 0; norm[2] = 1;
    				return;
    			}

    			/* Look for a third vertex which forms the triangle with maximum area
    			* (Length of normal == twice the triangle area)
    			*/
    			maxLen2 = 0;
    			v1 = minVert[i];
    			v2 = maxVert[i];
    			d1[0] = v1.coords[0] - v2.coords[0];
    			d1[1] = v1.coords[1] - v2.coords[1];
    			d1[2] = v1.coords[2] - v2.coords[2];
    			for( v = vHead.next; v !== vHead; v = v.next ) {
    				d2[0] = v.coords[0] - v2.coords[0];
    				d2[1] = v.coords[1] - v2.coords[1];
    				d2[2] = v.coords[2] - v2.coords[2];
    				tNorm[0] = d1[1]*d2[2] - d1[2]*d2[1];
    				tNorm[1] = d1[2]*d2[0] - d1[0]*d2[2];
    				tNorm[2] = d1[0]*d2[1] - d1[1]*d2[0];
    				tLen2 = tNorm[0]*tNorm[0] + tNorm[1]*tNorm[1] + tNorm[2]*tNorm[2];
    				if( tLen2 > maxLen2 ) {
    					maxLen2 = tLen2;
    					norm[0] = tNorm[0];
    					norm[1] = tNorm[1];
    					norm[2] = tNorm[2];
    				}
    			}

    			if( maxLen2 <= 0 ) {
    				/* All points lie on a single line -- any decent normal will do */
    				norm[0] = norm[1] = norm[2] = 0;
    				norm[this.longAxis_(d1)] = 1;
    			}
    		},

    		checkOrientation_: function() {
    			var area;
    			var f, fHead = this.mesh.fHead;
    			var v, vHead = this.mesh.vHead;
    			var e;

    			/* When we compute the normal automatically, we choose the orientation
    			* so that the the sum of the signed areas of all contours is non-negative.
    			*/
    			area = 0;
    			for( f = fHead.next; f !== fHead; f = f.next ) {
    				e = f.anEdge;
    				if( e.winding <= 0 ) continue;
    				do {
    					area += (e.Org.s - e.Dst.s) * (e.Org.t + e.Dst.t);
    					e = e.Lnext;
    				} while( e !== f.anEdge );
    			}
    			if( area < 0 ) {
    				/* Reverse the orientation by flipping all the t-coordinates */
    				for( v = vHead.next; v !== vHead; v = v.next ) {
    					v.t = - v.t;
    				}
    				this.tUnit[0] = - this.tUnit[0];
    				this.tUnit[1] = - this.tUnit[1];
    				this.tUnit[2] = - this.tUnit[2];
    			}
    		},

    	/*	#ifdef FOR_TRITE_TEST_PROGRAM
    		#include <stdlib.h>
    		extern int RandomSweep;
    		#define S_UNIT_X	(RandomSweep ? (2*drand48()-1) : 1.0)
    		#define S_UNIT_Y	(RandomSweep ? (2*drand48()-1) : 0.0)
    		#else
    		#if defined(SLANTED_SWEEP) */
    		/* The "feature merging" is not intended to be complete.  There are
    		* special cases where edges are nearly parallel to the sweep line
    		* which are not implemented.  The algorithm should still behave
    		* robustly (ie. produce a reasonable tesselation) in the presence
    		* of such edges, however it may miss features which could have been
    		* merged.  We could minimize this effect by choosing the sweep line
    		* direction to be something unusual (ie. not parallel to one of the
    		* coordinate axes).
    		*/
    	/*	#define S_UNIT_X	(TESSreal)0.50941539564955385	// Pre-normalized
    		#define S_UNIT_Y	(TESSreal)0.86052074622010633
    		#else
    		#define S_UNIT_X	(TESSreal)1.0
    		#define S_UNIT_Y	(TESSreal)0.0
    		#endif
    		#endif*/

    		/* Determine the polygon normal and project vertices onto the plane
    		* of the polygon.
    		*/
    		projectPolygon_: function() {
    			var v, vHead = this.mesh.vHead;
    			var norm = [0,0,0];
    			var sUnit, tUnit;
    			var i, first, computedNormal = false;

    			norm[0] = this.normal[0];
    			norm[1] = this.normal[1];
    			norm[2] = this.normal[2];
    			if( norm[0] === 0.0 && norm[1] === 0.0 && norm[2] === 0.0 ) {
    				this.computeNormal_( norm );
    				computedNormal = true;
    			}
    			sUnit = this.sUnit;
    			tUnit = this.tUnit;
    			i = this.longAxis_( norm );

    	/*	#if defined(FOR_TRITE_TEST_PROGRAM) || defined(TRUE_PROJECT)
    			// Choose the initial sUnit vector to be approximately perpendicular
    			// to the normal.
    			
    			Normalize( norm );

    			sUnit[i] = 0;
    			sUnit[(i+1)%3] = S_UNIT_X;
    			sUnit[(i+2)%3] = S_UNIT_Y;

    			// Now make it exactly perpendicular 
    			w = Dot( sUnit, norm );
    			sUnit[0] -= w * norm[0];
    			sUnit[1] -= w * norm[1];
    			sUnit[2] -= w * norm[2];
    			Normalize( sUnit );

    			// Choose tUnit so that (sUnit,tUnit,norm) form a right-handed frame 
    			tUnit[0] = norm[1]*sUnit[2] - norm[2]*sUnit[1];
    			tUnit[1] = norm[2]*sUnit[0] - norm[0]*sUnit[2];
    			tUnit[2] = norm[0]*sUnit[1] - norm[1]*sUnit[0];
    			Normalize( tUnit );
    		#else*/
    			/* Project perpendicular to a coordinate axis -- better numerically */
    			sUnit[i] = 0;
    			sUnit[(i+1)%3] = 1.0;
    			sUnit[(i+2)%3] = 0.0;

    			tUnit[i] = 0;
    			tUnit[(i+1)%3] = 0.0;
    			tUnit[(i+2)%3] = (norm[i] > 0) ? 1.0 : -1.0;
    	//	#endif

    			/* Project the vertices onto the sweep plane */
    			for( v = vHead.next; v !== vHead; v = v.next ) {
    				v.s = this.dot_( v.coords, sUnit );
    				v.t = this.dot_( v.coords, tUnit );
    			}
    			if( computedNormal ) {
    				this.checkOrientation_();
    			}

    			/* Compute ST bounds. */
    			first = true;
    			for( v = vHead.next; v !== vHead; v = v.next ) {
    				if (first) {
    					this.bmin[0] = this.bmax[0] = v.s;
    					this.bmin[1] = this.bmax[1] = v.t;
    					first = false;
    				} else {
    					if (v.s < this.bmin[0]) this.bmin[0] = v.s;
    					if (v.s > this.bmax[0]) this.bmax[0] = v.s;
    					if (v.t < this.bmin[1]) this.bmin[1] = v.t;
    					if (v.t > this.bmax[1]) this.bmax[1] = v.t;
    				}
    			}
    		},

    		addWinding_: function(eDst,eSrc) {
    			eDst.winding += eSrc.winding;
    			eDst.Sym.winding += eSrc.Sym.winding;
    		},
    		
    		/* tessMeshTessellateMonoRegion( face ) tessellates a monotone region
    		* (what else would it do??)  The region must consist of a single
    		* loop of half-edges (see mesh.h) oriented CCW.  "Monotone" in this
    		* case means that any vertical line intersects the interior of the
    		* region in a single interval.  
    		*
    		* Tessellation consists of adding interior edges (actually pairs of
    		* half-edges), to split the region into non-overlapping triangles.
    		*
    		* The basic idea is explained in Preparata and Shamos (which I don''t
    		* have handy right now), although their implementation is more
    		* complicated than this one.  The are two edge chains, an upper chain
    		* and a lower chain.  We process all vertices from both chains in order,
    		* from right to left.
    		*
    		* The algorithm ensures that the following invariant holds after each
    		* vertex is processed: the untessellated region consists of two
    		* chains, where one chain (say the upper) is a single edge, and
    		* the other chain is concave.  The left vertex of the single edge
    		* is always to the left of all vertices in the concave chain.
    		*
    		* Each step consists of adding the rightmost unprocessed vertex to one
    		* of the two chains, and forming a fan of triangles from the rightmost
    		* of two chain endpoints.  Determining whether we can add each triangle
    		* to the fan is a simple orientation test.  By making the fan as large
    		* as possible, we restore the invariant (check it yourself).
    		*/
    	//	int tessMeshTessellateMonoRegion( TESSmesh *mesh, TESSface *face )
    		tessellateMonoRegion_: function( mesh, face ) {
    			var up, lo;

    			/* All edges are oriented CCW around the boundary of the region.
    			* First, find the half-edge whose origin vertex is rightmost.
    			* Since the sweep goes from left to right, face->anEdge should
    			* be close to the edge we want.
    			*/
    			up = face.anEdge;
    			assert( up.Lnext !== up && up.Lnext.Lnext !== up );

    			for( ; Geom.vertLeq( up.Dst, up.Org ); up = up.Lprev )
    				;
    			for( ; Geom.vertLeq( up.Org, up.Dst ); up = up.Lnext )
    				;
    			lo = up.Lprev;

    			while( up.Lnext !== lo ) {
    				if( Geom.vertLeq( up.Dst, lo.Org )) {
    					/* up->Dst is on the left.  It is safe to form triangles from lo->Org.
    					* The EdgeGoesLeft test guarantees progress even when some triangles
    					* are CW, given that the upper and lower chains are truly monotone.
    					*/
    					while( lo.Lnext !== up && (Geom.edgeGoesLeft( lo.Lnext )
    						|| Geom.edgeSign( lo.Org, lo.Dst, lo.Lnext.Dst ) <= 0.0 )) {
    							var tempHalfEdge = mesh.connect( lo.Lnext, lo );
    							//if (tempHalfEdge == NULL) return 0;
    							lo = tempHalfEdge.Sym;
    					}
    					lo = lo.Lprev;
    				} else {
    					/* lo->Org is on the left.  We can make CCW triangles from up->Dst. */
    					while( lo.Lnext != up && (Geom.edgeGoesRight( up.Lprev )
    						|| Geom.edgeSign( up.Dst, up.Org, up.Lprev.Org ) >= 0.0 )) {
    							var tempHalfEdge = mesh.connect( up, up.Lprev );
    							//if (tempHalfEdge == NULL) return 0;
    							up = tempHalfEdge.Sym;
    					}
    					up = up.Lnext;
    				}
    			}

    			/* Now lo->Org == up->Dst == the leftmost vertex.  The remaining region
    			* can be tessellated in a fan from this leftmost vertex.
    			*/
    			assert( lo.Lnext !== up );
    			while( lo.Lnext.Lnext !== up ) {
    				var tempHalfEdge = mesh.connect( lo.Lnext, lo );
    				//if (tempHalfEdge == NULL) return 0;
    				lo = tempHalfEdge.Sym;
    			}

    			return true;
    		},


    		/* tessMeshTessellateInterior( mesh ) tessellates each region of
    		* the mesh which is marked "inside" the polygon.  Each such region
    		* must be monotone.
    		*/
    		//int tessMeshTessellateInterior( TESSmesh *mesh )
    		tessellateInterior_: function( mesh ) {
    			var f, next;

    			/*LINTED*/
    			for( f = mesh.fHead.next; f !== mesh.fHead; f = next ) {
    				/* Make sure we don''t try to tessellate the new triangles. */
    				next = f.next;
    				if( f.inside ) {
    					if ( !this.tessellateMonoRegion_( mesh, f ) ) return false;
    				}
    			}

    			return true;
    		},


    		/* tessMeshDiscardExterior( mesh ) zaps (ie. sets to NULL) all faces
    		* which are not marked "inside" the polygon.  Since further mesh operations
    		* on NULL faces are not allowed, the main purpose is to clean up the
    		* mesh so that exterior loops are not represented in the data structure.
    		*/
    		//void tessMeshDiscardExterior( TESSmesh *mesh )
    		discardExterior_: function( mesh ) {
    			var f, next;

    			/*LINTED*/
    			for( f = mesh.fHead.next; f !== mesh.fHead; f = next ) {
    				/* Since f will be destroyed, save its next pointer. */
    				next = f.next;
    				if( ! f.inside ) {
    					mesh.zapFace( f );
    				}
    			}
    		},

    		/* tessMeshSetWindingNumber( mesh, value, keepOnlyBoundary ) resets the
    		* winding numbers on all edges so that regions marked "inside" the
    		* polygon have a winding number of "value", and regions outside
    		* have a winding number of 0.
    		*
    		* If keepOnlyBoundary is TRUE, it also deletes all edges which do not
    		* separate an interior region from an exterior one.
    		*/
    	//	int tessMeshSetWindingNumber( TESSmesh *mesh, int value, int keepOnlyBoundary )
    		setWindingNumber_: function( mesh, value, keepOnlyBoundary ) {
    			var e, eNext;

    			for( e = mesh.eHead.next; e !== mesh.eHead; e = eNext ) {
    				eNext = e.next;
    				if( e.Rface.inside !== e.Lface.inside ) {

    					/* This is a boundary edge (one side is interior, one is exterior). */
    					e.winding = (e.Lface.inside) ? value : -value;
    				} else {

    					/* Both regions are interior, or both are exterior. */
    					if( ! keepOnlyBoundary ) {
    						e.winding = 0;
    					} else {
    						mesh.delete( e );
    					}
    				}
    			}
    		},

    		getNeighbourFace_: function(edge)
    		{
    			if (!edge.Rface)
    				return -1;
    			if (!edge.Rface.inside)
    				return -1;
    			return edge.Rface.n;
    		},

    		outputPolymesh_: function( mesh, elementType, polySize, vertexSize ) {
    			var v;
    			var f;
    			var edge;
    			var maxFaceCount = 0;
    			var maxVertexCount = 0;
    			var faceVerts, i;

    			// Assume that the input data is triangles now.
    			// Try to merge as many polygons as possible
    			if (polySize > 3)
    			{
    				mesh.mergeConvexFaces( polySize );
    			}

    			// Mark unused
    			for ( v = mesh.vHead.next; v !== mesh.vHead; v = v.next )
    				v.n = -1;

    			// Create unique IDs for all vertices and faces.
    			for ( f = mesh.fHead.next; f != mesh.fHead; f = f.next )
    			{
    				f.n = -1;
    				if( !f.inside ) continue;

    				edge = f.anEdge;
    				faceVerts = 0;
    				do
    				{
    					v = edge.Org;
    					if ( v.n === -1 )
    					{
    						v.n = maxVertexCount;
    						maxVertexCount++;
    					}
    					faceVerts++;
    					edge = edge.Lnext;
    				}
    				while (edge !== f.anEdge);
    				
    				assert( faceVerts <= polySize );

    				f.n = maxFaceCount;
    				++maxFaceCount;
    			}

    			this.elementCount = maxFaceCount;
    			if (elementType == Tess2$1.CONNECTED_POLYGONS)
    				maxFaceCount *= 2;
    	/*		tess.elements = (TESSindex*)tess->alloc.memalloc( tess->alloc.userData,
    															  sizeof(TESSindex) * maxFaceCount * polySize );
    			if (!tess->elements)
    			{
    				tess->outOfMemory = 1;
    				return;
    			}*/
    			this.elements = [];
    			this.elements.length = maxFaceCount * polySize;
    			
    			this.vertexCount = maxVertexCount;
    	/*		tess->vertices = (TESSreal*)tess->alloc.memalloc( tess->alloc.userData,
    															 sizeof(TESSreal) * tess->vertexCount * vertexSize );
    			if (!tess->vertices)
    			{
    				tess->outOfMemory = 1;
    				return;
    			}*/
    			this.vertices = [];
    			this.vertices.length = maxVertexCount * vertexSize;

    	/*		tess->vertexIndices = (TESSindex*)tess->alloc.memalloc( tess->alloc.userData,
    																    sizeof(TESSindex) * tess->vertexCount );
    			if (!tess->vertexIndices)
    			{
    				tess->outOfMemory = 1;
    				return;
    			}*/
    			this.vertexIndices = [];
    			this.vertexIndices.length = maxVertexCount;

    			
    			// Output vertices.
    			for ( v = mesh.vHead.next; v !== mesh.vHead; v = v.next )
    			{
    				if ( v.n != -1 )
    				{
    					// Store coordinate
    					var idx = v.n * vertexSize;
    					this.vertices[idx+0] = v.coords[0];
    					this.vertices[idx+1] = v.coords[1];
    					if ( vertexSize > 2 )
    						this.vertices[idx+2] = v.coords[2];
    					// Store vertex index.
    					this.vertexIndices[v.n] = v.idx;
    				}
    			}

    			// Output indices.
    			var nel = 0;
    			for ( f = mesh.fHead.next; f !== mesh.fHead; f = f.next )
    			{
    				if ( !f.inside ) continue;
    				
    				// Store polygon
    				edge = f.anEdge;
    				faceVerts = 0;
    				do
    				{
    					v = edge.Org;
    					this.elements[nel++] = v.n;
    					faceVerts++;
    					edge = edge.Lnext;
    				}
    				while (edge !== f.anEdge);
    				// Fill unused.
    				for (i = faceVerts; i < polySize; ++i)
    					this.elements[nel++] = -1;

    				// Store polygon connectivity
    				if ( elementType == Tess2$1.CONNECTED_POLYGONS )
    				{
    					edge = f.anEdge;
    					do
    					{
    						this.elements[nel++] = this.getNeighbourFace_( edge );
    						edge = edge.Lnext;
    					}
    					while (edge !== f.anEdge);
    					// Fill unused.
    					for (i = faceVerts; i < polySize; ++i)
    						this.elements[nel++] = -1;
    				}
    			}
    		},

    	//	void OutputContours( TESStesselator *tess, TESSmesh *mesh, int vertexSize )
    		outputContours_: function( mesh, vertexSize ) {
    			var f;
    			var edge;
    			var start;
    			var startVert = 0;
    			var vertCount = 0;

    			this.vertexCount = 0;
    			this.elementCount = 0;

    			for ( f = mesh.fHead.next; f !== mesh.fHead; f = f.next )
    			{
    				if ( !f.inside ) continue;

    				start = edge = f.anEdge;
    				do
    				{
    					this.vertexCount++;
    					edge = edge.Lnext;
    				}
    				while ( edge !== start );

    				this.elementCount++;
    			}

    	/*		tess->elements = (TESSindex*)tess->alloc.memalloc( tess->alloc.userData,
    															  sizeof(TESSindex) * tess->elementCount * 2 );
    			if (!tess->elements)
    			{
    				tess->outOfMemory = 1;
    				return;
    			}*/
    			this.elements = [];
    			this.elements.length = this.elementCount * 2;
    			
    	/*		tess->vertices = (TESSreal*)tess->alloc.memalloc( tess->alloc.userData,
    															  sizeof(TESSreal) * tess->vertexCount * vertexSize );
    			if (!tess->vertices)
    			{
    				tess->outOfMemory = 1;
    				return;
    			}*/
    			this.vertices = [];
    			this.vertices.length = this.vertexCount * vertexSize;

    	/*		tess->vertexIndices = (TESSindex*)tess->alloc.memalloc( tess->alloc.userData,
    																    sizeof(TESSindex) * tess->vertexCount );
    			if (!tess->vertexIndices)
    			{
    				tess->outOfMemory = 1;
    				return;
    			}*/
    			this.vertexIndices = [];
    			this.vertexIndices.length = this.vertexCount;

    			var nv = 0;
    			var nvi = 0;
    			var nel = 0;
    			startVert = 0;

    			for ( f = mesh.fHead.next; f !== mesh.fHead; f = f.next )
    			{
    				if ( !f.inside ) continue;

    				vertCount = 0;
    				start = edge = f.anEdge;
    				do
    				{
    					this.vertices[nv++] = edge.Org.coords[0];
    					this.vertices[nv++] = edge.Org.coords[1];
    					if ( vertexSize > 2 )
    						this.vertices[nv++] = edge.Org.coords[2];
    					this.vertexIndices[nvi++] = edge.Org.idx;
    					vertCount++;
    					edge = edge.Lnext;
    				}
    				while ( edge !== start );

    				this.elements[nel++] = startVert;
    				this.elements[nel++] = vertCount;

    				startVert += vertCount;
    			}
    		},

    		addContour: function( size, vertices )
    		{
    			var e;
    			var i;

    			if ( this.mesh === null )
    			  	this.mesh = new TESSmesh();
    	/*	 	if ( tess->mesh == NULL ) {
    				tess->outOfMemory = 1;
    				return;
    			}*/

    			if ( size < 2 )
    				size = 2;
    			if ( size > 3 )
    				size = 3;

    			e = null;

    			for( i = 0; i < vertices.length; i += size )
    			{
    				if( e == null ) {
    					/* Make a self-loop (one vertex, one edge). */
    					e = this.mesh.makeEdge();
    	/*				if ( e == NULL ) {
    						tess->outOfMemory = 1;
    						return;
    					}*/
    					this.mesh.splice( e, e.Sym );
    				} else {
    					/* Create a new vertex and edge which immediately follow e
    					* in the ordering around the left face.
    					*/
    					this.mesh.splitEdge( e );
    					e = e.Lnext;
    				}

    				/* The new vertex is now e->Org. */
    				e.Org.coords[0] = vertices[i+0];
    				e.Org.coords[1] = vertices[i+1];
    				if ( size > 2 )
    					e.Org.coords[2] = vertices[i+2];
    				else
    					e.Org.coords[2] = 0.0;
    				/* Store the insertion number so that the vertex can be later recognized. */
    				e.Org.idx = this.vertexIndexCounter++;

    				/* The winding of an edge says how the winding number changes as we
    				* cross from the edge''s right face to its left face.  We add the
    				* vertices in such an order that a CCW contour will add +1 to
    				* the winding number of the region inside the contour.
    				*/
    				e.winding = 1;
    				e.Sym.winding = -1;
    			}
    		},

    	//	int tessTesselate( TESStesselator *tess, int windingRule, int elementType, int polySize, int vertexSize, const TESSreal* normal )
    		tesselate: function( windingRule, elementType, polySize, vertexSize, normal ) {
    			this.vertices = [];
    			this.elements = [];
    			this.vertexIndices = [];

    			this.vertexIndexCounter = 0;
    			
    			if (normal)
    			{
    				this.normal[0] = normal[0];
    				this.normal[1] = normal[1];
    				this.normal[2] = normal[2];
    			}

    			this.windingRule = windingRule;

    			if (vertexSize < 2)
    				vertexSize = 2;
    			if (vertexSize > 3)
    				vertexSize = 3;

    	/*		if (setjmp(tess->env) != 0) { 
    				// come back here if out of memory
    				return 0;
    			}*/

    			if (!this.mesh)
    			{
    				return false;
    			}

    			/* Determine the polygon normal and project vertices onto the plane
    			* of the polygon.
    			*/
    			this.projectPolygon_();

    			/* tessComputeInterior( tess ) computes the planar arrangement specified
    			* by the given contours, and further subdivides this arrangement
    			* into regions.  Each region is marked "inside" if it belongs
    			* to the polygon, according to the rule given by tess->windingRule.
    			* Each interior region is guaranteed be monotone.
    			*/
    			Sweep.computeInterior( this );

    			var mesh = this.mesh;

    			/* If the user wants only the boundary contours, we throw away all edges
    			* except those which separate the interior from the exterior.
    			* Otherwise we tessellate all the regions marked "inside".
    			*/
    			if (elementType == Tess2$1.BOUNDARY_CONTOURS) {
    				this.setWindingNumber_( mesh, 1, true );
    			} else {
    				this.tessellateInterior_( mesh ); 
    			}
    	//		if (rc == 0) longjmp(tess->env,1);  /* could've used a label */

    			mesh.check();

    			if (elementType == Tess2$1.BOUNDARY_CONTOURS) {
    				this.outputContours_( mesh, vertexSize );     /* output contours */
    			}
    			else
    			{
    				this.outputPolymesh_( mesh, elementType, polySize, vertexSize );     /* output polygons */
    			}

    //			tess.mesh = null;

    			return true;
    		}
    	};

    var tess2 = tess2$1;

    var immutable = extend$1;

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    function extend$1() {
        var target = {};

        for (var i = 0; i < arguments.length; i++) {
            var source = arguments[i];

            for (var key in source) {
                if (hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }

        return target
    }

    var Tess2 = tess2;
    var xtend = immutable;

    var triangulateContours = function(contours, opt) {
        opt = opt||{};
        contours = contours.filter(function(c) {
            return c.length>0
        });
        
        if (contours.length === 0) {
            return { 
                positions: [],
                cells: []
            }
        }

        if (typeof opt.vertexSize !== 'number')
            opt.vertexSize = contours[0][0].length;

        //flatten for tess2.js
        contours = contours.map(function(c) {
            return c.reduce(function(a, b) {
                return a.concat(b)
            })
        });

        // Tesselate
        var res = Tess2.tesselate(xtend({
            contours: contours,
            windingRule: Tess2.WINDING_ODD,
            elementType: Tess2.POLYGONS,
            polySize: 3,
            vertexSize: 2
        }, opt));

        var positions = [];
        for (var i=0; i<res.vertices.length; i+=opt.vertexSize) {
            var pos = res.vertices.slice(i, i+opt.vertexSize);
            positions.push(pos);
        }
        
        var cells = [];
        for (i=0; i<res.elements.length; i+=3) {
            var a = res.elements[i],
                b = res.elements[i+1],
                c = res.elements[i+2];
            cells.push([a, b, c]);
        }

        //return a simplicial complex
        return {
            positions: positions,
            cells: cells
        }
    };

    var triangulate = /*@__PURE__*/getDefaultExportFromCjs(triangulateContours);

    function geometryForPath (ctx, path, threshold) {
        var key = path;
        var context = ctx;
        threshold = threshold || 1.0;
        if (!path) {
            return { lines: new Float32Array(), triangles: new Float32Array(), closed: false, z: 0 };
        }
        var cache_entry = context._pathCache[key];
        if (cache_entry !== undefined) {
            return cache_entry;
        }
        // get a list of polylines/contours from svg contents
        var lines = contours(parse$1(path)), tri;
        // simplify the contours before triangulation
        lines = lines.map(function (path) {
            return simplify(path, threshold);
        });
        // triangluate can fail in some corner cases
        try {
            tri = triangulate(lines);
        }
        catch (e) {
            // console.log('Could not triangulate the following path:');
            // console.log(path);
            // console.log(e);
            tri = { positions: [], cells: [] };
        }
        var z = context._randomZ ? 0.25 * (Math.random() - 0.5) : 0;
        var triangles = [];
        var tcl = tri.cells.length, tc = tri.cells, tp = tri.positions;
        for (var ci = 0; ci < tcl; ci++) {
            var cell = tc[ci];
            var p1 = tp[cell[0]];
            var p2 = tp[cell[1]];
            var p3 = tp[cell[2]];
            triangles.push(p1[0], p1[1], z, p2[0], p2[1], z, p3[0], p3[1], z);
        }
        var geom = {
            lines: lines,
            triangles: triangles,
            closed: path.endsWith('Z'),
            z: z,
            key: key
        };
        context._pathCache[key] = geom;
        context._pathCacheSize++;
        if (context._pathCacheSize > 10000) {
            context._pathCache = {};
            context._pathCacheSize = 0;
        }
        return geom;
    }

    function constant(x) {
      return function constant() {
        return x;
      };
    }

    const abs = Math.abs;
    const atan2 = Math.atan2;
    const cos = Math.cos;
    const max = Math.max;
    const min = Math.min;
    const sin = Math.sin;
    const sqrt = Math.sqrt;

    const epsilon$1 = 1e-12;
    const pi$1 = Math.PI;
    const halfPi = pi$1 / 2;
    const tau$1 = 2 * pi$1;

    function acos(x) {
      return x > 1 ? 0 : x < -1 ? pi$1 : Math.acos(x);
    }

    function asin(x) {
      return x >= 1 ? halfPi : x <= -1 ? -halfPi : Math.asin(x);
    }

    const pi = Math.PI,
        tau = 2 * pi,
        epsilon = 1e-6,
        tauEpsilon = tau - epsilon;

    function append(strings) {
      this._ += strings[0];
      for (let i = 1, n = strings.length; i < n; ++i) {
        this._ += arguments[i] + strings[i];
      }
    }

    function appendRound(digits) {
      let d = Math.floor(digits);
      if (!(d >= 0)) throw new Error(`invalid digits: ${digits}`);
      if (d > 15) return append;
      const k = 10 ** d;
      return function(strings) {
        this._ += strings[0];
        for (let i = 1, n = strings.length; i < n; ++i) {
          this._ += Math.round(arguments[i] * k) / k + strings[i];
        }
      };
    }

    class Path {
      constructor(digits) {
        this._x0 = this._y0 = // start of current subpath
        this._x1 = this._y1 = null; // end of current subpath
        this._ = "";
        this._append = digits == null ? append : appendRound(digits);
      }
      moveTo(x, y) {
        this._append`M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}`;
      }
      closePath() {
        if (this._x1 !== null) {
          this._x1 = this._x0, this._y1 = this._y0;
          this._append`Z`;
        }
      }
      lineTo(x, y) {
        this._append`L${this._x1 = +x},${this._y1 = +y}`;
      }
      quadraticCurveTo(x1, y1, x, y) {
        this._append`Q${+x1},${+y1},${this._x1 = +x},${this._y1 = +y}`;
      }
      bezierCurveTo(x1, y1, x2, y2, x, y) {
        this._append`C${+x1},${+y1},${+x2},${+y2},${this._x1 = +x},${this._y1 = +y}`;
      }
      arcTo(x1, y1, x2, y2, r) {
        x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;

        // Is the radius negative? Error.
        if (r < 0) throw new Error(`negative radius: ${r}`);

        let x0 = this._x1,
            y0 = this._y1,
            x21 = x2 - x1,
            y21 = y2 - y1,
            x01 = x0 - x1,
            y01 = y0 - y1,
            l01_2 = x01 * x01 + y01 * y01;

        // Is this path empty? Move to (x1,y1).
        if (this._x1 === null) {
          this._append`M${this._x1 = x1},${this._y1 = y1}`;
        }

        // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
        else if (!(l01_2 > epsilon));

        // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
        // Equivalently, is (x1,y1) coincident with (x2,y2)?
        // Or, is the radius zero? Line to (x1,y1).
        else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
          this._append`L${this._x1 = x1},${this._y1 = y1}`;
        }

        // Otherwise, draw an arc!
        else {
          let x20 = x2 - x0,
              y20 = y2 - y0,
              l21_2 = x21 * x21 + y21 * y21,
              l20_2 = x20 * x20 + y20 * y20,
              l21 = Math.sqrt(l21_2),
              l01 = Math.sqrt(l01_2),
              l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
              t01 = l / l01,
              t21 = l / l21;

          // If the start tangent is not coincident with (x0,y0), line to.
          if (Math.abs(t01 - 1) > epsilon) {
            this._append`L${x1 + t01 * x01},${y1 + t01 * y01}`;
          }

          this._append`A${r},${r},0,0,${+(y01 * x20 > x01 * y20)},${this._x1 = x1 + t21 * x21},${this._y1 = y1 + t21 * y21}`;
        }
      }
      arc(x, y, r, a0, a1, ccw) {
        x = +x, y = +y, r = +r, ccw = !!ccw;

        // Is the radius negative? Error.
        if (r < 0) throw new Error(`negative radius: ${r}`);

        let dx = r * Math.cos(a0),
            dy = r * Math.sin(a0),
            x0 = x + dx,
            y0 = y + dy,
            cw = 1 ^ ccw,
            da = ccw ? a0 - a1 : a1 - a0;

        // Is this path empty? Move to (x0,y0).
        if (this._x1 === null) {
          this._append`M${x0},${y0}`;
        }

        // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
        else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
          this._append`L${x0},${y0}`;
        }

        // Is this arc empty? We’re done.
        if (!r) return;

        // Does the angle go the wrong way? Flip the direction.
        if (da < 0) da = da % tau + tau;

        // Is this a complete circle? Draw two arcs to complete the circle.
        if (da > tauEpsilon) {
          this._append`A${r},${r},0,1,${cw},${x - dx},${y - dy}A${r},${r},0,1,${cw},${this._x1 = x0},${this._y1 = y0}`;
        }

        // Is this arc non-empty? Draw an arc!
        else if (da > epsilon) {
          this._append`A${r},${r},0,${+(da >= pi)},${cw},${this._x1 = x + r * Math.cos(a1)},${this._y1 = y + r * Math.sin(a1)}`;
        }
      }
      rect(x, y, w, h) {
        this._append`M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}h${w = +w}v${+h}h${-w}Z`;
      }
      toString() {
        return this._;
      }
    }

    function withPath(shape) {
      let digits = 3;

      shape.digits = function(_) {
        if (!arguments.length) return digits;
        if (_ == null) {
          digits = null;
        } else {
          const d = Math.floor(_);
          if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
          digits = d;
        }
        return shape;
      };

      return () => new Path(digits);
    }

    function arcInnerRadius(d) {
      return d.innerRadius;
    }

    function arcOuterRadius(d) {
      return d.outerRadius;
    }

    function arcStartAngle(d) {
      return d.startAngle;
    }

    function arcEndAngle(d) {
      return d.endAngle;
    }

    function arcPadAngle(d) {
      return d && d.padAngle; // Note: optional!
    }

    function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
      var x10 = x1 - x0, y10 = y1 - y0,
          x32 = x3 - x2, y32 = y3 - y2,
          t = y32 * x10 - x32 * y10;
      if (t * t < epsilon$1) return;
      t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / t;
      return [x0 + t * x10, y0 + t * y10];
    }

    // Compute perpendicular offset line of length rc.
    // http://mathworld.wolfram.com/Circle-LineIntersection.html
    function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
      var x01 = x0 - x1,
          y01 = y0 - y1,
          lo = (cw ? rc : -rc) / sqrt(x01 * x01 + y01 * y01),
          ox = lo * y01,
          oy = -lo * x01,
          x11 = x0 + ox,
          y11 = y0 + oy,
          x10 = x1 + ox,
          y10 = y1 + oy,
          x00 = (x11 + x10) / 2,
          y00 = (y11 + y10) / 2,
          dx = x10 - x11,
          dy = y10 - y11,
          d2 = dx * dx + dy * dy,
          r = r1 - rc,
          D = x11 * y10 - x10 * y11,
          d = (dy < 0 ? -1 : 1) * sqrt(max(0, r * r * d2 - D * D)),
          cx0 = (D * dy - dx * d) / d2,
          cy0 = (-D * dx - dy * d) / d2,
          cx1 = (D * dy + dx * d) / d2,
          cy1 = (-D * dx + dy * d) / d2,
          dx0 = cx0 - x00,
          dy0 = cy0 - y00,
          dx1 = cx1 - x00,
          dy1 = cy1 - y00;

      // Pick the closer of the two intersection points.
      // TODO Is there a faster way to determine which intersection to use?
      if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

      return {
        cx: cx0,
        cy: cy0,
        x01: -ox,
        y01: -oy,
        x11: cx0 * (r1 / r - 1),
        y11: cy0 * (r1 / r - 1)
      };
    }

    function d3_arc() {
      var innerRadius = arcInnerRadius,
          outerRadius = arcOuterRadius,
          cornerRadius = constant(0),
          padRadius = null,
          startAngle = arcStartAngle,
          endAngle = arcEndAngle,
          padAngle = arcPadAngle,
          context = null,
          path = withPath(arc);

      function arc() {
        var buffer,
            r,
            r0 = +innerRadius.apply(this, arguments),
            r1 = +outerRadius.apply(this, arguments),
            a0 = startAngle.apply(this, arguments) - halfPi,
            a1 = endAngle.apply(this, arguments) - halfPi,
            da = abs(a1 - a0),
            cw = a1 > a0;

        if (!context) context = buffer = path();

        // Ensure that the outer radius is always larger than the inner radius.
        if (r1 < r0) r = r1, r1 = r0, r0 = r;

        // Is it a point?
        if (!(r1 > epsilon$1)) context.moveTo(0, 0);

        // Or is it a circle or annulus?
        else if (da > tau$1 - epsilon$1) {
          context.moveTo(r1 * cos(a0), r1 * sin(a0));
          context.arc(0, 0, r1, a0, a1, !cw);
          if (r0 > epsilon$1) {
            context.moveTo(r0 * cos(a1), r0 * sin(a1));
            context.arc(0, 0, r0, a1, a0, cw);
          }
        }

        // Or is it a circular or annular sector?
        else {
          var a01 = a0,
              a11 = a1,
              a00 = a0,
              a10 = a1,
              da0 = da,
              da1 = da,
              ap = padAngle.apply(this, arguments) / 2,
              rp = (ap > epsilon$1) && (padRadius ? +padRadius.apply(this, arguments) : sqrt(r0 * r0 + r1 * r1)),
              rc = min(abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
              rc0 = rc,
              rc1 = rc,
              t0,
              t1;

          // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
          if (rp > epsilon$1) {
            var p0 = asin(rp / r0 * sin(ap)),
                p1 = asin(rp / r1 * sin(ap));
            if ((da0 -= p0 * 2) > epsilon$1) p0 *= (cw ? 1 : -1), a00 += p0, a10 -= p0;
            else da0 = 0, a00 = a10 = (a0 + a1) / 2;
            if ((da1 -= p1 * 2) > epsilon$1) p1 *= (cw ? 1 : -1), a01 += p1, a11 -= p1;
            else da1 = 0, a01 = a11 = (a0 + a1) / 2;
          }

          var x01 = r1 * cos(a01),
              y01 = r1 * sin(a01),
              x10 = r0 * cos(a10),
              y10 = r0 * sin(a10);

          // Apply rounded corners?
          if (rc > epsilon$1) {
            var x11 = r1 * cos(a11),
                y11 = r1 * sin(a11),
                x00 = r0 * cos(a00),
                y00 = r0 * sin(a00),
                oc;

            // Restrict the corner radius according to the sector angle. If this
            // intersection fails, it’s probably because the arc is too small, so
            // disable the corner radius entirely.
            if (da < pi$1) {
              if (oc = intersect(x01, y01, x00, y00, x11, y11, x10, y10)) {
                var ax = x01 - oc[0],
                    ay = y01 - oc[1],
                    bx = x11 - oc[0],
                    by = y11 - oc[1],
                    kc = 1 / sin(acos((ax * bx + ay * by) / (sqrt(ax * ax + ay * ay) * sqrt(bx * bx + by * by))) / 2),
                    lc = sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
                rc0 = min(rc, (r0 - lc) / (kc - 1));
                rc1 = min(rc, (r1 - lc) / (kc + 1));
              } else {
                rc0 = rc1 = 0;
              }
            }
          }

          // Is the sector collapsed to a line?
          if (!(da1 > epsilon$1)) context.moveTo(x01, y01);

          // Does the sector’s outer ring have rounded corners?
          else if (rc1 > epsilon$1) {
            t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
            t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);

            context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

            // Have the corners merged?
            if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

            // Otherwise, draw the two corners and the ring.
            else {
              context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
              context.arc(0, 0, r1, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
              context.arc(t1.cx, t1.cy, rc1, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
            }
          }

          // Or is the outer ring just a circular arc?
          else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

          // Is there no inner ring, and it’s a circular sector?
          // Or perhaps it’s an annular sector collapsed due to padding?
          if (!(r0 > epsilon$1) || !(da0 > epsilon$1)) context.lineTo(x10, y10);

          // Does the sector’s inner ring (or point) have rounded corners?
          else if (rc0 > epsilon$1) {
            t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
            t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);

            context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

            // Have the corners merged?
            if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

            // Otherwise, draw the two corners and the ring.
            else {
              context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
              context.arc(0, 0, r0, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
              context.arc(t1.cx, t1.cy, rc0, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
            }
          }

          // Or is the inner ring just a circular arc?
          else context.arc(0, 0, r0, a10, a00, cw);
        }

        context.closePath();

        if (buffer) return context = null, buffer + "" || null;
      }

      arc.centroid = function() {
        var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
            a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi$1 / 2;
        return [cos(a) * r, sin(a) * r];
      };

      arc.innerRadius = function(_) {
        return arguments.length ? (innerRadius = typeof _ === "function" ? _ : constant(+_), arc) : innerRadius;
      };

      arc.outerRadius = function(_) {
        return arguments.length ? (outerRadius = typeof _ === "function" ? _ : constant(+_), arc) : outerRadius;
      };

      arc.cornerRadius = function(_) {
        return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : constant(+_), arc) : cornerRadius;
      };

      arc.padRadius = function(_) {
        return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : constant(+_), arc) : padRadius;
      };

      arc.startAngle = function(_) {
        return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant(+_), arc) : startAngle;
      };

      arc.endAngle = function(_) {
        return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant(+_), arc) : endAngle;
      };

      arc.padAngle = function(_) {
        return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant(+_), arc) : padAngle;
      };

      arc.context = function(_) {
        return arguments.length ? ((context = _ == null ? null : _), arc) : context;
      };

      return arc;
    }

    function array(x) {
      return typeof x === "object" && "length" in x
        ? x // Array, TypedArray, NodeList, array-like
        : Array.from(x); // Map, Set, iterable, string, or anything else
    }

    function Linear(context) {
      this._context = context;
    }

    Linear.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._point = 0;
      },
      lineEnd: function() {
        if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x, y) {
        x = +x, y = +y;
        switch (this._point) {
          case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
          case 1: this._point = 2; // falls through
          default: this._context.lineTo(x, y); break;
        }
      }
    };

    function curveLinear(context) {
      return new Linear(context);
    }

    function x$1(p) {
      return p[0];
    }

    function y$1(p) {
      return p[1];
    }

    function d3_line(x, y) {
      var defined = constant(true),
          context = null,
          curve = curveLinear,
          output = null,
          path = withPath(line);

      x = typeof x === "function" ? x : (x === undefined) ? x$1 : constant(x);
      y = typeof y === "function" ? y : (y === undefined) ? y$1 : constant(y);

      function line(data) {
        var i,
            n = (data = array(data)).length,
            d,
            defined0 = false,
            buffer;

        if (context == null) output = curve(buffer = path());

        for (i = 0; i <= n; ++i) {
          if (!(i < n && defined(d = data[i], i, data)) === defined0) {
            if (defined0 = !defined0) output.lineStart();
            else output.lineEnd();
          }
          if (defined0) output.point(+x(d, i, data), +y(d, i, data));
        }

        if (buffer) return output = null, buffer + "" || null;
      }

      line.x = function(_) {
        return arguments.length ? (x = typeof _ === "function" ? _ : constant(+_), line) : x;
      };

      line.y = function(_) {
        return arguments.length ? (y = typeof _ === "function" ? _ : constant(+_), line) : y;
      };

      line.defined = function(_) {
        return arguments.length ? (defined = typeof _ === "function" ? _ : constant(!!_), line) : defined;
      };

      line.curve = function(_) {
        return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
      };

      line.context = function(_) {
        return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
      };

      return line;
    }

    function d3_area(x0, y0, y1) {
      var x1 = null,
          defined = constant(true),
          context = null,
          curve = curveLinear,
          output = null,
          path = withPath(area);

      x0 = typeof x0 === "function" ? x0 : (x0 === undefined) ? x$1 : constant(+x0);
      y0 = typeof y0 === "function" ? y0 : (y0 === undefined) ? constant(0) : constant(+y0);
      y1 = typeof y1 === "function" ? y1 : (y1 === undefined) ? y$1 : constant(+y1);

      function area(data) {
        var i,
            j,
            k,
            n = (data = array(data)).length,
            d,
            defined0 = false,
            buffer,
            x0z = new Array(n),
            y0z = new Array(n);

        if (context == null) output = curve(buffer = path());

        for (i = 0; i <= n; ++i) {
          if (!(i < n && defined(d = data[i], i, data)) === defined0) {
            if (defined0 = !defined0) {
              j = i;
              output.areaStart();
              output.lineStart();
            } else {
              output.lineEnd();
              output.lineStart();
              for (k = i - 1; k >= j; --k) {
                output.point(x0z[k], y0z[k]);
              }
              output.lineEnd();
              output.areaEnd();
            }
          }
          if (defined0) {
            x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
            output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
          }
        }

        if (buffer) return output = null, buffer + "" || null;
      }

      function arealine() {
        return d3_line().defined(defined).curve(curve).context(context);
      }

      area.x = function(_) {
        return arguments.length ? (x0 = typeof _ === "function" ? _ : constant(+_), x1 = null, area) : x0;
      };

      area.x0 = function(_) {
        return arguments.length ? (x0 = typeof _ === "function" ? _ : constant(+_), area) : x0;
      };

      area.x1 = function(_) {
        return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : constant(+_), area) : x1;
      };

      area.y = function(_) {
        return arguments.length ? (y0 = typeof _ === "function" ? _ : constant(+_), y1 = null, area) : y0;
      };

      area.y0 = function(_) {
        return arguments.length ? (y0 = typeof _ === "function" ? _ : constant(+_), area) : y0;
      };

      area.y1 = function(_) {
        return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : constant(+_), area) : y1;
      };

      area.lineX0 =
      area.lineY0 = function() {
        return arealine().x(x0).y(y0);
      };

      area.lineY1 = function() {
        return arealine().x(x0).y(y1);
      };

      area.lineX1 = function() {
        return arealine().x(x1).y(y0);
      };

      area.defined = function(_) {
        return arguments.length ? (defined = typeof _ === "function" ? _ : constant(!!_), area) : defined;
      };

      area.curve = function(_) {
        return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
      };

      area.context = function(_) {
        return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
      };

      return area;
    }

    var circle = {
      draw(context, size) {
        const r = sqrt(size / pi$1);
        context.moveTo(r, 0);
        context.arc(0, 0, r, 0, tau$1);
      }
    };

    function Symbol$1(type, size) {
      let context = null,
          path = withPath(symbol);

      type = typeof type === "function" ? type : constant(type || circle);
      size = typeof size === "function" ? size : constant(size === undefined ? 64 : +size);

      function symbol() {
        let buffer;
        if (!context) context = buffer = path();
        type.apply(this, arguments).draw(context, +size.apply(this, arguments));
        if (buffer) return context = null, buffer + "" || null;
      }

      symbol.type = function(_) {
        return arguments.length ? (type = typeof _ === "function" ? _ : constant(_), symbol) : type;
      };

      symbol.size = function(_) {
        return arguments.length ? (size = typeof _ === "function" ? _ : constant(+_), symbol) : size;
      };

      symbol.context = function(_) {
        return arguments.length ? (context = _ == null ? null : _, symbol) : context;
      };

      return symbol;
    }

    function x(item) { return item.x || 0; }
    function y(item) { return item.y || 0; }
    function w(item) { return item.width || 0; }
    function wh(item) { return item.width || item.height || 1; }
    function h(item) { return item.height || 0; }
    function xw(item) { return (item.x || 0) + (item.width || 0); }
    function yh(item) { return (item.y || 0) + (item.height || 0); }
    function cr(item) { return item.cornerRadius || 0; }
    function pa(item) { return item.padAngle || 0; }
    function def(item) { return !(item.defined === false); }
    function size(item) { return item.size == null ? 64 : item.size; }
    function type(item) { return vegaScenegraph.pathSymbols(item.shape || 'circle'); }
    var arcShape = d3_arc().cornerRadius(cr).padAngle(pa), areavShape = d3_area().x(x).y1(y).y0(yh).defined(def), areahShape = d3_area().y(y).x1(x).x0(xw).defined(def); d3_line().x(x).y(y).defined(def); var trailShape = vegaScenegraph.pathTrail().x(x).y(y).defined(def).size(wh); vegaScenegraph.pathRectangle().x(x).y(y).width(w).height(h).cornerRadius(cr); vegaScenegraph.pathRectangle().x(0).y(0).width(w).height(h).cornerRadius(cr); Symbol$1().type(type).size(size);
    function arc$1(context, item) {
        if (!context || context.arc) {
            return arcShape.context(context)(item);
        }
        return geometryForPath(context, arcShape.context(null)(item), 0.1);
    }
    function area$1(context, items) {
        var item = items[0], interp = item.interpolate || 'linear', s = (interp === 'trail' ? trailShape
            : (item.orient === 'horizontal' ? areahShape : areavShape)
                .curve(vegaScenegraph.pathCurves(interp, item.orient, item.tension)));
        if (!context || context.arc) {
            return s.context(context)(items);
        }
        return geometryForPath(context, s.context(null)(items), 0.1);
    }
    function shape$1(context, item) {
        var s = item.mark.shape || item.shape;
        if (!context || context.arc) {
            return s.context(context)(item);
        }
        return geometryForPath(context, s.context(null)(item), 0.1);
    }

    var asNumber = function numtype(num, def) {
    	return typeof num === 'number'
    		? num 
    		: (typeof def === 'number' ? def : 0)
    };

    var copy_1 = copy;

    /**
     * Copy the values from one vec2 to another
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the source vector
     * @returns {vec2} out
     */
    function copy(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        return out
    }

    var scaleAndAdd_1 = scaleAndAdd;

    /**
     * Adds two vec2's after scaling the second operand by a scalar value
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @param {Number} scale the amount to scale b by before adding
     * @returns {vec2} out
     */
    function scaleAndAdd(out, a, b, scale) {
        out[0] = a[0] + (b[0] * scale);
        out[1] = a[1] + (b[1] * scale);
        return out
    }

    var dot_1 = dot;

    /**
     * Calculates the dot product of two vec2's
     *
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {Number} dot product of a and b
     */
    function dot(a, b) {
        return a[0] * b[0] + a[1] * b[1]
    }

    function clone(arr) {
        return [arr[0], arr[1]]
    }

    function create() {
        return [0, 0]
    }

    var vecutil = {
        create: create,
        clone: clone,
        copy: copy_1,
        scaleAndAdd: scaleAndAdd_1,
        dot: dot_1
    };

    var polylineMiterUtil = {};

    var add_1;
    var hasRequiredAdd;

    function requireAdd () {
    	if (hasRequiredAdd) return add_1;
    	hasRequiredAdd = 1;
    	add_1 = add;

    	/**
    	 * Adds two vec2's
    	 *
    	 * @param {vec2} out the receiving vector
    	 * @param {vec2} a the first operand
    	 * @param {vec2} b the second operand
    	 * @returns {vec2} out
    	 */
    	function add(out, a, b) {
    	    out[0] = a[0] + b[0];
    	    out[1] = a[1] + b[1];
    	    return out
    	}
    	return add_1;
    }

    var set_1;
    var hasRequiredSet;

    function requireSet () {
    	if (hasRequiredSet) return set_1;
    	hasRequiredSet = 1;
    	set_1 = set;

    	/**
    	 * Set the components of a vec2 to the given values
    	 *
    	 * @param {vec2} out the receiving vector
    	 * @param {Number} x X component
    	 * @param {Number} y Y component
    	 * @returns {vec2} out
    	 */
    	function set(out, x, y) {
    	    out[0] = x;
    	    out[1] = y;
    	    return out
    	}
    	return set_1;
    }

    var normalize_1;
    var hasRequiredNormalize;

    function requireNormalize () {
    	if (hasRequiredNormalize) return normalize_1;
    	hasRequiredNormalize = 1;
    	normalize_1 = normalize;

    	/**
    	 * Normalize a vec2
    	 *
    	 * @param {vec2} out the receiving vector
    	 * @param {vec2} a vector to normalize
    	 * @returns {vec2} out
    	 */
    	function normalize(out, a) {
    	    var x = a[0],
    	        y = a[1];
    	    var len = x*x + y*y;
    	    if (len > 0) {
    	        //TODO: evaluate use of glm_invsqrt here?
    	        len = 1 / Math.sqrt(len);
    	        out[0] = a[0] * len;
    	        out[1] = a[1] * len;
    	    }
    	    return out
    	}
    	return normalize_1;
    }

    var subtract_1;
    var hasRequiredSubtract;

    function requireSubtract () {
    	if (hasRequiredSubtract) return subtract_1;
    	hasRequiredSubtract = 1;
    	subtract_1 = subtract;

    	/**
    	 * Subtracts vector b from vector a
    	 *
    	 * @param {vec2} out the receiving vector
    	 * @param {vec2} a the first operand
    	 * @param {vec2} b the second operand
    	 * @returns {vec2} out
    	 */
    	function subtract(out, a, b) {
    	    out[0] = a[0] - b[0];
    	    out[1] = a[1] - b[1];
    	    return out
    	}
    	return subtract_1;
    }

    var hasRequiredPolylineMiterUtil;

    function requirePolylineMiterUtil () {
    	if (hasRequiredPolylineMiterUtil) return polylineMiterUtil;
    	hasRequiredPolylineMiterUtil = 1;
    	var add = requireAdd();
    	var set = requireSet();
    	var normalize = requireNormalize();
    	var subtract = requireSubtract();
    	var dot = dot_1;

    	var tmp = [0, 0];

    	polylineMiterUtil.computeMiter = function computeMiter(tangent, miter, lineA, lineB, halfThick) {
    	    //get tangent line
    	    add(tangent, lineA, lineB);
    	    normalize(tangent, tangent);

    	    //get miter as a unit vector
    	    set(miter, -tangent[1], tangent[0]);
    	    set(tmp, -lineA[1], lineA[0]);

    	    //get the necessary length of our miter
    	    return halfThick / dot(miter, tmp)
    	};

    	polylineMiterUtil.normal = function normal(out, dir) {
    	    //get perpendicular
    	    set(out, -dir[1], dir[0]);
    	    return out
    	};

    	polylineMiterUtil.direction = function direction(out, a, b) {
    	    //get unit dir of two lines
    	    subtract(out, a, b);
    	    normalize(out, out);
    	    return out
    	};
    	return polylineMiterUtil;
    }

    var number = asNumber;
    var vec = vecutil;

    var tmp = vec.create();
    var capEnd = vec.create();
    var lineA = vec.create();
    var lineB = vec.create();
    var tangent = vec.create();
    var miter = vec.create();

    var util = requirePolylineMiterUtil();
    var computeMiter = util.computeMiter,
        normal = util.normal,
        direction = util.direction;

    function Stroke(opt) {
        if (!(this instanceof Stroke))
            return new Stroke(opt)
        opt = opt||{};
        this.miterLimit = number(opt.miterLimit, 10);
        this.thickness = number(opt.thickness, 1);
        this.join = opt.join || 'miter';
        this.cap = opt.cap || 'butt';
        this._normal = null;
        this._lastFlip = -1;
        this._started = false;
    }

    Stroke.prototype.mapThickness = function(point, i, points) {
        return this.thickness
    };

    Stroke.prototype.build = function(points) {
        var complex = {
            positions: [],
            cells: []
        };

        if (points.length <= 1)
            return complex

        var total = points.length;

        //clear flags
        this._lastFlip = -1;
        this._started = false;
        this._normal = null;

        //join each segment
        for (var i=1, count=0; i<total; i++) {
            var last = points[i-1];
            var cur = points[i];
            var next = i<points.length-1 ? points[i+1] : null;
            var thickness = this.mapThickness(cur, i, points);
            var amt = this._seg(complex, count, last, cur, next, thickness/2);
            count += amt;
        }
        return complex
    };

    Stroke.prototype._seg = function(complex, index, last, cur, next, halfThick) {
        var count = 0;
        var cells = complex.cells;
        var positions = complex.positions;
        var capSquare = this.cap === 'square';
        var joinBevel = this.join === 'bevel';

        //get unit direction of line
        direction(lineA, cur, last);

        //if we don't yet have a normal from previous join,
        //compute based on line start - end
        if (!this._normal) {
            this._normal = vec.create();
            normal(this._normal, lineA);
        }

        //if we haven't started yet, add the first two points
        if (!this._started) {
            this._started = true;

            //if the end cap is type square, we can just push the verts out a bit
            if (capSquare) {
                vec.scaleAndAdd(capEnd, last, lineA, -halfThick);
                last = capEnd;
            }

            extrusions(positions, last, this._normal, halfThick);
        }

        cells.push([index+0, index+1, index+2]);

        /*
        // now determine the type of join with next segment

        - round (TODO)
        - bevel 
        - miter
        - none (i.e. no next segment, use normal)
         */
        
        if (!next) { //no next segment, simple extrusion
            //now reset normal to finish cap
            normal(this._normal, lineA);

            //push square end cap out a bit
            if (capSquare) {
                vec.scaleAndAdd(capEnd, cur, lineA, halfThick);
                cur = capEnd;
            }

            extrusions(positions, cur, this._normal, halfThick);
            cells.push(this._lastFlip===1 ? [index, index+2, index+3] : [index+2, index+1, index+3]);

            count += 2;
         } else { //we have a next segment, start with miter
            //get unit dir of next line
            direction(lineB, next, cur);

            //stores tangent & miter
            var miterLen = computeMiter(tangent, miter, lineA, lineB, halfThick);

            // normal(tmp, lineA)
            
            //get orientation
            var flip = (vec.dot(tangent, this._normal) < 0) ? -1 : 1;

            var bevel = joinBevel;
            if (!bevel && this.join === 'miter') {
                var limit = miterLen / (halfThick);
                if (limit > this.miterLimit)
                    bevel = true;
            }

            if (bevel) {    
                //next two points in our first segment
                vec.scaleAndAdd(tmp, cur, this._normal, -halfThick * flip);
                positions.push(vec.clone(tmp));
                vec.scaleAndAdd(tmp, cur, miter, miterLen * flip);
                positions.push(vec.clone(tmp));


                cells.push(this._lastFlip!==-flip
                        ? [index, index+2, index+3] 
                        : [index+2, index+1, index+3]);

                //now add the bevel triangle
                cells.push([index+2, index+3, index+4]);

                normal(tmp, lineB);
                vec.copy(this._normal, tmp); //store normal for next round

                vec.scaleAndAdd(tmp, cur, tmp, -halfThick*flip);
                positions.push(vec.clone(tmp));

                // //the miter is now the normal for our next join
                count += 3;
            } else { //miter
                //next two points for our miter join
                extrusions(positions, cur, miter, miterLen);
                cells.push(this._lastFlip===1
                        ? [index, index+2, index+3] 
                        : [index+2, index+1, index+3]);

                flip = -1;

                //the miter is now the normal for our next join
                vec.copy(this._normal, miter);
                count += 2;
            }
            this._lastFlip = flip;
         }
         return count
    };

    function extrusions(positions, point, normal, scale) {
        //next two points to end our segment
        vec.scaleAndAdd(tmp, point, normal, -scale);
        positions.push(vec.clone(tmp));

        vec.scaleAndAdd(tmp, point, normal, scale);
        positions.push(vec.clone(tmp));
    }

    var extrudePolyline = Stroke;

    var extrude = /*@__PURE__*/getDefaultExportFromCjs(extrudePolyline);

    function geometryForItem (context, item, shapeGeom, cache) {
        if (cache === void 0) { cache = false; }
        if (cache && shapeGeom.key) {
            var entry = context._geometryCache[shapeGeom.key];
            if (entry)
                return entry;
        }
        var lw = (lw = item.strokeWidth) != null ? lw : 1, lc = (lc = item.strokeCap) != null ? lc : 'butt';
        var strokeMeshes = [];
        var i, len, c, li, ci, mesh, cell, p1, p2, p3, mp, mc, mcl, n = 0, ns = 0, fill = false, stroke = false;
        var opacity = item.opacity == null ? 1 : item.opacity;
        var fillOpacity = opacity * (item.fillOpacity == null ? 1 : item.fillOpacity);
        var strokeOpacity = opacity * (item.strokeOpacity == null ? 1 : item.strokeOpacity), strokeExtrude, z = shapeGeom.z || 0, st = shapeGeom.triangles, val;
        if (item.fill === 'transparent') {
            fillOpacity = 0;
        }
        if (item.fill && fillOpacity > 0) {
            fill = true;
            n = st ? st.length / 9 : 0;
        }
        if (item.stroke === 'transparent') {
            strokeOpacity = 0;
        }
        if (lw > 0 && item.stroke && strokeOpacity > 0) {
            stroke = true;
            strokeExtrude = extrude({
                thickness: lw,
                cap: lc,
                join: 'miter',
                miterLimit: 1,
                closed: !!shapeGeom.closed
            });
            for (li = 0; li < shapeGeom.lines.length; li++) {
                mesh = strokeExtrude.build(shapeGeom.lines[li]);
                strokeMeshes.push(mesh);
                ns += mesh.cells.length;
            }
        }
        var triangles = new Float32Array(n * 3 * 3);
        var sTriangles = new Float32Array(ns * 3 * 3);
        var colors = new Float32Array(n * 3 * 4);
        var sColors = new Float32Array(ns * 3 * 4);
        if (fill) {
            c = Color.from(item.fill);
            for (i = 0, len = st.length; i < len; i += 3) {
                triangles[i] = st[i];
                triangles[i + 1] = st[i + 1];
                triangles[i + 2] = st[i + 2];
            }
            for (i = 0, len = st.length / 3; i < len; i++) {
                colors[i * 4] = c[0];
                colors[i * 4 + 1] = c[1];
                colors[i * 4 + 2] = c[2];
                colors[i * 4 + 3] = fillOpacity;
            }
        }
        if (stroke) {
            z = -0.1;
            c = Color.from(item.stroke);
            i = 0;
            for (li = 0; li < strokeMeshes.length; li++) {
                mesh = strokeMeshes[li],
                    mp = mesh.positions,
                    mc = mesh.cells,
                    mcl = mesh.cells.length;
                for (ci = 0; ci < mcl; ci++) {
                    cell = mc[ci];
                    p1 = mp[cell[0]];
                    p2 = mp[cell[1]];
                    p3 = mp[cell[2]];
                    sTriangles[i * 3] = p1[0];
                    sTriangles[i * 3 + 1] = p1[1];
                    sTriangles[i * 3 + 2] = z;
                    sColors[i * 4] = c[0];
                    sColors[i * 4 + 1] = c[1];
                    sColors[i * 4 + 2] = c[2];
                    sColors[i * 4 + 3] = strokeOpacity;
                    i++;
                    sTriangles[i * 3] = p2[0];
                    sTriangles[i * 3 + 1] = p2[1];
                    sTriangles[i * 3 + 2] = z;
                    sColors[i * 4] = c[0];
                    sColors[i * 4 + 1] = c[1];
                    sColors[i * 4 + 2] = c[2];
                    sColors[i * 4 + 3] = strokeOpacity;
                    i++;
                    sTriangles[i * 3] = p3[0];
                    sTriangles[i * 3 + 1] = p3[1];
                    sTriangles[i * 3 + 2] = z;
                    sColors[i * 4] = c[0];
                    sColors[i * 4 + 1] = c[1];
                    sColors[i * 4 + 2] = c[2];
                    sColors[i * 4 + 3] = strokeOpacity;
                    i++;
                }
            }
        }
        val = {
            fillTriangles: triangles,
            strokeTriangles: sTriangles,
            fill: colors,
            stroke: sColors,
            fillCount: n * 3,
            strokeCount: ns * 3,
        };
        context._geometryCache[shapeGeom.key] = val;
        context._geometryCacheSize++;
        if (context._geometryCacheSize > 10000) {
            context._geometryCache = {};
            context._geometryCacheSize = 0;
        }
        return val;
    }

    var drawName$9 = 'Arc';
    var arc = {
        type: 'arc',
        draw: draw$a
    };
    var _device$8 = null;
    var _bufferManager$8 = null;
    var _shader$8 = null;
    var _vertextBufferManager$8 = null;
    var _pipeline$8 = null;
    var _renderPassDescriptor$8 = null;
    var isInitialized$8 = false;
    function initialize$8(device, ctx, vb) {
        if (_device$8 != device) {
            _device$8 = device;
            isInitialized$8 = false;
        }
        if (!isInitialized$8 || true) {
            _bufferManager$8 = new BufferManager(device, drawName$9, ctx._uniforms.resolution, [vb.x1, vb.y1]);
            _shader$8 = ctx._shaderCache["Arc"];
            _vertextBufferManager$8 = new VertexBufferManager(['float32x3', 'float32x4'], // position, color
            ['float32x2'] // center
            );
            _pipeline$8 = Renderer.createRenderPipeline(drawName$9, device, _shader$8, Renderer.colorFormat, _vertextBufferManager$8.getBuffers());
            _renderPassDescriptor$8 = Renderer.createRenderPassDescriptor(drawName$9, ctx.background, ctx.depthTexture.createView());
            isInitialized$8 = true;
        }
        _renderPassDescriptor$8.colorAttachments[0].view = ctx.getCurrentTexture().createView();
    }
    function draw$a(device, ctx, scene, vb) {
        var items = scene.items;
        if (!(items === null || items === void 0 ? void 0 : items.length)) {
            return;
        }
        initialize$8(device, ctx, vb);
        _bufferManager$8.setResolution(ctx._uniforms.resolution);
        _bufferManager$8.setOffset([vb.x1, vb.y1]);
        var uniformBuffer = _bufferManager$8.createUniformBuffer();
        var uniformBindGroup = Renderer.createUniformBindGroup(drawName$9, device, _pipeline$8, uniformBuffer);
        for (var itemStr in items) {
            var item = items[itemStr];
            var geometryData = createGeometryData$3(ctx, item);
            for (var i = 0; i < geometryData.length; i++) {
                var geometryCount = geometryData[i].length / _vertextBufferManager$8.getVertexLength();
                if (geometryCount == 0)
                    continue;
                var geometryBuffer = _bufferManager$8.createGeometryBuffer(geometryData[i]);
                var instanceBuffer = _bufferManager$8.createInstanceBuffer(createPosition(item));
                Renderer.queue2(device, _pipeline$8, _renderPassDescriptor$8, [geometryCount], [geometryBuffer, instanceBuffer], [uniformBindGroup]);
            }
        }
    }
    function createPosition(item) {
        var _a = item.x, x = _a === void 0 ? 0 : _a, _b = item.y, y = _b === void 0 ? 0 : _b;
        return Float32Array.from([x, y]);
    }
    function createGeometryData$3(context, item) {
        // @ts-ignore
        var shapeGeom = arc$1(context, item);
        var geometry = geometryForItem(context, item, shapeGeom);
        var geometryData = new Float32Array(geometry.fillCount * 7);
        var strokeGeometryData = new Float32Array(geometry.strokeCount * 7);
        var fill = Color.from(item.fill, item.opacity, item.fillOpacity);
        var stroke = Color.from(item.stroke, item.opacity, item.strokeOpacity);
        for (var i = 0; i < geometry.fillCount; i++) {
            geometryData[i * 7] = geometry.fillTriangles[i * 3];
            geometryData[i * 7 + 1] = geometry.fillTriangles[i * 3 + 1];
            geometryData[i * 7 + 2] = geometry.fillTriangles[i * 3 + 2] * -1;
            geometryData[i * 7 + 3] = fill.r;
            geometryData[i * 7 + 4] = fill.g;
            geometryData[i * 7 + 5] = fill.b;
            geometryData[i * 7 + 6] = fill.a;
        }
        for (var i = 0; i < geometry.strokeCount; i++) {
            strokeGeometryData[i * 7] = geometry.strokeTriangles[i * 3];
            strokeGeometryData[i * 7 + 1] = geometry.strokeTriangles[i * 3 + 1];
            strokeGeometryData[i * 7 + 2] = geometry.strokeTriangles[i * 3 + 2] * -1;
            strokeGeometryData[i * 7 + 3] = stroke.r;
            strokeGeometryData[i * 7 + 4] = stroke.g;
            strokeGeometryData[i * 7 + 5] = stroke.b;
            strokeGeometryData[i * 7 + 6] = stroke.a;
        }
        return [geometryData, strokeGeometryData];
    }

    var drawName$8 = 'Area';
    var area = {
        type: 'area',
        draw: draw$9
    };
    var _device$7 = null;
    var _bufferManager$7 = null;
    var _shader$7 = null;
    var _vertextBufferManager$7 = null;
    var _pipeline$7 = null;
    var _renderPassDescriptor$7 = null;
    var isInitialized$7 = false;
    function initialize$7(device, ctx, vb) {
        if (_device$7 != device) {
            _device$7 = device;
            isInitialized$7 = false;
        }
        if (!isInitialized$7) {
            _bufferManager$7 = new BufferManager(device, drawName$8, ctx._uniforms.resolution, [vb.x1, vb.y1]);
            _shader$7 = ctx._shaderCache["Area"];
            _vertextBufferManager$7 = new VertexBufferManager(['float32x3', 'float32x4'], // position, color
            [] // center
            );
            _pipeline$7 = Renderer.createRenderPipeline(drawName$8, device, _shader$7, Renderer.colorFormat, _vertextBufferManager$7.getBuffers());
            _renderPassDescriptor$7 = Renderer.createRenderPassDescriptor(drawName$8, ctx.background, ctx.depthTexture.createView());
            isInitialized$7 = true;
        }
        _renderPassDescriptor$7.colorAttachments[0].view = ctx.getCurrentTexture().createView();
    }
    function draw$9(device, ctx, scene, vb) {
        var items = scene.items;
        if (!(items === null || items === void 0 ? void 0 : items.length)) {
            return;
        }
        initialize$7(device, ctx, vb);
        _bufferManager$7.setResolution(ctx._uniforms.resolution);
        _bufferManager$7.setOffset([vb.x1, vb.y1]);
        var item = items[0];
        var geometryData = createGeometryData$2(ctx, item, items);
        var uniformBuffer = _bufferManager$7.createUniformBuffer();
        var uniformBindGroup = Renderer.createUniformBindGroup(drawName$8, device, _pipeline$7, uniformBuffer);
        for (var i = 0; i < geometryData.length; i++) {
            var geometryCount = geometryData[i].length / _vertextBufferManager$7.getVertexLength();
            if (geometryCount == 0)
                continue;
            var geometryBuffer = _bufferManager$7.createGeometryBuffer(geometryData[i]);
            // Renderer.queue2(device, _pipeline, [geometryCount], [geometryBuffer], [uniformBindGroup]);
            Renderer.queue2(device, _pipeline$7, _renderPassDescriptor$7, [geometryCount], [geometryBuffer], [uniformBindGroup]);
        }
    }
    function createGeometryData$2(context, item, items) {
        // @ts-ignore
        var shapeGeom = area$1(context, items);
        var geometry = geometryForItem(context, item, shapeGeom);
        var geometryData = new Float32Array(geometry.fillCount * 7);
        var strokeGeometryData = new Float32Array(geometry.strokeCount * 7);
        var fill = Color.from2(item.fill, item.opacity, item.fillOpacity);
        var stroke = Color.from2(item.stroke, item.opacity, item.strokeOpacity);
        for (var i = 0; i < geometry.fillCount; i++) {
            geometryData[i * 7] = geometry.fillTriangles[i * 3];
            geometryData[i * 7 + 1] = geometry.fillTriangles[i * 3 + 1];
            geometryData[i * 7 + 2] = geometry.fillTriangles[i * 3 + 2] * -1;
            geometryData[i * 7 + 3] = fill[0];
            geometryData[i * 7 + 4] = fill[1];
            geometryData[i * 7 + 5] = fill[2];
            geometryData[i * 7 + 6] = fill[3];
        }
        for (var i = 0; i < geometry.strokeCount; i++) {
            strokeGeometryData[i * 7] = geometry.strokeTriangles[i * 3];
            strokeGeometryData[i * 7 + 1] = geometry.strokeTriangles[i * 3 + 1];
            strokeGeometryData[i * 7 + 2] = geometry.strokeTriangles[i * 3 + 2] * -1;
            strokeGeometryData[i * 7 + 3] = stroke[0];
            strokeGeometryData[i * 7 + 4] = stroke[1];
            strokeGeometryData[i * 7 + 5] = stroke[2];
            strokeGeometryData[i * 7 + 6] = stroke[3];
        }
        return [geometryData, strokeGeometryData];
    }

    function compare(a, b) {
        return a.zindex - b.zindex || a.index - b.index;
    }
    function zorder(scene) {
        if (!scene.zdirty)
            return scene.zitems;
        var items = scene.items, output = [], item, i, n;
        for (i = 0, n = items.length; i < n; ++i) {
            item = items[i];
            item.index = i;
            if (item.zindex)
                output.push(item);
        }
        scene.zdirty = false;
        return (scene.zitems = output.sort(compare));
    }
    function visit(scene, visitor) {
        var items = scene.items, i, n;
        if (!items || !items.length)
            return;
        var zitems = zorder(scene);
        if (zitems && zitems.length) {
            for (i = 0, n = items.length; i < n; ++i) {
                if (!items[i].zindex)
                    visitor(items[i]);
            }
            items = zitems;
        }
        for (i = 0, n = items.length; i < n; ++i) {
            visitor(items[i]);
        }
    }

    // source: https://alain.xyz/blog/raw-webgpu
    var quadVertex = Float32Array.from([0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1]);
    Float32Array.from([0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1]);

    var drawName$7 = 'Group';
    var group = {
        type: 'group',
        draw: draw$8,
    };
    var _device$6 = null;
    var _bufferManager$6 = null;
    var _shader$6 = null;
    var _vertextBufferManager$6 = null;
    var _pipeline$6 = null;
    var _renderPassDescriptor$6 = null;
    var _geometryBuffer$3 = null;
    var isInitialized$6 = false;
    function initialize$6(device, ctx, vb) {
        if (_device$6 != device) {
            _device$6 = device;
            isInitialized$6 = false;
        }
        if (!isInitialized$6) {
            _bufferManager$6 = new BufferManager(device, drawName$7, ctx._uniforms.resolution, [vb.x1, vb.y1]);
            _shader$6 = ctx._shaderCache[drawName$7];
            _vertextBufferManager$6 = new VertexBufferManager(['float32x2'], // position
            // center, dimensions, fill color, stroke color, stroke width, corner radii
            ['float32x2', 'float32x2', 'float32x4', 'float32x4', 'float32', 'float32x4']);
            _pipeline$6 = Renderer.createRenderPipeline(drawName$7, device, _shader$6, Renderer.colorFormat, _vertextBufferManager$6.getBuffers());
            _renderPassDescriptor$6 = Renderer.createRenderPassDescriptor(drawName$7, ctx.background, ctx.depthTexture.createView());
            _geometryBuffer$3 = _bufferManager$6.createGeometryBuffer(quadVertex);
            isInitialized$6 = true;
        }
        _renderPassDescriptor$6.colorAttachments[0].view = ctx.getCurrentTexture().createView();
    }
    function draw$8(device, ctx, scene, vb) {
        var _this = this;
        var items = scene.items;
        if (!(items === null || items === void 0 ? void 0 : items.length)) {
            return;
        }
        initialize$6(device, ctx, vb);
        _bufferManager$6.setResolution(ctx._uniforms.resolution);
        _bufferManager$6.setOffset([vb.x1, vb.y1]);
        var uniformBuffer = _bufferManager$6.createUniformBuffer();
        var uniformBindGroup = Renderer.createUniformBindGroup(drawName$7, device, _pipeline$6, uniformBuffer);
        var attributes = createAttributes$4(items);
        var instanceBuffer = _bufferManager$6.createInstanceBuffer(attributes);
        Renderer.queue2(device, _pipeline$6, _renderPassDescriptor$6, [6, items.length], [_geometryBuffer$3, instanceBuffer], [uniformBindGroup]);
        visit(scene, function (group) {
            var gx = group.x || 0, gy = group.y || 0, w = group.width || 0, h = group.height || 0, oldClip;
            // setup graphics context
            ctx._tx += gx;
            ctx._ty += gy;
            ctx._textContext.save();
            ctx._textContext.translate(gx, gy);
            if (group.mark.clip) {
                oldClip = ctx._clip;
                ctx._clip = [
                    ctx._origin[0] + ctx._tx,
                    ctx._origin[1] + ctx._ty,
                    ctx._origin[0] + ctx._tx + w,
                    ctx._origin[1] + ctx._ty + h
                ];
            }
            if (vb)
                vb.translate(-gx, -gy);
            visit(group, function (item) {
                _this.draw(device, ctx, item, vb);
            });
            if (vb)
                vb.translate(gx, gy);
            //@ts-ignore
            if (group.clip || group.bounds.clip) {
                ctx._clip = oldClip;
            }
            ctx._tx -= gx;
            ctx._ty -= gy;
            ctx._textContext.restore();
        });
    }
    function createAttributes$4(items) {
        return Float32Array.from((items).flatMap(function (item) {
            var _a = item.x, x = _a === void 0 ? 0 : _a, _b = item.y, y = _b === void 0 ? 0 : _b, _c = item.width, width = _c === void 0 ? 0 : _c, _d = item.height, height = _d === void 0 ? 0 : _d, _e = item.opacity, opacity = _e === void 0 ? 1 : _e, fill = item.fill, _f = item.fillOpacity, fillOpacity = _f === void 0 ? 1 : _f, _g = item.stroke, stroke = _g === void 0 ? null : _g, _h = item.strokeOpacity, strokeOpacity = _h === void 0 ? 1 : _h, _j = item.strokeWidth, strokeWidth = _j === void 0 ? null : _j, _k = item.cornerRadius, cornerRadius = _k === void 0 ? 0 : _k, 
            // @ts-ignore
            _l = item.cornerRadiusBottomLeft, 
            // @ts-ignore
            cornerRadiusBottomLeft = _l === void 0 ? null : _l, 
            // @ts-ignore
            _m = item.cornerRadiusBottomRight, 
            // @ts-ignore
            cornerRadiusBottomRight = _m === void 0 ? null : _m, 
            // @ts-ignore
            _o = item.cornerRadiusTopRight, 
            // @ts-ignore
            cornerRadiusTopRight = _o === void 0 ? null : _o, 
            // @ts-ignore
            _p = item.cornerRadiusTopLeft, 
            // @ts-ignore
            cornerRadiusTopLeft = _p === void 0 ? null : _p;
            var col = Color.from(fill, opacity, fillOpacity);
            var scol = Color.from(stroke, opacity, strokeOpacity);
            var swidth = stroke ? strokeWidth !== null && strokeWidth !== void 0 ? strokeWidth : 1 : strokeWidth !== null && strokeWidth !== void 0 ? strokeWidth : 0;
            var cornerRadii = [
                cornerRadiusTopRight !== null && cornerRadiusTopRight !== void 0 ? cornerRadiusTopRight : cornerRadius,
                cornerRadiusBottomRight !== null && cornerRadiusBottomRight !== void 0 ? cornerRadiusBottomRight : cornerRadius,
                cornerRadiusBottomLeft !== null && cornerRadiusBottomLeft !== void 0 ? cornerRadiusBottomLeft : cornerRadius,
                cornerRadiusTopLeft !== null && cornerRadiusTopLeft !== void 0 ? cornerRadiusTopLeft : cornerRadius,
            ];
            return __spreadArray(__spreadArray(__spreadArray(__spreadArray([
                x,
                y,
                width,
                height
            ], __read(col.rgba), false), __read(scol.rgba), false), [
                swidth
            ], false), __read(cornerRadii), false);
        }));
    }

    var drawName$6 = 'Line';
    var line = {
        type: 'line',
        draw: draw$7,
        pick: function () { return null; },
    };
    var _device$5 = null;
    var _bufferManager$5 = null;
    var _vertextBufferManager$5 = null;
    var _shader$5 = null;
    var _shader2 = null;
    var _pipeline$5 = null;
    var _pipeline2 = null;
    var _renderPassDescriptor$5 = null;
    var isInitialized$5 = false;
    function initialize$5(device, ctx, vb) {
        if (_device$5 != device) {
            _device$5 = device;
            isInitialized$5 = false;
        }
        if (!isInitialized$5) {
            _bufferManager$5 = new BufferManager(device, drawName$6, ctx._uniforms.resolution, [vb.x1, vb.y1]);
            _vertextBufferManager$5 = new VertexBufferManager([], ['float32x2', 'float32x2', 'float32x4', 'float32'] // start, end, color, width
            );
            _shader$5 = ctx._shaderCache["Line"];
            _shader2 = ctx._shaderCache["SLine"];
            _pipeline$5 = Renderer.createRenderPipeline(drawName$6, device, _shader$5, Renderer.colorFormat, []);
            _pipeline2 = Renderer.createRenderPipeline("S" + drawName$6, device, _shader2, Renderer.colorFormat, _vertextBufferManager$5.getBuffers());
            _renderPassDescriptor$5 = Renderer.createRenderPassDescriptor(drawName$6, ctx.background, ctx.depthTexture.createView());
            isInitialized$5 = true;
        }
        _renderPassDescriptor$5.colorAttachments[0].view = ctx.getCurrentTexture().createView();
    }
    function draw$7(device, ctx, scene, vb) {
        var items = scene.items;
        if (!(items === null || items === void 0 ? void 0 : items.length)) {
            return;
        }
        initialize$5(device, ctx, vb);
        _bufferManager$5.setResolution(ctx._uniforms.resolution);
        _bufferManager$5.setOffset([vb.x1, vb.y1]);
        if (ctx._renderer.wgOptions.simpleLine === true) {
            var uniformBindGroup = Renderer.createUniformBindGroup("S" + drawName$6, device, _pipeline2, _bufferManager$5.createUniformBuffer());
            var attributes = createAttributes$3(items);
            var instanceBuffer = _bufferManager$5.createInstanceBuffer(attributes);
            Renderer.queue2(device, _pipeline2, _renderPassDescriptor$5, [6, items.length - 1], [instanceBuffer], [uniformBindGroup]);
        }
        else {
            var uniformBindGroup = Renderer.createUniformBindGroup(drawName$6, device, _pipeline$5, _bufferManager$5.createUniformBuffer());
            var pointDatas = createPointDatas(items);
            var pointPositionBuffer = _bufferManager$5.createBuffer(drawName$6 + ' Point Position Buffer', pointDatas.pos, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
            var pointColorBuffer = _bufferManager$5.createBuffer(drawName$6 + ' Point Color Buffer', pointDatas.colors, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
            var pointWidthBuffer = _bufferManager$5.createBuffer(drawName$6 + ' Point Width Buffer', pointDatas.widths, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
            var pointBindGroup = Renderer.createBindGroup(drawName$6, device, _pipeline$5, [pointPositionBuffer, pointColorBuffer, pointWidthBuffer], null, 1);
            Renderer.queue2(device, _pipeline$5, _renderPassDescriptor$5, [6, items.length - 1], [], [uniformBindGroup, pointBindGroup]);
        }
    }
    function createAttributes$3(items) {
        var lines = items;
        var result = new Float32Array((items.length - 1) * 9);
        for (var i = 0; i < lines.length - 1; i++) {
            // @ts-ignore
            var _a = lines[i], _b = _a.x, x = _b === void 0 ? 0 : _b, _c = _a.y, y = _c === void 0 ? 0 : _c, stroke = _a.stroke, _d = _a.strokeOpacity, strokeOpacity = _d === void 0 ? 1 : _d, _e = _a.strokeWidth, strokeWidth = _e === void 0 ? 1 : _e, _f = _a.opacity, opacity = _f === void 0 ? 1 : _f;
            var x2 = lines[i + 1].x;
            var y2 = lines[i + 1].y;
            var col = Color.from2(stroke, opacity, strokeOpacity);
            var index = i * 9;
            result[index] = x;
            result[index + 1] = y;
            result[index + 2] = x2;
            result[index + 3] = y2;
            result[index + 4] = col[0];
            result[index + 5] = col[1];
            result[index + 6] = col[2];
            result[index + 7] = col[3];
            result[index + 8] = strokeWidth;
        }
        return result;
    }
    function createPointDatas(items) {
        var lines = items;
        var numLines = lines.length;
        var pos = new Float32Array(numLines * 2);
        var colors = new Float32Array(numLines * 4);
        var widths = new Float32Array(numLines);
        for (var i = 0; i < lines.length; i++) {
            // @ts-ignore
            var _a = lines[i], _b = _a.x, x = _b === void 0 ? 0 : _b, _c = _a.y, y = _c === void 0 ? 0 : _c, stroke = _a.stroke, _d = _a.strokeOpacity, strokeOpacity = _d === void 0 ? 1 : _d, _e = _a.strokeWidth, strokeWidth = _e === void 0 ? 1 : _e, _f = _a.opacity, opacity = _f === void 0 ? 1 : _f;
            var col = Color.from2(stroke, opacity, strokeOpacity);
            var posIndex = i * 2;
            var colorsIndex = i * 4;
            pos[posIndex] = x;
            pos[posIndex + 1] = y;
            colors[colorsIndex] = col[0];
            colors[colorsIndex + 1] = col[1];
            colors[colorsIndex + 2] = col[2];
            colors[colorsIndex + 3] = col[3];
            widths[i] = strokeWidth;
        }
        return { pos: pos, colors: colors, widths: widths };
    }

    var drawName$5 = 'Rect';
    var rect = {
        type: 'rect',
        draw: draw$6,
    };
    var _device$4 = null;
    var _bufferManager$4 = null;
    var _shader$4 = null;
    var _vertextBufferManager$4 = null;
    var _pipeline$4 = null;
    var _renderPassDescriptor$4 = null;
    var _geometryBuffer$2 = null;
    var isInitialized$4 = false;
    function initialize$4(device, ctx, vb) {
        if (_device$4 != device) {
            _device$4 = device;
            isInitialized$4 = false;
        }
        if (!isInitialized$4) {
            _bufferManager$4 = new BufferManager(device, drawName$5, ctx._uniforms.resolution, [vb.x1, vb.y1]);
            _shader$4 = ctx._shaderCache[drawName$5];
            _vertextBufferManager$4 = new VertexBufferManager(['float32x2'], // position
            // center, dimensions, fill color, stroke color, stroke width, corner radii
            ['float32x2', 'float32x2', 'float32x4', 'float32x4', 'float32', 'float32x4']);
            _pipeline$4 = Renderer.createRenderPipeline(drawName$5, device, _shader$4, Renderer.colorFormat, _vertextBufferManager$4.getBuffers());
            _renderPassDescriptor$4 = Renderer.createRenderPassDescriptor(drawName$5, ctx.background, ctx.depthTexture.createView());
            _geometryBuffer$2 = _bufferManager$4.createGeometryBuffer(quadVertex);
            isInitialized$4 = true;
        }
        _renderPassDescriptor$4.colorAttachments[0].view = ctx.getCurrentTexture().createView();
    }
    function draw$6(device, ctx, scene, vb) {
        var items = scene.items;
        if (!(items === null || items === void 0 ? void 0 : items.length)) {
            return;
        }
        initialize$4(device, ctx, vb);
        _bufferManager$4.setResolution(ctx._uniforms.resolution);
        _bufferManager$4.setOffset([vb.x1, vb.y1]);
        var uniformBuffer = _bufferManager$4.createUniformBuffer();
        var uniformBindGroup = Renderer.createUniformBindGroup(drawName$5, device, _pipeline$4, uniformBuffer);
        var attributes = createAttributes$2(items);
        var instanceBuffer = _bufferManager$4.createInstanceBuffer(attributes);
        Renderer.queue2(device, _pipeline$4, _renderPassDescriptor$4, [6, items.length], [_geometryBuffer$2, instanceBuffer], [uniformBindGroup]);
    }
    function createAttributes$2(items) {
        return Float32Array.from((items).flatMap(function (item) {
            var _a = item.x, x = _a === void 0 ? 0 : _a, _b = item.y, y = _b === void 0 ? 0 : _b, _c = item.width, width = _c === void 0 ? 0 : _c, _d = item.height, height = _d === void 0 ? 0 : _d, _e = item.opacity, opacity = _e === void 0 ? 1 : _e, fill = item.fill, _f = item.fillOpacity, fillOpacity = _f === void 0 ? 1 : _f, _g = item.stroke, stroke = _g === void 0 ? null : _g, _h = item.strokeOpacity, strokeOpacity = _h === void 0 ? 1 : _h, _j = item.strokeWidth, strokeWidth = _j === void 0 ? null : _j, _k = item.cornerRadius, cornerRadius = _k === void 0 ? 0 : _k, 
            // @ts-ignore
            _l = item.cornerRadiusBottomLeft, 
            // @ts-ignore
            cornerRadiusBottomLeft = _l === void 0 ? null : _l, 
            // @ts-ignore
            _m = item.cornerRadiusBottomRight, 
            // @ts-ignore
            cornerRadiusBottomRight = _m === void 0 ? null : _m, 
            // @ts-ignore
            _o = item.cornerRadiusTopRight, 
            // @ts-ignore
            cornerRadiusTopRight = _o === void 0 ? null : _o, 
            // @ts-ignore
            _p = item.cornerRadiusTopLeft, 
            // @ts-ignore
            cornerRadiusTopLeft = _p === void 0 ? null : _p;
            var col = Color.from(fill, opacity, fillOpacity);
            var scol = Color.from(stroke, opacity, strokeOpacity);
            var swidth = stroke ? strokeWidth !== null && strokeWidth !== void 0 ? strokeWidth : 1 : strokeWidth !== null && strokeWidth !== void 0 ? strokeWidth : 0;
            var cornerRadii = [
                cornerRadiusTopRight !== null && cornerRadiusTopRight !== void 0 ? cornerRadiusTopRight : cornerRadius,
                cornerRadiusBottomRight !== null && cornerRadiusBottomRight !== void 0 ? cornerRadiusBottomRight : cornerRadius,
                cornerRadiusBottomLeft !== null && cornerRadiusBottomLeft !== void 0 ? cornerRadiusBottomLeft : cornerRadius,
                cornerRadiusTopLeft !== null && cornerRadiusTopLeft !== void 0 ? cornerRadiusTopLeft : cornerRadius,
            ];
            return __spreadArray(__spreadArray(__spreadArray(__spreadArray([
                x,
                y,
                width,
                height
            ], __read(col.rgba), false), __read(scol.rgba), false), [
                swidth
            ], false), __read(cornerRadii), false);
        }));
    }

    var drawName$4 = 'Rule';
    var rule = {
        type: 'rule',
        draw: draw$5
    };
    var _device$3 = null;
    var _bufferManager$3 = null;
    var _shader$3 = null;
    var _vertextBufferManager$3 = null;
    var _pipeline$3 = null;
    var _renderPassDescriptor$3 = null;
    var _geometryBuffer$1 = null;
    var isInitialized$3 = false;
    function initialize$3(device, ctx, vb) {
        if (_device$3 != device) {
            _device$3 = device;
            isInitialized$3 = false;
        }
        if (!isInitialized$3) {
            _bufferManager$3 = new BufferManager(device, drawName$4, ctx._uniforms.resolution, [vb.x1, vb.y1]);
            _shader$3 = ctx._shaderCache[drawName$4];
            _vertextBufferManager$3 = new VertexBufferManager(['float32x2'], // position
            // center, scale, color
            ['float32x2', 'float32x2', 'float32x4']);
            _pipeline$3 = Renderer.createRenderPipeline(drawName$4, device, _shader$3, Renderer.colorFormat, _vertextBufferManager$3.getBuffers());
            _renderPassDescriptor$3 = Renderer.createRenderPassDescriptor(drawName$4, ctx.background, ctx.depthTexture.createView());
            _geometryBuffer$1 = _bufferManager$3.createGeometryBuffer(quadVertex);
            isInitialized$3 = true;
        }
        _renderPassDescriptor$3.colorAttachments[0].view = ctx.getCurrentTexture().createView();
    }
    function draw$5(device, ctx, scene, vb) {
        var items = scene.items;
        if (!(items === null || items === void 0 ? void 0 : items.length)) {
            return;
        }
        initialize$3(device, ctx, vb);
        _bufferManager$3.setResolution(ctx._uniforms.resolution);
        _bufferManager$3.setOffset([vb.x1, vb.y1]);
        var uniformBuffer = _bufferManager$3.createUniformBuffer();
        var uniformBindGroup = Renderer.createUniformBindGroup(drawName$4, device, _pipeline$3, uniformBuffer);
        var attributes = createAttributes$1(items);
        var instanceBuffer = _bufferManager$3.createInstanceBuffer(attributes);
        Renderer.queue2(device, _pipeline$3, _renderPassDescriptor$3, [6, items.length], [_geometryBuffer$1, instanceBuffer], [uniformBindGroup]);
    }
    function createAttributes$1(items) {
        return Float32Array.from(items.flatMap(function (item) {
            var _a = item.x, x = _a === void 0 ? 0 : _a, _b = item.y, y = _b === void 0 ? 0 : _b, x2 = item.x2, y2 = item.y2, stroke = item.stroke, _c = item.strokeWidth, strokeWidth = _c === void 0 ? 1 : _c, _d = item.opacity, opacity = _d === void 0 ? 1 : _d, _e = item.strokeOpacity, strokeOpacity = _e === void 0 ? 1 : _e;
            x2 !== null && x2 !== void 0 ? x2 : (x2 = x);
            y2 !== null && y2 !== void 0 ? y2 : (y2 = y);
            var ax = Math.abs(x2 - x);
            var ay = Math.abs(y2 - y);
            var col = Color.from(stroke, opacity, strokeOpacity);
            return __spreadArray([
                Math.min(x, x2),
                Math.min(y, y2),
                ax ? ax : strokeWidth,
                ay ? ay : strokeWidth
            ], __read(col.rgba), false);
        }));
    }

    var segments = 32;
    var drawName$3 = 'Symbol';
    var symbol = {
        type: 'symbol',
        draw: draw$4,
        pick: function () { return null; },
    };
    var _device$2 = null;
    var _bufferManager$2 = null;
    var _shader$2 = null;
    var _vertextBufferManager$2 = null;
    var _pipeline$2 = null;
    var _renderPassDescriptor$2 = null;
    var _geometryBuffer = null;
    var isInitialized$2 = false;
    function initialize$2(device, ctx, vb) {
        if (_device$2 != device) {
            _device$2 = device;
            isInitialized$2 = false;
        }
        if (!isInitialized$2) {
            _bufferManager$2 = new BufferManager(device, drawName$3, ctx._uniforms.resolution, [vb.x1, vb.y1]);
            _shader$2 = ctx._shaderCache["Symbol"];
            _vertextBufferManager$2 = new VertexBufferManager(['float32x2'], // position
            ['float32x2', 'float32', 'float32x4', 'float32x4', 'float32'] // center, radius, color, stroke color, stroke width
            );
            _pipeline$2 = Renderer.createRenderPipeline(drawName$3, device, _shader$2, Renderer.colorFormat, _vertextBufferManager$2.getBuffers());
            _renderPassDescriptor$2 = Renderer.createRenderPassDescriptor(drawName$3, ctx.background, ctx.depthTexture.createView());
            _geometryBuffer = _bufferManager$2.createGeometryBuffer(createGeometry());
            isInitialized$2 = true;
        }
        _renderPassDescriptor$2.colorAttachments[0].view = ctx.getCurrentTexture().createView();
    }
    function draw$4(device, ctx, scene, vb) {
        var items = scene.items;
        if (!(items === null || items === void 0 ? void 0 : items.length)) {
            return;
        }
        initialize$2(device, ctx, vb);
        _bufferManager$2.setResolution(ctx._uniforms.resolution);
        _bufferManager$2.setOffset([vb.x1, vb.y1]);
        var uniformBuffer = _bufferManager$2.createUniformBuffer();
        var uniformBindGroup = Renderer.createUniformBindGroup(drawName$3, device, _pipeline$2, uniformBuffer);
        var attributes = createAttributes(items);
        var instanceBuffer = _bufferManager$2.createInstanceBuffer(attributes);
        Renderer.queue2(device, _pipeline$2, _renderPassDescriptor$2, [segments * 3, items.length], [_geometryBuffer, instanceBuffer], [uniformBindGroup]);
    }
    function createAttributes(items) {
        var result = new Float32Array(items.length * 12);
        var len = items.length;
        for (var i = 0; i < len; i++) {
            var _a = items[i], _b = _a.x, x = _b === void 0 ? 0 : _b, _c = _a.y, y = _c === void 0 ? 0 : _c, size = _a.size, fill = _a.fill, stroke = _a.stroke, strokeWidth = _a.strokeWidth, _d = _a.opacity, opacity = _d === void 0 ? 1 : _d, _e = _a.fillOpacity, fillOpacity = _e === void 0 ? 1 : _e, _f = _a.strokeOpacity, strokeOpacity = _f === void 0 ? 1 : _f;
            var col = Color.from2(fill, opacity, fillOpacity);
            var scol = Color.from2(stroke, opacity, strokeOpacity);
            var rad = Math.sqrt(size) / 2;
            var startIndex = i * 12;
            result[startIndex] = x;
            result[startIndex + 1] = y;
            result[startIndex + 2] = rad;
            result[startIndex + 3] = col[0];
            result[startIndex + 4] = col[1];
            result[startIndex + 5] = col[2];
            result[startIndex + 6] = col[3];
            result[startIndex + 7] = scol[0];
            result[startIndex + 8] = scol[1];
            result[startIndex + 9] = scol[2];
            result[startIndex + 10] = scol[3];
            result[startIndex + 11] = stroke ? (strokeWidth !== null && strokeWidth !== void 0 ? strokeWidth : 1) : 0;
        }
        return result;
    }
    function createGeometry() {
        return new Float32Array(Array.from({ length: segments }, function (_, i) {
            var j = (i + 1) % segments;
            var ang1 = !i ? 0 : ((Math.PI * 2.0) / segments) * i;
            var ang2 = !j ? 0 : ((Math.PI * 2.0) / segments) * j;
            var x1 = Math.cos(ang1);
            var y1 = Math.sin(ang1);
            var x2 = Math.cos(ang2);
            var y2 = Math.sin(ang2);
            return [x1, y1, 0, 0, x2, y2];
        }).flat());
    }

    function draw$3(device, ctx, scene, bounds) {
        vegaScenegraph.Marks.text.draw(this._textContext, scene, bounds);
    }
    var text = {
        type: 'text',
        draw: draw$3,
    };

    var drawName$2 = 'Path';
    var path = {
        type: 'path',
        draw: draw$2
    };
    var _device$1 = null;
    var _bufferManager$1 = null;
    var _shader$1 = null;
    var _vertextBufferManager$1 = null;
    var _pipeline$1 = null;
    var _renderPassDescriptor$1 = null;
    var isInitialized$1 = false;
    function initialize$1(device, ctx, vb) {
        if (_device$1 != device) {
            _device$1 = device;
            isInitialized$1 = false;
        }
        if (!isInitialized$1) {
            _bufferManager$1 = new BufferManager(device, drawName$2, ctx._uniforms.resolution, [vb.x1, vb.y1]);
            _shader$1 = ctx._shaderCache["Path"];
            _vertextBufferManager$1 = new VertexBufferManager(['float32x3', 'float32x4'], // position, color
            []);
            _pipeline$1 = Renderer.createRenderPipeline(drawName$2, device, _shader$1, Renderer.colorFormat, _vertextBufferManager$1.getBuffers());
            _renderPassDescriptor$1 = Renderer.createRenderPassDescriptor(drawName$2, ctx.background, ctx.depthTexture.createView());
            isInitialized$1 = true;
        }
        _renderPassDescriptor$1.colorAttachments[0].view = ctx.getCurrentTexture().createView();
    }
    function draw$2(device, ctx, scene, vb) {
        var items = scene.items;
        if (!(items === null || items === void 0 ? void 0 : items.length)) {
            return;
        }
        initialize$1(device, ctx, vb);
        _bufferManager$1.setResolution(ctx._uniforms.resolution);
        _bufferManager$1.setOffset([vb.x1, vb.y1]);
        var uniformBuffer = _bufferManager$1.createUniformBuffer();
        var uniformBindGroup = Renderer.createUniformBindGroup(drawName$2, device, _pipeline$1, uniformBuffer);
        for (var itemStr in items) {
            var item = items[itemStr];
            ctx._tx += item.x || 0;
            ctx._ty += item.y || 0;
            var geometryData = createGeometryData$1(ctx, item);
            for (var i = 0; i < geometryData.length; i++) {
                var geometryCount = geometryData[i].length / _vertextBufferManager$1.getVertexLength();
                if (geometryCount == 0)
                    continue;
                var geometryBuffer = _bufferManager$1.createGeometryBuffer(geometryData[i]);
                Renderer.queue2(device, _pipeline$1, _renderPassDescriptor$1, [geometryCount], [geometryBuffer], [uniformBindGroup]);
            }
            ctx._tx -= item.x || 0;
            ctx._ty -= item.y || 0;
        }
    }
    function createGeometryData$1(context, item) {
        // @ts-ignore
        var path = item.path;
        var shapeGeom = geometryForPath(context, path);
        var geometry = geometryForItem(context, item, shapeGeom);
        var geometryData = new Float32Array(geometry.fillCount * 7);
        var strokeGeometryData = new Float32Array(geometry.strokeCount * 7);
        var fill = Color.from2(item.fill, item.opacity, item.fillOpacity);
        var stroke = Color.from2(item.stroke, item.opacity, item.strokeOpacity);
        for (var i = 0; i < geometry.fillCount; i++) {
            geometryData[i * 7] = geometry.fillTriangles[i * 3];
            geometryData[i * 7 + 1] = geometry.fillTriangles[i * 3 + 1];
            geometryData[i * 7 + 2] = geometry.fillTriangles[i * 3 + 2] * -1;
            geometryData[i * 7 + 3] = fill[0];
            geometryData[i * 7 + 4] = fill[1];
            geometryData[i * 7 + 5] = fill[2];
            geometryData[i * 7 + 6] = fill[3];
        }
        for (var i = 0; i < geometry.strokeCount; i++) {
            strokeGeometryData[i * 7] = geometry.strokeTriangles[i * 3];
            strokeGeometryData[i * 7 + 1] = geometry.strokeTriangles[i * 3 + 1];
            strokeGeometryData[i * 7 + 2] = geometry.strokeTriangles[i * 3 + 2] * -1;
            strokeGeometryData[i * 7 + 3] = stroke[0];
            strokeGeometryData[i * 7 + 4] = stroke[1];
            strokeGeometryData[i * 7 + 5] = stroke[2];
            strokeGeometryData[i * 7 + 6] = stroke[3];
        }
        return [geometryData, strokeGeometryData];
    }

    var drawName$1 = 'Shape';
    var shape = {
        type: 'shape',
        draw: draw$1
    };
    var _device = null;
    var _bufferManager = null;
    var _shader = null;
    var _vertextBufferManager = null;
    var _pipeline = null;
    var _renderPassDescriptor = null;
    var isInitialized = false;
    var _cache = {};
    function initialize(device, ctx, vb) {
        if (_device != device) {
            _device = device;
            isInitialized = false;
        }
        if (!isInitialized) {
            _cache = {};
            _bufferManager = new BufferManager(device, drawName$1, ctx._uniforms.resolution, [vb.x1, vb.y1]);
            _shader = ctx._shaderCache[drawName$1];
            _vertextBufferManager = new VertexBufferManager(['float32x3', 'float32x4'], // position, color
            [] // center
            );
            _pipeline = Renderer.createRenderPipeline(drawName$1, device, _shader, Renderer.colorFormat, _vertextBufferManager.getBuffers());
            _renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName$1, ctx.background, ctx.depthTexture.createView());
            isInitialized = true;
        }
        _renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
    }
    function draw$1(device, ctx, scene, vb) {
        var _a;
        var items = scene.items;
        if (!(items === null || items === void 0 ? void 0 : items.length)) {
            return;
        }
        initialize(device, ctx, vb);
        _bufferManager.setResolution(ctx._uniforms.resolution);
        _bufferManager.setOffset([vb.x1, vb.y1]);
        var uniformBuffer = _bufferManager.createUniformBuffer();
        var uniformBindGroup = Renderer.createUniformBindGroup(drawName$1, device, _pipeline, uniformBuffer);
        for (var itemStr in items) {
            var item = items[itemStr];
            var geometryData = createGeometryData(ctx, item, (_a = ctx._renderer.wgOptions.cacheShapes) !== null && _a !== void 0 ? _a : false);
            for (var i = 0; i < geometryData.length; i++) {
                var geometryCount = geometryData[i].length / _vertextBufferManager.getVertexLength();
                if (geometryCount == 0)
                    continue;
                var geometryBuffer = _bufferManager.createGeometryBuffer(geometryData[i]);
                Renderer.queue2(device, _pipeline, _renderPassDescriptor, [geometryCount], [geometryBuffer], [uniformBindGroup]);
            }
        }
    }
    function createGeometryData(context, item, useCache) {
        var _a, _b;
        // @ts-ignore
        var key = (_b = (_a = item.datum.id) !== null && _a !== void 0 ? _a : item.id) !== null && _b !== void 0 ? _b : item[Object.getOwnPropertySymbols(item)[0]];
        var cacheEntry = _cache[key];
        if (useCache && cacheEntry && item.strokeWidth == cacheEntry.strokeWidth
            && item.x == cacheEntry.x && item.y == cacheEntry.y
            && item.bounds == cacheEntry.bounds) {
            var fill_1 = Color.from(item.fill, item.opacity, item.fillOpacity);
            var stroke_1 = Color.from(item.stroke, item.opacity, item.strokeOpacity);
            if (cacheEntry.fill == fill_1 && cacheEntry.stroke == stroke_1)
                return cacheEntry.data;
            var data = [new Float32Array(cacheEntry.data[0].length), new Float32Array(cacheEntry.data[1].length)];
            console.log(fill_1);
            for (var i = 0; i < data[0].length; i += 7) {
                data[0][i] = cacheEntry.data[0][i];
                data[0][i + 1] = cacheEntry.data[0][i + 1];
                data[0][i + 2] = cacheEntry.data[0][i + 2];
                data[0][i + 3] = fill_1.r;
                data[0][i + 4] = fill_1.g;
                data[0][i + 5] = fill_1.b;
                data[0][i + 6] = fill_1.a;
            }
            for (var i = 0; i < data[1].length; i += 7) {
                data[1][i] = cacheEntry.data[1][i];
                data[1][i + 1] = cacheEntry.data[1][i + 1];
                data[1][i + 2] = cacheEntry.data[1][i + 2];
                data[1][i + 3] = stroke_1.r;
                data[1][i + 4] = stroke_1.g;
                data[1][i + 5] = stroke_1.b;
                data[1][i + 6] = stroke_1.a;
            }
            return data;
        }
        var shapeGeom = shape$1(context, item);
        shapeGeom.key = key;
        var geometry = geometryForItem(context, item, shapeGeom);
        var geometryData = new Float32Array(geometry.fillCount * 7);
        var strokeGeometryData = new Float32Array(geometry.strokeCount * 7);
        var fill = Color.from2(item.fill, item.opacity, item.fillOpacity);
        var stroke = Color.from2(item.stroke, item.opacity, item.strokeOpacity);
        for (var i = 0; i < geometry.fillCount; i++) {
            geometryData[i * 7] = geometry.fillTriangles[i * 3];
            geometryData[i * 7 + 1] = geometry.fillTriangles[i * 3 + 1];
            geometryData[i * 7 + 2] = geometry.fillTriangles[i * 3 + 2] * -1;
            geometryData[i * 7 + 3] = fill[0];
            geometryData[i * 7 + 4] = fill[1];
            geometryData[i * 7 + 5] = fill[2];
            geometryData[i * 7 + 6] = fill[3];
        }
        for (var i = 0; i < geometry.strokeCount; i++) {
            strokeGeometryData[i * 7] = geometry.strokeTriangles[i * 3];
            strokeGeometryData[i * 7 + 1] = geometry.strokeTriangles[i * 3 + 1];
            strokeGeometryData[i * 7 + 2] = geometry.strokeTriangles[i * 3 + 2] * -1;
            strokeGeometryData[i * 7 + 3] = stroke[0];
            strokeGeometryData[i * 7 + 4] = stroke[1];
            strokeGeometryData[i * 7 + 5] = stroke[2];
            strokeGeometryData[i * 7 + 6] = stroke[3];
        }
        _cache[key] = { file: fill, stroke: stroke, x: item.x, y: item.y, bounds: item.bounds, strokeWidth: item.strokeWidth, data: [geometryData, strokeGeometryData] };
        return [geometryData, strokeGeometryData];
    }

    var drawName = 'Image';
    var image = {
        type: 'image',
        draw: draw
    };
    function draw(device, ctx, scene, vb) {
        var items = scene.items;
        if (!(items === null || items === void 0 ? void 0 : items.length)) {
            return;
        }
        console.warn(drawName + " not yet supported!");
    }

    var marks = {
        arc: arc,
        area: area,
        group: group,
        line: line,
        rect: rect,
        rule: rule,
        symbol: symbol,
        text: text,
        path: path,
        shape: shape,
        image: image,
    };

    function accessor (fn, fields, name) {
      fn.fields = fields || [];
      fn.fname = name;
      return fn;
    }

    function getter (path) {
      return path.length === 1 ? get1(path[0]) : getN(path);
    }
    const get1 = field => function (obj) {
      return obj[field];
    };
    const getN = path => {
      const len = path.length;
      return function (obj) {
        for (let i = 0; i < len; ++i) {
          obj = obj[path[i]];
        }
        return obj;
      };
    };

    function error (message) {
      throw Error(message);
    }

    function splitAccessPath (p) {
      const path = [],
        n = p.length;
      let q = null,
        b = 0,
        s = '',
        i,
        j,
        c;
      p = p + '';
      function push() {
        path.push(s + p.substring(i, j));
        s = '';
        i = j + 1;
      }
      for (i = j = 0; j < n; ++j) {
        c = p[j];
        if (c === '\\') {
          s += p.substring(i, j++);
          i = j;
        } else if (c === q) {
          push();
          q = null;
          b = -1;
        } else if (q) {
          continue;
        } else if (i === b && c === '"') {
          i = j + 1;
          q = c;
        } else if (i === b && c === "'") {
          i = j + 1;
          q = c;
        } else if (c === '.' && !b) {
          if (j > i) {
            push();
          } else {
            i = j + 1;
          }
        } else if (c === '[') {
          if (j > i) push();
          b = i = j + 1;
        } else if (c === ']') {
          if (!b) error('Access path missing open bracket: ' + p);
          if (b > 0) push();
          b = 0;
          i = j + 1;
        }
      }
      if (b) error('Access path missing closing bracket: ' + p);
      if (q) error('Access path missing closing quote: ' + p);
      if (j > i) {
        j++;
        push();
      }
      return path;
    }

    function field (field, name, opt) {
      const path = splitAccessPath(field);
      field = path.length === 1 ? path[0] : field;
      return accessor((opt && opt.get || getter)(path), [field], name || field);
    }

    field('id');
    accessor(_ => _, [], 'identity');
    accessor(() => 0, [], 'zero');
    accessor(() => 1, [], 'one');
    accessor(() => true, [], 'true');
    accessor(() => false, [], 'false');

    function extend (_) {
      for (let x, k, i = 1, len = arguments.length; i < len; ++i) {
        x = arguments[i];
        for (k in x) {
          _[k] = x[k];
        }
      }
      return _;
    }

    function inherits (child, parent, members) {
      const proto = child.prototype = Object.create(parent.prototype);
      Object.defineProperty(proto, 'constructor', {
        value: child,
        writable: true,
        enumerable: true,
        configurable: true
      });
      return extend(proto, members);
    }

    var symbolShader = "struct Uniforms {\n  resolution: vec2<f32>,\n  offset: vec2<f32>,\n}\n\n@group(0) @binding(0) var<uniform> uniforms : Uniforms;\n\nstruct VertexInput {\n  @location(0) position: vec2<f32>,\n}\n\nstruct InstanceInput {\n  @location(1) center: vec2<f32>,\n  @location(2) radius: f32,\n  @location(3) fill_color: vec4<f32>,\n  @location(4) stroke_color: vec4<f32>,\n  @location(5) stroke_width: f32,\n}\n\nstruct VertexOutput {\n  @builtin(position) pos: vec4<f32>,\n  @location(0) uv: vec2<f32>,\n  @location(1) fill: vec4<f32>,\n  @location(2) stroke_color: vec4<f32>,\n  @location(3) stroke_width_percent: f32,\n}\n\nconst smooth_width = 0.05;\n\n@vertex\nfn main_vertex(\n    model: VertexInput,\n    instance: InstanceInput\n) -> VertexOutput {\n    var output: VertexOutput;\n    var stroke_width = instance.stroke_width / 2.0;\n    var radius_with_stroke = instance.radius + stroke_width;\n    var smooth_adjusted_radius = radius_with_stroke * 2.0 / (2.0 - smooth_width * 2.0);\n    var pos = vec2<f32>(model.position * smooth_adjusted_radius) + instance.center - uniforms.offset;\n    pos = pos / uniforms.resolution;\n    pos.y = 1.0 - pos.y;\n    pos = pos * 2.0 - 1.0;\n    output.pos = vec4<f32>(pos, 0.0, 1.0);\n    output.uv = model.position / 2.0 + vec2<f32>(0.5, 0.5);\n    output.fill = instance.fill_color;\n    output.stroke_color = instance.stroke_color;\n    output.stroke_width_percent = stroke_width / radius_with_stroke;\n    return output;\n}\n\n@fragment\nfn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {\n    let distance = distance(vec2<f32>(0.5, 0.5), in.uv);\n    let smoothOuter: f32 = smoothstep(0.0, smooth_width, 0.5 - distance);\n    let smoothInner: f32 = 1.0 - smoothstep(in.stroke_width_percent - smooth_width / 2.0, in.stroke_width_percent + smooth_width / 2.0, 0.5 - distance);\n    return mix(vec4<f32>(in.fill.rgb, in.fill.a * smoothOuter), vec4<f32>(in.stroke_color.rgb, in.stroke_color.a * smoothOuter), smoothInner);\n}\n\nfn binaryIndicator(value: f32, edge0: f32, edge1: f32) -> f32 {\n    if edge0 == edge1 {\n        return 0.0;\n    }\n    let t = saturate((value - edge0) / (edge1 - edge0));\n    return ceil(t);\n}";

    var lineShader = "struct Uniforms {\n    resolution: vec2<f32>,\n    offset: vec2<f32>,\n};\n\n@group(0) @binding(0) var<uniform> uniforms: Uniforms;\n@group(1) @binding(0) var<storage, read> pos: array<vec2<f32>>;\n@group(1) @binding(1) var<storage, read> colors: array<vec4<f32>>;\n@group(1) @binding(2) var<storage, read> widths: array<f32>;\n\nstruct VertexInput {\n    @location(0) index: u32,\n};\n\n\nstruct VertexOutput {\n    @builtin(position) pos: vec4<f32>,\n    @location(0) uv: vec2<f32>,\n    @location(1) fill: vec4<f32>,\n    @location(2) smooth_width: f32,\n};\n\nconst smooth_step = 1.5;\n\n@vertex\nfn main_vertex(@builtin(instance_index) index: u32, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {\n    let start = pos[index];\n    let end = pos[index + 1];\n    let stroke_width = widths[index];\n    var color = colors[index];\n\n    // Calculate the direction vector of the line\n    let direction = normalize(end - start);\n    let angle = atan2(direction.y, direction.x);\n\n    // Calculate the normal vector\n    let normal = normalize(vec2<f32>(-direction.y, direction.x));\n\n    // Calculate the offset for width\n    let adjusted_width = stroke_width + smooth_step;\n    let offset = normal * ((adjusted_width) * 0.5);\n    let width = stroke_width + smooth_step * 2.0;\n    let length = length(end - start);\n\n    // Calculate the four points of the line\n    var p1 = start - offset;\n    var p2 = start + offset;\n    var p3 = end - offset;\n    var p4 = end + offset;\n\n    var vertices = array(p1, p2, p3, p2, p4, p3);\n    var uvs = array(\n        vec2<f32>(0.0, 0.0),\n        vec2<f32>(1.0, 0.0),\n        vec2<f32>(0.0, 1.0),\n        vec2<f32>(1.0, 0.0),\n        vec2<f32>(1.0, 1.0),\n        vec2<f32>(0.0, 1.0)\n    );\n    var pos = vertices[vertexIndex];\n    pos = (pos - uniforms.offset) / uniforms.resolution;\n    pos.y = 1.0 - pos.y;\n    pos = pos * 2.0 - 1.0;\n\n    var out: VertexOutput;\n    out.pos = vec4<f32>(pos, 0.0, 1.0);\n    out.uv = uvs[vertexIndex];\n    out.fill = color;\n    out.smooth_width = adjusted_width / stroke_width - 1.0;\n    return out;\n}\n\n@fragment\nfn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {\n    let sx = abs(in.uv.x - 0.5) * 2.0;\n    let sy = abs(in.uv.y - 0.5) * 2.0;\n    let aax: f32 = 1.0 - smoothstep(1.0 - in.smooth_width, 1.0, sx);\n    // let aay: f32 = 1.0 - smoothstep(1.0 - in.smooth_length, 1.0, sy);\n    return vec4<f32>(in.fill.rgb, in.fill.a * aax);\n}\n\nfn pos_length() -> u32 {\n    return arrayLength(&pos);\n}";

    var ruleShader = "struct Uniforms {\n    resolution: vec2<f32>,\n    offset: vec2<f32>,\n}\n\n@group(0) @binding(0) var<uniform> uniforms: Uniforms;\n\nstruct VertexInput {\n    @location(0) position: vec2<f32>,\n    @location(1) center: vec2<f32>,\n    @location(2) scale: vec2<f32>,\n    @location(3) stroke_color: vec4<f32>,\n}\n\nstruct VertexOutput {\n    @builtin(position) pos: vec4<f32>,\n    @location(1) stroke: vec4<f32>,\n}\n\n@vertex\nfn main_vertex(in: VertexInput) -> VertexOutput {\n    var output : VertexOutput;\n    var u = uniforms.resolution;\n    var axis_offsets = calculateAxisWidthOffsets(in.scale);\n    var pos = in.position * in.scale  + in.center - uniforms.offset - axis_offsets;\n    pos = pos / uniforms.resolution;\n    pos.y = 1.0 - pos.y;\n    pos = pos * 2.0 - 1.0;\n    output.pos = vec4<f32>(pos, 0.0, 1.0);\n    output.stroke = in.stroke_color;\n    return output;\n}\n\n@fragment\nfn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {\n    return in.stroke;\n}\n\nfn calculateAxisWidthOffsets(inScale: vec2<f32>) -> vec2<f32> {\n    var x_width_offset = inScale.x;\n    var y_width_offset = inScale.y;\n\n    // one of them should be exactly 1.0 as its either a y or a x axis.\n    if (x_width_offset > 1.0) {\n        x_width_offset = 0.0;\n    }\n    if (y_width_offset > 1.0) {\n        y_width_offset = 0.0;\n    }\n    return vec2<f32>(x_width_offset / 2.0, y_width_offset / 2.0);\n}";

    var slineShader = "struct Uniforms {\n    resolution: vec2<f32>,\n    offset: vec2<f32>,\n};\n\n@group(0) @binding(0) var<uniform> uniforms: Uniforms;\n\nstruct VertexInput {\n    @location(0) start: vec2<f32>,\n    @location(1) end: vec2<f32>,\n    @location(2) color: vec4<f32>,\n    @location(3) stroke_width: f32,\n};\n\n\nstruct VertexOutput {\n    @builtin(position) pos: vec4<f32>,\n    @location(0)  uv: vec2<f32>,\n    @location(1) fill: vec4<f32>,\n};\n\n@vertex\nfn main_vertex(in: VertexInput, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {\n    let start = in.start;\n    let end = in.end;\n    let color = in.color;\n    let stroke_width = in.stroke_width;\n\n    // Calculate the direction vector of the line\n    let direction = normalize(end - start);\n    let angle = atan2(direction.y, direction.x);\n\n    // Calculate the normal vector\n    let normal = normalize(vec2<f32>(-direction.y, direction.x));\n\n    // Calculate the offset for width\n    let offset = normal * ((stroke_width) * 0.5);\n\n    // Calculate the four points of the line\n    var p1 = start - offset;\n    var p2 = start + offset;\n    var p3 = end - offset;\n    var p4 = end + offset;\n\n    var vertices = array(p1, p2, p3, p4, p2, p3);\n    var pos = vertices[vertexIndex];\n    pos = (pos - uniforms.offset) / uniforms.resolution;\n    pos.y = 1.0 - pos.y;\n    pos = pos * 2.0 - 1.0;\n\n    var out: VertexOutput;\n    out.pos = vec4<f32>(pos, 0.0, 1.0);\n    let rotatedUV = vertices[vertexIndex] + uniforms.offset;\n    var len = length(pos.xy);\n    out.uv = vec2<f32>(- pos.x / len, pos.y / len);\n    out.fill = color;\n    return out;\n}\n\n@fragment\nfn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {\n    return in.fill;\n}";

    var pathShader = "struct Uniforms {\n  resolution: vec2<f32>,\n  offset: vec2<f32>,\n}\n\n@group(0) @binding(0) var<uniform> uniforms : Uniforms;\n\nstruct VertexInput {\n  @location(0) position: vec3<f32>,\n  @location(1) fill_color: vec4<f32>,\n}\n\nstruct InstanceInput {\n  @location(2) center: vec2<f32>,\n}\n\nstruct VertexOutput {\n  @builtin(position) pos: vec4<f32>,\n  @location(0) uv: vec2<f32>,\n  @location(1) fill: vec4<f32>,\n}\n\n@vertex\nfn main_vertex(\n    model: VertexInput\n) -> VertexOutput {\n    var output: VertexOutput;\n    var pos = model.position.xy - uniforms.offset;\n    pos = pos / uniforms.resolution;\n    pos.y = 1.0 - pos.y;\n    pos = pos * 2.0 - 1.0;\n    output.pos = vec4<f32>(pos, model.position.z + 0.5, 1.0);\n    output.uv = pos;\n    output.fill = model.fill_color;\n    return output;\n}\n\n@fragment\nfn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {\n    return in.fill;\n}\n";

    var rectShader = "struct Uniforms {\n  resolution: vec2<f32>,\n  offset: vec2<f32>,\n};\n\n@group(0) @binding(0) var<uniform> uniforms : Uniforms;\n\nstruct VertexInput {\n  @location(0) position: vec2<f32>,\n}\n\nstruct InstanceInput {\n  @location(1) center: vec2<f32>,\n  @location(2) scale: vec2<f32>,\n  @location(3) fill_color: vec4<f32>,\n  @location(4) stroke_color: vec4<f32>,\n  @location(5) strokewidth: f32,\n  @location(6) corner_radii: vec4<f32>,\n}\n\nstruct VertexOutput {\n  @builtin(position) pos: vec4<f32>,\n  @location(0) uv: vec2<f32>,\n  @location(1) fill: vec4<f32>,\n  @location(2) stroke: vec4<f32>,\n  @location(3) strokewidth: f32,\n  @location(4) corner_radii: vec4<f32>,\n  @location(5) scale: vec2<f32>,\n}\n\n@vertex\nfn main_vertex(\n    model: VertexInput,\n    instance: InstanceInput\n) -> VertexOutput {\n    var output: VertexOutput;\n    var u = uniforms.resolution;\n    var scale = instance.scale + vec2<f32>(instance.strokewidth, instance.strokewidth);\n    var pos = model.position * scale + instance.center - uniforms.offset - vec2<f32>(instance.strokewidth, instance.strokewidth) / 2.0;\n    pos = pos / u;\n    pos.y = 1.0 - pos.y;\n    pos = pos * 2.0 - 1.0;\n    output.pos = vec4<f32>(pos, 0.0, 1.0);\n    output.uv = vec2<f32>(model.position.x, 1.0 - model.position.y);\n    output.fill = instance.fill_color;\n    output.stroke = instance.stroke_color;\n    output.strokewidth = instance.strokewidth;\n    output.corner_radii = instance.corner_radii;\n    output.scale = instance.scale;\n    return output;\n}\n\n@fragment\nfn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {\n    var col: vec4<f32> = in.fill;\n    let sw: vec2<f32> = vec2<f32>(in.strokewidth, in.strokewidth) / in.scale;\n    if in.uv.x < sw.x || in.uv.x > 1.0 - sw.x {\n        col = in.stroke;\n    }\n    if in.uv.y < sw.y || in.uv.y > 1.0 - sw.y {\n        col = in.stroke;\n    }\n    return col;\n}\n\nfn roundedBox(center: vec2<f32>, size: vec2<f32>, radius: vec4<f32>) -> f32 {\n    var rad = radius;\n    if center.x > 0.0 {\n        rad.x = radius.x;\n        rad.y = radius.y;\n    } else {\n        rad.x = radius.z;\n        rad.y = radius.w;\n    }\n    if center.y > 0.0 {\n        rad.x = rad.y;\n    }\n    var q = abs(center) - size + rad.x;\n    return min(max(q.x, q.y), 0.0) + length(max(q, vec2<f32>(0.0))) - rad.x;\n}\n";

    var arcShader = "struct Uniforms {\r\n  resolution: vec2<f32>,\r\n  offset: vec2<f32>,\r\n}\r\n\r\n@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r\n\r\nstruct VertexInput {\r\n  @location(0) position: vec3<f32>,\r\n  @location(1) fill_color: vec4<f32>,\r\n}\r\n\r\nstruct InstanceInput {\r\n  @location(2) center: vec2<f32>,\r\n}\r\n\r\nstruct VertexOutput {\r\n  @builtin(position) pos: vec4<f32>,\r\n  @location(0) uv: vec2<f32>,\r\n  @location(1) fill: vec4<f32>,\r\n}\r\n\r\n@vertex\r\nfn main_vertex(\r\n    model: VertexInput,\r\n    instance: InstanceInput\r\n) -> VertexOutput {\r\n    var output: VertexOutput;\r\n    var pos = model.position.xy + instance.center - uniforms.offset;\r\n    pos = pos / uniforms.resolution;\r\n    pos.y = 1.0 - pos.y;\r\n    pos = pos * 2.0 - 1.0;\r\n    output.pos = vec4<f32>(pos, model.position.z + 0.5, 1.0);\r\n    output.uv = pos;\r\n    output.fill = model.fill_color;\r\n    return output;\r\n}\r\n\r\n@fragment\r\nfn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {\r\n    return in.fill;\r\n}\r\n";

    var shapeShader = "struct Uniforms {\r\n  resolution: vec2<f32>,\r\n  offset: vec2<f32>,\r\n}\r\n\r\n@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r\n\r\nstruct VertexInput {\r\n  @location(0) position: vec3<f32>,\r\n  @location(1) fill_color: vec4<f32>,\r\n}\r\n\r\nstruct VertexOutput {\r\n  @builtin(position) pos: vec4<f32>,\r\n  @location(0) uv: vec2<f32>,\r\n  @location(1) fill: vec4<f32>,\r\n}\r\n\r\n@vertex\r\nfn main_vertex(\r\n    model: VertexInput,\r\n) -> VertexOutput {\r\n    var output: VertexOutput;\r\n    var pos = model.position.xy - uniforms.offset;\r\n    pos = pos / uniforms.resolution;\r\n    pos.y = 1.0 - pos.y;\r\n    pos = pos * 2.0 - 1.0;\r\n    output.pos = vec4<f32>(pos, model.position.z + 0.5, 1.0);\r\n    output.uv = pos;\r\n    output.fill = model.fill_color;\r\n    return output;\r\n}\r\n\r\n@fragment\r\nfn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {\r\n    return in.fill;\r\n}\r\n";

    var areaShader = "struct Uniforms {\r\n  resolution: vec2<f32>,\r\n  offset: vec2<f32>,\r\n}\r\n\r\n@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r\n\r\nstruct VertexInput {\r\n  @location(0) position: vec3<f32>,\r\n  @location(1) fill_color: vec4<f32>,\r\n}\r\n\r\nstruct VertexOutput {\r\n  @builtin(position) pos: vec4<f32>,\r\n  @location(0) uv: vec2<f32>,\r\n  @location(1) fill: vec4<f32>,\r\n}\r\n\r\n@vertex\r\nfn main_vertex(\r\n    model: VertexInput\r\n) -> VertexOutput {\r\n    var output: VertexOutput;\r\n    var pos = model.position.xy - uniforms.offset;\r\n    pos = pos / uniforms.resolution;\r\n    pos.y = 1.0 - pos.y;\r\n    pos = pos * 2.0 - 1.0;\r\n    output.pos = vec4<f32>(pos, model.position.z + 0.5, 1.0);\r\n    output.uv = pos;\r\n    output.fill = model.fill_color;\r\n    return output;\r\n}\r\n\r\n@fragment\r\nfn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {\r\n    return in.fill;\r\n}\r\n";

    function WebGPURenderer(loader) {
        vegaScenegraph.Renderer.call(this, loader);
        this._options = {};
        this._redraw = false;
        this._dirty = new vegaScenegraph.Bounds();
        this._tempb = new vegaScenegraph.Bounds();
    }
    var base = vegaScenegraph.Renderer.prototype;
    var viewBounds = function (origin, width, height) {
        return new vegaScenegraph.Bounds().set(0, 0, width, height).translate(-origin[0], -origin[1]);
    };
    inherits(WebGPURenderer, vegaScenegraph.Renderer, {
        initialize: function (el, width, height, origin) {
            this._canvas = document.createElement('canvas'); // instantiate a small canvas
            var ctx = this._canvas.getContext('webgpu');
            this._textCanvas = document.createElement('canvas');
            this._textContext = this._textCanvas.getContext('2d');
            if (el) {
                el.setAttribute('style', 'position: relative;');
                this._canvas.setAttribute('class', 'marks');
                this._textCanvas.setAttribute('class', 'textCanvas');
                this._textCanvas.style.position = 'absolute';
                this._textCanvas.style.top = '0';
                this._textCanvas.style.left = '0';
                this._textCanvas.style.zIndex = '10';
                this._textCanvas.style.pointerEvents = 'none';
                vegaScenegraph.domClear(el, 0);
                el.appendChild(this._canvas);
                el.appendChild(this._textCanvas);
            }
            this._canvas._textCanvas = this._textCanvas;
            ctx._textContext = this._textContext;
            ctx._renderer = this;
            this._bgcolor = "#ffffff";
            this._uniforms = {
                resolution: [width, height],
                origin: origin,
                dpi: window.devicePixelRatio || 1,
            };
            ctx._uniforms = this._uniforms;
            ctx._pathCache = {};
            ctx._pathCacheSize = 0;
            ctx._geometryCache = {};
            ctx._geometryCacheSize = 0;
            this._ctx = ctx;
            var wgOptions = {};
            wgOptions.simpleLine = true;
            wgOptions.debugLog = false;
            wgOptions.cacheShapes = false;
            this.wgOptions = wgOptions;
            this._renderCount = 0;
            // this method will invoke resize to size the canvas appropriately
            return base.initialize.call(this, el, width, height, origin);
        },
        resize: function (width, height, origin) {
            base.resize.call(this, width, height, origin);
            resize(this._canvas, this._ctx, this._width, this._height, this._origin, this._textCanvas, this._textContext);
            var ratio = window.devicePixelRatio || 1;
            if (ratio !== 1) {
                this._textCanvas.style.width = width + 'px';
                this._textCanvas.style.height = height + 'px';
            }
            this._uniforms = {
                resolution: [width, height],
                origin: origin,
                dpi: window.devicePixelRatio || 1,
            };
            this._ctx._uniforms = this._uniforms;
            return this._redraw = true, this;
        },
        canvas: function () {
            return this._canvas;
        },
        textCanvas: function () {
            return this._textCanvas;
        },
        context: function () {
            return this._ctx ? this._ctx : null;
        },
        textContext: function () {
            return this._textContext ? this._textContext : null;
        },
        device: function () {
            return this._device ? this._device : null;
        },
        dirty: function (item) {
            var b = this._tempb.clear().union(item.bounds);
            var g = item.mark.group;
            while (g) {
                b.translate(g.x || 0, g.y || 0);
                g = g.mark.group;
            }
            this._dirty.union(b);
        },
        _reinit: function () {
            return __awaiter(this, void 0, void 0, function () {
                var device, ctx, adapter, presentationFormat;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            device = this.device();
                            ctx = this.context();
                            if (!(!device || !ctx)) return [3 /*break*/, 3];
                            return [4 /*yield*/, navigator.gpu.requestAdapter({ powerPreference: "high-performance" })];
                        case 1:
                            adapter = _a.sent();
                            return [4 /*yield*/, adapter.requestDevice()];
                        case 2:
                            device = _a.sent();
                            this._adapter = adapter;
                            this._device = device;
                            presentationFormat = navigator.gpu.getPreferredCanvasFormat();
                            Renderer.colorFormat = presentationFormat;
                            ctx = this._canvas.getContext('webgpu');
                            ctx.configure({
                                device: device,
                                format: presentationFormat,
                                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
                                alphaMode: 'premultiplied',
                            });
                            this._ctx = ctx;
                            this.cacheShaders();
                            this._renderPassDescriptor = Renderer.createRenderPassDescriptor("Bundler", this.clearColor(), this.depthTexture().createView());
                            _a.label = 3;
                        case 3: return [2 /*return*/, { device: device, ctx: ctx }];
                    }
                });
            });
        },
        _render: function (scene) {
            var _this = this;
            (function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, device, ctx, o, w, h, 
                // db = this._dirty,
                vb, t1, t2;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this._reinit()];
                        case 1:
                            _a = (_b.sent()), device = _a.device, ctx = _a.ctx;
                            Renderer.startFrame();
                            o = this._origin, w = this._width, h = this._height, vb = viewBounds(o, w, h);
                            ctx._tx = 0;
                            ctx._ty = 0;
                            this.clear();
                            t1 = performance.now();
                            this.draw(device, ctx, scene, vb);
                            t2 = performance.now();
                            device.queue.onSubmittedWorkDone().then(function () {
                                if (_this.wgOptions.debugLog === true) {
                                    var t3 = performance.now();
                                    console.log("Render Time (".concat(_this._renderCount++, "): ").concat(((t3 - t1) / 1).toFixed(3), "ms (Draw: ").concat(((t2 - t1) / 1).toFixed(3), "ms, WebGPU: ").concat(((t3 - t2) / 1).toFixed(3), "ms)"));
                                }
                            });
                            this._renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
                            return [4 /*yield*/, Renderer.submitQueue(device)];
                        case 2:
                            _b.sent();
                            return [2 /*return*/];
                    }
                });
            }); })();
            return this;
        },
        frame: function () {
            if (this._lastScene) {
                this._render(this._lastScene, []);
            }
            return this;
        },
        draw: function (device, ctx, scene, transform) {
            var mark = marks[scene.marktype];
            if (mark == null) {
                console.error("Unknown mark type: '".concat(scene.marktype, "'"));
            }
            else {
                // ToDo: Set Options
                ctx.depthTexture = this.depthTexture();
                ctx.background = this.clearColor();
                mark.draw.call(this, device, ctx, scene, transform);
            }
        },
        clear: function () {
            var device = this.device();
            var context = this.context();
            var textureView = context.getCurrentTexture().createView();
            var renderPassDescriptor = {
                label: 'Background',
                colorAttachments: [
                    {
                        view: textureView,
                        loadOp: 'clear',
                        storeOp: 'store',
                        clearValue: this.clearColor(),
                    },
                ]
            };
            var commandEncoder = device.createCommandEncoder();
            var passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
            passEncoder.end();
            device.queue.submit([commandEncoder.finish()]);
            var textContext = this.textContext();
            textContext.save();
            textContext.setTransform(1, 0, 0, 1, 0, 0);
            textContext.clearRect(0, 0, this.textCanvas().width, this.textCanvas().height);
            textContext.restore();
        },
        depthTexture: function () {
            if (this._depthTexture != null) {
                if (this._depthTexture.device === this._device
                    && this._depthTexture.width === this.canvas().width
                    && this._depthTexture.height === this.canvas().height)
                    return this._depthTexture;
            }
            this._depthTexture = this.device().createTexture({
                size: [this.canvas().width, this.canvas().height, 1],
                format: Renderer.depthFormat,
                dimension: '2d',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
            this._depthTexture.device = this._device;
            this._renderPassDescriptor = Renderer.createRenderPassDescriptor("Bundler", this.clearColor(), this.depthTexture().createView());
            return this._depthTexture;
        },
        clearColor: function () {
            return (this._bgcolor ? Color.from(this._bgcolor) : { r: 1.0, g: 1.0, b: 1.0, a: 1.0 });
        },
        cacheShaders: function () {
            var device = this.device();
            var context = this.context();
            context._shaderCache = {};
            context._shaderCache["Symbol"] = device.createShaderModule({ code: symbolShader, label: 'Symbol Shader' });
            context._shaderCache["Line"] = device.createShaderModule({ code: lineShader, label: 'Line Shader' });
            context._shaderCache["Rule"] = device.createShaderModule({ code: ruleShader, label: 'Rule Shader' });
            context._shaderCache["SLine"] = device.createShaderModule({ code: slineShader, label: 'SLine Shader' });
            context._shaderCache["Path"] = device.createShaderModule({ code: pathShader, label: 'Triangle Shader' });
            context._shaderCache["Rect"] = device.createShaderModule({ code: rectShader, label: 'Rect Shader' });
            context._shaderCache["Group"] = device.createShaderModule({ code: rectShader, label: 'Group Shader' });
            context._shaderCache["Arc"] = device.createShaderModule({ code: arcShader, label: 'Arc Shader' });
            context._shaderCache["Shape"] = device.createShaderModule({ code: shapeShader, label: 'Shape Shader' });
            context._shaderCache["Area"] = device.createShaderModule({ code: areaShader, label: 'Area Shader' });
        },
    });

    // Patch CanvasHandler
    vegaScenegraph.CanvasHandler.prototype.context = function () {
        return this._canvas.getContext('2d') || this._canvas._textCanvas.getContext('2d');
    };
    vegaScenegraph.renderModule('webgpu', { handler: vegaScenegraph.CanvasHandler, renderer: WebGPURenderer });

    exports.WebGPURenderer = WebGPURenderer;

}));
//# sourceMappingURL=vega-webgpu-renderer.js.map
