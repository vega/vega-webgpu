
const urlParams = new URLSearchParams(window.location.search);
const urlSpec = urlParams.get('spec');
const urlRenderer = urlParams.get('renderer') ?? 'webgpu';

let runtime, view, selectedSpec, selectedRenderer;

const selectSpec = document.querySelector('#specs');
selectSpec.addEventListener('change', function () {
  selectedSpec = selectSpec.options[selectSpec.selectedIndex].value;
  updateUrl();
  load(selectedSpec);
});
const selectRenderer = document.querySelector('#render');
selectRenderer.addEventListener('change', function () {
  selectedRenderer = selectRenderer.options[selectRenderer.selectedIndex].value;
  updateUrl();
  if (view) {
    view.renderer(selectedRenderer);
    view.runAsync();
    view._renderer._debugLog = true;
    view._renderer._simpleLine = true;
  }
});


function updateUrl() {
  if (!selectedSpec)
    selectedSpec = undefined;
  window.history.replaceState({}, '', `?spec=${selectedSpec}&renderer=${selectedRenderer}`);
}

async function init() {
  try {
    const data = await fetch('specs-valid.json').then(r => r.json());

    // load manifest of test specifications
    data.forEach(function (name) {
      const opt = document.createElement('option');
      opt.setAttribute('value', name);
      opt.textContent = name;
      selectSpec.appendChild(opt);
    });

    if (urlRenderer) {
      selectedRenderer = urlRenderer;
    }
    if (urlSpec) {
      selectedSpec = urlSpec;
    }
  } catch (err) {
    console.error(err, err.stack);
  }
}
async function load(name) {
  if (view) view.finalize().container().innerHTML = '';
  if (!name || name == undefined || name == 'undefined') {
    return;
  }

  // update select widget state
  selectSpec.selectedIndex = 0;
  for (let i = 0, n = selectSpec.options.length; i < n; ++i) {
    if (selectSpec.options[i].value === name) {
      selectSpec.selectedIndex = i;
      break;
    }
    if (i + 1 == n) {
      selectSpec.selectedIndex = undefined;
    }
  }
  selectRenderer.selectedIndex = 0;
  for (let i = 0, n = selectRenderer.options.length; i < n; ++i) {
    if (selectRenderer.options[i].value === selectedRenderer) {
      selectRenderer.selectedIndex = i;
      break;
    }
    if (i + 1 == n) {
      selectRenderer.selectedIndex = undefined;
    }
  }

  // load vega spec, then visualize it
  try {
    const selectedSpecData = await fetch(`specs-valid/${name}.vg.json`).then(r => r.json());
    console.log('LOAD', name);

    runtime = vega.parse(selectedSpecData)
    view = new vega.View(runtime)
      .logLevel(vega.Warn) // set view logging level
      .initialize(document.querySelector('#vis')) // set parent DOM element
      .renderer(selectedRenderer) // set render type (defaults to 'canvas')
      .hover();

    view._renderer._debugLog = true;
    view._renderer._simpleLine = true;

    view.runAsync();
    console.log('INIT', name);
    specname = name;
  } catch (err) {
    console.error(err, err.stack);
  }
}

(async () => {
  await init();
  await load(selectedSpec);
})();