
const urlParams = new URLSearchParams(window.location.search);
const urlSpec = urlParams.get('spec');
const urlRenderer = urlParams.get('renderer') ?? 'webgpu';
const urlVersion = urlParams.get('version') ?? vegaWevGPURendererVersions[0] ?? 'dev';

let runtime, view, selectedSpec, selectedRenderer, selectedVersion;

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
    configureWebGPU();
  }
});
const selectVersion = document.querySelector('#versions');
selectVersion.addEventListener('change', function () {
  selectedVersion = selectVersion.options[selectVersion.selectedIndex].value;
  updateUrl();
  window.location.reload(true);
});


function updateUrl() {
  // Assuming selectedSpec and selectedRenderer are defined elsewhere
  if (!selectedSpec) {
    selectedSpec = undefined;
  }

  const urlSearchParams = new URLSearchParams(window.location.search);

  // If version parameter exists, set it as the first tag
  urlSearchParams.set('spec', selectedSpec);
  urlSearchParams.set('renderer', selectedRenderer);
  urlSearchParams.set('version', selectedVersion);

  window.history.replaceState({}, '', `?${urlSearchParams.toString()}`);
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

    vegaWevGPURendererVersions?.forEach(function (name) {
      const opt = document.createElement('option');
      opt.setAttribute('value', name);
      opt.textContent = name;
      selectVersion.appendChild(opt);
    });

    if (urlSpec) {
      selectedSpec = urlSpec;
    }
    if (urlRenderer) {
      selectedRenderer = urlRenderer;
    }
    if (urlVersion) {
      selectedVersion = urlVersion;
    }
  } catch (err) {
    console.error(err, err.stack);
  }
}
async function load(name) {
  selectVersion.selectedIndex = 0;
  for (let i = 0, n = selectVersion.options.length; i < n; ++i) {
    if (selectVersion.options[i].value === selectedVersion) {
      selectVersion.selectedIndex = i;
      break;
    }
  }
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
    configureWebGPU();

    view.runAsync();
    console.log('INIT', name);
    specname = name;
  } catch (err) {
    console.error(err, err.stack);
  }
}

function configureWebGPU() {
  if (!selectedRenderer || selectedRenderer != 'webgpu')
    return;
  if (selectedVersion && selectedVersion.replaceAll('_', '.') == '1.0.0') {
    view._renderer.debugLog = true;
    view._renderer.simpleLine = true;
  } else {
    view._renderer.wgOptions.debugLog = true;
    view._renderer.wgOptions.simpleLine = true;
    view._renderer.wgOptions.shapeCache = false;
  }
}

(async () => {
  await init();
  updateUrl();
  await load(selectedSpec);
})();