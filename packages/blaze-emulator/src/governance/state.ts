import {
  type CommitteeMember,
  type Hash28ByteBase16,
  type PoolId,
  type PoolParameters,
  type RewardAccount,
} from "@blaze-cardano/core";
import { type RegisteredAccount, type StakeSnapshot } from "../types";

// TODO: Have an abstracted governance handler the emulator interfaces with

export const findCommitteeMemberByColdHash = (
  members: CommitteeMember[],
  hash: Hash28ByteBase16,
): CommitteeMember | undefined =>
  members.find((member) => member.coldCredential.hash === hash);

export const committeeMemberTermActive = (
  member: CommitteeMember,
  currentEpoch: number,
): boolean => Number(member.epoch) >= currentEpoch;

export const buildStakeSnapshot = (
  accounts: Map<RewardAccount, RegisteredAccount>,
): StakeSnapshot => {
  const snapshot: StakeSnapshot = {
    drepDelegation: {},
    spoDelegation: {},
  };

  for (const [, account] of accounts.entries()) {
    const stake = account.balance;
    if (stake === 0n) continue;

    if (account.drep) {
      const drepId = account.drep.toCbor();
      snapshot.drepDelegation[drepId] =
        (snapshot.drepDelegation[drepId] ?? 0n) + stake;
    }

    if (account.poolId) {
      snapshot.spoDelegation[account.poolId] =
        (snapshot.spoDelegation[account.poolId] ?? 0n) + stake;
    }
  }

  return snapshot;
};

export const isKnownStakePool = (
  activePools: Record<PoolId, PoolParameters>,
  poolId: PoolId,
): boolean => activePools[poolId] !== undefined;
