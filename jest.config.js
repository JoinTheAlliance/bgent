/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "./src",
  testMatch: ["**/*.test.ts"],
  globals: {
    __DEV__: true,
    __TEST__: true,
    __VERSION__: "0.0.1",
  },
};
