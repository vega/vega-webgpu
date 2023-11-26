import { string } from 'rollup-plugin-string';

import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'index.ts',
  output: {
    file: 'build/vega-webgpu-renderer.js',
    format: 'umd',
    name: 'WevGPURenderer',
    sourcemap: true,
    globals: {
      'd3-color': 'd3',
      'vega-scenegraph': 'vega'
    }
  },
  external: ['d3-color', 'vega-scenegraph'],
  plugins: [
    commonjs({
      include: 'node_modules/**',
    }),
    resolve({
      jsnext: true,
      // main: true,
      browser: true,
    }),
    string({
      include: '**/*.wgsl',
      exclude: ['node_modules/*'],
    }),
    typescript({
      allowSyntheticDefaultImports: true,
      lib: ['esnext', 'dom'],
    }),
  ],
};
