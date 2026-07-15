import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/blaze.ts"],
  format: ["esm", "cjs"],
  dts: true,
  exports: true,
  deps: {
    neverBundle: [/^rxjs/],
  },
});
