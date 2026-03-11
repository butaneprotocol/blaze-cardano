import { bech32 } from "bech32";
import sum from "lodash/sum.js";
import { CustomError } from "ts-custom-error";

export const formatErrorMessage = (reason, detail) =>
  reason + (detail ? ` (${detail})` : "");

const isWithInnerError = (error) =>
  error !== null && typeof error === "object" && "innerError" in error;

const isErrorLike = (error) => {
  if (!error || typeof error !== "object") return false;
  if (!("message" in error && "stack" in error)) return false;
  const { message, stack } = error;
  return typeof message === "string" && typeof stack === "string";
};

export const stripStackTrace = (error) => {
  if (!error) return;
  if (isErrorLike(error)) {
    delete error.stack;
  }
  if (isWithInnerError(error)) {
    stripStackTrace(error.innerError);
  }
};

export class ComposableError extends CustomError {
  static stackDelimiter = "\n    at ";

  constructor(message, innerError) {
    let firstLine = "";
    let innerStack = [];
    if (isErrorLike(innerError) && innerError.stack) {
      [firstLine, ...innerStack] = innerError.stack.split(
        ComposableError.stackDelimiter,
      );
      message = `${message} due to\n ${firstLine}`;
    }
    if (typeof innerError === "string") {
      message = `${message} due to\n ${innerError}`;
    }
    super(message);
    this.innerError = innerError;
    if (!this.stack || innerStack.length === 0) return;
    const [firstLineOfStack] = this.stack.split(ComposableError.stackDelimiter);
    Object.defineProperty(this, "stack", {
      configurable: true,
      value: `${firstLineOfStack}${innerStack.join(ComposableError.stackDelimiter)}`,
    });
  }
}

export class InvalidStringError extends ComposableError {
  constructor(expectation, innerError) {
    super(`Invalid string: "${expectation}"`, innerError);
  }
}

export class InvalidArgumentError extends CustomError {
  constructor(argName, message) {
    super(`Invalid argument '${argName}': ${message}`);
  }
}

export class InvalidStateError extends CustomError {
  constructor(message) {
    super(`Invalid state': ${message}`);
  }
}

export const BigIntMath = {
  abs(x) {
    return x < 0n ? -x : x;
  },
  max(arr) {
    if (arr.length === 0) return null;
    let max = arr[0];
    for (const num of arr.slice(1)) {
      if (num > max) max = num;
    }
    return max;
  },
  subtract(arr) {
    if (arr.length === 0) return 0n;
    return arr.reduce((result, num) => result - num);
  },
  sum(arr) {
    return arr.reduce((result, num) => result + num, 0n);
  },
};

export const Percent = (value) => value;
export const calcPercentages = (parts, total = sum(parts)) => {
  if (parts.length === 0) return [];
  let partsSum = sum(parts);
  if (total < partsSum) total = partsSum;
  if (total === 0) {
    parts = parts.map(() => 1);
    partsSum = sum(parts);
    total = partsSum;
  }
  return parts.map((part) => Percent(part / total));
};

export const isNotNil = (item) =>
  typeof item !== "undefined" && item !== null;

const MAX_BECH32_LENGTH_LIMIT = 1023;
const isOneOf = (target, options) =>
  (Array.isArray(options) && options.includes(target)) || target === options;

export const assertIsBech32WithPrefix = (
  target,
  prefix,
  expectedDecodedLength,
) => {
  let decoded;
  try {
    decoded = bech32.decode(target, MAX_BECH32_LENGTH_LIMIT);
  } catch (error) {
    throw new InvalidStringError(
      `expected bech32-encoded string with '${prefix}' prefix`,
      error,
    );
  }
  if (!isOneOf(decoded.prefix, prefix)) {
    throw new InvalidStringError(
      `expected bech32 prefix '${prefix}', got '${decoded.prefix}''`,
    );
  }
  if (
    expectedDecodedLength &&
    !isOneOf(decoded.words.length, expectedDecodedLength)
  ) {
    throw new InvalidStringError(
      `expected decoded length of '${expectedDecodedLength}', got '${decoded.words.length}'`,
    );
  }
};

export const typedBech32 = (target, prefix, expectedDecodedLength) => {
  assertIsBech32WithPrefix(target, prefix, expectedDecodedLength);
  return target;
};

const assertLength = (expectedLength, target) => {
  if (expectedLength && target.length !== expectedLength) {
    throw new InvalidStringError(
      `expected length '${expectedLength}', got ${target.length}`,
    );
  }
};

export const assertIsHexString = (target, expectedLength) => {
  assertLength(expectedLength, target);
  if (target.length > 0 && !/^[\da-f]+$/i.test(target)) {
    throw new InvalidStringError("expected hex string");
  }
};

export const typedHex = (value, length) => {
  assertIsHexString(value, length);
  return value;
};

export const Base64Blob = (target) => {
  if (/^(?:[\d+/a-z]{4})*(?:[\d+/a-z]{2}==|[\d+/a-z]{3}=)?$/i.test(target)) {
    return target;
  }
  throw new InvalidStringError("expected base64 string");
};
Base64Blob.fromBytes = (bytes) => Buffer.from(bytes).toString("base64");

export const HexBlob = (target) => typedHex(target);
HexBlob.fromBytes = (bytes) => Buffer.from(bytes).toString("hex");
HexBlob.CHARS_PER_BYTE = 2;
HexBlob.fromBase64 = (rawData) => Buffer.from(rawData, "base64").toString("hex");
HexBlob.toTypedBech32 = (prefix, hexString) =>
  bech32.encode(
    prefix,
    bech32.toWords(Uint8Array.from(Buffer.from(hexString, "hex"))),
  );

export const castHexBlob = (target, expectedLength) => {
  assertLength(expectedLength, target);
  return target;
};

export const hexStringToBuffer = (value) => Buffer.from(value, "hex");
