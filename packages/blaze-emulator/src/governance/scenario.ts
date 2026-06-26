import {
  type Address,
  Credential,
  type CredentialCore,
  CredentialType,
  DRep,
  Ed25519KeyHashHex,
  EpochNo,
  GovernanceActionId,
  Hash28ByteBase16,
  NetworkId,
  type ProposalProcedure,
  RewardAccount,
  type Transaction,
  TransactionId,
  Vote,
  type Voter,
  VotingProcedure,
  VotingProcedures,
  type CommitteeMember,
  type ProtocolParameters,
} from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import type { Blaze } from "@blaze-cardano/sdk";
import type { HotWallet } from "@blaze-cardano/wallet";
import type { Emulator } from "../emulator";

/** Actor used by governance scenario helpers.
 *
 * @public
 */
export type GovernanceScenarioActor = {
  blaze: Blaze<Provider, HotWallet>;
  address: Address;
};

/** Options for deterministic governance scenario setup.
 *
 * @public
 */
export type GovernanceScenarioOptions = {
  committeeColdHash?: Hash28ByteBase16;
  committeeTermEpoch?: EpochNo;
  parameterOverrides?: Partial<ProtocolParameters>;
};

/** Registered DRep details returned by scenario setup helpers.
 *
 * @public
 */
export type GovernanceScenarioDRep = {
  stakeCredential: CredentialCore;
  rewardAccount: RewardAccount;
};

const defaultCommitteeColdHash = Hash28ByteBase16("aa".repeat(28));

/** Configure the emulator for deterministic Conway governance tests.
 *
 * @public
 */
export const configureGovernanceScenario = (
  emulator: Emulator,
  options: GovernanceScenarioOptions = {},
): void => {
  const committeeMember: CommitteeMember = {
    coldCredential: {
      type: CredentialType.KeyHash,
      hash: options.committeeColdHash ?? defaultCommitteeColdHash,
    },
    epoch: options.committeeTermEpoch ?? EpochNo(100),
  };

  Object.assign(emulator.params, options.parameterOverrides);
  emulator.bootstrapMode = false;
  emulator.params.constitutionalCommitteeMinSize = 1;
  emulator.setCommitteeState(
    {
      members: [committeeMember],
      quorumThreshold: { numerator: 0, denominator: 1 },
    },
    { hotCredentials: { [committeeMember.coldCredential.hash]: undefined } },
  );

  if (emulator.params.stakePoolVotingThresholds) {
    emulator.params.stakePoolVotingThresholds.securityRelevantParamVotingThreshold =
      { numerator: 0, denominator: 1 };
  }
};

/** Sign, submit, and confirm a scenario transaction.
 *
 * @public
 */
export const signAndSubmitGovernanceTransaction = async (
  emulator: Emulator,
  blaze: Blaze<Provider, HotWallet>,
  tx: Transaction,
  signWithStakeKey = false,
): Promise<TransactionId> => {
  const signed = await blaze.wallet.signTransaction(tx, true, signWithStakeKey);
  const witnesses = tx.witnessSet();
  witnesses.setVkeys(signed.vkeys()!);
  tx.setWitnessSet(witnesses);
  const txId = await blaze.provider.postTransactionToChain(tx);
  emulator.awaitTransactionConfirmation(txId);
  return txId;
};

/** Register the actor's stake credential as a key DRep and assign deterministic voting stake.
 *
 * @public
 */
export const registerKeyDRepForScenario = async (
  emulator: Emulator,
  actor: GovernanceScenarioActor,
  options: { deposit?: bigint; stake?: bigint } = {},
): Promise<GovernanceScenarioDRep> => {
  const stakeCredential = actor.address.getProps().delegationPart!;
  const credential = Credential.fromCore(stakeCredential);
  const tx = await actor.blaze
    .newTransaction()
    .addRegisterStake(credential)
    .addRegisterDRep(credential, options.deposit ?? 0n)
    .complete();
  await signAndSubmitGovernanceTransaction(emulator, actor.blaze, tx, true);

  const rewardAccount = RewardAccount.fromCredential(
    stakeCredential,
    NetworkId.Testnet,
  );
  const account = emulator.accounts.get(rewardAccount);
  if (account) {
    account.balance = options.stake ?? 1_000_000_000n;
    account.drep = DRep.newKeyHash(Ed25519KeyHashHex(stakeCredential.hash));
  }

  return { stakeCredential, rewardAccount };
};

/** Submit a proposal and return the resulting governance action id.
 *
 * @public
 */
export const submitGovernanceScenarioProposal = async (
  emulator: Emulator,
  actor: GovernanceScenarioActor,
  procedure: ProposalProcedure,
): Promise<GovernanceActionId> => {
  const tx = await actor.blaze
    .newTransaction()
    .addProposal(procedure)
    .complete();
  const txId = await signAndSubmitGovernanceTransaction(
    emulator,
    actor.blaze,
    tx,
  );
  return new GovernanceActionId(TransactionId(txId), 0n);
};

/** Cast one or more DRep votes in a governance scenario.
 *
 * @public
 */
export const voteAsDRepInScenario = async (
  emulator: Emulator,
  actor: GovernanceScenarioActor,
  voter: Voter,
  votes: Array<{ actionId: GovernanceActionId; vote?: Vote }>,
  requiredSigner?: Hash28ByteBase16,
): Promise<TransactionId> => {
  const procedures = new VotingProcedures();
  for (const { actionId, vote = Vote.yes } of votes) {
    procedures.insert(voter, actionId, new VotingProcedure(vote));
  }

  const builder = actor.blaze.newTransaction().setVotingProcedures(procedures);
  if (requiredSigner) {
    builder.addRequiredSigner(Ed25519KeyHashHex(requiredSigner));
  }
  const tx = await builder.complete();
  return signAndSubmitGovernanceTransaction(emulator, actor.blaze, tx, true);
};
