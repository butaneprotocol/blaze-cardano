// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
/** The transaction metadatum type kind. */
export enum TransactionMetadatumKind {
  /** A map of TransactionMetadatum as both key and values. */
  Map,

  /** A list of TransactionMetadatum. */
  List,

  /** An integer. */
  Integer,

  /** Bounded bytes. */
  Bytes,

  /** A text string. */
  Text
}
