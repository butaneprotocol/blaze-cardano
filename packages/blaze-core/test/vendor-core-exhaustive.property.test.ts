import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

type Manifest = {
  files: string[];
};

type WalkState = {
  callables: number;
  constructors: number;
  objects: number;
  modules: number;
};

type InvocationOutcome =
  | { ok: true; value: unknown }
  | { ok: false; error: { name: string; message: string } };

const PROPERTY_CASES = 8;
const MAX_DEPTH = 5;
const BUILTIN_FUNCTION_KEYS = new Set([
  "length",
  "name",
  "prototype",
  "arguments",
  "caller",
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(
  packageRoot,
  "vendor",
  "cardano-js-sdk",
  "manifest.json",
);
const vendorCoreRoot = path.join(packageRoot, "vendor", "cardano-js-sdk", "core");

const require = createRequire(import.meta.url);
const realCoreEntrypointPath = require.resolve("@cardano-sdk/core");
const realPackageRoot = path.resolve(path.dirname(realCoreEntrypointPath), "..", "..");
const realCoreRoot = path.join(realPackageRoot, "dist", "esm");

function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomString(next: () => number, maxLength = 16): string {
  const length = next() % (maxLength + 1);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += String.fromCharCode(32 + (next() % 95));
  }
  return result;
}

function randomBytes(next: () => number, maxLength = 24): Uint8Array {
  const length = next() % (maxLength + 1);
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = next() & 0xff;
  }
  return bytes;
}

function randomPrimitive(next: () => number): unknown {
  const selector = next() % 8;
  if (selector === 0) {
    return undefined;
  }
  if (selector === 1) {
    return null;
  }
  if (selector === 2) {
    return (next() % 2) === 0;
  }
  if (selector === 3) {
    return ((next() % 2 === 0 ? -1 : 1) * (next() % 1_000_000)) | 0;
  }
  if (selector === 4) {
    return Number((next() % 1_000_000) / 1000);
  }
  if (selector === 5) {
    return BigInt(next() % 1_000_000) * BigInt((next() % 3) - 1);
  }
  if (selector === 6) {
    return randomString(next);
  }
  return Symbol.for(`sym-${next() % 64}`);
}

function randomValue(next: () => number, depth: number): unknown {
  if (depth >= 2) {
    return randomPrimitive(next);
  }

  const selector = next() % 10;
  if (selector <= 5) {
    return randomPrimitive(next);
  }
  if (selector === 6) {
    return randomBytes(next);
  }
  if (selector === 7) {
    const length = next() % 5;
    const values: unknown[] = [];
    for (let i = 0; i < length; i++) {
      values.push(randomValue(next, depth + 1));
    }
    return values;
  }
  if (selector === 8) {
    const result: Record<string, unknown> = {};
    const size = next() % 4;
    for (let i = 0; i < size; i++) {
      result[`k${i}`] = randomValue(next, depth + 1);
    }
    return result;
  }

  return { tag: `t-${next() % 32}` };
}

function randomArgs(next: () => number, hintArity: number): unknown[] {
  const maxLen = Math.min(5, Math.max(1, hintArity + 2));
  const length = next() % (maxLen + 1);
  const args: unknown[] = [];
  for (let i = 0; i < length; i++) {
    args.push(randomValue(next, 0));
  }
  return args;
}

