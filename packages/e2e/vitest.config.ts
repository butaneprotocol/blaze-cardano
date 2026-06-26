import { defineConfig } from "vitest/config";
import { config as dotenv } from "dotenv";

dotenv();

export default defineConfig({
  resolve: {
    alias: {
      "@emurgo/cardano-message-signing-browser":
        "@emurgo/cardano-message-signing-nodejs",
    },
  },
  test: {
    include: ["**/tests/**/*.e2e.test.ts"],
    testTimeout: 120000,
    retry: 2,
    pool: "forks",
    fileParallelism: false,
    setupFiles: ["./tests/setup.e2e.ts"],
  },
});
