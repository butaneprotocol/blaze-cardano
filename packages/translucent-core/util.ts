import * as C from "./core";
import { HexBlob, OpaqueString, typedHex } from "@cardano-sdk/util";
import {
  PolicyId,
  Hash28ByteBase16,
  Ed25519PublicKeyHex,
  Address,
  PaymentAddress,
  Script,
  CredentialType,
  AddressType,
  NetworkId,
  Credential,
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
    hexString += ("0" + (byteArray[i]! & 0xff).toString(16)).slice(-2);
  }
  return hexString;
}
/**
 * Function to create an Address from a Bech32 string.
 * @param {string} bech32 - The Bech32 string to create the Address from.
 * @returns {Address} The created Address.
 */
export const addressFromBech32 = Address.fromBech32;

/**
 * Function to create an Address from a validator script.
 * @param {NetworkId} network - The network ID of the Address.
 * @param {Script} validator - The validator script to create the Address from.
 * @returns {Address} The created Address.
 */
export const addressFromValidator = (
  network: NetworkId,
  validator: Script,
): Address =>
  new Address({
    paymentPart: { hash: validator.hash(), type: CredentialType.ScriptHash },
    type: AddressType.EnterpriseScript,
    networkId: network,
  });

/**
 * Function to create an Address from a credential.
 * @param {NetworkId} network - The network ID of the Address.
 * @param {Credential} credential - The credential to create the Address from.
 * @returns {Address} The created Address.
 */
export const addressFromCredential = (
  network: NetworkId,
  credential: Credential,
): Address =>
  new Address({
    paymentPart: credential,
    type: AddressType.EnterpriseScript,
    networkId: network,
  });

/**
 * Interface for objects that can be serialized to CBOR.
 */
interface CborSerializable<C> {
  /**
   * Function to serialize the object to CBOR.
   * @returns {HexBlob} The serialized object.
   */
  toCbor(): HexBlob;
  /**
   * Function to convert the object to its core representation.
   * @returns {C} The core representation of the object.
   */
  toCore(): C;
}

/**
 * Exporting CborSet from C.Serialization.
 */
export const CborSet = C.Serialization.CborSet;
/**
 * Type definition for CborSet.
 */
export type CborSet<A, B extends CborSerializable<A>> = C.Serialization.CborSet<
  A,
  B
>;

/**
 * Exporting HexBlob, OpaqueString, and typedHex.
 */
export { HexBlob, OpaqueString, typedHex };
