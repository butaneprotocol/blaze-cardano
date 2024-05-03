import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest/presets/default-esm",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.[tj]s$": ["ts-jest", { useESM: true }],
    "^.+\\.js?$": "babel-jest",
  },
  transformIgnorePatterns: ["<rootDir>/node_modules(?!@noble)"],
};

export default jestConfig;