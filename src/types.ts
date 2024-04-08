import * as C from "@cardano-sdk/core"
import * as Crypto from '@cardano-sdk/crypto';

export const Value = C.Serialization.Value
export type Value = C.Serialization.Value

export const Transaction = C.Serialization.Transaction
export type Transaction = C.Serialization.Transaction

export const TransactionBody = C.Serialization.TransactionBody
export type TransactionBody = C.Serialization.TransactionBody

export const TransactionUnspentOutput = C.Serialization.TransactionUnspentOutput
export type TransactionUnspentOutput = C.Serialization.TransactionUnspentOutput

export const TransactionInput = C.Serialization.TransactionInput
export type TransactionInput = C.Serialization.TransactionInput

export const TransactionOutput = C.Serialization.TransactionOutput
export type TransactionOutput = C.Serialization.TransactionOutput

export const CborSet = C.Serialization.CborSet
export type CborSet = typeof CborSet

export type TransactionInputSet = C.Serialization.CborSet<ReturnType<TransactionInput['toCore']>, TransactionInput>;

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