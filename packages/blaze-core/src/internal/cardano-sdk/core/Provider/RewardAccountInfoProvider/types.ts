// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import { Cardano, Provider } from '../..';

export interface RewardAccountInfoProvider extends Provider {
  rewardAccountInfo(
    rewardAccount: Cardano.RewardAccount,
    localEpoch: Cardano.EpochNo
  ): Promise<Cardano.RewardAccountInfo>;
  delegationPortfolio(rewardAccounts: Cardano.RewardAccount): Promise<Cardano.Cip17DelegationPortfolio | null>;
}
