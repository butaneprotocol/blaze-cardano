import { describe, expect, it } from "vitest";
import * as RealCore from "@cardano-sdk/core";
import * as VendoredCore from "../vendor/cardano-js-sdk/index.js";

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
  for (let i = 0; i < length; i++) {
    bytes[i] = next() & 0xff;
  }
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (x) => x.toString(16).padStart(2, "0")).join("");
}

function randomAscii(next: () => number, length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += String.fromCharCode(32 + (next() % 95));
  }
  return result;
}

describe("vendored cardano-js-sdk core equivalence", () => {
  it("matches key Cardano + Serialization behavior across random inputs", () => {
    const next = seededRng(0x0b1a2e99);
    const cases = 250;

    for (let i = 0; i < cases; i++) {
      const policyHex = toHex(randomBytes(next, 28));
      const assetNameHex = toHex(randomBytes(next, next() % 33));

      const realPolicy = RealCore.Cardano.PolicyId(policyHex);
      const vendoredPolicy = VendoredCore.Cardano.PolicyId(policyHex);
      const realAssetName = RealCore.Cardano.AssetName(assetNameHex);
      const vendoredAssetName = VendoredCore.Cardano.AssetName(assetNameHex);

      const realAssetId = RealCore.Cardano.AssetId.fromParts(
        realPolicy,
        realAssetName,
      );
      const vendoredAssetId = VendoredCore.Cardano.AssetId.fromParts(
        vendoredPolicy,
        vendoredAssetName,
      );

      expect(vendoredAssetId).toBe(realAssetId);
      expect(VendoredCore.Cardano.AssetId.getPolicyId(vendoredAssetId)).toBe(
        RealCore.Cardano.AssetId.getPolicyId(realAssetId),
      );
      expect(VendoredCore.Cardano.AssetId.getAssetName(vendoredAssetId)).toBe(
        RealCore.Cardano.AssetId.getAssetName(realAssetId),
      );

      const keyHash = toHex(randomBytes(next, 28));
      expect(VendoredCore.Cardano.PoolId.fromKeyHash(keyHash)).toBe(
        RealCore.Cardano.PoolId.fromKeyHash(keyHash),
      );

      const signedInt = (next() % 2 === 0 ? 1 : -1) * (next() % 1_000_000);
      const payloadA = randomBytes(next, next() % 64);
      const payloadB = randomBytes(next, next() % 64);
      const text = randomAscii(next, next() % 24);
      const boolValue = next() % 2 === 0;

      const realWriter = new RealCore.Serialization.CborWriter();
      const vendoredWriter = new VendoredCore.Serialization.CborWriter();

      for (const writer of [realWriter, vendoredWriter]) {
        writer.writeStartArray(6);
        writer.writeInt(signedInt);
        writer.writeByteString(payloadA);
        writer.writeTextString(text);
        writer.writeBoolean(boolValue);
        writer.writeStartMap(1);
        writer.writeInt(1);
        writer.writeByteString(payloadB);
        writer.writeEndMap();
        writer.writeNull();
      }

      const realCbor = realWriter.encodeAsHex();
      const vendoredCbor = vendoredWriter.encodeAsHex();
      expect(vendoredCbor).toBe(realCbor);

    }
  });
});
