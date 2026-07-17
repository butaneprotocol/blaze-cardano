import {
  CborReader,
  CborReaderState,
  CborWriter,
  Ed25519PrivateKey,
  Ed25519PrivateNormalKeyHex,
  Ed25519Signature,
  HexBlob,
  fromHex,
  toHex,
} from "@blaze-cardano/core";
import { describe, expect, it } from "vitest";
import { signData } from "../src/utils";

type Scalar =
  | { kind: "int"; value: bigint }
  | { kind: "bytes"; value: Uint8Array }
  | { kind: "text"; value: string }
  | { kind: "bool"; value: boolean };

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

function randomBytes(next: () => number, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = next() & 0xff;
  }
  return bytes;
}

function readLabel(reader: CborReader): string {
  const state = reader.peekState();
  if (
    state === CborReaderState.UnsignedInteger ||
    state === CborReaderState.NegativeInteger
  ) {
    return `i:${reader.readInt().toString()}`;
  }
  if (state === CborReaderState.TextString) {
    return `t:${reader.readTextString()}`;
  }
  throw new Error(`Unexpected map key state: ${state}`);
}

function readScalar(reader: CborReader): Scalar {
  const state = reader.peekState();
  if (
    state === CborReaderState.UnsignedInteger ||
    state === CborReaderState.NegativeInteger
  ) {
    return { kind: "int", value: reader.readInt() };
  }
  if (state === CborReaderState.ByteString) {
    return { kind: "bytes", value: reader.readByteString() };
  }
  if (state === CborReaderState.TextString) {
    return { kind: "text", value: reader.readTextString() };
  }
  if (state === CborReaderState.Boolean) {
    return { kind: "bool", value: reader.readBoolean() };
  }
  throw new Error(`Unexpected value state: ${state}`);
}

function readFlatMap(reader: CborReader): Map<string, Scalar> {
  const len = reader.readStartMap();
  if (len === null) {
    throw new Error("Expected definite-length map");
  }

  const map = new Map<string, Scalar>();
  for (let i = 0; i < len; i++) {
    map.set(readLabel(reader), readScalar(reader));
  }
  reader.readEndMap();
  return map;
}

function decodeMapFromBytes(bytes: Uint8Array): Map<string, Scalar> {
  const reader = new CborReader(HexBlob(toHex(bytes)));
  const map = readFlatMap(reader);
  expect(reader.peekState()).toBe(CborReaderState.Finished);
  return map;
}

function expectInt(
  map: Map<string, Scalar>,
  key: string,
  expected: bigint,
): void {
  const value = map.get(key);
  expect(value).toBeDefined();
  expect(value?.kind).toBe("int");
  if (value?.kind === "int") {
    expect(value.value).toBe(expected);
  }
}

function expectBytes(
  map: Map<string, Scalar>,
  key: string,
  expected: Uint8Array,
): void {
  const value = map.get(key);
  expect(value).toBeDefined();
  expect(value?.kind).toBe("bytes");
  if (value?.kind === "bytes") {
    expect(Array.from(value.value)).toEqual(Array.from(expected));
  }
}

function expectBool(
  map: Map<string, Scalar>,
  key: string,
  expected: boolean,
): void {
  const value = map.get(key);
  expect(value).toBeDefined();
  expect(value?.kind).toBe("bool");
  if (value?.kind === "bool") {
    expect(value.value).toBe(expected);
  }
}

function buildSigStructure(
  protectedHeaders: Uint8Array,
  payload: Uint8Array,
): Uint8Array {
  const writer = new CborWriter();
  writer.writeStartArray(4);
  writer.writeTextString("Signature1");
  writer.writeByteString(protectedHeaders);
  writer.writeByteString(new Uint8Array(0));
  writer.writeByteString(payload);
  return writer.encode();
}

describe("signData properties", () => {
  it("emits valid CIP-8 COSE structures and verifiable signatures", async () => {
    const next = seededRng(0xc1f80008);
    const cases = 250;

    for (let i = 0; i < cases; i++) {
      const addressBytes = randomBytes(next, (next() % 80) + 1);
      const payloadBytes = randomBytes(next, next() % 256);
      const privateKeyBytes = randomBytes(next, 32);

      const addressHex = toHex(addressBytes);
      const payloadHex = toHex(payloadBytes);
      const privateKey = Ed25519PrivateKey.fromNormalHex(
        Ed25519PrivateNormalKeyHex(toHex(privateKeyBytes)),
      );
      const publicKey = privateKey.toPublic();

      const { signature, key } = await signData(addressHex, payloadHex, privateKey);

      const sign1Reader = new CborReader(signature);
      expect(sign1Reader.readStartArray()).toBe(4);
      const protectedHeaders = sign1Reader.readByteString();
      const unprotected = readFlatMap(sign1Reader);
      expect(sign1Reader.readByteString()).toEqual(fromHex(payloadHex));
      const signatureBytes = sign1Reader.readByteString();
      sign1Reader.readEndArray();
      expect(sign1Reader.peekState()).toBe(CborReaderState.Finished);

      const protectedMap = decodeMapFromBytes(protectedHeaders);
      expect(protectedMap.size).toBe(2);
      expectInt(protectedMap, "i:1", -8n);
      expectBytes(protectedMap, "t:address", addressBytes);

      expect(unprotected.size).toBe(1);
      expectBool(unprotected, "t:hashed", false);

      const keyReader = new CborReader(key);
      const keyMap = readFlatMap(keyReader);
      expect(keyReader.peekState()).toBe(CborReaderState.Finished);

      expect(keyMap.size).toBe(4);
      expectInt(keyMap, "i:1", 1n);
      expectInt(keyMap, "i:3", -8n);
      expectInt(keyMap, "i:-1", 6n);
      expectBytes(keyMap, "i:-2", publicKey.bytes());

      const sigStructure = buildSigStructure(protectedHeaders, payloadBytes);
      const isValid = publicKey.verify(
        Ed25519Signature.fromBytes(signatureBytes),
        HexBlob(toHex(sigStructure)),
      );
      expect(isValid).toBe(true);
    }
  });
});
