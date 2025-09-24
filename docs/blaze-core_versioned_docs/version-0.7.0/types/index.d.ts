import * as bip39 from '@scure/bip39';
import * as C from '@cardano-sdk/core';
import type { Cardano } from '@cardano-sdk/core';
import * as Crypto from '@cardano-sdk/crypto';
import { HexBlob } from '@cardano-sdk/util';
import { OpaqueString } from '@cardano-sdk/util';
import { typedHex } from '@cardano-sdk/util';
import { wordlist } from '@scure/bip39/wordlists/english';

export declare const Address: typeof C.Cardano.Address;

export declare type Address = C.Cardano.Address;

declare function address(ns: NativeScript, networkId: NetworkId): Address;

/**
 * Function to create an Address from a Bech32 string.
 * @param {string} bech32 - The Bech32 string to create the Address from.
 * @returns {Address} The created Address.
 */
export declare const addressFromBech32: typeof C.Cardano.Address.fromBech32;

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

/**
 * Function to create an Address from a validator script.
 * @param {NetworkId} network - The network ID of the Address.
 * @param {Script} validator - The validator script to create the Address from.
 * @returns {Address} The created Address.
 */
export declare const addressFromValidator: (network: NetworkId, validator: Script) => Address;

export declare const AddressType: typeof C.Cardano.AddressType;

export declare type AddressType = C.Cardano.AddressType;

declare function after(slot: Slot): NativeScript;

declare function allOf(...addresses: NativeScript[]): NativeScript;

declare function anyOf(...addresses: NativeScript[]): NativeScript;

export declare const AssetId: {
    (value: string): C.Cardano.AssetId;
    getPolicyId(id: C.Cardano.AssetId): C.Cardano.PolicyId;
    getAssetName(id: C.Cardano.AssetId): C.Cardano.AssetName;
    fromParts(policyId: C.Cardano.PolicyId, assetName: C.Cardano.AssetName): C.Cardano.AssetId;
};

export declare type AssetId = C.Cardano.AssetId;

export declare const AssetName: {
    (value: string): C.Cardano.AssetName;
    toUTF8(assetName: C.Cardano.AssetName, stripInvisibleCharacters?: boolean): string;
};

export declare type AssetName = C.Cardano.AssetName;

declare function atLeastNOfK(n: number, ...addresses: NativeScript[]): NativeScript;

export declare const AuxiliaryData: typeof C.Serialization.AuxiliaryData;

export declare type AuxiliaryData = C.Serialization.AuxiliaryData;

declare function before(slot: Slot): NativeScript;

export declare const Bip32PrivateKey: typeof Crypto.Bip32PrivateKey;

export declare type Bip32PrivateKey = Crypto.Bip32PrivateKey;

export declare type Bip32PrivateKeyHex = OpaqueString<"Bip32PrivateKeyHex">;

export declare const Bip32PrivateKeyHex: (value: string) => Bip32PrivateKeyHex;

export declare const Bip32PublicKey: typeof Crypto.Bip32PublicKey;

export declare type Bip32PublicKey = Crypto.Bip32PublicKey;

/**
 * Function to compute the BLAKE2b-224 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash28ByteBase16 format.
 */
export declare function blake2b_224(data: HexBlob): Hash28ByteBase16;

/**
 * Function to compute the BLAKE2b-256 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash32ByteBase16 format.
 */
export declare function blake2b_256(data: HexBlob): Hash32ByteBase16;

export declare const CborReader: typeof C.Serialization.CborReader;

export declare type CborReader = C.Serialization.CborReader;

export declare const CborReaderState: typeof C.Serialization.CborReaderState;

export declare type CborReaderState = C.Serialization.CborReaderState;

/**
 * Interface for objects that can be serialized to CBOR.
 */
