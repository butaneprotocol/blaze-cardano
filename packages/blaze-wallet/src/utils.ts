import {
  type CborWriter,
  type Ed25519PrivateKey,
  fromHex,
  toHex,
  HexBlob,
} from "@blaze-cardano/core";
import { getCryptoFunctions } from "./crypto";
import { type CIP30DataSignature } from "./types";

type CreateCborWriter = () => CborWriter;

function buildProtectedHeaders(
  createCborWriter: CreateCborWriter,
  address: Uint8Array,
): Uint8Array {
  const writer = createCborWriter();
  writer.writeStartMap(2);
  writer.writeInt(1);
  writer.writeInt(-8);
  writer.writeTextString("address");
  writer.writeByteString(address);
  return writer.encode();
}

function buildSigStructure(
  createCborWriter: CreateCborWriter,
  protectedHeaders: Uint8Array,
  payload: Uint8Array,
): Uint8Array {
  const writer = createCborWriter();
  writer.writeStartArray(4);
  writer.writeTextString("Signature1");
  writer.writeByteString(protectedHeaders);
  writer.writeByteString(new Uint8Array(0));
  writer.writeByteString(payload);
  return writer.encode();
}

function buildCoseSign1(
  createCborWriter: CreateCborWriter,
  protectedHeaders: Uint8Array,
  payload: Uint8Array,
  signature: Uint8Array,
): Uint8Array {
  const writer = createCborWriter();
  writer.writeStartArray(4);
  writer.writeByteString(protectedHeaders);
  writer.writeStartMap(1);
  writer.writeTextString("hashed");
  writer.writeBoolean(false);
  writer.writeByteString(payload);
  writer.writeByteString(signature);
  return writer.encode();
}

function buildCoseKey(
  createCborWriter: CreateCborWriter,
  publicKey: Uint8Array,
): Uint8Array {
  const writer = createCborWriter();
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
  const cryptoFunctions = await getCryptoFunctions();
  const addressBytes = fromHex(addressHex);
  const payloadBytes = fromHex(payload);
  const protectedHeaders = buildProtectedHeaders(
    cryptoFunctions.createCborWriter,
    addressBytes,
  );
  const toSign = buildSigStructure(
    cryptoFunctions.createCborWriter,
    protectedHeaders,
    payloadBytes,
  );
  const publicKey = privateKey.toPublic();
  const signature = cryptoFunctions.signEd25519(privateKey, toSign);
  const coseSign1 = buildCoseSign1(
    cryptoFunctions.createCborWriter,
    protectedHeaders,
    payloadBytes,
    signature,
  );
  const key = buildCoseKey(cryptoFunctions.createCborWriter, publicKey.bytes());

  return {
    signature: HexBlob(toHex(coseSign1)),
    key: HexBlob(toHex(key)),
  };
}
