import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import {string} from 'rollup-plugin-string';

export default {
  input: 'src/index.ts',
  output: {file: './dist/vega-webgpu.module.js', format: 'es'},
  plugins: [
    commonjs(),
    resolve(),
    typescript({allowSyntheticDefaultImports: true}),
    string({
      include: '**/*.wgsl',
      exclude: ['node_modules/*']
    })
  ]
};
