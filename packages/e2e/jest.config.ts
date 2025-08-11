import base from "@blaze-cardano/jest-config/base.jest.config";
import { config as dotenv } from "dotenv";

dotenv();

export default {
  ...base,
  testMatch: ["**/tests/**/*.e2e.test.ts"],
  testTimeout: 120000,
  maxWorkers: 1,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.e2e.ts"],
  testEnvironment: "node",
};
