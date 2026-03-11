export type OpaqueString<K extends PropertyKey> = string;

export type HexBlob = string;
export type Base64BlobString = string;

export declare function formatErrorMessage(
  reason: string,
  detail?: string,
): string;

export declare class ComposableError extends Error {
  static stackDelimiter: string;
  innerError: unknown;
  constructor(message: string, innerError?: unknown);
}

export declare class InvalidStringError extends ComposableError {
  constructor(expectation: string, innerError?: unknown);
}

export declare class InvalidArgumentError extends Error {
  constructor(argName: string, message: string);
}

export declare class InvalidStateError extends Error {
  constructor(message: string);
}

export declare const BigIntMath: {
  abs(x: bigint): bigint;
  max(arr: bigint[]): bigint | null;
  subtract(arr: bigint[]): bigint;
  sum(arr: bigint[]): bigint;
};

export declare const Percent: (value: number) => number;
export declare const calcPercentages: (parts: number[], total?: number) => number[];

export declare const isNotNil: <T>(item: T | null | undefined) => item is T;

export declare const assertIsBech32WithPrefix: (
  target: string,
  prefix: string | string[],
  expectedDecodedLength?: number | number[],
) => void;

export declare const typedBech32: <T = string>(
  target: string,
  prefix: string | string[],
  expectedDecodedLength?: number | number[],
) => T;

export declare const assertIsHexString: (
  target: string,
  expectedLength?: number,
) => void;

export declare const typedHex: <T = string>(
  value: string,
  length?: number,
) => T;

export declare function Base64Blob(target: string): Base64BlobString;
export declare namespace Base64Blob {
  function fromBytes(bytes: Uint8Array): Base64BlobString;
}

export declare function HexBlob(target: string): HexBlob;
export declare namespace HexBlob {
  function fromBytes(bytes: Uint8Array): HexBlob;
  const CHARS_PER_BYTE: number;
  function fromBase64(rawData: string): HexBlob;
  function toTypedBech32(prefix: string, hexString: string): string;
}

export declare const castHexBlob: <T = string>(
  target: string,
  expectedLength?: number,
) => T;

export declare const hexStringToBuffer: (value: string) => Buffer;
