import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'
import pkg from './package.json'
import json from '@rollup/plugin-json';

export default defineConfig([
    {
        input: 'src/index.ts',
        output: [
            {
                file: pkg.unpkg,
                format: 'iife',
                sourcemap: true,
                name: pkg.name,
            },
            {
                file: pkg.browser,
                format: 'umd',
                sourcemap: true,
                name: pkg.name,
            },
        ],
        plugins: [
            json(),
            resolve(), // so Rollup can resolve packages
            commonjs(), // so Rollup can convert commonjs to an ES module
            typescript(), // so Rollup can convert TypeScript to JavaScript
            replace({
                // see: https://github.com/rollup/plugins/tree/master/packages/replace#preventassignment
                preventAssignment: true,
            })
        ].filter(Boolean),
    },
    {
        input: 'src/index.ts',
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {}),
        ],
        output: [
            {
                file: pkg.main,
                format: 'cjs',
                sourcemap: true,
                exports: 'auto',
            },
            {
                file: pkg.module,
                format: 'es',
                sourcemap: true,
            },
        ],
        plugins: [
            json(),
            typescript(), // so Rollup can convert TypeScript to JavaScript
            replace({
                // preserve to be handled by bundlers
                __DEV__: `(process.env.NODE_ENV !== 'production')`,
                // see: https://github.com/rollup/plugins/tree/master/packages/replace#preventassignment
                preventAssignment: true,
            })
        ].filter(Boolean),
    },
])