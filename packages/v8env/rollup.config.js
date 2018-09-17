import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'lib/index.js',
  plugins: [
    resolve({
      jsnext: true,
      customResolveOptions: {
        moduleDirectory: '../../node_modules'
      }
    }),
    commonjs({
      include: '../../node_modules/**',
    }),
  ],
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    name: 'flyMain'
  }
};