function fingerprint(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null) {
    return { type: "null" };
  }

  const valueType = typeof value;
  if (valueType === "undefined") {
    return { type: "undefined" };
  }
  if (valueType === "string" || valueType === "boolean") {
    return { type: valueType, value };
  }
  if (valueType === "number") {
    if (Number.isNaN(value as number)) {
      return { type: "number", value: "NaN" };
    }
    if (!Number.isFinite(value as number)) {
      return { type: "number", value: `${value}` };
    }
    return { type: "number", value };
  }
  if (valueType === "bigint") {
    return { type: "bigint", value: (value as bigint).toString() };
  }
  if (valueType === "symbol") {
    return { type: "symbol", value: String(value) };
  }
  if (valueType === "function") {
    const fn = value as (...args: unknown[]) => unknown;
    return { type: "function", name: fn.name, length: fn.length };
  }

  const objectValue = value as object;
  if (seen.has(objectValue)) {
    return { type: "circular" };
  }
  seen.add(objectValue);

  if (ArrayBuffer.isView(objectValue)) {
    const view = objectValue as Uint8Array;
    return {
      type: "typed-array",
      ctor: objectValue.constructor.name,
      byteLength: view.byteLength,
      sample: Array.from(view.subarray(0, 16)),
    };
  }

  if (Array.isArray(objectValue)) {
    const arrayValue = objectValue as unknown[];
    return {
      type: "array",
      length: arrayValue.length,
      values:
        depth >= 2
          ? []
          : arrayValue.slice(0, 8).map((item) => fingerprint(item, depth + 1, seen)),
    };
  }

  if (objectValue instanceof Date) {
    return { type: "date", time: objectValue.getTime() };
  }

  if (objectValue instanceof Error) {
    return {
      type: "error",
      name: objectValue.name,
      message: objectValue.message,
    };
  }

  const ownKeys = Object.getOwnPropertyNames(objectValue).sort();
  const preview: Record<string, unknown> = {};
  if (depth < 2) {
    for (const key of ownKeys.slice(0, 10)) {
      const descriptor = Object.getOwnPropertyDescriptor(objectValue, key);
      if (!descriptor) {
        continue;
      }
      if ("value" in descriptor) {
        preview[key] = fingerprint(descriptor.value, depth + 1, seen);
      } else {
        preview[key] = {
          get: typeof descriptor.get === "function",
          set: typeof descriptor.set === "function",
        };
      }
    }
  }

  return {
    type: "object",
    ctor: objectValue.constructor?.name ?? "Object",
    keys: ownKeys,
    preview,
  };
}

function invocationError(error: unknown): { name: string; message: string } {
  if (error && typeof error === "object") {
    const err = error as { name?: unknown; message?: unknown };
    return {
      name: typeof err.name === "string" ? err.name : "Error",
      message: typeof err.message === "string" ? err.message : String(error),
    };
  }
  return { name: "Error", message: String(error) };
}

function invokeCallable(
  fn: (...args: unknown[]) => unknown,
  args: unknown[],
  thisArg: unknown,
): InvocationOutcome {
  try {
    const value = Reflect.apply(fn, thisArg, args);
    return { ok: true, value: fingerprint(value) };
  } catch (error) {
    return { ok: false, error: invocationError(error) };
  }
}

function invokeConstructor(
  Ctor: new (...args: unknown[]) => unknown,
  args: unknown[],
): InvocationOutcome {
  try {
    const instance = Reflect.construct(Ctor, args);
    const proto = Object.getPrototypeOf(instance);
    return {
      ok: true,
      value: {
        instance: fingerprint(instance),
        prototypeKeys: Object.getOwnPropertyNames(proto ?? {}).sort(),
      },
    };
  } catch (error) {
    return { ok: false, error: invocationError(error) };
  }
}

function expectInvocationParity(
  pathLabel: string,
  sample: number,
  realOutcome: InvocationOutcome,
  vendorOutcome: InvocationOutcome,
): void {
  expect(vendorOutcome.ok, `${pathLabel} invocation success mismatch (sample ${sample})`).toBe(
    realOutcome.ok,
  );

  if (realOutcome.ok && vendorOutcome.ok) {
    expect(
      fingerprint(vendorOutcome.value),
      `${pathLabel} invocation value mismatch (sample ${sample})`,
    ).toEqual(fingerprint(realOutcome.value));
    return;
  }

  if (!realOutcome.ok && !vendorOutcome.ok) {
    expect(
      vendorOutcome.error.name,
      `${pathLabel} invocation error type mismatch (sample ${sample})`,
    ).toBe(realOutcome.error.name);
  }
}

function isClassLike(fn: (...args: unknown[]) => unknown): boolean {
  const source = Function.prototype.toString.call(fn);
  if (source.startsWith("class ")) {
    return true;
  }

  const proto = fn.prototype;
  if (!proto || typeof proto !== "object") {
    return false;
  }

  const methodNames = Object.getOwnPropertyNames(proto).filter(
    (name) => name !== "constructor",
  );
  return methodNames.length > 0 && /^[A-Z]/.test(fn.name || "");
}

type DescriptorRead =
  | { kind: "none" }
  | { kind: "value"; value: unknown }
  | { kind: "error"; error: { name: string; message: string } };

function readDescriptorValue(owner: object, descriptor: PropertyDescriptor): DescriptorRead {
  if ("value" in descriptor) {
    return { kind: "value", value: descriptor.value };
  }

  if (typeof descriptor.get === "function") {
    try {
      return { kind: "value", value: descriptor.get.call(owner) };
    } catch (error) {
      return { kind: "error", error: invocationError(error) };
    }
  }

  return { kind: "none" };
}

function sorted<T>(values: Iterable<T>): T[] {
  return [...values].sort() as T[];
}

