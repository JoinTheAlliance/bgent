import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { defineConfig } from "rollup";
import pkg from "./package.json";

const externalDependencies = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

export default defineConfig([
  {
    input: "src/index.ts",
    external: (id) =>
      externalDependencies.some(
        (dependency) => id === dependency || id.startsWith(`${dependency}/`),
      ),
    output: [
      {
        file: pkg.main,
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
      {
        file: pkg.module,
        format: "es",
        sourcemap: true,
        exports: "named",
      },
    ],
    plugins: [
      json(),
      typescript(),
      nodeResolve(),
      replace({
        __DEV__: `(process.env.NODE_ENV !== 'production')`,
        preventAssignment: true,
      }),
    ].filter(Boolean),
  },
]);
