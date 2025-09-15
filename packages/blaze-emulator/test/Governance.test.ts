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
} from "@blaze-cardano/core";
import { Blaze, makeValue, Provider } from "@blaze-cardano/sdk";
import { HotWallet } from "@blaze-cardano/wallet";
import { Emulator, EmulatorProvider } from "../src";
import { signAndSubmit } from "./util";

describe("Emulator governance", () => {
  let emulator: Emulator;
  let provider: EmulatorProvider;
  let blaze: Blaze<Provider, HotWallet>;
  let address: Address;

  beforeEach(async () => {
    emulator = new Emulator([], {
      slotConfig: {
        // ensure snapshots/ratification logic runs predictably per epoch
        zeroTime: 0,
        zeroSlot: 0,
        slotLength: 1000,
      },
      trace: true,
    });
    provider = new EmulatorProvider(emulator);
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
    const paymentCred = address.getProps().paymentPart!;
    const stakeCred = address.getProps().delegationPart!;

    console.log(paymentCred.hash, stakeCred.hash);

    // 1) Register stake + register dRep + delegate voting power to the dRep
    const setupTx = await blaze
      .newTransaction()
      .addRegisterStake(Credential.fromCore(stakeCred))
      .addRegisterDRep(Credential.fromCore(paymentCred), 0n)
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
    }

    // Move to next epoch so the stake snapshot (E1) includes our delegation/state
    emulator.stepForwardToNextEpoch();

    // 2) Submit a parameter change proposal (change minFeeConstant)
    const newMinFeeConstant = 160000;
    const pp = ProposalProcedure.fromCore({
      deposit: 0n,
      rewardAccount,
      governanceAction: {
        // @ts-expect-error
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
      .enableTracing(true)
      .complete();
    const voteSigned = await blaze.signTransaction(voteTx);
    const voteTxHash = await signAndSubmit(voteSigned, blaze, true);
    emulator.awaitTransactionConfirmation(voteTxHash);

    // 4) Epoch E2: ratification should occur using E1 snapshot
    emulator.stepForwardToNextEpoch();
    // 5) Epoch E3: enactment should occur
    emulator.stepForwardToNextEpoch();

    expect(emulator.params.minFeeConstant).toBe(newMinFeeConstant);
  });
});
