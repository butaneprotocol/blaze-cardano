import * as BaseEncoding from '@scure/base';
import * as Crypto from '@cardano-sdk/crypto';
import { HexBlob, typedBech32, typedHex } from '@cardano-sdk/util';
const MAX_BECH32_LENGTH_LIMIT = 1023;
export const PoolId = (value) => typedBech32(value, 'pool', 45);
PoolId.fromKeyHash = (value) => HexBlob.toTypedBech32('pool', value);
export const PoolIdHex = (value) => Crypto.Hash28ByteBase16(value);
export const VrfVkHex = (target) => typedHex(target, 64);
PoolId.toKeyHash = (poolId) => {
    const { words } = BaseEncoding.bech32.decode(poolId, MAX_BECH32_LENGTH_LIMIT);
    return Crypto.Ed25519KeyHashHex(HexBlob.fromBytes(BaseEncoding.bech32.fromWords(words)));
};
