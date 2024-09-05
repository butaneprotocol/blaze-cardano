import config from "@blaze-cardano/jest-config/base.jest.config";

export default {
  ...config,
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { isolatedModules: true }],
  },
  transformIgnorePatterns: [
    `<rootDir>/node_modules/.pnpm/(?!(@utxorpc\\+sdk)@)`,
  ],
};
