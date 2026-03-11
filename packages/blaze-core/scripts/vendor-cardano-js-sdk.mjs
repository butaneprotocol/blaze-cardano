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
  ensureDir(vendorDepsRoot);

  fs.writeFileSync(
    path.join(vendorDepsRoot, "util.js"),
    [
      'import { bech32 } from "bech32";',
      'import sum from "lodash/sum.js";',
      'import { CustomError } from "ts-custom-error";',
      "",
      "export const formatErrorMessage = (reason, detail) =>",
      "  reason + (detail ? ` (${detail})` : \"\");",
      "",
      "const isWithInnerError = (error) =>",
      "  error !== null && typeof error === \"object\" && \"innerError\" in error;",
      "",
      "const isErrorLike = (error) => {",
      "  if (!error || typeof error !== \"object\") return false;",
      "  if (!('message' in error && 'stack' in error)) return false;",
      "  const { message, stack } = error;",
      "  return typeof message === \"string\" && typeof stack === \"string\";",
      "};",
      "",
      "export class ComposableError extends CustomError {",
      "  static stackDelimiter = \"\\n    at \";",
      "",
      "  constructor(message, innerError) {",
      "    let firstLine = \"\";",
      "    let innerStack = [];",
      "    if (isErrorLike(innerError) && innerError.stack) {",
      "      [firstLine, ...innerStack] = innerError.stack.split(",
      "        ComposableError.stackDelimiter,",
      "      );",
      "      message = `${message} due to\\n ${firstLine}`;",
      "    }",
      "    if (typeof innerError === \"string\") {",
      "      message = `${message} due to\\n ${innerError}`;",
      "    }",
      "    super(message);",
      "    this.innerError = innerError;",
      "    if (!this.stack || innerStack.length === 0) return;",
      "    const [firstLineOfStack] = this.stack.split(ComposableError.stackDelimiter);",
      "    Object.defineProperty(this, \"stack\", {",
      "      configurable: true,",
      "      value: `${firstLineOfStack}${innerStack.join(ComposableError.stackDelimiter)}`,",
      "    });",
      "  }",
      "}",
      "",
      "export class InvalidStringError extends ComposableError {",
      "  constructor(expectation, innerError) {",
      '    super(`Invalid string: "${expectation}"`, innerError);',
      "  }",
      "}",
      "",
      "export class InvalidArgumentError extends CustomError {",
      "  constructor(argName, message) {",
      "    super(`Invalid argument '${argName}': ${message}`);",
      "  }",
      "}",
      "",
      "export class InvalidStateError extends CustomError {",
      "  constructor(message) {",
      "    super(`Invalid state': ${message}`);",
      "  }",
      "}",
      "",
      "export const BigIntMath = {",
      "  abs(x) {",
      "    return x < 0n ? -x : x;",
      "  },",
      "  max(arr) {",
      "    if (arr.length === 0) return null;",
      "    let max = arr[0];",
      "    for (const num of arr.slice(1)) {",
      "      if (num > max) max = num;",
      "    }",
      "    return max;",
      "  },",
      "  subtract(arr) {",
      "    if (arr.length === 0) return 0n;",
      "    return arr.reduce((result, num) => result - num);",
      "  },",
      "  sum(arr) {",
      "    return arr.reduce((result, num) => result + num, 0n);",
      "  },",
      "};",
      "",
      "export const Percent = (value) => value;",
      "export const calcPercentages = (parts, total = sum(parts)) => {",
      "  if (parts.length === 0) return [];",
      "  let partsSum = sum(parts);",
      "  if (total < partsSum) total = partsSum;",
      "  if (total === 0) {",
      "    parts = parts.map(() => 1);",
      "    partsSum = sum(parts);",
      "    total = partsSum;",
      "  }",
      "  return parts.map((part) => Percent(part / total));",
      "};",
      "",
      "export const isNotNil = (item) =>",
      "  typeof item !== \"undefined\" && item !== null;",
      "",
      "const MAX_BECH32_LENGTH_LIMIT = 1023;",
      "const isOneOf = (target, options) =>",
      "  (Array.isArray(options) && options.includes(target)) || target === options;",
      "",
      "export const assertIsBech32WithPrefix = (",
      "  target,",
      "  prefix,",
      "  expectedDecodedLength,",
      ") => {",
      "  let decoded;",
      "  try {",
      "    decoded = bech32.decode(target, MAX_BECH32_LENGTH_LIMIT);",
      "  } catch (error) {",
      "    throw new InvalidStringError(",
      "      `expected bech32-encoded string with '${prefix}' prefix`,",
      "      error,",
      "    );",
      "  }",
      "  if (!isOneOf(decoded.prefix, prefix)) {",
      "    throw new InvalidStringError(",
      "      `expected bech32 prefix '${prefix}', got '${decoded.prefix}''`,",
      "    );",
      "  }",
      "  if (expectedDecodedLength && !isOneOf(decoded.words.length, expectedDecodedLength)) {",
      "    throw new InvalidStringError(",
      "      `expected decoded length of '${expectedDecodedLength}', got '${decoded.words.length}'`,",
      "    );",
      "  }",
      "};",
      "",
      "export const typedBech32 = (target, prefix, expectedDecodedLength) => {",
      "  assertIsBech32WithPrefix(target, prefix, expectedDecodedLength);",
      "  return target;",
      "};",
      "",
      "const assertLength = (expectedLength, target) => {",
      "  if (expectedLength && target.length !== expectedLength) {",
      "    throw new InvalidStringError(",
      "      `expected length '${expectedLength}', got ${target.length}`,",
      "    );",
      "  }",
      "};",
      "",
      "export const assertIsHexString = (target, expectedLength) => {",
      "  assertLength(expectedLength, target);",
      "  if (target.length > 0 && !/^[\\da-f]+$/i.test(target)) {",
      "    throw new InvalidStringError(\"expected hex string\");",
      "  }",
      "};",
      "",
      "export const typedHex = (value, length) => {",
      "  assertIsHexString(value, length);",
      "  return value;",
      "};",
      "",
      "export const Base64Blob = (target) => {",
      "  if (/^(?:[\\d+/a-z]{4})*(?:[\\d+/a-z]{2}==|[\\d+/a-z]{3}=)?$/i.test(target)) {",
      "    return target;",
      "  }",
      "  throw new InvalidStringError(\"expected base64 string\");",
      "};",
      "Base64Blob.fromBytes = (bytes) => Buffer.from(bytes).toString(\"base64\");",
      "",
      "export const HexBlob = (target) => typedHex(target);",
      "HexBlob.fromBytes = (bytes) => Buffer.from(bytes).toString(\"hex\");",
      "HexBlob.CHARS_PER_BYTE = 2;",
      "HexBlob.fromBase64 = (rawData) => Buffer.from(rawData, \"base64\").toString(\"hex\");",
      "HexBlob.toTypedBech32 = (prefix, hexString) =>",
      "  bech32.encode(",
      "    prefix,",
      "    bech32.toWords(Uint8Array.from(Buffer.from(hexString, \"hex\"))),",
      "  );",
      "",
      "export const castHexBlob = (target, expectedLength) => {",
      "  assertLength(expectedLength, target);",
      "  return target;",
      "};",
      "",
    ].join("\n"),
    "utf8",
  );

  fs.writeFileSync(
    path.join(vendorDepsRoot, "crypto.js"),
    [
      'import blake from "blakejs";',
      'import { castHexBlob, HexBlob, typedHex } from "./util.js";',
      "",
      "export const ready = async () => {};",
      "",
      "export const BIP32_PUBLIC_KEY_HASH_LENGTH = 28;",
      "export const ED25519_PUBLIC_KEY_LENGTH = 32;",
      "",
      "export const Hash28ByteBase16 = (value) => typedHex(value, 56);",
      "export const Hash32ByteBase16 = (value) => typedHex(value, 64);",
      "Hash32ByteBase16.fromHexBlob = (value) => castHexBlob(value, 64);",
      "",
      "export const Ed25519SignatureHex = (value) => typedHex(value, 128);",
      "export const Bip32PublicKeyHex = (key) => typedHex(key, 128);",
      "export const Ed25519PublicKeyHex = (value) =>",
      "  typedHex(value, ED25519_PUBLIC_KEY_LENGTH * HexBlob.CHARS_PER_BYTE);",
      "Ed25519PublicKeyHex.fromBip32PublicKey = (bip32PublicKey) =>",
      "  bip32PublicKey.slice(0, ED25519_PUBLIC_KEY_LENGTH * HexBlob.CHARS_PER_BYTE);",
      "export const Ed25519KeyHashHex = (value) => typedHex(value, 56);",
      "",
      "const hexStringToBuffer = (value) => Buffer.from(value, \"hex\");",
      "export const blake2b = {",
      "  hash(message, outputLengthBytes) {",
      "    return blake.blake2bHex(",
      "      hexStringToBuffer(message),",
      "      undefined,",
      "      outputLengthBytes,",
      "    );",
      "  },",
      "  async hashAsync(message, outputLengthBytes) {",
      "    return blake2b.hash(message, outputLengthBytes);",
      "  },",
      "};",
      "",
    ].join("\n"),
    "utf8",
  );
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
