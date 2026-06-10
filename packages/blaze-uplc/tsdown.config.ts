import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  format: ["esm", "cjs"],
  dts: true,
  exports: {
    customExports: {
      "./wasm": {
        types: "./dist/wasm/pkg-node/uplc_wasm.d.ts",
        browser: "./dist/wasm/pkg-bundler/uplc_wasm.js",
        import: "./dist/wasm/pkg-node/uplc_wasm.js",
        default: "./dist/wasm/pkg-node/uplc_wasm.js",
      },
      "./wasm/web": {
        types: "./dist/wasm/pkg-web/uplc_wasm.d.ts",
        import: "./dist/wasm/pkg-web/uplc_wasm.js",
        default: "./dist/wasm/pkg-web/uplc_wasm.js",
      },
      "./wasm/bundler": {
        types: "./dist/wasm/pkg-bundler/uplc_wasm.d.ts",
        import: "./dist/wasm/pkg-bundler/uplc_wasm.js",
        default: "./dist/wasm/pkg-bundler/uplc_wasm.js",
      },
    },
  },
  deps: {
    neverBundle: [/^rxjs/],
  },
});
