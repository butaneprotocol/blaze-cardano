import * as C from "./core";
import { HexBlob } from "@cardano-sdk/util";
import {
  PolicyId,
  Hash28ByteBase16,
  Ed25519PublicKeyHex,
  Address,
  PaymentAddress,
} from "./types";

/**
 * Converts an Address to a PaymentAddress.
 * @param {Address} address - The address to be converted.
 * @returns {PaymentAddress} The converted address in PaymentAddress format.
 * @throws {Error} If a reward account is passed in.
 */
export function getPaymentAddress(address: Address): PaymentAddress {
  const bech = address.toBech32();

  if (bech.__opaqueString == "RewardAccount") {
    throw new Error(
      "getPaymentAddress: failed because a reward account was passed in!",
    );
  }

  return bech;
}

/**
 * Converts a PolicyId to a Hash28ByteBase16 format.
 * @param {PolicyId} policy - The policy ID to be converted.
 * @returns {Hash28ByteBase16} The converted hash in Hash28ByteBase16 format.
 */
export function PolicyIdToHash(policy: PolicyId): Hash28ByteBase16 {
  return policy as unknown as Hash28ByteBase16;
}

/**
 * Converts a Hash28ByteBase16 to an Ed25519PublicKeyHex format.
 * @param {Hash28ByteBase16} hash - The hash to be converted.
 * @returns {Ed25519PublicKeyHex} The converted hash in Ed25519PublicKeyHex format.
 */
export function HashAsPubKeyHex(hash: Hash28ByteBase16): Ed25519PublicKeyHex {
  return hash as unknown as Ed25519PublicKeyHex;
}

/**
 * Converts a hex string to a byte array.
 * @param {string} hexString - The hex string to convert.
 * @returns {Uint8Array} The resulting byte array.
 */
export function fromHex(hexString: string): Uint8Array {
  if (hexString.length % 2 !== 0) {
    throw new Error("Invalid hexString length");
  }
  const byteArray = new Uint8Array(hexString.length / 2);
  for (let i = 0, j = 0; i < hexString.length; i += 2, j++) {
    byteArray[j] = parseInt(hexString.substr(i, 2), 16);
  }
  return byteArray;
}

/**
 * Converts a byte array to a hex string.
 * @param {Uint8Array} byteArray - The byte array to convert.
 * @returns {string} The resulting hex string.
 */
export function toHex(byteArray: Uint8Array): string {
  let hexString = "";
  for (let i = 0; i < byteArray.length; i++) {
    hexString += ("0" + (byteArray[i] & 0xff).toString(16)).slice(-2);
  }
  return hexString;
}

interface CborSerializable<C> {
  toCbor(): HexBlob;
  toCore(): C;
}

export const CborSet = C.Serialization.CborSet;
export type CborSet<A, B extends CborSerializable<A>> = C.Serialization.CborSet<
  A,
  B
>;

export { HexBlob };
