#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const sourceRoot = path.resolve(
  packageRoot,
  "..",
  "..",
  "node_modules",
  "@cardano-sdk",
  "core",
  "dist",
  "esm",
);
const vendorRoot = path.resolve(packageRoot, "vendor", "cardano-js-sdk");
const vendorCoreRoot = path.join(vendorRoot, "core");

const entrypoints = [
  "Cardano/index.js",
  "Serialization/index.js",
  "util/conwayEra.js",
];

const importPattern =
  /\b(?:import|export)\s+(?:[^'"`;]*?\s+from\s+)?["']([^"'`]+)["']/g;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

function toPosix(relPath) {
  return relPath.split(path.sep).join("/");
}

function walkDependencyClosure() {
  const seen = new Set();
  const queue = [...entrypoints];
  const bareImports = new Set();

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || seen.has(current)) {
      continue;
    }

    const absolute = path.join(sourceRoot, current);
    if (!fs.existsSync(absolute)) {
      throw new Error(`Missing source file: ${absolute}`);
    }

    seen.add(current);
    const source = fs.readFileSync(absolute, "utf8");

    importPattern.lastIndex = 0;
    let match = importPattern.exec(source);
    while (match) {
      const specifier = match[1];
      if (specifier.startsWith(".")) {
        let nextPath = path.normalize(path.join(path.dirname(current), specifier));
        if (!path.extname(nextPath)) {
          nextPath += ".js";
        }
        const normalized = toPosix(nextPath);
        if (!normalized.startsWith("..")) {
          queue.push(normalized);
        }
      } else {
        bareImports.add(specifier);
      }
      match = importPattern.exec(source);
    }
  }

  return {
    files: [...seen].sort(),
    bareImports: [...bareImports].sort(),
  };
}

function copyClosure(files) {
  for (const file of files) {
    const src = path.join(sourceRoot, file);
    const dst = path.join(vendorCoreRoot, file);
    ensureDir(path.dirname(dst));
    const content = fs.readFileSync(src, "utf8");
    const sanitized = content.replace(
      /^\/\/# sourceMappingURL=.*$/gm,
      "",
    );
    fs.writeFileSync(dst, sanitized, "utf8");
  }
}

function writeVendorIndex() {
  ensureDir(vendorRoot);

  fs.writeFileSync(
    path.join(vendorRoot, "index.js"),
    [
      'import * as Cardano from "./core/Cardano/index.js";',
      'import * as Serialization from "./core/Serialization/index.js";',
      "",
      "export { Cardano, Serialization };",
      'export { setInConwayEra } from "./core/util/conwayEra.js";',
      "",
    ].join("\n"),
    "utf8",
  );

  fs.writeFileSync(
    path.join(vendorRoot, "index.d.ts"),
    [
      'export { Cardano, Serialization, setInConwayEra } from "@cardano-sdk/core";',
      "",
    ].join("\n"),
    "utf8",
  );
}

function writeManifest(files, bareImports) {
  const manifest = {
    source: "@cardano-sdk/core/dist/esm",
    entrypoints,
    fileCount: files.length,
    files,
    bareImports,
  };
  fs.writeFileSync(
    path.join(vendorRoot, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

function main() {
  if (!fs.existsSync(sourceRoot)) {
    throw new Error(
      `Could not find ${sourceRoot}. Install dependencies before vendoring.`,
    );
  }

  removeDir(vendorCoreRoot);
  const { files, bareImports } = walkDependencyClosure();
  copyClosure(files);
  writeVendorIndex();
  writeManifest(files, bareImports);

  // Keep upstream notices alongside vendored runtime files.
  const upstreamPackageRoot = path.resolve(sourceRoot, "..", "..");
  for (const file of ["LICENSE", "NOTICE"]) {
    const src = path.join(upstreamPackageRoot, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(vendorRoot, file));
    }
  }

  console.log(
    `Vendored ${files.length} files from @cardano-sdk/core with ${bareImports.length} bare imports.`,
  );
  console.log(`Output: ${vendorRoot}`);
}

main();
