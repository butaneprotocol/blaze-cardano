import * as C from "@cardano-sdk/core";
import type { OpaqueString } from "@cardano-sdk/util";
import { HexBlob, typedHex } from "@cardano-sdk/util";
import type {
  PolicyId,
  PaymentAddress,
  Script,
  NetworkId,
  Credential,
  Ed25519PrivateExtendedKeyHex,
  Ed25519PrivateNormalKeyHex,
} from "./types";
import {
  Hash28ByteBase16,
  Ed25519PublicKeyHex,
  Address,
  CredentialType,
  AddressType,
  Hash32ByteBase16,
  Ed25519SignatureHex,
} from "./types";
import { sha256 } from "@noble/hashes/sha256";
import * as sha3 from "@noble/hashes/sha3";
import * as blake from "blakejs";
import * as bip39 from "@scure/bip39";
import { ed25519 as ed } from "@noble/curves/ed25519";

export { wordlist } from "@scure/bip39/wordlists/english";

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
 * Function to compute the SHA2-256 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash32ByteBase16 format.
 */
export function sha2_256(data: HexBlob): Hash32ByteBase16 {
  return Hash32ByteBase16(toHex(sha256(fromHex(data))));
}

/**
 * Function to compute the SHA3-256 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash32ByteBase16 format.
 */
export function sha3_256(data: HexBlob): Hash32ByteBase16 {
  return Hash32ByteBase16(toHex(sha3.sha3_256(fromHex(data))));
}

/**
 * Function to compute the BLAKE2b-256 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash32ByteBase16 format.
 */
export function blake2b_256(data: HexBlob): Hash32ByteBase16 {
  return Hash32ByteBase16(blake.blake2bHex(fromHex(data), undefined, 32));
}

/**
 * Function to compute the BLAKE2b-224 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash28ByteBase16 format.
 */
export function blake2b_224(data: HexBlob): Hash28ByteBase16 {
  return Hash28ByteBase16(blake.blake2bHex(fromHex(data), undefined, 28));
}

/**
 * Function to derive the public key from a private key.
 * @param {Ed25519PrivateNormalKeyHex | Ed25519PrivateExtendedKeyHex} privateKey - The private key to derive the public key from.
 * @returns {Ed25519PublicKeyHex} The derived public key.
 */
export function derivePublicKey(
  privateKey: Ed25519PrivateNormalKeyHex | Ed25519PrivateExtendedKeyHex,
): Ed25519PublicKeyHex {
  if (privateKey.length > 64) {
    return Ed25519PublicKeyHex(
      toHex(ed.getPublicKey(fromHex(privateKey.slice(0, 64)))),
    );
  } else {
    return Ed25519PublicKeyHex(toHex(ed.getPublicKey(fromHex(privateKey))));
  }
}

/**
 * Function to sign a message with a private key.
 * @param {HexBlob} message - The message to sign.
 * @param {Ed25519PrivateNormalKeyHex} privateKey - The private key to sign the message with.
 * @returns {Ed25519SignatureHex} The signature of the message.
 */
export function signMessage(
  message: HexBlob,
  privateKey: Ed25519PrivateNormalKeyHex | Ed25519PrivateExtendedKeyHex,
): Ed25519SignatureHex {
  return Ed25519SignatureHex(toHex(ed.sign(message, privateKey.slice(0, 64))));
}

/**
 * Function to generate a mnemonic.
 * @returns {string} The generated mnemonic.
 */
export const generateMnemonic = bip39.generateMnemonic;

/**
 * Function to convert entropy to a mnemonic.
 * @param {Buffer} entropy - The entropy to convert.
 * @returns {string} The generated mnemonic.
 */
export const entropyToMnemonic = bip39.entropyToMnemonic;

/**
 * Function to convert a mnemonic to entropy.
 * @param {string} mnemonic - The mnemonic to convert.
 * @returns {Buffer} The generated entropy.
 */
export const mnemonicToEntropy = bip39.mnemonicToEntropy;

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
): Address => {
  const cred = credential.toCore();
  let type: AddressType;
  if (cred.type == CredentialType.KeyHash) {
    type = AddressType.EnterpriseKey;
  } else {
    type = AddressType.EnterpriseScript;
  }
  return new Address({
    paymentPart: credential.toCore(),
    type,
    networkId: network,
  });
};

/**
 * Function to create an Address from payment and optional delegation credentials.
 * @param {NetworkId} network - The network ID of the Address.
 * @param {Credential} paymentCredential - The payment credential to create the Address from.
 * @param {Credential} [delegationCredential] - The optional delegation credential to create the Address from.
 * @returns {Address} The created Address.
 */
export const addressFromCredentials = (
  network: NetworkId,
  paymentCredential: Credential,
  delegationCredential?: Credential,
): Address => {
  const pCred = paymentCredential.toCore();
  const dCred = delegationCredential?.toCore();
  let type: AddressType;
  if (!dCred) {
    if (pCred.type == CredentialType.KeyHash) {
      type = AddressType.EnterpriseKey;
    } else {
      type = AddressType.EnterpriseScript;
    }
  } else {
    if (pCred.type == CredentialType.KeyHash) {
      if (dCred.type == CredentialType.KeyHash) {
        type = AddressType.BasePaymentKeyStakeKey;
      } else {
        type = AddressType.BasePaymentKeyStakeScript;
      }
    } else {
      if (dCred.type == CredentialType.KeyHash) {
        type = AddressType.BasePaymentScriptStakeKey;
      } else {
        type = AddressType.BasePaymentScriptStakeScript;
      }
    }
  }
  return new Address({
    paymentPart: paymentCredential.toCore(),
    delegationPart: delegationCredential?.toCore(),
    type,
    networkId: network,
  });
};

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
export type { OpaqueString };
export { HexBlob, typedHex };