function shouldRecurse(value: unknown): boolean {
  return typeof value === "function" || (typeof value === "object" && value !== null);
}

function compareValue(
  pathLabel: string,
  realValue: unknown,
  vendorValue: unknown,
  state: WalkState,
  depth: number,
  seen: WeakMap<object, WeakSet<object>>,
): void {
  const realType = typeof realValue;
  const vendorType = typeof vendorValue;

  expect(vendorType, `${pathLabel} type mismatch`).toBe(realType);

  if (realType !== "function" && (realType !== "object" || realValue === null)) {
    expect(fingerprint(vendorValue), `${pathLabel} primitive mismatch`).toEqual(
      fingerprint(realValue),
    );
    return;
  }

  const realObject = realValue as object;
  const vendorObject = vendorValue as object;

  if (realObject && vendorObject) {
    let mapped = seen.get(realObject);
    if (!mapped) {
      mapped = new WeakSet<object>();
      seen.set(realObject, mapped);
    } else if (mapped.has(vendorObject)) {
      return;
    }
    mapped.add(vendorObject);
  }

  if (realType === "function") {
    state.callables += 1;

    const realFn = realValue as (...args: unknown[]) => unknown;
    const vendorFn = vendorValue as (...args: unknown[]) => unknown;

    expect(vendorFn.length, `${pathLabel} length mismatch`).toBe(realFn.length);

    const classLike = isClassLike(realFn);
    if (classLike) {
      state.constructors += 1;
    }

    const callablePropertyKeys = sorted(
      Object.getOwnPropertyNames(realFn).filter(
        (name) => !BUILTIN_FUNCTION_KEYS.has(name),
      ),
    );

    expect(
      sorted(
        Object.getOwnPropertyNames(vendorFn).filter(
          (name) => !BUILTIN_FUNCTION_KEYS.has(name),
        ),
      ),
      `${pathLabel} static property mismatch`,
    ).toEqual(callablePropertyKeys);

    for (let sample = 0; sample < PROPERTY_CASES; sample++) {
      const next = seededRng(hashString(`${pathLabel}#${sample}`));
      const args = randomArgs(next, realFn.length);

      const realOutcome = classLike
        ? invokeConstructor(
            realFn as unknown as new (...args: unknown[]) => unknown,
            args,
          )
        : invokeCallable(realFn, args, randomValue(next, 0));
      const vendorOutcome = classLike
        ? invokeConstructor(
            vendorFn as unknown as new (...args: unknown[]) => unknown,
            args,
          )
        : invokeCallable(vendorFn, args, randomValue(next, 0));

      expectInvocationParity(pathLabel, sample, realOutcome, vendorOutcome);
    }

    if (depth >= MAX_DEPTH) {
      return;
    }

    for (const key of callablePropertyKeys) {
      const realDescriptor = Object.getOwnPropertyDescriptor(realFn, key);
      const vendorDescriptor = Object.getOwnPropertyDescriptor(vendorFn, key);
      expect(vendorDescriptor, `${pathLabel}.${key} missing descriptor`).toBeDefined();
      if (!realDescriptor || !vendorDescriptor) {
        continue;
      }

      const realRead = readDescriptorValue(realFn, realDescriptor);
      const vendorRead = readDescriptorValue(vendorFn, vendorDescriptor);
      expect(vendorRead.kind, `${pathLabel}.${key} readable kind mismatch`).toBe(
        realRead.kind,
      );
      if (realRead.kind === "error" && vendorRead.kind === "error") {
        expect(vendorRead.error.name, `${pathLabel}.${key} getter error type mismatch`).toBe(
          realRead.error.name,
        );
      } else if (realRead.kind === "value" && vendorRead.kind === "value") {
        if (shouldRecurse(realRead.value) && shouldRecurse(vendorRead.value)) {
          compareValue(`${pathLabel}.${key}`, realRead.value, vendorRead.value, state, depth + 1, seen);
        } else {
          expect(fingerprint(vendorRead.value)).toEqual(fingerprint(realRead.value));
        }
      }
    }

    if (classLike && realFn.prototype && vendorFn.prototype) {
      const realProtoKeys = sorted(
        Object.getOwnPropertyNames(realFn.prototype).filter(
          (key) => key !== "constructor",
        ),
      );

      expect(
        sorted(
          Object.getOwnPropertyNames(vendorFn.prototype).filter(
            (key) => key !== "constructor",
          ),
        ),
        `${pathLabel}.prototype key mismatch`,
      ).toEqual(realProtoKeys);

      for (const key of realProtoKeys) {
        const realDescriptor = Object.getOwnPropertyDescriptor(realFn.prototype, key);
        const vendorDescriptor = Object.getOwnPropertyDescriptor(vendorFn.prototype, key);
        expect(vendorDescriptor, `${pathLabel}.prototype.${key} missing descriptor`).toBeDefined();
        if (!realDescriptor || !vendorDescriptor) {
          continue;
        }

        const realRead = readDescriptorValue(realFn.prototype, realDescriptor);
        const vendorRead = readDescriptorValue(vendorFn.prototype, vendorDescriptor);
        expect(vendorRead.kind, `${pathLabel}.prototype.${key} readable kind mismatch`).toBe(
          realRead.kind,
        );
        if (realRead.kind === "error" && vendorRead.kind === "error") {
          expect(
            vendorRead.error.name,
            `${pathLabel}.prototype.${key} getter error type mismatch`,
          ).toBe(realRead.error.name);
        } else if (realRead.kind === "value" && vendorRead.kind === "value") {
          if (shouldRecurse(realRead.value) && shouldRecurse(vendorRead.value)) {
            compareValue(
              `${pathLabel}.prototype.${key}`,
              realRead.value,
              vendorRead.value,
              state,
              depth + 1,
              seen,
            );
          }
        }
      }
    }

    return;
  }

  state.objects += 1;

  const realKeys = sorted(Object.getOwnPropertyNames(realObject));
  const vendorKeys = sorted(Object.getOwnPropertyNames(vendorObject));
  expect(vendorKeys, `${pathLabel} object keys mismatch`).toEqual(realKeys);

  if (depth >= MAX_DEPTH) {
    return;
  }

  for (const key of realKeys) {
    const realDescriptor = Object.getOwnPropertyDescriptor(realObject, key);
    const vendorDescriptor = Object.getOwnPropertyDescriptor(vendorObject, key);
    expect(vendorDescriptor, `${pathLabel}.${key} missing descriptor`).toBeDefined();
    if (!realDescriptor || !vendorDescriptor) {
      continue;
    }

    const realRead = readDescriptorValue(realObject, realDescriptor);
    const vendorRead = readDescriptorValue(vendorObject, vendorDescriptor);
    expect(vendorRead.kind, `${pathLabel}.${key} readable kind mismatch`).toBe(realRead.kind);
    if (realRead.kind === "error" && vendorRead.kind === "error") {
      expect(vendorRead.error.name, `${pathLabel}.${key} getter error type mismatch`).toBe(
        realRead.error.name,
      );
    } else if (realRead.kind === "value" && vendorRead.kind === "value") {
      if (shouldRecurse(realRead.value) && shouldRecurse(vendorRead.value)) {
        compareValue(
          `${pathLabel}.${key}`,
          realRead.value,
          vendorRead.value,
          state,
          depth + 1,
          seen,
        );
      } else {
        expect(fingerprint(vendorRead.value), `${pathLabel}.${key} value mismatch`).toEqual(
          fingerprint(realRead.value),
        );
      }
    }
  }
}

