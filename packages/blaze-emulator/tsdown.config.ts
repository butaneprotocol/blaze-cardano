import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/rpc/index.ts", "src/rpc/cli.ts"],
  format: ["esm", "cjs"],
  dts: true,
  exports: {
    exclude: ["rpc/cli"],
  },
  deps: {
    neverBundle: [/^rxjs/],
  },
});
