module.exports = {
  preset: "ts-jest/presets/default-esm",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.[tj]s?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
};
