// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
/** The plutus data type kind. */
export enum PlutusDataKind {
  /** Represents a specific constructor of a 'Sum Type' along with its arguments. */
  ConstrPlutusData,

  /** A map of PlutusData as both key and values. */
  Map,

  /** A list of PlutusData. */
  List,

  /** An integer. */
  Integer,

  /** Bounded bytes. */
  Bytes
}
