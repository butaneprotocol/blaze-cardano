import * as C from './core'
import { HexBlob } from '@cardano-sdk/util'
import { PolicyId, Hash28ByteBase16, Ed25519PublicKeyHex } from './types'

/**
 * Converts a PolicyId to a Hash28ByteBase16 format.
 * @param {PolicyId} policy - The policy ID to be converted.
 * @returns {Hash28ByteBase16} The converted hash in Hash28ByteBase16 format.
 */
export function PolicyIdToHash(policy: PolicyId): Hash28ByteBase16 {
  return (policy as unknown) as Hash28ByteBase16
}

/**
 * Converts a Hash28ByteBase16 to an Ed25519PublicKeyHex format.
 * @param {Hash28ByteBase16} hash - The hash to be converted.
 * @returns {Ed25519PublicKeyHex} The converted hash in Ed25519PublicKeyHex format.
 */
export function HashAsPubKeyHex(hash: Hash28ByteBase16): Ed25519PublicKeyHex {
  return (hash as unknown) as Ed25519PublicKeyHex
}

/**
 * Converts a hex string to a byte array.
 * @param {string} hexString - The hex string to convert.
 * @returns {Uint8Array} The resulting byte array.
 */
export function fromHex(hexString: string): Uint8Array {
  if (hexString.length % 2 !== 0) {
    throw new Error('Invalid hexString length')
  }
  const byteArray = new Uint8Array(hexString.length / 2)
  for (let i = 0, j = 0; i < hexString.length; i += 2, j++) {
    byteArray[j] = parseInt(hexString.substr(i, 2), 16)
  }
  return byteArray
}

/**
 * Converts a byte array to a hex string.
 * @param {Uint8Array} byteArray - The byte array to convert.
 * @returns {string} The resulting hex string.
 */
export function toHex(byteArray: Uint8Array): string {
  return Array.from(byteArray, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

interface CborSerializable<C> {
  toCbor(): HexBlob
  toCore(): C
}

export const CborSet = C.Serialization.CborSet
export type CborSet<A, B extends CborSerializable<A>> = C.Serialization.CborSet<
  A,
  B
>

export { HexBlob }
