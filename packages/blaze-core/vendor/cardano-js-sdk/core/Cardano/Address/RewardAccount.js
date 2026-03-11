import { Address, CredentialType } from './Address.js';
import { Hash28ByteBase16 } from "../../../deps/crypto.js";
import { typedBech32 } from "../../../deps/util.js";
import { RewardAddress } from './RewardAddress.js';
export const RewardAccount = (value) => typedBech32(value, ['stake', 'stake_test'], 47);
RewardAccount.toHash = (rewardAccount) => Address.fromBech32(rewardAccount).asReward().getPaymentCredential().hash;
RewardAccount.fromCredential = (credential, networkId) => RewardAccount(RewardAddress.fromCredentials(networkId, { hash: credential.hash, type: credential.type }).toAddress().toBech32());
RewardAccount.toNetworkId = (rewardAccount) => Address.fromBech32(rewardAccount).asReward().toAddress().getNetworkId();
export const createRewardAccount = (stakeKeyHash, networkId) => RewardAccount(RewardAddress.fromCredentials(networkId, { hash: Hash28ByteBase16(stakeKeyHash), type: CredentialType.KeyHash })
    .toAddress()
    .toBech32());
