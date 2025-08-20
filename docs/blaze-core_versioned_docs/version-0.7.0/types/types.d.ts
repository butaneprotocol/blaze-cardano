import { type OpaqueString } from "@cardano-sdk/util";
import * as C from "@cardano-sdk/core";
import * as Crypto from "@cardano-sdk/crypto";
export declare const Slot: (value: number) => C.Cardano.Slot;
export type Slot = C.Cardano.Slot;
export declare const Value: typeof C.Serialization.Value;
export type Value = C.Serialization.Value;
export type TokenMap = C.Cardano.TokenMap;
export declare const Transaction: typeof C.Serialization.Transaction;
export type Transaction = C.Serialization.Transaction;
export declare const TxCBOR: {
    (tx: string): C.Serialization.TxCBOR;
    serialize(tx: C.Cardano.Tx): C.Serialization.TxCBOR;
    deserialize(tx: C.Serialization.TxCBOR): C.Cardano.Tx;
};
export type TxCBOR = C.Serialization.TxCBOR;
export declare const TransactionId: {
    (value: string): C.Cardano.TransactionId;
    fromHexBlob(value: import("@cardano-sdk/util").HexBlob): C.Cardano.TransactionId;
};
export type TransactionId = C.Cardano.TransactionId;
export declare const TransactionBody: typeof C.Serialization.TransactionBody;
export type TransactionBody = C.Serialization.TransactionBody;
export declare const TransactionWitnessSet: typeof C.Serialization.TransactionWitnessSet;
export type TransactionWitnessSet = C.Serialization.TransactionWitnessSet;
export declare const TransactionUnspentOutput: typeof C.Serialization.TransactionUnspentOutput;
export type TransactionUnspentOutput = C.Serialization.TransactionUnspentOutput;
export declare const TransactionInput: typeof C.Serialization.TransactionInput;
export type TransactionInput = C.Serialization.TransactionInput;
export declare const TransactionOutput: typeof C.Serialization.TransactionOutput;
export type TransactionOutput = C.Serialization.TransactionOutput;
export type TransactionInputSet = C.Serialization.CborSet<ReturnType<TransactionInput["toCore"]>, TransactionInput>;
export type TransactionWitnessPlutusData = Set<PlutusData>;
export declare const PlutusData: typeof C.Serialization.PlutusData;
export type PlutusData = C.Serialization.PlutusData;
export declare const ConstrPlutusData: typeof C.Serialization.ConstrPlutusData;
export type ConstrPlutusData = C.Serialization.ConstrPlutusData;
export declare const PlutusList: typeof C.Serialization.PlutusList;
export type PlutusList = C.Serialization.PlutusList;
export declare const PlutusMap: typeof C.Serialization.PlutusMap;
export type PlutusMap = C.Serialization.PlutusMap;
export declare const PlutusDataKind: typeof C.Serialization.PlutusDataKind;
export type PlutusDataKind = C.Serialization.PlutusDataKind;
export declare const Redeemers: typeof C.Serialization.Redeemers;
export type Redeemers = C.Serialization.Redeemers;
export declare const Redeemer: typeof C.Serialization.Redeemer;
export type Redeemer = C.Serialization.Redeemer;
export declare const RedeemerPurpose: typeof C.Cardano.RedeemerPurpose;
export type RedeemerPurpose = C.Cardano.RedeemerPurpose;
export declare const RedeemerTag: typeof C.Serialization.RedeemerTag;
export type RedeemerTag = C.Serialization.RedeemerTag;
export declare const Script: typeof C.Serialization.Script;
export type Script = C.Serialization.Script;
export declare const PolicyId: (value: string) => C.Cardano.PolicyId;
export type PolicyId = C.Cardano.PolicyId;
export declare const AssetName: {
    (value: string): C.Cardano.AssetName;
    toUTF8(assetName: C.Cardano.AssetName, stripInvisibleCharacters?: boolean): string;
};
export type AssetName = C.Cardano.AssetName;
export declare const AssetId: {
    (value: string): C.Cardano.AssetId;
    getPolicyId(id: C.Cardano.AssetId): C.Cardano.PolicyId;
    getAssetName(id: C.Cardano.AssetId): C.Cardano.AssetName;
    fromParts(policyId: C.Cardano.PolicyId, assetName: C.Cardano.AssetName): C.Cardano.AssetId;
};
export type AssetId = C.Cardano.AssetId;
export type ScriptHash = Crypto.Hash28ByteBase16;
export declare const Address: typeof C.Cardano.Address;
export type Address = C.Cardano.Address;
export declare const RewardAddress: typeof C.Cardano.RewardAddress;
export type RewardAddress = C.Cardano.RewardAddress;
export declare const AddressType: typeof C.Cardano.AddressType;
export type AddressType = C.Cardano.AddressType;
export declare const PaymentAddress: (value: string) => C.Cardano.PaymentAddress;
export type PaymentAddress = C.Cardano.PaymentAddress;
export declare const Credential: typeof C.Serialization.Credential;
export type Credential = C.Serialization.Credential;
export type CredentialCore = C.Cardano.Credential;
export declare const Ed25519PublicKeyHex: (value: string) => Crypto.Ed25519PublicKeyHex;
export type Ed25519PublicKeyHex = Crypto.Ed25519PublicKeyHex;
export declare const Ed25519PrivateKey: typeof Crypto.Ed25519PrivateKey;
export type Ed25519PrivateKey = Crypto.Ed25519PrivateKey;
export type Ed25519PrivateNormalKeyHex = OpaqueString<"Ed25519PrivateKeyHex">;
export declare const Ed25519PrivateNormalKeyHex: (value: string) => Ed25519PrivateNormalKeyHex;
export type Ed25519PrivateExtendedKeyHex = OpaqueString<"Ed25519PrivateKeyHex">;
export declare const Ed25519PrivateExtendedKeyHex: (value: string) => Ed25519PrivateExtendedKeyHex;
export type Bip32PrivateKeyHex = OpaqueString<"Bip32PrivateKeyHex">;
export declare const Bip32PrivateKeyHex: (value: string) => Bip32PrivateKeyHex;
export declare const Ed25519KeyHashHex: (value: string) => Crypto.Ed25519KeyHashHex;
export type Ed25519KeyHashHex = Crypto.Ed25519KeyHashHex;
export declare const Hash28ByteBase16: {
    (value: string): Crypto.Hash28ByteBase16;
    fromEd25519KeyHashHex(value: Crypto.Ed25519KeyHashHex): Crypto.Hash28ByteBase16;
};
export type Hash28ByteBase16 = Crypto.Hash28ByteBase16;
export declare const Hash32ByteBase16: {
    (value: string): Crypto.Hash32ByteBase16;
    fromHexBlob<T>(value: import("@cardano-sdk/util").HexBlob): T;
};
export type Hash32ByteBase16 = Crypto.Hash32ByteBase16;
export declare const CredentialType: typeof C.Cardano.CredentialType;
export type CredentialType = C.Cardano.CredentialType;
export declare const Certificate: typeof C.Serialization.Certificate;
export type Certificate = C.Serialization.Certificate;
export declare const PoolId: {
    (value: string): PoolId;
    fromKeyHash(value: Crypto.Ed25519KeyHashHex): PoolId;
    toKeyHash(poolId: PoolId): Crypto.Ed25519KeyHashHex;
};
export type PoolId = OpaqueString<"PoolId">;
export declare const StakeRegistration: typeof C.Serialization.StakeRegistration;
export type StakeRegistration = C.Serialization.StakeRegistration;
export declare const StakeDeregistration: typeof C.Serialization.StakeDeregistration;
export type StakeDeregistration = C.Serialization.StakeDeregistration;
export declare const StakeDelegation: typeof C.Serialization.StakeDelegation;
export type StakeDelegation = C.Serialization.StakeDelegation;
export type StakeDelegationCertificate = C.Cardano.StakeDelegationCertificate;
export declare const CertificateType: typeof C.Cardano.CertificateType;
export type CertificateType = C.Cardano.CertificateType;
export declare const VkeyWitness: typeof C.Serialization.VkeyWitness;
export type VkeyWitness = C.Serialization.VkeyWitness;
export declare const Ed25519SignatureHex: (value: string) => Crypto.Ed25519SignatureHex;
export type Ed25519SignatureHex = Crypto.Ed25519SignatureHex;
export declare const Ed25519PublicKey: typeof Crypto.Ed25519PublicKey;
export type Ed25519PublicKey = Crypto.Ed25519PublicKey;
export declare const Ed25519Signature: typeof Crypto.Ed25519Signature;
export type Ed25519Signature = Crypto.Ed25519Signature;
export declare const Bip32PrivateKey: typeof Crypto.Bip32PrivateKey;
export type Bip32PrivateKey = Crypto.Bip32PrivateKey;
export declare const Bip32PublicKey: typeof Crypto.Bip32PublicKey;
export type Bip32PublicKey = Crypto.Bip32PublicKey;
export declare const PlutusLanguageVersion: typeof C.Cardano.PlutusLanguageVersion;
export type PlutusLanguageVersion = C.Cardano.PlutusLanguageVersion;
export declare const NativeScript: typeof C.Serialization.NativeScript;
export type NativeScript = C.Serialization.NativeScript;
export declare const ScriptPubkey: typeof C.Serialization.ScriptPubkey;
export type ScriptPubkey = C.Serialization.ScriptPubkey;
export declare const ScriptAll: typeof C.Serialization.ScriptAll;
export type ScriptAll = C.Serialization.ScriptAll;
export declare const ScriptAny: typeof C.Serialization.ScriptAny;
export type ScriptAny = C.Serialization.ScriptAny;
export declare const ScriptNOfK: typeof C.Serialization.ScriptNOfK;
export type ScriptNOfK = C.Serialization.ScriptNOfK;
export declare const TimelockStart: typeof C.Serialization.TimelockStart;
export type TimelockStart = C.Serialization.TimelockStart;
export declare const TimelockExpiry: typeof C.Serialization.TimelockExpiry;
export type TimelockExpiry = C.Serialization.TimelockExpiry;
export declare const PlutusV1Script: typeof C.Serialization.PlutusV1Script;
export type PlutusV1Script = C.Serialization.PlutusV1Script;
export declare const PlutusV2Script: typeof C.Serialization.PlutusV2Script;
export type PlutusV2Script = C.Serialization.PlutusV2Script;
export declare const PlutusV3Script: typeof C.Serialization.PlutusV3Script;
export type PlutusV3Script = C.Serialization.PlutusV3Script;
export declare const Costmdls: typeof C.Serialization.Costmdls;
export type Costmdls = C.Serialization.Costmdls;
export declare const CostModel: typeof C.Serialization.CostModel;
export type CostModel = C.Serialization.CostModel;
export declare const CborWriter: typeof C.Serialization.CborWriter;
export type CborWriter = C.Serialization.CborWriter;
export declare const CborReader: typeof C.Serialization.CborReader;
export type CborReader = C.Serialization.CborReader;
export declare const CborReaderState: typeof C.Serialization.CborReaderState;
export type CborReaderState = C.Serialization.CborReaderState;
export declare const RewardAccount: {
    (value: string): C.Cardano.RewardAccount;
    toHash(rewardAccount: C.Cardano.RewardAccount): Hash28ByteBase16;
    fromCredential(credential: C.Cardano.Credential, networkId: C.Cardano.NetworkId): C.Cardano.RewardAccount;
    toNetworkId(rewardAccount: C.Cardano.RewardAccount): C.Cardano.NetworkId;
};
export type RewardAccount = OpaqueString<"RewardAccount">;
export declare const Hash: typeof C.Serialization.Hash;
export type Hash<T extends string> = C.Serialization.Hash<T>;
export declare const DatumHash: {
    (value: string): Crypto.Hash32ByteBase16;
    fromHexBlob<T>(value: import("@cardano-sdk/util").HexBlob): T;
};
export type DatumHash = Crypto.Hash32ByteBase16;
export declare const Datum: typeof C.Serialization.Datum;
export type Datum = PlutusData | DatumHash;
export type CostModels = C.Cardano.CostModels;
export type ExUnits = C.Serialization.ExUnits;
export declare const ExUnits: typeof C.Serialization.ExUnits;
export declare const NetworkId: typeof C.Cardano.NetworkId;
export type NetworkId = C.Cardano.ChainId["networkId"];
export declare const DatumKind: typeof C.Serialization.DatumKind;
export type Evaluator = (tx: Transaction, additionalUtxos: TransactionUnspentOutput[]) => Promise<Redeemers>;
export declare const AuxiliaryData: typeof C.Serialization.AuxiliaryData;
export type AuxiliaryData = C.Serialization.AuxiliaryData;
export declare const Metadata: typeof C.Serialization.GeneralTransactionMetadata;
export type Metadata = C.Serialization.GeneralTransactionMetadata;
export declare const Metadatum: typeof C.Serialization.TransactionMetadatum;
export type Metadatum = C.Serialization.TransactionMetadatum;
export declare const MetadatumMap: typeof C.Serialization.MetadatumMap;
export type MetadatumMap = C.Serialization.MetadatumMap;
export declare const MetadatumList: typeof C.Serialization.MetadatumList;
export type MetadatumList = C.Serialization.MetadatumList;
export declare const TransactionMetadatumKind: typeof C.Serialization.TransactionMetadatumKind;
export type TransactionMetadatumKind = C.Serialization.TransactionMetadatumKind;
/**
 * The SlotConfig interface defines the configuration for slots.
 * @interface SlotConfig
 * @property {number} zeroTime - The zero time for slot calculation.
 * @property {number} zeroSlot - The zero slot.
 * @property {number} slotLength - The slot length.
 */
export interface SlotConfig {
    zeroTime: number;
    zeroSlot: number;
    slotLength: number;
}
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
//# sourceMappingURL=types.d.ts.map