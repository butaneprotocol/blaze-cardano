import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@emurgo/cardano-message-signing-browser":
        "@emurgo/cardano-message-signing-nodejs",
    },
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
