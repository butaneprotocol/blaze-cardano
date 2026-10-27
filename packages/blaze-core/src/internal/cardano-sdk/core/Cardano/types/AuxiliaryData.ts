// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import * as Crypto from '../../../crypto/index';
import * as Serialization from '../../Serialization/AuxiliaryData';
import { Hash32ByteBase16 } from '../../../crypto/index';
import { Script } from './Script';

// eslint-disable-next-line no-use-before-define
export type MetadatumMap = Map<Metadatum, Metadatum>;

export type Metadatum = bigint | MetadatumMap | string | Uint8Array | Metadatum[];

export type TxMetadata = Map<bigint, Metadatum>;

export interface AuxiliaryData {
  blob?: TxMetadata;
  scripts?: Script[];
}

export const computeAuxiliaryDataHash = (data: AuxiliaryData | undefined): Hash32ByteBase16 | undefined =>
  data ? Crypto.blake2b.hash<Hash32ByteBase16>(Serialization.AuxiliaryData.fromCore(data).toCbor(), 32) : undefined;
