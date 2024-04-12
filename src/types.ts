import * as C from '@cardano-sdk/core'
import * as Crypto from '@cardano-sdk/crypto'
import { HexBlob } from '@cardano-sdk/util'

export const Value = C.Serialization.Value
export type Value = C.Serialization.Value

export type TokenMap = C.Cardano.TokenMap

export const Transaction = C.Serialization.Transaction
export type Transaction = C.Serialization.Transaction

export const TransactionBody = C.Serialization.TransactionBody
export type TransactionBody = C.Serialization.TransactionBody

export const TransactionWitnessSet = C.Serialization.TransactionWitnessSet
export type TransactionWitnessSet = C.Serialization.TransactionWitnessSet

export const TransactionUnspentOutput = C.Serialization.TransactionUnspentOutput
export type TransactionUnspentOutput = C.Serialization.TransactionUnspentOutput

export const TransactionInput = C.Serialization.TransactionInput
export type TransactionInput = C.Serialization.TransactionInput

export const TransactionOutput = C.Serialization.TransactionOutput
export type TransactionOutput = C.Serialization.TransactionOutput

interface CborSerializable<C> {
  toCbor(): HexBlob
  toCore(): C
}

export const CborSet = C.Serialization.CborSet
export type CborSet<A, B extends CborSerializable<A>> = C.Serialization.CborSet<
  A,
  B
>

export type TransactionInputSet = C.Serialization.CborSet<
  ReturnType<TransactionInput['toCore']>,
  TransactionInput
>

export type TransactionWitnessPlutusData = Set<PlutusData>

export const PlutusData = C.Serialization.PlutusData
export type PlutusData = C.Serialization.PlutusData

export const Redeemers = C.Serialization.Redeemers
export type Redeemers = C.Serialization.Redeemers

export const Redeemer = C.Serialization.Redeemer
export type Redeemer = C.Serialization.Redeemer

export const RedeemerPurpose = C.Cardano.RedeemerPurpose
export type RedeemerPurpose = C.Cardano.RedeemerPurpose

export const Script = C.Serialization.Script
export type Script = C.Serialization.Script

export const PolicyId = C.Cardano.PolicyId
export type PolicyId = C.Cardano.PolicyId

export const AssetName = C.Cardano.AssetName
export type AssetName = C.Cardano.AssetName

export const AssetId = C.Cardano.AssetId
export type AssetId = C.Cardano.AssetId

export type ScriptHash = Crypto.Hash28ByteBase16

export const Address = C.Cardano.Address
export type Address = C.Cardano.Address

export const Ed25519PublicKeyHex = Crypto.Ed25519PublicKeyHex
export type Ed25519PublicKeyHex = Crypto.Ed25519PublicKeyHex

export const Ed25519KeyHashHex = Crypto.Ed25519KeyHashHex
export type Ed25519KeyHashHex = Crypto.Ed25519KeyHashHex

export const Hash28ByteBase16 = Crypto.Hash28ByteBase16
export type Hash28ByteBase16 = Crypto.Hash28ByteBase16

export const Hash32ByteBase16 = Crypto.Hash32ByteBase16
export type Hash32ByteBase16 = Crypto.Hash32ByteBase16

export const CredentialType = C.Cardano.CredentialType
export type CredentialType = C.Cardano.CredentialType

export const VkeyWitness = C.Serialization.VkeyWitness
export type VkeyWitness = C.Serialization.VkeyWitness

export const Ed25519SignatureHex = Crypto.Ed25519SignatureHex
export type Ed25519SignatureHex = Crypto.Ed25519SignatureHex

export const PlutusLanguageVersion = C.Cardano.PlutusLanguageVersion
export type PlutusLanguageVersion = C.Cardano.PlutusLanguageVersion

export const NativeScript = C.Serialization.NativeScript
export type NativeScript = C.Serialization.NativeScript

export const PlutusV1Script = C.Serialization.PlutusV1Script
export type PlutusV1Script = C.Serialization.PlutusV1Script

export const PlutusV2Script = C.Serialization.PlutusV2Script
export type PlutusV2Script = C.Serialization.PlutusV2Script

export const PlutusV3Script = C.Serialization.PlutusV3Script
export type PlutusV3Script = C.Serialization.PlutusV3Script

export const Costmdls = C.Serialization.Costmdls
export type Costmdls = C.Serialization.Costmdls

export const CostModel = C.Serialization.CostModel
export type CostModel = C.Serialization.CostModel

export const CborWriter = C.Serialization.CborWriter
export type CborWriter = C.Serialization.CborWriter

export const RewardAccount = C.Cardano.RewardAccount
export type RewardAccount = C.Cardano.RewardAccount

export const Hash = C.Serialization.Hash
export type Hash<T extends string> = C.Serialization.Hash<T>