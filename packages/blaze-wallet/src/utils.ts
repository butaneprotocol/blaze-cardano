import {
  type Ed25519PrivateKey,
  fromHex,
  toHex,
  HexBlob,
  Serialization,
} from "@blaze-cardano/core";
import { type CIP30DataSignature } from "./types";

const {
  CborWriter,
} = Serialization;

function buildProtectedHeaders(address: Uint8Array): Uint8Array {
  const writer = new CborWriter();
  writer.writeStartMap(2);
  writer.writeInt(1);
  writer.writeInt(-8);
  writer.writeTextString("address");
  writer.writeByteString(address);
  return writer.encode();
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

function buildCoseSign1(
  protectedHeaders: Uint8Array,
  payload: Uint8Array,
  signature: Uint8Array,
): Uint8Array {
  const writer = new CborWriter();
  writer.writeStartArray(4);
  writer.writeByteString(protectedHeaders);
  writer.writeStartMap(1);
  writer.writeTextString("hashed");
  writer.writeBoolean(false);
  writer.writeByteString(payload);
  writer.writeByteString(signature);
  return writer.encode();
}

function buildCoseKey(publicKey: Uint8Array): Uint8Array {
  const writer = new CborWriter();
  writer.writeStartMap(4);
  writer.writeInt(1);
  writer.writeInt(1);
  writer.writeInt(3);
  writer.writeInt(-8);
  writer.writeInt(-1);
  writer.writeInt(6);
  writer.writeInt(-2);
  writer.writeByteString(publicKey);
  return writer.encode();
}

export async function signData(
  addressHex: string,
  payload: string,
  privateKey: Ed25519PrivateKey,
): Promise<CIP30DataSignature> {
  const addressBytes = fromHex(addressHex);
  const payloadBytes = fromHex(payload);
  const protectedHeaders = buildProtectedHeaders(addressBytes);
  const toSign = buildSigStructure(protectedHeaders, payloadBytes);
  const publicKey = privateKey.toPublic();
  const signedSigStruc = privateKey.sign(HexBlob(toHex(toSign)));
  const signature = signedSigStruc.bytes();
  const coseSign1 = buildCoseSign1(protectedHeaders, payloadBytes, signature);
  const key = buildCoseKey(publicKey.bytes());

  return {
    signature: HexBlob(toHex(coseSign1)),
    key: HexBlob(toHex(key)),
  };
}
