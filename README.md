# WebGPU Renderer for [Vega](https://vega.github.io/vega)

[Demo](https://kanadaat.github.io/vega-webgpu/test)

**Warning:** The splom examples of the demo use a set of 50.000 data points. Thus canvas and svg will take very long for it to render or simply crash.

The Vega WebGPU Extension is created by [KaNaDaAT](https://github.com/KaNaDaAT) based on the already existing efforts of [lsh](https://github.com/lsh).

## Basics

This repository contains a WebGPU renderer extension for Vega JS. 

Almost all Vega Components can be used. While some are more performant than others. 
It is not yet possible to use:
- Images
- Gradient Colors
- Some Properties of Components as for example rounded edges for Rectangles or Groups

**Note:** The WebGPU renderer is currently a work in progress and might not be suitable for all production use.

## How to Use

Use this scaffolding to get started using the WebGPU renderer. Instead of being directly usable after loading Vega, as the SVG and Canvas renderers are, the WebGPU renderer is a plugin which requires the inclusion of an additional JavaScript library.

Therefor all that needs to be done is to link the Vega WebGPU Renderer
```html
<script src="https://kanadaat.github.io/vega-webgpu/releases/1_1_1/vega-webgpu-renderer.js"></script>
```

The WebGPU renderer was developed for Vega 5.19.1. Other Versions may work as well.
```html
<body>
  <script src="https://d3js.org/d3.v4.min.js" charset="utf-8"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega@5.19.1/build/vega.js"></script>
  <script src="https://kanadaat.github.io/vega-webgpu/releases/1_1_1/vega-webgpu-renderer.js"></script>
  <div id="vis"></div>
  <script>
    // Load in your own Vega spec here.
    d3.json('https://vega.github.io/vega/examples/bar-chart.vg.json', function (spec) {
      var view = new vega.View(vega.parse(spec))
        .initialize(document.querySelector('#vis'))
        .renderer('webgpu')
        .run();
    });
  </script>
</body>
```

The example shows how it is possible to always use the "latest" version.

For more infos look at [Hosted Versions](#hosted-versions).

## Building Locally
To build the WebGPU renderer locally, follow these steps:

1. Install dependencies: `npm install`
2. Build the renderer: `npm run build`
3. The built `vega-webgpu-renderer.js` file will be available in the `build` directory.


## Development Locally
To develop the WebGPU renderer locally, follow these steps:

1. Install dependencies: `npm install`
2. Build the renderer in dev mode: `npm run dev`
3. Go live using something as the Visual Studio Code "Live Server" Extension and open the test website.

Call: http://localhost:5500/test?spec=bar&renderer=webgpu&version=dev in order to use the local file.

New Versions can be simply released by using the npm run release script.
`npm run release 1.1.1 "Using Render Bundles for Performance"`

Readme has to be changed manually yet.

## Hosted Versions

| Version | Hosted Renderer Link                                                                                     | Changes |
| ------- | -------------------------------------------------------------------------------------------------------- | ------- |
| 1.0.0   | [vega-webgpu-renderer](https://kanadaat.github.io/vega-webgpu/releases/1_0_0/vega-webgpu-renderer.js) | First WebGPU Implementation |
| 1.1.0   | [vega-webgpu-renderer](https://kanadaat.github.io/vega-webgpu/releases/1_1_0/vega-webgpu-renderer.js) | Over all improvements in terms of performance and structure.  |
| 1.1.1   | [vega-webgpu-renderer](https://kanadaat.github.io/vega-webgpu/releases/1_1_1/vega-webgpu-renderer.js) | Performance improvements on Paths.<br>Introducing WebGPU Render Option `renderLock`.  |

Have a look at all versions [here](https://kanadaat.github.io/vega-webgpu/releases).


## WebGPU Renderer Specific Options

The WebGPU allows some options to be set:
```js
fetch('https://vega.github.io/vega/examples/bar-chart.vg.json')
  .then(res => res.json())
  .then(spec => render(spec))
  .catch(err => console.error(err));
function render(spec) {
  view = new vega.View(vega.parse(spec), {
    renderer:  'webgpu',  // renderer (canvas or svg)
    container: '#vis',   // parent DOM container
    hover:     true       // enable hover processing
  });
  return view.runAsync();
}
view._renderer.wgOptions.debugLog = true;
// For Version 1.0.0 it is:
// view._renderer.debugLog = true;
```
| Option     | Description                                                                                                                                                 | Default | Version |   |
|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|---------|---------|---|
| debugLog   | Allows the renderer to log the time needed for the frame                                                                                                    | false   | 1.0.0   |   |
| simpleLine | When set to `false` the renderer will use a different type of line rendering that is optimized for small amount of lines with alot of points (curved lines) | true    | 1.0.0   |   |
| cacheShape | Allows shapes to cache its entries so it might be faster (experimental)                                                                                     | false   | 1.1.0   |   |
| renderLock | Will lock the render loop from beeing called again until the previous call is finished. Might skip render steps. The most recent will always be called. Will enhance the performance, esspecially for interactive GUI.                                 | true   | 1.1.1   |   |

**Note:** Its a bit different on Version 1.0.0. Have a look at the demos index.js

## Contributing

Contributions are welcome as this project is very complex. The small amount of WebGPU sources yet make it even more complicated. (Especially for 2D rendering)

## Known Issues

- Performance of Areas, Shapes and Paths might not be very good. A hybrid version will be needed.
- Gradiants do not work. May do that via hybrid version or shaders.
- Symbols only support circles yet.
- Lines dont support dashes nor joins (miter join, bevel join, ...)
- Rects do not support rounded edges yet.
- Cliping is not supported yet.
- Resizing the Canvas will cause webgpu renderer to fail.
