import * as BaseEncoding from '@scure/base';
import * as Crypto from '@cardano-sdk/crypto';
import { InvalidStringError, typedBech32 } from '@cardano-sdk/util';
import { PoolId } from './StakePool/primitives.js';
export const BlockSize = (value) => value;
export const BlockNo = (value) => value;
export const EpochNo = (value) => value;
export const Slot = (value) => value;
export const BlockId = (value) => Crypto.Hash32ByteBase16(value);
export const VrfVkBech32 = (value) => typedBech32(value, 'vrf_vk', 52);
export const GenesisDelegate = (value) => {
    if (/ShelleyGenesis-[\da-f]{16}/.test(value)) {
        return value;
    }
    return Crypto.Hash28ByteBase16(value);
};
export const SlotLeader = (value) => {
    try {
        return PoolId(value);
    }
    catch {
        try {
            return GenesisDelegate(value);
        }
        catch (error) {
            throw new InvalidStringError('Expected either PoolId or GenesisDelegate', error);
        }
    }
};
VrfVkBech32.fromHex = (value) => {
    const words = BaseEncoding.bech32.toWords(Buffer.from(value, 'hex'));
    return VrfVkBech32(BaseEncoding.bech32.encode('vrf_vk', words, 1023));
};
