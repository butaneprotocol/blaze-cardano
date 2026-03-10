import { defineConfig } from "vitest/config";
import { config as dotenv } from "dotenv";

dotenv();

export default defineConfig({
  test: {
    include: ["**/tests/**/*.e2e.test.ts"],
    testTimeout: 120000,
    retry: 2,
    pool: "forks",
    poolOptions: { forks: { maxForks: 1, minForks: 1 } },
    setupFiles: ["./tests/setup.e2e.ts"],
  },
});
