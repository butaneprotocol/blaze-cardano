import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@emurgo/cardano-message-signing-browser":
        "@emurgo/cardano-message-signing-nodejs",
    },
  },
});