async function importModule(absPath: string): Promise<Record<string, unknown>> {
  return (await import(pathToFileURL(absPath).href)) as Record<string, unknown>;
}

describe("vendored cardano-js-sdk exhaustive parity", () => {
  it("property-tests every vendored module export/class/function/constructor", async () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Manifest;

    const state: WalkState = {
      callables: 0,
      constructors: 0,
      objects: 0,
      modules: 0,
    };

    const seen = new WeakMap<object, WeakSet<object>>();

    for (const relativeFile of manifest.files) {
      const realModulePath = path.join(realCoreRoot, relativeFile);
      const vendorModulePath = path.join(vendorCoreRoot, relativeFile);

      const [realModule, vendorModule] = await Promise.all([
        importModule(realModulePath),
        importModule(vendorModulePath),
      ]);

      state.modules += 1;

      const realExportKeys = sorted(Object.keys(realModule));
      const vendorExportKeys = sorted(Object.keys(vendorModule));
      expect(vendorExportKeys, `${relativeFile} export key mismatch`).toEqual(realExportKeys);

      for (const exportKey of realExportKeys) {
        compareValue(
          `${relativeFile}:${exportKey}`,
          realModule[exportKey],
          vendorModule[exportKey],
          state,
          0,
          seen,
        );
      }
    }

    expect(state.modules).toBe(manifest.files.length);
    expect(state.callables).toBeGreaterThan(0);
    expect(state.objects).toBeGreaterThan(0);
    expect(state.constructors).toBeGreaterThan(0);
  });
});
