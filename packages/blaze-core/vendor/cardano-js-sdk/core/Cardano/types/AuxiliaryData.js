import * as Crypto from '@cardano-sdk/crypto';
import * as Serialization from '../../Serialization/AuxiliaryData/index.js';
export const computeAuxiliaryDataHash = (data) => data ? Crypto.blake2b.hash(Serialization.AuxiliaryData.fromCore(data).toCbor(), 32) : undefined;
