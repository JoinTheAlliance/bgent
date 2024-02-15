import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import pkg from "./package.json";

export default defineConfig([
  {
    input: "src/index.ts",
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ],
    output: [
      {
        file: pkg.main,
        format: "cjs",
        sourcemap: true,
        exports: "auto",
      },
      {
        file: pkg.module,
        format: "es",
        sourcemap: true,
      },
    ],
    plugins: [
      json(),
      typescript(),
      replace({
        __DEV__: `(process.env.NODE_ENV !== 'production')`,
        preventAssignment: true,
      }),
    ].filter(Boolean),
  },
]);
