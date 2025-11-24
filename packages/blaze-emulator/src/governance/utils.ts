import {
  CredentialType,
  DRep,
  Ed25519KeyHashHex,
  GovernanceActionKind,
} from "@blaze-cardano/core";
import type {
  CredentialCore,
  Hash28ByteBase16,
  ProtocolParameters,
  ScriptHash,
  Voter,
} from "@blaze-cardano/core";

export const serialiseVoter = (voter: Voter): string => voter.toCbor();

export const serialiseDrepCredential = (cred: CredentialCore): string => {
  if (cred.type === CredentialType.KeyHash) {
    return DRep.newKeyHash(
      Ed25519KeyHashHex(cred.hash as Hash28ByteBase16),
    ).toCbor();
  }
  return DRep.newScriptHash(cred.hash as ScriptHash).toCbor();
};

export const isDelayingAction = (kind: number): boolean =>
  [
    GovernanceActionKind.NoConfidence,
    GovernanceActionKind.UpdateCommittee,
    GovernanceActionKind.NewConstitution,
    GovernanceActionKind.HardForkInitiation,
  ].includes(kind);

export const nextDrepExpiryEpoch = (
  params: ProtocolParameters,
  currentEpoch: number,
): number | undefined => {
  const maxIdleTime = params.delegateRepresentativeMaxIdleTime;
  if (maxIdleTime === undefined) return undefined;
  return currentEpoch + maxIdleTime;
};
