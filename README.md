# WebGPU Renderer for [Vega](https://vega.github.io/vega)

[Demo](https://kanadaat.github.io/vega-webgpu/test/)

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
<script src="https://kanadaat.github.io/vega-webgpu/releases/1_0_0/vega-webgpu-renderer.js"></script>
```

The WebGPU renderer was developed for Vega 5.19.1. Other Versions may work as well.
```html
<body>
  <script src="https://d3js.org/d3.v4.min.js" charset="utf-8"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega@5.19.1/build/vega.js"></script>
  <script src="https://kanadaat.github.io/vega-webgpu/releases/1_0_0/vega-webgpu-renderer.js"></script>
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

For more infos look at (Hosted Versions)[#Hosted_Versions].

## Building Locally
To build the WebGPU renderer locally, follow these steps:

1. Install dependencies: `npm install`
2. Build the renderer: `npm run build`
3. The built `vega-webgpu-renderer.js` file will be available in the `build` directory.


## Development Locally
To develop the WebGPU renderer locally, follow these steps:

1. Install dependencies: `npm install`
2. Build the renderer in dev mode: `npm run dev`
3. Go live using something as the Visual Studio Code "Live Server" Extenstion and open the test website.

## Hosted Versions

| Version | Hosted Renderer Link                                                                                     |
| ------- | -------------------------------------------------------------------------------------------------------- |
| 1.0.0   | (vega-webgpu-renderer.js)[https://kanadaat.github.io/vega-webgpu/releases/1_0_0/vega-webgpu-renderer.js] |

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
view._renderer.debugLog = true;
```

There are different options available for the WebGPU renderer.
- **debugLog**: Allows the renderer to log the time needed for the frame
- **simpleLine**: Allows the renderer to use a different type of line rendering that is optimized for small amount of lines with alot of points (curved lines)

## Contributing

Contributions are welcome as this project is very complex. The small amount of WebGPU sources yet make it even more complicated. (Especially for 2D rendering)

## Known Issues

- Performance of Areas, Shapes and Paths might not be very good. A hybrid version will be needed.
- Gradiants do not work. May do that via hybrid version or shaders.
- Symbols only support circles yet.
- Lines dont support dashes nor joins (miter join, bevel join, ...)