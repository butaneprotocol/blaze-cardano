import { typedBech32 } from '@cardano-sdk/util';
export const PoolMdVk = (target) => typedBech32(target, 'poolmd_vk', 52);
