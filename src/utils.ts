import { Serialization } from '@cardano-sdk/core';
import { HexBlob } from '@cardano-sdk/util';
import {PolicyId, Hash28ByteBase16, Ed25519PublicKeyHex} from "./types"

/**
 * Encodes an array of items into CBOR format.
 * Each item in the array must have a `toCbor` method that returns a HexBlob.
 * The `toCbor` method is called for each item, and the result is encoded into CBOR format.
 * 
 * @param {T[]} items - An array of items to be encoded. Each item must have a `toCbor` method.
 * @returns {Uint8Array} The encoded CBOR array.
 */
export function getCborEncodedArray<T extends { toCbor: () => HexBlob }>(items: T[]): Uint8Array {
  const writer = new Serialization.CborWriter();

  writer.writeStartArray(items.length);

  for (const item of items) {
    writer.writeEncodedValue(Buffer.from(item.toCbor(), 'hex'));
  }

  return writer.encode();
};

/**
 * Converts a PolicyId to a Hash28ByteBase16 format.
 * @param {PolicyId} policy - The policy ID to be converted.
 * @returns {Hash28ByteBase16} The converted hash in Hash28ByteBase16 format.
 */
export function PolicyIdToHash(policy: PolicyId): Hash28ByteBase16 {
    return policy as unknown as Hash28ByteBase16
}

/**
 * Converts a Hash28ByteBase16 to an Ed25519PublicKeyHex format.
 * @param {Hash28ByteBase16} hash - The hash to be converted.
 * @returns {Ed25519PublicKeyHex} The converted hash in Ed25519PublicKeyHex format.
 */
export function HashAsPubKeyHex(hash: Hash28ByteBase16): Ed25519PublicKeyHex {
    return hash as unknown as Ed25519PublicKeyHex
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
    return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
}
