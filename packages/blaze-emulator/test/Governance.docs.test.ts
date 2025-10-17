import {
  Credential,
  CredentialType,
  DRep,
  Ed25519KeyHashHex,
  EpochNo,
  GovernanceActionId,
  Hash28ByteBase16,
  Hash32ByteBase16,
  NetworkId,
  ProposalProcedure,
  RewardAccount,
  TransactionId,
  Vote,
  Voter,
  VotingProcedure,
  VotingProcedures,
  hardCodedProtocolParams,
  type CommitteeMember,
  type CredentialCore,
} from "@blaze-cardano/core";
import { Blaze, Provider, makeValue } from "@blaze-cardano/sdk";
import { HotWallet } from "@blaze-cardano/wallet";
import { Emulator } from "../src";
import { signAndSubmit } from "./util";

const ZERO_HASH32 = Hash32ByteBase16("".padStart(64, "0"));

describe("docs governance examples", () => {
  let emulator: Emulator;
  let blaze: Blaze<Provider, HotWallet>;
  let rewardAccount: RewardAccount;
  let stakeCred: CredentialCore;

  beforeEach(async () => {
    const params = structuredClone(hardCodedProtocolParams);
    params.governanceActionDeposit = 0;
    params.delegateRepresentativeDeposit = 0;
    params.delegateRepresentativeMaxIdleTime = 2;
    params.stakePoolVotingThresholds!.committeeNormal = {
      numerator: 0,
      denominator: 1,
    };
    params.stakePoolVotingThresholds!.securityRelevantParamVotingThreshold = {
      numerator: 0,
      denominator: 1,
    };
    params.delegateRepresentativeVotingThresholds!.ppEconomicGroup = {
      numerator: 1,
      denominator: 1,
    };

    emulator = new Emulator([], {
      params,
      slotConfig: { zeroTime: 0, zeroSlot: 0, slotLength: 1_000 },
    });
    emulator.bootstrapMode = false;
    emulator.params.collateralPercentage = 0;
    emulator.params.constitutionalCommitteeMinSize = 1;

    const committeeMember: CommitteeMember = {
      coldCredential: {
        type: CredentialType.KeyHash,
        hash: Hash28ByteBase16("aa".repeat(28)),
      },
      epoch: EpochNo(200),
    };
    emulator.setCommitteeState(
      {
        members: [committeeMember],
        quorumThreshold: { numerator: 0, denominator: 1 },
      },
      { hotCredentials: { [committeeMember.coldCredential.hash]: undefined } },
    );

    await emulator.register("gov-wallet", makeValue(1_000_000_000n));
    await emulator.as("gov-wallet", async (instance, address) => {
      blaze = instance as Blaze<Provider, HotWallet>;
      stakeCred = address.getProps().delegationPart!;
      rewardAccount = RewardAccount.fromCredential(
        stakeCred,
        NetworkId.Testnet,
      );
    });
  });

  const registerStakeholder = async (stake: bigint) => {
    const stakeCredential = Credential.fromCore(stakeCred);
    const tx = await blaze
      .newTransaction()
      .addRegisterStake(stakeCredential)
      .addRegisterDRep(stakeCredential, 0n)
      .complete();
    const hash = await signAndSubmit(tx, blaze, true);
    emulator.awaitTransactionConfirmation(hash);

    const account =
      emulator.accounts.get(rewardAccount) ??
      ({
        balance: 0n,
      } as typeof emulator.accounts extends Map<RewardAccount, infer T>
        ? T
        : never);
    account.balance = stake;
    account.drep = DRep.newKeyHash(Ed25519KeyHashHex(stakeCred.hash));
    emulator.accounts.set(rewardAccount, account);

    const drepState = emulator.dreps[stakeCred.hash];
    if (drepState) {
      drepState.isRegistered = true;
      drepState.deposit = 0n;
      drepState.expiryEpoch =
        emulator.clock.epoch +
        (emulator.params.delegateRepresentativeMaxIdleTime ?? 0);
    }
  };

  const submitProposal = async (procedure: ProposalProcedure) => {
    const builder = blaze.newTransaction().addProposal(procedure);
    builder.setMinimumFee(0n);
    const tx = await builder.complete();
    tx.body().setFee(0n);
    const hash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(hash);
    return new GovernanceActionId(TransactionId(hash), 0n);
  };

  const voteAsDRep = async (actionId: GovernanceActionId, vote: Vote = Vote.yes) => {
    const voter = Voter.newDrep(Credential.fromCore(stakeCred).toCore());
    const procedures = new VotingProcedures();
    procedures.insert(voter, actionId, new VotingProcedure(vote));
    const tx = await blaze
      .newTransaction()
      .setVotingProcedures(procedures)
      .addRequiredSigner(Ed25519KeyHashHex(stakeCred.hash))
      .complete();
    const hash = await signAndSubmit(tx, blaze, true);
    emulator.awaitTransactionConfirmation(hash);
  };

  it("enacts a parameter change when a dRep votes yes", async () => {
    await registerStakeholder(600_000_000n);
    const baseline = emulator.params.minFeeConstant;

    emulator.stepForwardToNextEpoch();

    const proposal = ProposalProcedure.fromCore({
      deposit: 0n,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: { minFeeConstant: baseline + 1_000 },
        policyHash: emulator.constitution.scriptHash,
      },
      anchor: { url: "ipfs://docs-parameter-change", dataHash: ZERO_HASH32 },
    });

    const actionId = await submitProposal(proposal);
    await voteAsDRep(actionId, Vote.yes);

    emulator.stepForwardToNextEpoch();
    emulator.stepForwardToNextEpoch();

    expect(emulator.params.minFeeConstant).toBe(baseline + 1_000);
    expect(emulator.getGovernanceProposalStatus(actionId)).toBe("Enacted");
  });

  it("refunds the proposer after a treasury withdrawal enacts", async () => {
    await registerStakeholder(500_000_000n);
    emulator.treasury = 700_000_000n;

    emulator.stepForwardToNextEpoch();

    const withdrawal = ProposalProcedure.fromCore({
      deposit: 0n,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error GovernanceActionType is not exported
        __typename: "treasury_withdrawals_action",
        withdrawals: new Set([{ rewardAccount, coin: 150_000_000n }]),
        policyHash: null,
      },
      anchor: { url: "ipfs://docs-treasury", dataHash: ZERO_HASH32 },
    });

    const actionId = await submitProposal(withdrawal);
    await voteAsDRep(actionId, Vote.yes);

    const treasuryBefore = emulator.treasury;
    const feeShare = emulator.getCurrentTreasuryFeeShare();
    emulator.stepForwardToNextEpoch();
    emulator.stepForwardToNextEpoch();

    expect(emulator.getGovernanceProposalStatus(actionId)).toBe("Enacted");
    expect(emulator.treasury).toBe(
      treasuryBefore - 150_000_000n + feeShare,
    );
    expect(emulator.accounts.get(rewardAccount)?.balance).toBe(
      500_000_000n + 150_000_000n,
    );
  });
});