declare interface CborSerializable<C> {
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
export declare type CborSet<A, B extends CborSerializable<A>> = C.Serialization.CborSet<A, B>;

export declare const CborWriter: typeof C.Serialization.CborWriter;

export declare type CborWriter = C.Serialization.CborWriter;

export declare const Certificate: typeof C.Serialization.Certificate;

export declare type Certificate = C.Serialization.Certificate;

export declare const CertificateType: typeof C.Cardano.CertificateType;

export declare type CertificateType = C.Cardano.CertificateType;

export declare const ConstrPlutusData: typeof C.Serialization.ConstrPlutusData;

export declare type ConstrPlutusData = C.Serialization.ConstrPlutusData;

export declare const Costmdls: typeof C.Serialization.Costmdls;

export declare type Costmdls = C.Serialization.Costmdls;

export declare const CostModel: typeof C.Serialization.CostModel;

export declare type CostModel = C.Serialization.CostModel;

export declare type CostModels = C.Cardano.CostModels;

export declare const Credential: typeof C.Serialization.Credential;

export declare type Credential = C.Serialization.Credential;

export declare type CredentialCore = C.Cardano.Credential;

export declare const CredentialType: typeof C.Cardano.CredentialType;

export declare type CredentialType = C.Cardano.CredentialType;

export declare const Datum: typeof C.Serialization.Datum;

export declare type Datum = PlutusData | DatumHash;

export declare const DatumHash: {
    (value: string): Crypto.Hash32ByteBase16;
    fromHexBlob<T>(value: HexBlob): T;
};

export declare type DatumHash = Crypto.Hash32ByteBase16;

export declare const DatumKind: typeof C.Serialization.DatumKind;

/**
 * Function to derive the public key from a private key.
 * @param {Ed25519PrivateNormalKeyHex | Ed25519PrivateExtendedKeyHex} privateKey - The private key to derive the public key from.
 * @returns {Ed25519PublicKeyHex} The derived public key.
 */
export declare function derivePublicKey(privateKey: Ed25519PrivateNormalKeyHex | Ed25519PrivateExtendedKeyHex): Ed25519PublicKeyHex;

export declare const Ed25519KeyHashHex: (value: string) => Crypto.Ed25519KeyHashHex;

export declare type Ed25519KeyHashHex = Crypto.Ed25519KeyHashHex;

export declare type Ed25519PrivateExtendedKeyHex = OpaqueString<"Ed25519PrivateKeyHex">;

export declare const Ed25519PrivateExtendedKeyHex: (value: string) => Ed25519PrivateExtendedKeyHex;

export declare const Ed25519PrivateKey: typeof Crypto.Ed25519PrivateKey;

export declare type Ed25519PrivateKey = Crypto.Ed25519PrivateKey;

export declare type Ed25519PrivateNormalKeyHex = OpaqueString<"Ed25519PrivateKeyHex">;

export declare const Ed25519PrivateNormalKeyHex: (value: string) => Ed25519PrivateNormalKeyHex;

export declare const Ed25519PublicKey: typeof Crypto.Ed25519PublicKey;

export declare type Ed25519PublicKey = Crypto.Ed25519PublicKey;

export declare const Ed25519PublicKeyHex: (value: string) => Crypto.Ed25519PublicKeyHex;

export declare type Ed25519PublicKeyHex = Crypto.Ed25519PublicKeyHex;

export declare const Ed25519Signature: typeof Crypto.Ed25519Signature;

export declare type Ed25519Signature = Crypto.Ed25519Signature;

export declare const Ed25519SignatureHex: (value: string) => Crypto.Ed25519SignatureHex;

export declare type Ed25519SignatureHex = Crypto.Ed25519SignatureHex;

/**
 * Function to convert entropy to a mnemonic.
 * @param {Buffer} entropy - The entropy to convert.
 * @returns {string} The generated mnemonic.
 */
export declare const entropyToMnemonic: typeof bip39.entropyToMnemonic;

export declare type Evaluator = (tx: Transaction, additionalUtxos: TransactionUnspentOutput[]) => Promise<Redeemers>;

export declare type ExUnits = C.Serialization.ExUnits;

export declare const ExUnits: typeof C.Serialization.ExUnits;

/**
 * Converts a hex string to a byte array.
 * @param {string} hexString - The hex string to convert.
 * @returns {Uint8Array} The resulting byte array.
 */
export declare function fromHex(hexString: string): Uint8Array;

/**
 * Function to generate a mnemonic.
 * @returns {string} The generated mnemonic.
 */
export declare const generateMnemonic: typeof bip39.generateMnemonic;

export declare const getBurnAddress: (network: NetworkId) => C.Cardano.Address;

/**
 * Converts an Address to a PaymentAddress.
 * @param {Address} address - The address to be converted.
 * @returns {PaymentAddress} The converted address in PaymentAddress format.
 * @throws {Error} If a reward account is passed in.
 */
export declare function getPaymentAddress(address: Address): PaymentAddress;

/**
 * Hard coded protocol parameters for the Cardano ledger.
 * These parameters are used as default values in the absence of network-provided parameters.
 */
export declare const hardCodedProtocolParams: ProtocolParameters;

export declare const Hash: typeof C.Serialization.Hash;

export declare type Hash<T extends string> = C.Serialization.Hash<T>;

export declare const Hash28ByteBase16: {
    (value: string): Crypto.Hash28ByteBase16;
    fromEd25519KeyHashHex(value: Crypto.Ed25519KeyHashHex): Crypto.Hash28ByteBase16;
};

export declare type Hash28ByteBase16 = Crypto.Hash28ByteBase16;

export declare const Hash32ByteBase16: {
    (value: string): Crypto.Hash32ByteBase16;
    fromHexBlob<T>(value: HexBlob): T;
};

export declare type Hash32ByteBase16 = Crypto.Hash32ByteBase16;

/**
 * Converts a Hash28ByteBase16 to an Ed25519PublicKeyHex format.
 * @param {Hash28ByteBase16} hash - The hash to be converted.
 * @returns {Ed25519PublicKeyHex} The converted hash in Ed25519PublicKeyHex format.
 */
export declare function HashAsPubKeyHex(hash: Hash28ByteBase16): Ed25519PublicKeyHex;

export { HexBlob }

declare function justAddress(address: string, networkId: NetworkId): NativeScript;

export declare const Metadata: typeof C.Serialization.GeneralTransactionMetadata;

export declare type Metadata = C.Serialization.GeneralTransactionMetadata;

export declare const Metadatum: typeof C.Serialization.TransactionMetadatum;

export declare type Metadatum = C.Serialization.TransactionMetadatum;

export declare const MetadatumList: typeof C.Serialization.MetadatumList;

export declare type MetadatumList = C.Serialization.MetadatumList;

export declare const MetadatumMap: typeof C.Serialization.MetadatumMap;

export declare type MetadatumMap = C.Serialization.MetadatumMap;

export declare interface MinFeeReferenceScripts {
    base: number;
    range: number;
    multiplier: number;
}

/**
 * Function to convert a mnemonic to entropy.
 * @param {string} mnemonic - The mnemonic to convert.
 * @returns {Buffer} The generated entropy.
 */
export declare const mnemonicToEntropy: typeof bip39.mnemonicToEntropy;

export declare const NativeScript: typeof C.Serialization.NativeScript;

export declare type NativeScript = C.Serialization.NativeScript;

export declare namespace NativeScripts {
    export {
        allOf,
        anyOf,
        atLeastNOfK,
        justAddress,
        before,
        after,
        address
    }
}

export declare const NetworkId: typeof C.Cardano.NetworkId;

export declare type NetworkId = C.Cardano.ChainId["networkId"];

export { OpaqueString }

export declare const PaymentAddress: (value: string) => C.Cardano.PaymentAddress;

export declare type PaymentAddress = C.Cardano.PaymentAddress;

export declare const PlutusData: typeof C.Serialization.PlutusData;

export declare type PlutusData = C.Serialization.PlutusData;

export declare const PlutusDataKind: typeof C.Serialization.PlutusDataKind;

export declare type PlutusDataKind = C.Serialization.PlutusDataKind;

export declare const PlutusLanguageVersion: typeof C.Cardano.PlutusLanguageVersion;

export declare type PlutusLanguageVersion = C.Cardano.PlutusLanguageVersion;

export declare const PlutusList: typeof C.Serialization.PlutusList;

export declare type PlutusList = C.Serialization.PlutusList;

export declare const PlutusMap: typeof C.Serialization.PlutusMap;

export declare type PlutusMap = C.Serialization.PlutusMap;

export declare const PlutusV1Script: typeof C.Serialization.PlutusV1Script;

export declare type PlutusV1Script = C.Serialization.PlutusV1Script;

export declare const PlutusV2Script: typeof C.Serialization.PlutusV2Script;

export declare type PlutusV2Script = C.Serialization.PlutusV2Script;

export declare const PlutusV3Script: typeof C.Serialization.PlutusV3Script;

export declare type PlutusV3Script = C.Serialization.PlutusV3Script;

export declare const PolicyId: (value: string) => C.Cardano.PolicyId;

export declare type PolicyId = C.Cardano.PolicyId;

/**
 * Converts a PolicyId to a Hash28ByteBase16 format.
 * @param {PolicyId} policy - The policy ID to be converted.
 * @returns {Hash28ByteBase16} The converted hash in Hash28ByteBase16 format.
 */
export declare function PolicyIdToHash(policy: PolicyId): Hash28ByteBase16;

export declare const PoolId: {
    (value: string): PoolId;
    fromKeyHash(value: Crypto.Ed25519KeyHashHex): PoolId;
    toKeyHash(poolId: PoolId): Crypto.Ed25519KeyHashHex;
};

export declare type PoolId = OpaqueString<"PoolId">;

export declare type Prettier = PlutusData | string | number | boolean | null;

export declare function prettify(data: Prettier, indent?: string): string;

/**
 * Cardano ledger protocol parameters.
 */
export declare interface ProtocolParameters {
    /** The number of coins per UTXO byte. */
    coinsPerUtxoByte: number;
    /** The maximum transaction size. */
    maxTxSize: number;
    /** The minimum fee coefficient. */
    minFeeCoefficient: number;
    /** The minimum fee constant. */
    minFeeConstant: number;
    /** The maximum block body size. */
    maxBlockBodySize: number;
    /** The maximum block header size. */
    maxBlockHeaderSize: number;
    /** The stake key deposit. */
    stakeKeyDeposit: number;
    /** The pool deposit. */
    poolDeposit: number | null;
    /** The pool retirement epoch bound. */
    poolRetirementEpochBound: number;
    /** The desired number of pools. */
    desiredNumberOfPools: number;
    /** The pool influence. */
    poolInfluence: string;
    /** The monetary expansion. */
    monetaryExpansion: string;
    /** The treasury expansion. */
    treasuryExpansion: string;
    /** The minimum pool cost. */
    minPoolCost: number;
    /** The protocol version. */
    protocolVersion: Cardano.ProtocolVersion;
    /** The maximum value size. */
    maxValueSize: number;
    /** The collateral percentage. */
    collateralPercentage: number;
    /** The maximum collateral inputs. */
    maxCollateralInputs: number;
    /** The cost models. */
    costModels: Cardano.CostModels;
    /** The prices. */
    prices: Cardano.Prices;
    /** The maximum execution units per transaction. */
    maxExecutionUnitsPerTransaction: Cardano.ExUnits;
    /** The maximum execution units per block. */
    maxExecutionUnitsPerBlock: Cardano.ExUnits;
    /** Params used for calculating the minimum fee from reference inputs (see https://github.com/CardanoSolutions/ogmios/releases/tag/v6.5.0) */
    minFeeReferenceScripts?: MinFeeReferenceScripts;
}

export declare const Redeemer: typeof C.Serialization.Redeemer;

export declare type Redeemer = C.Serialization.Redeemer;

export declare const RedeemerPurpose: typeof C.Cardano.RedeemerPurpose;

export declare type RedeemerPurpose = C.Cardano.RedeemerPurpose;

export declare const Redeemers: typeof C.Serialization.Redeemers;

export declare type Redeemers = C.Serialization.Redeemers;

export declare const RedeemerTag: typeof C.Serialization.RedeemerTag;

export declare type RedeemerTag = C.Serialization.RedeemerTag;

export declare const RewardAccount: {
    (value: string): C.Cardano.RewardAccount;
    toHash(rewardAccount: C.Cardano.RewardAccount): Hash28ByteBase16;
    fromCredential(credential: C.Cardano.Credential, networkId: C.Cardano.NetworkId): C.Cardano.RewardAccount;
    toNetworkId(rewardAccount: C.Cardano.RewardAccount): C.Cardano.NetworkId;
};

export declare type RewardAccount = OpaqueString<"RewardAccount">;

export declare const RewardAddress: typeof C.Cardano.RewardAddress;

export declare type RewardAddress = C.Cardano.RewardAddress;

export declare const Script: typeof C.Serialization.Script;

export declare type Script = C.Serialization.Script;

export declare const ScriptAll: typeof C.Serialization.ScriptAll;

export declare type ScriptAll = C.Serialization.ScriptAll;

export declare const ScriptAny: typeof C.Serialization.ScriptAny;

export declare type ScriptAny = C.Serialization.ScriptAny;

export declare type ScriptHash = Crypto.Hash28ByteBase16;

export declare const ScriptNOfK: typeof C.Serialization.ScriptNOfK;

export declare type ScriptNOfK = C.Serialization.ScriptNOfK;

export declare const ScriptPubkey: typeof C.Serialization.ScriptPubkey;

export declare type ScriptPubkey = C.Serialization.ScriptPubkey;

export declare type SelectionPhase = "wide" | "deep" | "final";

/**
 * Helper function to set the serialization era.
 */
export declare const setInConwayEra: (value: boolean) => false;

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
 * Function to sign a message with a private key.
 * @param {HexBlob} message - The message to sign.
 * @param {Ed25519PrivateNormalKeyHex} privateKey - The private key to sign the message with.
 * @returns {Ed25519SignatureHex} The signature of the message.
 */
export declare function signMessage(message: HexBlob, privateKey: Ed25519PrivateNormalKeyHex | Ed25519PrivateExtendedKeyHex): Ed25519SignatureHex;

export declare const Slot: (value: number) => C.Cardano.Slot;

export declare type Slot = C.Cardano.Slot;

export declare const SLOT_CONFIG_NETWORK: {
    Mainnet: {
        zeroTime: number;
        zeroSlot: number;
        slotLength: number;
    };
    Preview: {
        zeroTime: number;
        zeroSlot: number;
        slotLength: number;
    };
    Preprod: {
        zeroTime: number;
        zeroSlot: number;
        slotLength: number;
    };
};

/**
 * The SlotConfig interface defines the configuration for slots.
 * @interface SlotConfig
 * @property {number} zeroTime - The zero time for slot calculation.
 * @property {number} zeroSlot - The zero slot.
 * @property {number} slotLength - The slot length.
 */
export declare interface SlotConfig {
    zeroTime: number;
    zeroSlot: number;
    slotLength: number;
}

export declare const StakeDelegation: typeof C.Serialization.StakeDelegation;

export declare type StakeDelegation = C.Serialization.StakeDelegation;

export declare type StakeDelegationCertificate = C.Cardano.StakeDelegationCertificate;

export declare const StakeDeregistration: typeof C.Serialization.StakeDeregistration;

export declare type StakeDeregistration = C.Serialization.StakeDeregistration;

export declare const StakeRegistration: typeof C.Serialization.StakeRegistration;

export declare type StakeRegistration = C.Serialization.StakeRegistration;

export declare const TimelockExpiry: typeof C.Serialization.TimelockExpiry;

export declare type TimelockExpiry = C.Serialization.TimelockExpiry;

export declare const TimelockStart: typeof C.Serialization.TimelockStart;

export declare type TimelockStart = C.Serialization.TimelockStart;

/**
 * Converts a byte array to a hex string.
 * @param {Uint8Array} byteArray - The byte array to convert.
 * @returns {string} The resulting hex string.
 */
export declare function toHex(byteArray: Uint8Array): string;

export declare type TokenMap = C.Cardano.TokenMap;

export declare const Transaction: typeof C.Serialization.Transaction;

export declare type Transaction = C.Serialization.Transaction;

export declare const TransactionBody: typeof C.Serialization.TransactionBody;

export declare type TransactionBody = C.Serialization.TransactionBody;

export declare const TransactionId: {
    (value: string): C.Cardano.TransactionId;
    fromHexBlob(value: HexBlob): C.Cardano.TransactionId;
};

export declare type TransactionId = C.Cardano.TransactionId;

export declare const TransactionInput: typeof C.Serialization.TransactionInput;

export declare type TransactionInput = C.Serialization.TransactionInput;

export declare type TransactionInputSet = C.Serialization.CborSet<ReturnType<TransactionInput["toCore"]>, TransactionInput>;

export declare const TransactionMetadatumKind: typeof C.Serialization.TransactionMetadatumKind;

export declare type TransactionMetadatumKind = C.Serialization.TransactionMetadatumKind;

export declare const TransactionOutput: typeof C.Serialization.TransactionOutput;

export declare type TransactionOutput = C.Serialization.TransactionOutput;

export declare const TransactionUnspentOutput: typeof C.Serialization.TransactionUnspentOutput;

export declare type TransactionUnspentOutput = C.Serialization.TransactionUnspentOutput;

export declare type TransactionWitnessPlutusData = Set<PlutusData>;

export declare const TransactionWitnessSet: typeof C.Serialization.TransactionWitnessSet;

export declare type TransactionWitnessSet = C.Serialization.TransactionWitnessSet;

export declare const TxCBOR: {
    (tx: string): C.Serialization.TxCBOR;
    serialize(tx: C.Cardano.Tx): C.Serialization.TxCBOR;
    deserialize(tx: C.Serialization.TxCBOR): C.Cardano.Tx;
};

export declare type TxCBOR = C.Serialization.TxCBOR;

export { typedHex }

export declare class UTxOSelectionError extends Error {
    phase: SelectionPhase;
    dearth: Value;
    availableInputs?: TransactionUnspentOutput[] | undefined;
    selectedInputs?: TransactionUnspentOutput[] | undefined;
    bestStep?: [bigint | number, Value, number] | undefined;
    constructor(phase: SelectionPhase, dearth: Value, availableInputs?: TransactionUnspentOutput[] | undefined, selectedInputs?: TransactionUnspentOutput[] | undefined, bestStep?: [bigint | number, Value, number] | undefined);
}

export declare const Value: typeof C.Serialization.Value;

export declare type Value = C.Serialization.Value;

export declare const VkeyWitness: typeof C.Serialization.VkeyWitness;

export declare type VkeyWitness = C.Serialization.VkeyWitness;

export { wordlist }

export { }
