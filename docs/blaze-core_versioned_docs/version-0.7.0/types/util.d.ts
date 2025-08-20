import * as C from "@cardano-sdk/core";
import type { OpaqueString } from "@cardano-sdk/util";
import { HexBlob, typedHex } from "@cardano-sdk/util";
import type { PolicyId, PaymentAddress, Script, NetworkId, Ed25519PrivateExtendedKeyHex, Ed25519PrivateNormalKeyHex } from "./types";
import { Hash28ByteBase16, Ed25519PublicKeyHex, Address, Hash32ByteBase16, Ed25519SignatureHex, Credential } from "./types";
import * as bip39 from "@scure/bip39";
export { wordlist } from "@scure/bip39/wordlists/english";
/**
 * Converts an Address to a PaymentAddress.
 * @param {Address} address - The address to be converted.
 * @returns {PaymentAddress} The converted address in PaymentAddress format.
 * @throws {Error} If a reward account is passed in.
 */
export declare function getPaymentAddress(address: Address): PaymentAddress;
/**
 * Converts a PolicyId to a Hash28ByteBase16 format.
 * @param {PolicyId} policy - The policy ID to be converted.
 * @returns {Hash28ByteBase16} The converted hash in Hash28ByteBase16 format.
 */
export declare function PolicyIdToHash(policy: PolicyId): Hash28ByteBase16;
/**
 * Converts a Hash28ByteBase16 to an Ed25519PublicKeyHex format.
 * @param {Hash28ByteBase16} hash - The hash to be converted.
 * @returns {Ed25519PublicKeyHex} The converted hash in Ed25519PublicKeyHex format.
 */
export declare function HashAsPubKeyHex(hash: Hash28ByteBase16): Ed25519PublicKeyHex;
/**
 * Converts a hex string to a byte array.
 * @param {string} hexString - The hex string to convert.
 * @returns {Uint8Array} The resulting byte array.
 */
export declare function fromHex(hexString: string): Uint8Array;
/**
 * Converts a byte array to a hex string.
 * @param {Uint8Array} byteArray - The byte array to convert.
 * @returns {string} The resulting hex string.
 */
export declare function toHex(byteArray: Uint8Array): string;
/**
 * Function to compute the SHA2-256 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash32ByteBase16 format.
 */
export declare function sha2_256(data: HexBlob): Hash32ByteBase16;
/**
 * Function to compute the SHA3-256 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash32ByteBase16 format.
 */
export declare function sha3_256(data: HexBlob): Hash32ByteBase16;
/**
 * Function to compute the BLAKE2b-256 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash32ByteBase16 format.
 */
export declare function blake2b_256(data: HexBlob): Hash32ByteBase16;
/**
 * Function to compute the BLAKE2b-224 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash28ByteBase16 format.
 */
export declare function blake2b_224(data: HexBlob): Hash28ByteBase16;
/**
 * Function to derive the public key from a private key.
 * @param {Ed25519PrivateNormalKeyHex | Ed25519PrivateExtendedKeyHex} privateKey - The private key to derive the public key from.
 * @returns {Ed25519PublicKeyHex} The derived public key.
 */
export declare function derivePublicKey(privateKey: Ed25519PrivateNormalKeyHex | Ed25519PrivateExtendedKeyHex): Ed25519PublicKeyHex;
/**
 * Function to sign a message with a private key.
 * @param {HexBlob} message - The message to sign.
 * @param {Ed25519PrivateNormalKeyHex} privateKey - The private key to sign the message with.
 * @returns {Ed25519SignatureHex} The signature of the message.
 */
export declare function signMessage(message: HexBlob, privateKey: Ed25519PrivateNormalKeyHex | Ed25519PrivateExtendedKeyHex): Ed25519SignatureHex;
/**
 * Function to generate a mnemonic.
 * @returns {string} The generated mnemonic.
 */
export declare const generateMnemonic: typeof bip39.generateMnemonic;
/**
 * Function to convert entropy to a mnemonic.
 * @param {Buffer} entropy - The entropy to convert.
 * @returns {string} The generated mnemonic.
 */
export declare const entropyToMnemonic: typeof bip39.entropyToMnemonic;
/**
 * Function to convert a mnemonic to entropy.
 * @param {string} mnemonic - The mnemonic to convert.
 * @returns {Buffer} The generated entropy.
 */
export declare const mnemonicToEntropy: typeof bip39.mnemonicToEntropy;
/**
 * Function to create an Address from a Bech32 string.
 * @param {string} bech32 - The Bech32 string to create the Address from.
 * @returns {Address} The created Address.
 */
export declare const addressFromBech32: typeof C.Cardano.Address.fromBech32;
/**
 * Function to create an Address from a validator script.
 * @param {NetworkId} network - The network ID of the Address.
 * @param {Script} validator - The validator script to create the Address from.
 * @returns {Address} The created Address.
 */
export declare const addressFromValidator: (network: NetworkId, validator: Script) => Address;
/**
 * Function to create an Address from a credential.
 * @param {NetworkId} network - The network ID of the Address.
 * @param {Credential} credential - The credential to create the Address from.
 * @returns {Address} The created Address.
 */
export declare const addressFromCredential: (network: NetworkId, credential: Credential) => Address;
/**
 * Function to create an Address from payment and optional delegation credentials.
 * @param {NetworkId} network - The network ID of the Address.
 * @param {Credential} paymentCredential - The payment credential to create the Address from.
 * @param {Credential} [delegationCredential] - The optional delegation credential to create the Address from.
 * @returns {Address} The created Address.
 */
export declare const addressFromCredentials: (network: NetworkId, paymentCredential: Credential, delegationCredential?: Credential) => Address;
export declare const getBurnAddress: (network: NetworkId) => C.Cardano.Address;
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
export declare const CborSet: typeof C.Serialization.CborSet;
/**
 * Type definition for CborSet.
 */
export type CborSet<A, B extends CborSerializable<A>> = C.Serialization.CborSet<A, B>;
/**
 * Helper function to set the serialization era.
 */
export declare const setInConwayEra: (value: boolean) => false;
/**
 * Exporting HexBlob, OpaqueString, and typedHex.
 */
export type { OpaqueString };
export { HexBlob, typedHex };
//# sourceMappingURL=util.d.ts.map