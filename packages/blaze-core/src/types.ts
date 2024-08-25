import { type OpaqueString, typedHex } from "@cardano-sdk/util";
import * as C from "@cardano-sdk/core";
import * as Crypto from "@cardano-sdk/crypto";

export const Slot = C.Cardano.Slot;
export type Slot = C.Cardano.Slot;

export const Value = C.Serialization.Value;
export type Value = C.Serialization.Value;

export type TokenMap = C.Cardano.TokenMap;

export const Transaction = C.Serialization.Transaction;
export type Transaction = C.Serialization.Transaction;

export const TxCBOR = C.TxCBOR;
export type TxCBOR = C.TxCBOR;

export const TransactionId = C.Cardano.TransactionId;
export type TransactionId = C.Cardano.TransactionId;

export const TransactionBody = C.Serialization.TransactionBody;
export type TransactionBody = C.Serialization.TransactionBody;

export const TransactionWitnessSet = C.Serialization.TransactionWitnessSet;
export type TransactionWitnessSet = C.Serialization.TransactionWitnessSet;

export const TransactionUnspentOutput =
  C.Serialization.TransactionUnspentOutput;
export type TransactionUnspentOutput = C.Serialization.TransactionUnspentOutput;

export const TransactionInput = C.Serialization.TransactionInput;
export type TransactionInput = C.Serialization.TransactionInput;

export const TransactionOutput = C.Serialization.TransactionOutput;
export type TransactionOutput = C.Serialization.TransactionOutput;

export type TransactionInputSet = C.Serialization.CborSet<
  ReturnType<TransactionInput["toCore"]>,
  TransactionInput
>;

export type TransactionWitnessPlutusData = Set<PlutusData>;

export const PlutusData = C.Serialization.PlutusData;
export type PlutusData = C.Serialization.PlutusData;

export const ConstrPlutusData = C.Serialization.ConstrPlutusData;
export type ConstrPlutusData = C.Serialization.ConstrPlutusData;

export const PlutusList = C.Serialization.PlutusList;
export type PlutusList = C.Serialization.PlutusList;

export const PlutusMap = C.Serialization.PlutusMap;
export type PlutusMap = C.Serialization.PlutusMap;

export const PlutusDataKind = C.Serialization.PlutusDataKind;
export type PlutusDataKind = C.Serialization.PlutusDataKind;

export const Redeemers = C.Serialization.Redeemers;
export type Redeemers = C.Serialization.Redeemers;

export const Redeemer = C.Serialization.Redeemer;
export type Redeemer = C.Serialization.Redeemer;

export const RedeemerPurpose = C.Cardano.RedeemerPurpose;
export type RedeemerPurpose = C.Cardano.RedeemerPurpose;

export const RedeemerTag = C.Serialization.RedeemerTag;
export type RedeemerTag = C.Serialization.RedeemerTag;

export const Script = C.Serialization.Script;
export type Script = C.Serialization.Script;

export const PolicyId = C.Cardano.PolicyId;
export type PolicyId = C.Cardano.PolicyId;

export const AssetName = C.Cardano.AssetName;
export type AssetName = C.Cardano.AssetName;

export const AssetId = C.Cardano.AssetId;
export type AssetId = C.Cardano.AssetId;

export type ScriptHash = Crypto.Hash28ByteBase16;

export const Address = C.Cardano.Address;
export type Address = C.Cardano.Address;

export const RewardAddress = C.Cardano.RewardAddress;
export type RewardAddress = C.Cardano.RewardAddress;

export const AddressType = C.Cardano.AddressType;
export type AddressType = C.Cardano.AddressType;

export const PaymentAddress = C.Cardano.PaymentAddress;
export type PaymentAddress = C.Cardano.PaymentAddress;

export const Credential = C.Serialization.Credential;
export type Credential = C.Serialization.Credential;

export type CredentialCore = C.Cardano.Credential;

export const Ed25519PublicKeyHex = Crypto.Ed25519PublicKeyHex;
export type Ed25519PublicKeyHex = Crypto.Ed25519PublicKeyHex;

export type Ed25519PrivateNormalKeyHex = OpaqueString<"Ed25519PrivateKeyHex">;
export const Ed25519PrivateNormalKeyHex = (
  value: string,
): Ed25519PrivateNormalKeyHex => typedHex(value, 64);

export type Ed25519PrivateExtendedKeyHex = OpaqueString<"Ed25519PrivateKeyHex">;
export const Ed25519PrivateExtendedKeyHex = (
  value: string,
): Ed25519PrivateExtendedKeyHex => typedHex(value, 128);

export type Bip32PrivateKeyHex = OpaqueString<"Bip32PrivateKeyHex">;
export const Bip32PrivateKeyHex = (value: string): Bip32PrivateKeyHex =>
  typedHex(value, 192);

export const Ed25519KeyHashHex = Crypto.Ed25519KeyHashHex;
export type Ed25519KeyHashHex = Crypto.Ed25519KeyHashHex;

export const Hash28ByteBase16 = Crypto.Hash28ByteBase16;
export type Hash28ByteBase16 = Crypto.Hash28ByteBase16;

