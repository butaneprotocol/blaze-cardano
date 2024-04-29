import { OpaqueString, typedHex } from "@cardano-sdk/util";
import * as C from "./core";
import * as Crypto from "./crypto";

export const Slot = C.Cardano.Slot;
export type Slot = C.Cardano.Slot;

export const Value = C.Serialization.Value;
export type Value = C.Serialization.Value;

export type TokenMap = C.Cardano.TokenMap;

export const Transaction = C.Serialization.Transaction;
export type Transaction = C.Serialization.Transaction;

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

export type Credential = C.Cardano.Credential;

export const Ed25519PublicKeyHex = Crypto.Ed25519PublicKeyHex;
export type Ed25519PublicKeyHex = Crypto.Ed25519PublicKeyHex;

export type Ed25519PrivateNormalKeyHex = OpaqueString<"Ed25519PrivateKeyHex">;
export const Ed25519PrivateNormalKeyHex = (
  value: string,
): Ed25519PrivateNormalKeyHex => typedHex(value, 64);

export const Ed25519KeyHashHex = Crypto.Ed25519KeyHashHex;
export type Ed25519KeyHashHex = Crypto.Ed25519KeyHashHex;

export const Hash28ByteBase16 = Crypto.Hash28ByteBase16;
export type Hash28ByteBase16 = Crypto.Hash28ByteBase16;

export const Hash32ByteBase16 = Crypto.Hash32ByteBase16;
export type Hash32ByteBase16 = Crypto.Hash32ByteBase16;

export const CredentialType = C.Cardano.CredentialType;
export type CredentialType = C.Cardano.CredentialType;

export const StakeRegistration = C.Serialization.StakeRegistration;
export type StakeRegistration = C.Serialization.StakeRegistration;

export const VkeyWitness = C.Serialization.VkeyWitness;
export type VkeyWitness = C.Serialization.VkeyWitness;

export const Ed25519SignatureHex = Crypto.Ed25519SignatureHex;
export type Ed25519SignatureHex = Crypto.Ed25519SignatureHex;

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

export const RewardAccount = C.Cardano.RewardAccount;
export type RewardAccount = C.Cardano.RewardAccount;

export const Hash = C.Serialization.Hash;
export type Hash<T extends string> = C.Serialization.Hash<T>;

export const DatumHash = Crypto.Hash32ByteBase16;
export type DatumHash = Crypto.Hash32ByteBase16;

export type Datum = PlutusData | DatumHash;

export type CostModels = C.Cardano.CostModels;

export type ExUnits = C.Serialization.ExUnits;
export const ExUnits = C.Serialization.ExUnits;

export const NetworkId = C.Cardano.NetworkId;
export type NetworkId = C.Cardano.ChainId["networkId"];

export type Evaluator = (
  tx: Transaction,
  additionalUtxos: TransactionUnspentOutput[],
) => Promise<Redeemers>;
