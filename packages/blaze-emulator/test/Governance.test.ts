import {
  Address,
  Credential,
  GovernanceActionId,
  Hash32ByteBase16,
  NetworkId,
  ProposalProcedure,
  RewardAccount,
  TransactionId,
  VotingProcedure,
  VotingProcedures,
  Voter,
  Vote,
  Ed25519KeyHashHex,
  DRep,
} from "@blaze-cardano/core";
import { Blaze, makeValue, Provider } from "@blaze-cardano/sdk";
import { HotWallet } from "@blaze-cardano/wallet";
import { Emulator } from "../src";
import { signAndSubmit } from "./util";

describe("Emulator governance", () => {
  let emulator: Emulator;
  let blaze: Blaze<Provider, HotWallet>;
  let address: Address;

  beforeEach(async () => {
    emulator = new Emulator([], {
      slotConfig: {
        zeroTime: 0,
        zeroSlot: 0,
        slotLength: 1000,
      },
    });
    emulator.bootstrapMode = false;
    if (emulator.params.stakePoolVotingThresholds) {
      emulator.params.stakePoolVotingThresholds.securityRelevantParamVotingThreshold =
        {
          numerator: 0,
          denominator: 1,
        };
    }
    await emulator.register("dRep", makeValue(1_000_000_000n));
    emulator.as("dRep", async (thisBlaze, thisAddress) => {
      blaze = thisBlaze as Blaze<Provider, HotWallet>;
      address = thisAddress;
    });
  });

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
      NetworkId.Testnet
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
      deposit: 0n,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: { minFeeConstant: newMinFeeConstant },
        policyHash: null,
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
      NetworkId.Testnet
    );
    const account = emulator.accounts.get(rewardAccount);
    if (account) account.balance = 500_000_000n;
    if (account)
      account.drep = DRep.newKeyHash(Ed25519KeyHashHex(stakeCred.hash));

    emulator.stepForwardToNextEpoch();

    const newMinFeeConstant = baseline + 1000;
    const proposal = ProposalProcedure.fromCore({
      deposit: 0n,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: { minFeeConstant: newMinFeeConstant },
        policyHash: null,
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
      NetworkId.Testnet
    );
    const setupTx = await blaze
      .newTransaction()
      .addRegisterStake(Credential.fromCore(stakeCred))
      .complete();
    const setupHash = await signAndSubmit(setupTx, blaze);
    emulator.awaitTransactionConfirmation(setupHash);

    const proposal = ProposalProcedure.fromCore({
      deposit: 0n,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: {
          minFeeConstant: emulator.params.minFeeConstant + 500,
        },
        policyHash: null,
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
      /unregistered drep/i
    );
  });
});
