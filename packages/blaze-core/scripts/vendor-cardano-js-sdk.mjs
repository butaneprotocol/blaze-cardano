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
const vendorDepsRoot = path.join(vendorRoot, "deps");

const entrypoints = [
  "Cardano/index.js",
  "Serialization/index.js",
  "util/conwayEra.js",
];

const importPattern =
  /\b(?:import|export)\s+(?:[^'"`;]*?\s+from\s+)?["']([^"'`]+)["']/g;

const shimImportRewrites = {
  "@cardano-sdk/crypto": "deps/crypto.js",
  "@cardano-sdk/util": "deps/util.js",
};

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

function toImportPath(fromCoreFile, vendorRelativeTarget) {
  const fromDir = path.dirname(path.join(vendorCoreRoot, fromCoreFile));
  const toFile = path.join(vendorRoot, vendorRelativeTarget);
  let rel = toPosix(path.relative(fromDir, toFile));
  if (!rel.startsWith(".")) {
    rel = `./${rel}`;
  }
  return rel;
}

function rewriteShimImports(source, file) {
  let rewritten = source;
  for (const [specifier, replacement] of Object.entries(shimImportRewrites)) {
    const escaped = specifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const importPath = toImportPath(file, replacement);
    rewritten = rewritten.replace(
      new RegExp(`(["'])${escaped}\\1`, "g"),
      `"${importPath}"`,
    );
  }
  return rewritten;
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
    const rewritten = rewriteShimImports(content, file);
    const sanitized = rewritten.replace(
      /^\/\/# sourceMappingURL=.*$/gm,
      "",
    );
    fs.writeFileSync(dst, sanitized, "utf8");
  }
}

function writeDependencyShims() {
  const templatesRoot = path.resolve(__dirname, "templates", "deps");
  ensureDir(vendorDepsRoot);

  for (const file of ["util.js", "util.d.ts", "crypto.js", "crypto.d.ts"]) {
    const src = path.join(templatesRoot, file);
    const dst = path.join(vendorDepsRoot, file);
    if (!fs.existsSync(src)) {
      throw new Error(`Missing shim template: ${src}`);
    }
    fs.copyFileSync(src, dst);
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
  const rewrittenImports = Object.keys(shimImportRewrites);
  const manifest = {
    source: "@cardano-sdk/core/dist/esm",
    entrypoints,
    fileCount: files.length,
    files,
    bareImports: bareImports.filter(
      (specifier) => !rewrittenImports.includes(specifier),
    ),
    rewrittenImports,
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

  removeDir(vendorRoot);
  const { files, bareImports } = walkDependencyClosure();
  copyClosure(files);
  writeDependencyShims();
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