export const Hash32ByteBase16 = Crypto.Hash32ByteBase16;
export type Hash32ByteBase16 = Crypto.Hash32ByteBase16;

export const CredentialType = C.Cardano.CredentialType;
export type CredentialType = C.Cardano.CredentialType;

export const Certificate = C.Serialization.Certificate;
export type Certificate = C.Serialization.Certificate;

export const PoolId = C.Cardano.PoolId;
export type PoolId = C.Cardano.PoolId;

export const StakeRegistration = C.Serialization.StakeRegistration;
export type StakeRegistration = C.Serialization.StakeRegistration;

export const StakeDelegation = C.Serialization.StakeDelegation;
export type StakeDelegation = C.Serialization.StakeDelegation;

export type StakeDelegationCertificate = C.Cardano.StakeDelegationCertificate;

export const CertificateType = C.Cardano.CertificateType;
export type CertificateType = C.Cardano.CertificateType;

export const VkeyWitness = C.Serialization.VkeyWitness;
export type VkeyWitness = C.Serialization.VkeyWitness;

export const Ed25519SignatureHex = Crypto.Ed25519SignatureHex;
export type Ed25519SignatureHex = Crypto.Ed25519SignatureHex;

export const Ed25519PublicKey = Crypto.Ed25519PublicKey;
export type Ed25519PublicKey = Crypto.Ed25519PublicKey;

export const Ed25519Signature = Crypto.Ed25519Signature;
export type Ed25519Signature = Crypto.Ed25519Signature;

export const Bip32PrivateKey = Crypto.Bip32PrivateKey;
export type Bip32PrivateKey = Crypto.Bip32PrivateKey;

export const Bip32PublicKey = Crypto.Bip32PublicKey;
export type Bip32PublicKey = Crypto.Bip32PublicKey;

export const PlutusLanguageVersion = C.Cardano.PlutusLanguageVersion;
export type PlutusLanguageVersion = C.Cardano.PlutusLanguageVersion;

export const NativeScript = C.Serialization.NativeScript;
export type NativeScript = C.Serialization.NativeScript;

export const PlutusV1Script = C.Serialization.PlutusV1Script;
export type PlutusV1Script = C.Serialization.PlutusV1Script;

export const PlutusV2Script = C.Serialization.PlutusV2Script;
export type PlutusV2Script = C.Serialization.PlutusV2Script;

export const PlutusV3Script = C.Serialization.PlutusV3Script;
export type PlutusV3Script = C.Serialization.PlutusV3Script;

export const Costmdls = C.Serialization.Costmdls;
export type Costmdls = C.Serialization.Costmdls;

export const CostModel = C.Serialization.CostModel;
export type CostModel = C.Serialization.CostModel;

export const CborWriter = C.Serialization.CborWriter;
export type CborWriter = C.Serialization.CborWriter;

export const CborReader = C.Serialization.CborReader;
export type CborReader = C.Serialization.CborReader;

export const CborReaderState = C.Serialization.CborReaderState;
export type CborReaderState = C.Serialization.CborReaderState;

export const RewardAccount = C.Cardano.RewardAccount;
export type RewardAccount = C.Cardano.RewardAccount;

export const Hash = C.Serialization.Hash;
export type Hash<T extends string> = C.Serialization.Hash<T>;

export const DatumHash = Crypto.Hash32ByteBase16;
export type DatumHash = Crypto.Hash32ByteBase16;

export const Datum = C.Serialization.Datum;
export type Datum = PlutusData | DatumHash;

export type CostModels = C.Cardano.CostModels;

export type ExUnits = C.Serialization.ExUnits;
export const ExUnits = C.Serialization.ExUnits;

export const NetworkId = C.Cardano.NetworkId;
export type NetworkId = C.Cardano.ChainId["networkId"];

export const DatumKind = C.Serialization.DatumKind;

export type Evaluator = (
  tx: Transaction,
  additionalUtxos: TransactionUnspentOutput[],
) => Promise<Redeemers>;

export const AuxiliaryData = C.Serialization.AuxiliaryData;
export type AuxiliaryData = C.Serialization.AuxiliaryData;

export const Metadata = C.Serialization.GeneralTransactionMetadata;
export type Metadata = C.Serialization.GeneralTransactionMetadata;

export const Metadatum = C.Serialization.TransactionMetadatum;
export type Metadatum = C.Serialization.TransactionMetadatum;

export const MetadatumMap = C.Serialization.MetadatumMap;
export type MetadatumMap = C.Serialization.MetadatumMap;

export const MetadatumList = C.Serialization.MetadatumList;
export type MetadatumList = C.Serialization.MetadatumList;

export const TransactionMetadatumKind =
  C.Serialization.TransactionMetadatumKind;
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

export const SLOT_CONFIG_NETWORK = {
  Mainnet: { zeroTime: 1596059091000, zeroSlot: 4492800, slotLength: 1000 },
  Preview: { zeroTime: 1666656000000, zeroSlot: 0, slotLength: 1000 },
  Preprod: {
    zeroTime: 1654041600000 + 1728000000,
    zeroSlot: 86400,
    slotLength: 1000,
  },
};
