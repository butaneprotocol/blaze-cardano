import {
  Address,
  Credential,
  type CredentialCore,
  CredentialType,
  type CommitteeMember,
  GovernanceActionId,
  Hash28ByteBase16,
  Hash32ByteBase16,
  NetworkId,
  PoolId,
  ProposalProcedure,
  RewardAccount,
  TransactionId,
  EpochNo,
  VotingProcedure,
  VotingProcedures,
  Voter,
  Vote,
  Ed25519KeyHashHex,
  DRep,
  hardCodedProtocolParams,
  Cardano,
} from "@blaze-cardano/core";
import { Blaze, makeValue, Provider } from "@blaze-cardano/sdk";
import { HotWallet } from "@blaze-cardano/wallet";
import { Emulator } from "../src";
import { signAndSubmit, VOID_PLUTUS_DATA } from "./util";
import { AlwaysTrueScriptPropose, AlwaysTrueScriptVote } from "./aiken/plutus";

const DEPOSIT = BigInt(hardCodedProtocolParams.governanceActionDeposit!);
const STAKE_KEY_DEPOSIT = BigInt(hardCodedProtocolParams.stakeKeyDeposit!);

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

if (!(BigInt.prototype as unknown as { toJSON?: () => string }).toJSON) {
  (BigInt.prototype as unknown as { toJSON?: () => string }).toJSON =
    function () {
      return this.toString();
    };
}

