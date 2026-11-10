// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import { fromMetadatum } from './fromMetadatum';
import { fromPlutusData } from './fromPlutusData';

import { NftMetadata as _NftMetadata } from './types';

export * from './types';
export * from './errors';

// tsc requires the type and object, sharing a name, to be exported from the same module (re-export syntax for the type doesn't work)
export type NftMetadata = _NftMetadata;
export const NftMetadata = {
  fromMetadatum,
  fromPlutusData
};
