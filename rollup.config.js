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
            resolve(),
            commonjs(),
            typescript(),
            replace({
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
            typescript(),
            replace({
                __DEV__: `(process.env.NODE_ENV !== 'production')`,
                preventAssignment: true,
            })
        ].filter(Boolean),
    },
])