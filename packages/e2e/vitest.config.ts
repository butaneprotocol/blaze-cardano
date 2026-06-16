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
  poolOptions: { forks: { maxForks: 1, minForks: 1 } },
  test: {
    include: ["**/tests/**/*.e2e.test.ts"],
    testTimeout: 120000,
    retry: process.env["BLAZE_SCRIPT_DEPLOYMENT_E2E"] === "true" ? 0 : 2,
    fileParallelism: false,
    pool: "forks",
    setupFiles: ["./tests/setup.e2e.ts"],
  },
});