describe("Emulator governance", () => {
  let emulator: Emulator;
  let blaze: Blaze<Provider, HotWallet>;
  let address: Address;

  beforeEach(async () => {
    const coldCredential = {
      type: CredentialType.KeyHash,
      hash: Hash28ByteBase16("aa".repeat(28)),
    } as CredentialCore;
    const committeeMember: CommitteeMember = {
      coldCredential,
      epoch: EpochNo(100),
    };
    emulator = new Emulator([], {
      params: structuredClone(hardCodedProtocolParams),
      slotConfig: {
        zeroTime: 0,
        zeroSlot: 0,
        slotLength: 1000,
      },
      cc: {
        members: [committeeMember],
        quorumThreshold: { numerator: 0, denominator: 1 },
      },
      ccHotCredentials: { [coldCredential.hash]: undefined },
    });
    emulator.params.constitutionalCommitteeMinSize = 1;
    emulator.bootstrapMode = false;
    emulator.setCommitteeState(emulator.cc, {
      hotCredentials: emulator.cc.members.reduce<
        Record<string, CredentialCore | undefined>
      >((acc, member) => {
        acc[member.coldCredential.hash] = undefined;
        return acc;
      }, {}),
    });
    if (emulator.params.stakePoolVotingThresholds) {
      emulator.params.stakePoolVotingThresholds.securityRelevantParamVotingThreshold =
        {
          numerator: 0,
          denominator: 1,
        };
    }
    await emulator.register("dRep", makeValue(1_000_000_000_000n));
    emulator.as("dRep", async (thisBlaze, thisAddress) => {
      blaze = thisBlaze as Blaze<Provider, HotWallet>;
      address = thisAddress;
    });
  });

  const ZERO_HASH32 = Hash32ByteBase16("".padStart(64, "0"));

  const registerStakeHolder = async ({
    registerDRep = true,
    drepDeposit = 0n,
    stake = 1_000_000_000n,
  }: {
    registerDRep?: boolean;
    drepDeposit?: bigint;
    stake?: bigint;
  } = {}) => {
    const stakeCred = address.getProps().delegationPart!;
    const stakeCredential = Credential.fromCore(stakeCred);
    let txBuilder = blaze.newTransaction().addRegisterStake(stakeCredential);
    if (registerDRep) {
      txBuilder = txBuilder.addRegisterDRep(stakeCredential, drepDeposit);
    }
    let tx = await txBuilder.complete();
    if (registerDRep) {
      tx = await blaze.signTransaction(tx);
    }
    const txHash = await signAndSubmit(tx, blaze, registerDRep);
    emulator.awaitTransactionConfirmation(txHash);

    const rewardAccount = RewardAccount.fromCredential(
      stakeCred,
      NetworkId.Testnet,
    );
    const account = emulator.accounts.get(rewardAccount);
    if (account) {
      account.balance = stake;
      if (registerDRep) {
        account.drep = DRep.newKeyHash(Ed25519KeyHashHex(stakeCred.hash));
      }
    }
    return { stakeCred, rewardAccount };
  };

  const submitProposal = async (
    procedure: ProposalProcedure,
  ): Promise<GovernanceActionId> => {
    const builder = blaze.newTransaction().addProposal(procedure);
    const tx = await builder.complete();
    const hash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(hash);
    return new GovernanceActionId(TransactionId(hash), 0n);
  };

  const castDrepVotes = async (
    stakeCred: CredentialCore,
    targets: Array<{ actionId: GovernanceActionId; vote?: Vote }>,
  ) => {
    const procedures = new VotingProcedures();
    for (const { actionId, vote = Vote.yes } of targets) {
      const voter = Voter.newDrep(Credential.fromCore(stakeCred).toCore());
      const procedure = new VotingProcedure(vote);
      procedures.insert(voter, actionId, procedure);
    }

    const voteTx = await blaze
      .newTransaction()
      .setVotingProcedures(procedures)
      .addRequiredSigner(Ed25519KeyHashHex(stakeCred.hash))
      .complete();
    const voteHash = await signAndSubmit(voteTx, blaze, true);
    emulator.awaitTransactionConfirmation(voteHash);
  };

  test("parameter change proposal ratifies and enacts across epochs", async () => {
    // Create an initial snapshot at epoch 0 → 1 boundary
    emulator.stepForwardToNextEpoch();

    // Prepare a dRep credential tied to this test address' payment key, and a stake credential
    const stakeCred = address.getProps().delegationPart!;

    // 1) Register stake + register dRep + delegate voting power to the dRep
    const setupTx = await blaze
      .newTransaction()
      .addRegisterStake(Credential.fromCore(stakeCred))
      .addRegisterDRep(Credential.fromCore(stakeCred), 0n)
      .complete();

    const paymentSigned = await blaze.signTransaction(setupTx);
    const setupTxHash = await signAndSubmit(paymentSigned, blaze, true);
    emulator.awaitTransactionConfirmation(setupTxHash);

    // Give the delegator some voting stake in the snapshot model
    const rewardAccount = RewardAccount.fromCredential(
      stakeCred,
      NetworkId.Testnet,
    );
    const acct = emulator.accounts.get(rewardAccount);
    if (acct) {
      acct.balance = 1_000_000_000n;
      acct.drep = DRep.newKeyHash(Ed25519KeyHashHex(stakeCred.hash));
    }

    // Move to next epoch so the stake snapshot (E1) includes our delegation/state
    emulator.stepForwardToNextEpoch();

    // 2) Submit a parameter change proposal (change minFeeConstant)
    const newMinFeeConstant = 160000;
    const pp = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: { minFeeConstant: newMinFeeConstant },
        policyHash: emulator.constitution.scriptHash,
      },
      anchor: {
        url: "ipfs://example",
        dataHash: Hash32ByteBase16("".padStart(64, "0")),
      },
    });

    const proposalTx = await blaze.newTransaction().addProposal(pp).complete();
    const proposalTxHash = await signAndSubmit(proposalTx, blaze);
    emulator.awaitTransactionConfirmation(proposalTxHash);

    // 3) Cast a yes vote from the dRep for this action id
    const voter = Voter.newDrep(Credential.fromCore(stakeCred).toCore());
    const actionId = new GovernanceActionId(TransactionId(proposalTxHash), 0n);
    const vp = new VotingProcedure(Vote.yes);
    const vps = new VotingProcedures();
    vps.insert(voter, actionId, vp);

    const voteTx = await blaze
      .newTransaction()
      .setVotingProcedures(vps)
      .addRequiredSigner(Ed25519KeyHashHex(stakeCred.hash))
      .complete();
    const voteSigned = await blaze.signTransaction(voteTx);
    const voteTxHash = await signAndSubmit(voteSigned, blaze, true);
    emulator.awaitTransactionConfirmation(voteTxHash);

    // 4) Epoch E2: ratification and enactment should occur using E1 snapshot
    emulator.stepForwardToNextEpoch();

    expect(emulator.params.minFeeConstant).toBe(newMinFeeConstant);
  });

  test("stake pool default votes respect bootstrap and delegation rules", async () => {
    const poolStakeCred: CredentialCore = {
      type: CredentialType.KeyHash,
      hash: Hash28ByteBase16("bb".repeat(28)),
    };
    const poolReward = RewardAccount.fromCredential(
      poolStakeCred,
      NetworkId.Testnet,
    );
    emulator.accounts.set(poolReward, {
      balance: 600_000_000n,
      poolId: undefined,
    });
    const poolId = PoolId.fromKeyHash(Ed25519KeyHashHex(poolStakeCred.hash));
    const poolAccount = emulator.accounts.get(poolReward)!;
    poolAccount.poolId = poolId;
    emulator.activePools[poolId] = {
      id: poolId,
      rewardAccount: poolReward,
      owners: [poolReward],
      pledge: 0n,
      cost: 0n,
      margin: { numerator: 0, denominator: 1 },
      relays: [],
      metadataJson: undefined,
      metadata: undefined,
      vrf: Cardano.VrfVkHex("".padStart(64, "0")),
    };

    const proposer = await registerStakeHolder({
      registerDRep: true,
      stake: 800_000_000n,
    });

    const originalDeposit = emulator.params.governanceActionDeposit ?? 0;
    emulator.params.governanceActionDeposit = 0;

    emulator.stepForwardToNextEpoch();

    // Bootstrap mode → SPO abstains by default.
    emulator.bootstrapMode = true;
    const bootstrapParamChange = ProposalProcedure.fromCore({
      deposit: BigInt(emulator.params.governanceActionDeposit ?? 0),
      rewardAccount: proposer.rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "info_action",
        governanceActionId: null,
      },
      anchor: { url: "ipfs://bootstrap-spo", dataHash: ZERO_HASH32 },
    });
    const bootstrapActionId = await submitProposal(bootstrapParamChange);
    emulator.stepForwardToNextEpoch();
    const bootstrapTallies = emulator.getTallies(bootstrapActionId)!;
    expect(bootstrapTallies.tallies.spo.yes).toBe(0n);
    expect(bootstrapTallies.tallies.spo.no).toBe(0n);

    // Post-bootstrap without delegation → defaults to no.
    emulator.bootstrapMode = false;
    emulator.stepForwardToNextEpoch();
    const postBootstrapParamChange = ProposalProcedure.fromCore({
      deposit: BigInt(emulator.params.governanceActionDeposit ?? 0),
      rewardAccount: proposer.rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "info_action",
        governanceActionId: null,
      },
      anchor: { url: "ipfs://post-bootstrap-spo", dataHash: ZERO_HASH32 },
    });
    const postBootstrapActionId = await submitProposal(
      postBootstrapParamChange,
    );
    emulator.stepForwardToNextEpoch();
    const postBootstrapTallies = emulator.getTallies(postBootstrapActionId)!;
    expect(postBootstrapTallies.tallies.spo.yes).toBe(0n);
    expect(postBootstrapTallies.tallies.spo.no).toBe(600_000_000n);

    // Delegating to AlwaysNoConfidence flips the default to yes for no-confidence votes.
    poolAccount.drep = DRep.newAlwaysNoConfidence();
    emulator.stepForwardToNextEpoch();
    const noConfidenceProposal = ProposalProcedure.fromCore({
      deposit: BigInt(emulator.params.governanceActionDeposit ?? 0),
      rewardAccount: proposer.rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "no_confidence",
        governanceActionId: null,
      },
      anchor: { url: "ipfs://noc-default", dataHash: ZERO_HASH32 },
    });
    const noConfidenceActionId = await submitProposal(noConfidenceProposal);
    emulator.stepForwardToNextEpoch();
    const noConfidenceTallies = emulator.getTallies(noConfidenceActionId)!;
    expect(noConfidenceTallies.tallies.spo.yes).toBe(600_000_000n);
    expect(noConfidenceTallies.tallies.spo.no).toBe(0n);

    emulator.params.governanceActionDeposit = originalDeposit;
  });

  test("latest vote from a voter overrides previous votes", async () => {
    const baseline = emulator.params.minFeeConstant;
    emulator.stepForwardToNextEpoch();

    const stakeCred = address.getProps().delegationPart!;

    const setupTx = await blaze
      .newTransaction()
      .addRegisterStake(Credential.fromCore(stakeCred))
      .addRegisterDRep(Credential.fromCore(stakeCred), 0n)
      .complete();
    const setupHash = await signAndSubmit(setupTx, blaze, true);
    emulator.awaitTransactionConfirmation(setupHash);

    const rewardAccount = RewardAccount.fromCredential(
      stakeCred,
      NetworkId.Testnet,
    );
    const account = emulator.accounts.get(rewardAccount);
    if (account) account.balance = 500_000_000n;
    if (account)
      account.drep = DRep.newKeyHash(Ed25519KeyHashHex(stakeCred.hash));

    emulator.stepForwardToNextEpoch();

    const newMinFeeConstant = baseline + 1000;
    const proposal = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: { minFeeConstant: newMinFeeConstant },
        policyHash: emulator.constitution.scriptHash,
      },
      anchor: {
        url: "ipfs://example",
        dataHash: Hash32ByteBase16("".padStart(64, "0")),
      },
    });

    const proposalTx = await blaze
      .newTransaction()
      .addProposal(proposal)
      .complete();
    const proposalHash = await signAndSubmit(proposalTx, blaze);
    emulator.awaitTransactionConfirmation(proposalHash);

    const actionId = new GovernanceActionId(TransactionId(proposalHash), 0n);
    const voter = Voter.newDrep(Credential.fromCore(stakeCred).toCore());

    const yesProcedures = new VotingProcedures();
    yesProcedures.insert(voter, actionId, new VotingProcedure(Vote.yes));
    const voteYesTx = await blaze
      .newTransaction()
      .setVotingProcedures(yesProcedures)
      .addRequiredSigner(Ed25519KeyHashHex(stakeCred.hash))
      .complete();
    const voteYesHash = await signAndSubmit(voteYesTx, blaze, true);
    emulator.awaitTransactionConfirmation(voteYesHash);

    const noProcedures = new VotingProcedures();
    noProcedures.insert(voter, actionId, new VotingProcedure(Vote.no));
    const voteNoTx = await blaze
      .newTransaction()
      .setVotingProcedures(noProcedures)
      .addRequiredSigner(Ed25519KeyHashHex(stakeCred.hash))
      .complete();
    const voteNoHash = await signAndSubmit(voteNoTx, blaze, true);
    emulator.awaitTransactionConfirmation(voteNoHash);

    emulator.stepForwardToNextEpoch();

    expect(emulator.params.minFeeConstant).toBe(baseline);
  });

  test("unregistered drep vote is rejected", async () => {
    emulator.stepForwardToNextEpoch();

    const stakeCred = address.getProps().delegationPart!;
    const rewardAccount = RewardAccount.fromCredential(
      stakeCred,
      NetworkId.Testnet,
    );
    const setupTx = await blaze
      .newTransaction()
      .addRegisterStake(Credential.fromCore(stakeCred))
      .complete();
    const setupHash = await signAndSubmit(setupTx, blaze);
    emulator.awaitTransactionConfirmation(setupHash);

    const proposal = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: {
          minFeeConstant: emulator.params.minFeeConstant + 500,
        },
        policyHash: emulator.constitution.scriptHash,
      },
      anchor: {
        url: "https://example.com",
        dataHash: Hash32ByteBase16("".padStart(64, "0")),
      },
    });

    const proposalTx = await blaze
      .newTransaction()
      .addProposal(proposal)
      .complete();
    const proposalHash = await signAndSubmit(proposalTx, blaze);
    emulator.awaitTransactionConfirmation(proposalHash);

    const voter = Voter.newDrep(Credential.fromCore(stakeCred).toCore());
    const procedures = new VotingProcedures();
    const actionId = new GovernanceActionId(TransactionId(proposalHash), 0n);
    procedures.insert(voter, actionId, new VotingProcedure(Vote.yes));

    const voteTx = await blaze
      .newTransaction()
      .setVotingProcedures(procedures)
      .addRequiredSigner(Ed25519KeyHashHex(stakeCred.hash))
      .complete();

    await expect(signAndSubmit(voteTx, blaze, true)).rejects.toThrow(
      /unregistered drep/i,
    );
  });

  test("treasury withdrawals transfer funds to registered accounts once ratified", async () => {
    // Conway ledger RATIFY/ENACT rules (spec lines 273-333) require treasury
    // movements for accepted withdrawal actions.
    emulator.treasury = 1_000_000_000n;
    if (emulator.params.stakePoolVotingThresholds) {
      emulator.params.stakePoolVotingThresholds.committeeNormal = {
        numerator: 0,
        denominator: 1,
      };
    }

    emulator.stepForwardToNextEpoch();
    const { stakeCred, rewardAccount } = await registerStakeHolder({
      stake: 800_000_000n,
    });

    emulator.stepForwardToNextEpoch();

    const withdrawAmount = 300_000_000n;
    const treasuryProposal = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "treasury_withdrawals_action",
        withdrawals: new Set([{ rewardAccount, coin: withdrawAmount }]),
        policyHash: null,
      },
      anchor: { url: "ipfs://treasury", dataHash: ZERO_HASH32 },
    });

    const proposalTx = await blaze
      .newTransaction()
      .addProposal(treasuryProposal)
      .complete();
    const proposalHash = await signAndSubmit(proposalTx, blaze);
    emulator.awaitTransactionConfirmation(proposalHash);

    const actionId = new GovernanceActionId(TransactionId(proposalHash), 0n);
    await castDrepVotes(stakeCred, [{ actionId }]);

    const currentTreasury = emulator.treasury;
    const treasuryFee = emulator.getCurrentTreasuryFeeShare();

    emulator.stepForwardToNextEpoch();

    expect(emulator.treasury).toBe(
      currentTreasury - withdrawAmount + treasuryFee,
    );
    const account = emulator.accounts.get(rewardAccount);
    expect(account).toBeDefined();
    expect(account!.balance).toBe(800_000_000n + withdrawAmount);
    expect(emulator.depositPot).toBe(BigInt(emulator.params.stakeKeyDeposit));
  });

  test("treasury withdrawals exceeding treasury remain active", async () => {
    emulator.treasury = 500_000_000n;
    if (emulator.params.stakePoolVotingThresholds) {
      emulator.params.stakePoolVotingThresholds.committeeNormal = {
        numerator: 0,
        denominator: 1,
      };
    }

    emulator.stepForwardToNextEpoch();
    const { stakeCred, rewardAccount } = await registerStakeHolder({
      stake: 900_000_000n,
    });

    emulator.stepForwardToNextEpoch();

    const excessiveWithdrawal = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "treasury_withdrawals_action",
        withdrawals: new Set([{ rewardAccount, coin: 600_000_000n }]),
        policyHash: null,
      },
      anchor: { url: "ipfs://treasury-excess", dataHash: ZERO_HASH32 },
    });

    const actionId = await submitProposal(excessiveWithdrawal);

    await castDrepVotes(stakeCred, [{ actionId }]);

    const treasuryBefore = emulator.treasury;
    const feeShare = emulator.getCurrentTreasuryFeeShare();
    emulator.stepForwardToNextEpoch();

    expect(emulator.getGovernanceProposalStatus(actionId)).toBe("Active");
    expect(emulator.treasury).toBe(treasuryBefore + feeShare);
  });

  test("committee update rejects candidates whose term has already expired", async () => {
    emulator.stepForwardToNextEpoch();
    const { rewardAccount } = await registerStakeHolder({
      registerDRep: false,
      stake: 0n,
    });

    const expiredCandidate = {
      type: CredentialType.KeyHash,
      hash: Hash28ByteBase16("11".repeat(28)),
    } as CredentialCore;

    const proposal = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "update_committee",
        governanceActionId: null,
        membersToBeRemoved: new Set<CredentialCore>(),
        membersToBeAdded: new Set([
          {
            coldCredential: expiredCandidate,
            epoch: EpochNo(emulator.clock.epoch),
          },
        ]) as Set<CommitteeMember>,
        newQuorumThreshold: { numerator: 1, denominator: 1 },
      },
      anchor: { url: "ipfs://committee", dataHash: ZERO_HASH32 },
    });

    const tx = await blaze.newTransaction().addProposal(proposal).complete();

    await expect(signAndSubmit(tx, blaze)).rejects.toThrow(
      /term must end in the future/i,
    );
  });

  test("committee updates refresh membership and reset hot credentials on enactment", async () => {
    const coldToRemove = Hash28ByteBase16("01".repeat(28));
    const newCold = Hash28ByteBase16("02".repeat(28));
    const existingHot: CredentialCore = {
      type: CredentialType.KeyHash,
      hash: Hash28ByteBase16("03".repeat(28)),
    };

    emulator.setCommitteeState(
      {
        members: [
          {
            coldCredential: {
              type: CredentialType.KeyHash,
              hash: coldToRemove,
            },
            epoch: EpochNo(emulator.clock.epoch + 5),
          },
        ],
        quorumThreshold: { numerator: 1, denominator: 1 },
      },
      { hotCredentials: { [coldToRemove]: existingHot } },
    );

    if (emulator.params.stakePoolVotingThresholds) {
      emulator.params.stakePoolVotingThresholds.committeeNormal = {
        numerator: 0,
        denominator: 1,
      };
    }

    emulator.stepForwardToNextEpoch();
    const { stakeCred, rewardAccount } = await registerStakeHolder({
      stake: 600_000_000n,
    });
    emulator.stepForwardToNextEpoch();

    const newTermEpoch = EpochNo(emulator.clock.epoch + 5);
    const proposal = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "update_committee",
        governanceActionId: null,
        membersToBeRemoved: new Set([
          { type: CredentialType.KeyHash, hash: coldToRemove },
        ]) as Set<CredentialCore>,
        membersToBeAdded: new Set([
          {
            coldCredential: {
              type: CredentialType.KeyHash,
              hash: newCold,
            },
            epoch: newTermEpoch,
          },
        ]) as Set<CommitteeMember>,
        newQuorumThreshold: { numerator: 2, denominator: 3 },
      },
      anchor: { url: "ipfs://committee-update", dataHash: ZERO_HASH32 },
    });

    const proposalTx = await blaze
      .newTransaction()
      .addProposal(proposal)
      .complete();
    const proposalHash = await signAndSubmit(proposalTx, blaze);
    emulator.awaitTransactionConfirmation(proposalHash);

    const actionId = new GovernanceActionId(TransactionId(proposalHash), 0n);
    await castDrepVotes(stakeCred, [{ actionId }]);

    emulator.stepForwardToNextEpoch();

    expect(emulator.cc.members).toEqual([
      expect.objectContaining({
        coldCredential: {
          type: CredentialType.KeyHash,
          hash: newCold,
        },
        epoch: newTermEpoch,
      }),
    ]);
    expect(emulator.cc.quorumThreshold).toEqual({
      numerator: 2,
      denominator: 3,
    });
    expect(emulator.getCommitteeHotCredential(coldToRemove)).toBeUndefined();
    expect(emulator.getCommitteeHotCredential(newCold)).toBeUndefined();
  });

  test("new constitution proposals must reference last enacted constitution", async () => {
    // constitution updates.
    emulator.stepForwardToNextEpoch();
    const { stakeCred, rewardAccount } = await registerStakeHolder({
      stake: 700_000_000n,
    });
    emulator.stepForwardToNextEpoch();

    const firstAnchor = {
      url: "https://constitution/v1",
      dataHash: ZERO_HASH32,
    };
    const firstProposal = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "new_constitution",
        governanceActionId: null,
        constitution: {
          anchor: firstAnchor,
          scriptHash: null,
        },
      },
      anchor: { url: "ipfs://constitution-v1", dataHash: ZERO_HASH32 },
    });

    const proposalTx1 = await blaze
      .newTransaction()
      .addProposal(firstProposal)
      .complete();
    const hash1 = await signAndSubmit(proposalTx1, blaze);
    emulator.awaitTransactionConfirmation(hash1);
    const actionId1 = new GovernanceActionId(TransactionId(hash1), 0n);

    await castDrepVotes(stakeCred, [{ actionId: actionId1 }]);
    emulator.stepForwardToNextEpoch();

    expect(emulator.constitution.anchor.url).toBe(firstAnchor.url);

    const secondCore = {
      anchor: { url: "https://constitution/v2", dataHash: ZERO_HASH32 },
      scriptHash: null,
    };
    const secondProposal = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "new_constitution",
        governanceActionId: null,
        constitution: secondCore,
      },
      anchor: { url: "ipfs://constitution-v2", dataHash: ZERO_HASH32 },
    });

    const proposalTx2 = await blaze
      .newTransaction()
      .addProposal(secondProposal)
      .complete();

    await expect(signAndSubmit(proposalTx2, blaze)).rejects.toThrow(
      /must reference last enacted action/i,
    );

    const linkedSecond = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "new_constitution",
        governanceActionId: actionId1.toCore(),
        constitution: secondCore,
      },
      anchor: { url: "ipfs://constitution-v2", dataHash: ZERO_HASH32 },
    });

    const proposalTx2b = await blaze
      .newTransaction()
      .addProposal(linkedSecond)
      .complete();
    const hash2 = await signAndSubmit(proposalTx2b, blaze);
    emulator.awaitTransactionConfirmation(hash2);
    const actionId2 = new GovernanceActionId(TransactionId(hash2), 0n);

    await castDrepVotes(stakeCred, [{ actionId: actionId2 }]);
    emulator.stepForwardToNextEpoch();

    expect(emulator.constitution.anchor.url).toBe("https://constitution/v2");
  });

  test("no-confidence ratification delays unrelated governance actions until next epoch", async () => {
    if (emulator.params.stakePoolVotingThresholds) {
      emulator.params.stakePoolVotingThresholds.motionNoConfidence = {
        numerator: 0,
        denominator: 1,
      };
    }

    const baseline = emulator.params.minFeeConstant;

    emulator.stepForwardToNextEpoch();
    const { stakeCred, rewardAccount } = await registerStakeHolder({
      stake: 900_000_000n,
    });
    emulator.stepForwardToNextEpoch();

    const noConfidence = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "no_confidence",
        governanceActionId: null,
      },
      anchor: { url: "ipfs://noc", dataHash: ZERO_HASH32 },
    });

    const paramTarget = baseline + 2_222;
    const parameterChange = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: { minFeeConstant: paramTarget },
        policyHash: null,
      },
      anchor: { url: "ipfs://params", dataHash: ZERO_HASH32 },
    });

    const firstTx = await blaze
      .newTransaction()
      .addProposal(noConfidence)
      .complete();
    const firstHash = await signAndSubmit(firstTx, blaze);
    emulator.awaitTransactionConfirmation(firstHash);

    const secondTx = await blaze
      .newTransaction()
      .addProposal(parameterChange)
      .complete();
    const secondHash = await signAndSubmit(secondTx, blaze);
    emulator.awaitTransactionConfirmation(secondHash);

    const actionNoConf = new GovernanceActionId(TransactionId(firstHash), 0n);
    const actionParam = new GovernanceActionId(TransactionId(secondHash), 0n);

    await castDrepVotes(stakeCred, [
      { actionId: actionNoConf },
      { actionId: actionParam },
    ]);

    emulator.stepForwardToNextEpoch();
    expect(emulator.params.minFeeConstant).toBe(baseline);

    emulator.stepForwardToNextEpoch();
    expect(emulator.params.minFeeConstant).toBe(paramTarget);
  });

  test("proposal deposits expire and refund stake when lifetime elapses", async () => {
    emulator.params.governanceActionLifetime = 1;

    const { rewardAccount } = await registerStakeHolder({
      registerDRep: false,
      stake: 0n,
    });

    const proposal = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: {
          minFeeConstant: emulator.params.minFeeConstant + 1,
        },
        policyHash: null,
      },
      anchor: { url: "ipfs://expiring", dataHash: ZERO_HASH32 },
    });

    const tx = await blaze.newTransaction().addProposal(proposal).complete();
    const hash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(hash);

    expect(emulator.depositPot).toBe(DEPOSIT + STAKE_KEY_DEPOSIT);
    expect(emulator.accounts.get(rewardAccount)?.balance).toBe(DEPOSIT);

    emulator.stepForwardToNextEpoch();
    emulator.stepForwardToNextEpoch();

    expect(emulator.depositPot).toBe(STAKE_KEY_DEPOSIT);
    expect(emulator.accounts.get(rewardAccount)?.balance).toBe(0n);
  });

  test("committee votes reject unauthorized hot credentials", async () => {
    emulator.stepForwardToNextEpoch();

    const coldAddress = await emulator.register(
      "ccCold",
      makeValue(1_000_000_000n),
    );
    const hotAddress = await emulator.register(
      "ccHot",
      makeValue(1_000_000_000n),
    );

    let ccHotBlaze!: Blaze<Provider, HotWallet>;
    await emulator.as("ccHot", async (thisBlaze) => {
      ccHotBlaze = thisBlaze as Blaze<Provider, HotWallet>;
    });

    const coldStakeCred = coldAddress.getProps().delegationPart!;
    const hotStakeCred = hotAddress.getProps().delegationPart!;

    emulator.setCommitteeState({
      members: [
        {
          coldCredential: coldStakeCred,
          epoch: EpochNo(emulator.clock.epoch + 5),
        },
      ],
      quorumThreshold: { numerator: 1, denominator: 1 },
    });

    const { rewardAccount } = await registerStakeHolder({
      registerDRep: false,
      stake: 0n,
    });

    const proposal = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: {
          minFeeConstant: emulator.params.minFeeConstant + 50,
        },
        policyHash: emulator.constitution.scriptHash,
      },
      anchor: { url: "ipfs://param-hot", dataHash: ZERO_HASH32 },
    });

    const proposalTx = await blaze
      .newTransaction()
      .addProposal(proposal)
      .complete();
    const proposalHash = await signAndSubmit(proposalTx, blaze);
    emulator.awaitTransactionConfirmation(proposalHash);
    const actionId = new GovernanceActionId(TransactionId(proposalHash), 0n);

    const hotCredential = Credential.fromCore(hotStakeCred);
    const procedures = new VotingProcedures();
    procedures.insert(
      Voter.newConstitutionalCommitteeHotKey(hotCredential.toCore()),
      actionId,
      new VotingProcedure(Vote.yes),
    );

    const voteTx = await ccHotBlaze
      .newTransaction()
      .setVotingProcedures(procedures)
      .addRequiredSigner(Ed25519KeyHashHex(hotStakeCred.hash))
      .complete();

    await expect(signAndSubmit(voteTx, ccHotBlaze, true)).rejects.toThrow(
      /committee voter is not authorized/i,
    );
  });

  test("drep re-registration enforces deposit rules and refreshes expiry", async () => {
    emulator.params.delegateRepresentativeDeposit = 5_000_000;
    emulator.params.delegateRepresentativeMaxIdleTime = 2;

    const deposit = BigInt(emulator.params.delegateRepresentativeDeposit);
    const maxIdle = emulator.params.delegateRepresentativeMaxIdleTime ?? 0;

    emulator.stepForwardToNextEpoch();
    const { stakeCred, rewardAccount } = await registerStakeHolder({
      registerDRep: true,
      drepDeposit: deposit,
      stake: 1_000_000_000n,
    });

    const drepState = emulator.dreps[stakeCred.hash]!;
    expect(drepState.deposit).toBe(deposit);
    expect(drepState.expiryEpoch).toBe(emulator.clock.epoch + maxIdle);
    expect(emulator.depositPot).toBe(STAKE_KEY_DEPOSIT + deposit);

    const unregisterTx = await blaze
      .newTransaction()
      .addUnregisterDRep(Credential.fromCore(stakeCred), deposit)
      .complete();
    const unregisterHash = await signAndSubmit(unregisterTx, blaze, true);
    emulator.awaitTransactionConfirmation(unregisterHash);
    expect(emulator.depositPot).toBe(STAKE_KEY_DEPOSIT);

    const reRegisterTx = await blaze
      .newTransaction()
      .addRegisterDRep(Credential.fromCore(stakeCred), 0n)
      .complete();
    const reRegisterHash = await signAndSubmit(reRegisterTx, blaze, true);
    emulator.awaitTransactionConfirmation(reRegisterHash);
    expect(emulator.depositPot).toBe(STAKE_KEY_DEPOSIT);

    const paramChange = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: {
          minFeeConstant: emulator.params.minFeeConstant + 42,
        },
        policyHash: emulator.constitution.scriptHash,
      },
      anchor: { url: "ipfs://drep-refresh", dataHash: ZERO_HASH32 },
    });

    const paramActionId = await submitProposal(paramChange);

    const voteEpoch = emulator.clock.epoch;
    await castDrepVotes(stakeCred, [{ actionId: paramActionId }]);
    emulator.stepForwardToNextEpoch();

    const refreshed = emulator.dreps[stakeCred.hash]!;
    expect(refreshed.expiryEpoch).toBe(voteEpoch + maxIdle);
  });

  test("parameter group combination selects strictest thresholds", async () => {
    if (!emulator.params.delegateRepresentativeVotingThresholds) {
      throw new Error("Missing delegateRepresentativeVotingThresholds");
    }
    emulator.params.delegateRepresentativeVotingThresholds.ppEconomicGroup = {
      numerator: 3,
      denominator: 4,
    };
    emulator.params.delegateRepresentativeVotingThresholds.ppGovernanceGroup = {
      numerator: 4,
      denominator: 5,
    };
    if (!emulator.params.stakePoolVotingThresholds) {
      throw new Error("Missing stakePoolVotingThresholds");
    }
    emulator.params.stakePoolVotingThresholds.securityRelevantParamVotingThreshold =
      {
        numerator: 0,
        denominator: 1,
      };

    const { stakeCred, rewardAccount } = await registerStakeHolder({
      stake: 800_000_000n,
    });

    emulator.stepForwardToNextEpoch();

    const update = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: {
          coinsPerUtxoByte: emulator.params.coinsPerUtxoByte + 1,
          governanceActionValidityPeriod: EpochNo(
            (emulator.params.governanceActionLifetime ?? 0) + 5,
          ),
        },
        policyHash: emulator.constitution.scriptHash,
      },
      anchor: { url: "ipfs://group-thresholds", dataHash: ZERO_HASH32 },
    });

    const actionId = await submitProposal(update);
    await castDrepVotes(stakeCred, [{ actionId }]);

    emulator.stepForwardToNextEpoch();
    emulator.stepForwardToNextEpoch();

    const drepThreshold =
      emulator.params.delegateRepresentativeVotingThresholds.ppGovernanceGroup;
    expect(drepThreshold).toEqual({ numerator: 4, denominator: 5 });
    const spoThreshold =
      emulator.params.stakePoolVotingThresholds
        .securityRelevantParamVotingThreshold;
    expect(spoThreshold).toEqual({ numerator: 0, denominator: 1 });
    expect(emulator.getGovernanceProposalStatus(actionId)).toBe("Enacted");
  });

  test("info and treasury actions skip previous-action linkage", async () => {
    const { stakeCred, rewardAccount } = await registerStakeHolder({
      stake: 600_000_000n,
    });

    emulator.setCommitteeState({
      members: [],
      quorumThreshold: { numerator: 0, denominator: 1 },
    });
    emulator.params.constitutionalCommitteeMinSize = 0;
    if (emulator.params.stakePoolVotingThresholds) {
      emulator.params.stakePoolVotingThresholds.committeeNormal = {
        numerator: 0,
        denominator: 1,
      };
    }

    emulator.stepForwardToNextEpoch();

    const infoProposal = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "info_action",
        governanceActionId: null,
      },
      anchor: { url: "ipfs://info-1", dataHash: ZERO_HASH32 },
    });
    const infoAction1 = await submitProposal(infoProposal);
    await castDrepVotes(stakeCred, [{ actionId: infoAction1 }]);
    emulator.stepForwardToNextEpoch();

    const infoProposal2 = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "info_action",
        governanceActionId: null,
      },
      anchor: { url: "ipfs://info-2", dataHash: ZERO_HASH32 },
    });
    const infoAction2 = await submitProposal(infoProposal2);
    await castDrepVotes(stakeCred, [{ actionId: infoAction2 }]);
    emulator.stepForwardToNextEpoch();
    expect(emulator.getGovernanceProposalStatus(infoAction2)).toBe("Active");

    emulator.treasury = 1_000_000_000n;
    const treasuryProposal = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "treasury_withdrawals_action",
        withdrawals: new Set([{ rewardAccount, coin: 100_000_000n }]),
        policyHash: null,
      },
      anchor: { url: "ipfs://treasury-1", dataHash: ZERO_HASH32 },
    });
    const treasuryAction1 = await submitProposal(treasuryProposal);
    await castDrepVotes(stakeCred, [{ actionId: treasuryAction1 }]);
    emulator.stepForwardToNextEpoch();
    emulator.stepForwardToNextEpoch();

    const treasuryProposal2 = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "treasury_withdrawals_action",
        withdrawals: new Set([{ rewardAccount, coin: 50_000_000n }]),
        policyHash: null,
      },
      anchor: { url: "ipfs://treasury-2", dataHash: ZERO_HASH32 },
    });
    const treasuryAction2 = await submitProposal(treasuryProposal2);
    await castDrepVotes(stakeCred, [{ actionId: treasuryAction2 }]);
    emulator.stepForwardToNextEpoch();
    const treasuryTallies = emulator.getTallies(treasuryAction2)!;
    expect(treasuryTallies.tallies.drep.yes).toBeGreaterThan(0n);
    emulator.stepForwardToNextEpoch();
    expect(emulator.getGovernanceProposalStatus(treasuryAction2)).toBe(
      "Active",
    );
  });

  test("script drep should be able to vote and propose", async () => {
    emulator.stepForwardToNextEpoch();

    const scriptVote = new AlwaysTrueScriptVote(0n, "");

    const scriptDrepCredential = Credential.fromCore({
      type: CredentialType.ScriptHash,
      hash: scriptVote.Script.hash(),
    });

    const registerBuilder = blaze
      .newTransaction()
      .provideScript(scriptVote.Script)
      .addRegisterDRep(scriptDrepCredential, 0n, undefined, VOID_PLUTUS_DATA);

    const registerTx = await registerBuilder.complete();
    const registerHash = await signAndSubmit(registerTx, blaze);
    emulator.awaitTransactionConfirmation(registerHash);

    const scriptDrepHash = scriptDrepCredential.toCore().hash;
    expect(emulator.dreps[scriptDrepHash]).toEqual(
      expect.objectContaining({ isRegistered: true }),
    );

    const { stakeCred, rewardAccount } = await registerStakeHolder({
      registerDRep: false,
      stake: 900_000_000n,
    });

    const delegateTx = await blaze
      .newTransaction()
      .addVoteDelegation(Credential.fromCore(stakeCred), scriptDrepCredential)
      .complete();
    const delegateHash = await signAndSubmit(delegateTx, blaze, true);
    emulator.awaitTransactionConfirmation(delegateHash);

    emulator.stepForwardToNextEpoch();

    const targetMinFee = emulator.params.minFeeConstant + 1_111;
    const proposal = ProposalProcedure.fromCore({
      deposit: DEPOSIT,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: { minFeeConstant: targetMinFee },
        policyHash: emulator.constitution.scriptHash,
      },
      anchor: { url: "ipfs://script-drep", dataHash: ZERO_HASH32 },
    });

    const proposalBuilder = blaze.newTransaction().addProposal(proposal);
    const proposalTx = await proposalBuilder.complete();
    const proposalHash = await signAndSubmit(proposalTx, blaze);
    emulator.awaitTransactionConfirmation(proposalHash);

    const actionId = new GovernanceActionId(TransactionId(proposalHash), 0n);
    const voter = Voter.newDrep(scriptDrepCredential.toCore());

    const voteBuilder = blaze
      .newTransaction()
      .provideScript(scriptVote.Script)
      .addVote(voter, actionId, Vote.yes, { redeemer: VOID_PLUTUS_DATA });
    const voteTx = await voteBuilder.complete();
    const voteHash = await signAndSubmit(voteTx, blaze);
    emulator.awaitTransactionConfirmation(voteHash);

    emulator.stepForwardToNextEpoch();

    expect(emulator.params.minFeeConstant).toBe(targetMinFee);
    const tallies = emulator.getTallies(actionId)!;
    expect(tallies.tallies.drep.yes).toBeGreaterThan(0n);
  });

  test("parameter change proposals invoke proposal policy when constitution script is set", async () => {
    emulator.stepForwardToNextEpoch();

    const policyScript = new AlwaysTrueScriptPropose(0n, "");
    const previousScriptHash = emulator.constitution.scriptHash;
    emulator.constitution.scriptHash = policyScript.Script.hash();

    try {
      const { stakeCred, rewardAccount } = await registerStakeHolder({
        stake: 900_000_000n,
      });

      emulator.stepForwardToNextEpoch();

      const updatedMinFee = emulator.params.minFeeConstant + 777;
      const policyProposal = ProposalProcedure.fromCore({
        deposit: DEPOSIT,
        rewardAccount,
        governanceAction: {
          // @ts-expect-error - GovernanceActionType is not exported
          __typename: "parameter_change_action",
          governanceActionId: null,
          protocolParamUpdate: { minFeeConstant: updatedMinFee },
          policyHash: emulator.constitution.scriptHash,
        },
        anchor: { url: "ipfs://policy-redeemer", dataHash: ZERO_HASH32 },
      });

      expect(() =>
        blaze
          .newTransaction()
          .provideScript(policyScript.Script)
          .addProposal(policyProposal),
      ).toThrow(/proposal policy requires a redeemer/i);

      const policyTx = await blaze
        .newTransaction()
        .provideScript(policyScript.Script)
        .addProposal(policyProposal, VOID_PLUTUS_DATA)
        .complete();
      const policyHash = await signAndSubmit(policyTx, blaze);
      emulator.awaitTransactionConfirmation(policyHash);

      const actionId = new GovernanceActionId(TransactionId(policyHash), 0n);
      await castDrepVotes(stakeCred, [{ actionId }]);

      emulator.stepForwardToNextEpoch();

      expect(emulator.params.minFeeConstant).toBe(updatedMinFee);
    } finally {
      emulator.constitution.scriptHash = previousScriptHash;
    }
  });
});
