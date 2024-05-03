import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    server: {
      deps: {
        inline: true,
      },
    },
    // alias: [{ "/^@visx/scale$":  '@visx/scale/esm/index.js' }]
  },
});
