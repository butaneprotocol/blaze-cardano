import {
  Address,
  Credential,
  CredentialType,
  EpochNo,
  GovernanceActionId,
  Hash28ByteBase16,
  Hash32ByteBase16,
  NetworkId,
  ProposalProcedure,
  RewardAccount,
  Transaction,
  TransactionId,
  Vote,
  Voter,
  hardCodedProtocolParams,
  type CommitteeMember,
  type CredentialCore,
} from "@blaze-cardano/core";
import { Blaze, makeValue, type Provider } from "@blaze-cardano/sdk";
import { HotWallet } from "@blaze-cardano/wallet";
import { Emulator } from "@blaze-cardano/emulator";
import {
  GovernanceGuardPropose,
  GovernanceGuardVote,
} from "../../../packages/blaze-emulator/test/aiken/plutus";

const ZERO_HASH32 = Hash32ByteBase16("".padStart(64, "0"));
const GOVERNANCE_REDEEMER = 42n;

async function signAndSubmit(
  tx: Transaction,
  blaze: Blaze<Provider, HotWallet>,
  signWithStakeKey = false,
): Promise<TransactionId> {
  const signed = await blaze.wallet.signTransaction(tx, true, signWithStakeKey);
  const witnessSet = tx.witnessSet();
  witnessSet.setVkeys(signed.vkeys()!);
  tx.setWitnessSet(witnessSet);
  return blaze.provider.postTransactionToChain(tx);
}

function createGovernanceEmulator(): Emulator {
  const coldCredential: CredentialCore = {
    type: CredentialType.KeyHash,
    hash: Hash28ByteBase16("aa".repeat(28)),
  };
  const committeeMember: CommitteeMember = {
    coldCredential,
    epoch: EpochNo(100),
  };
  const emulator = new Emulator([], {
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
  emulator.params.collateralPercentage = 0;
  emulator.bootstrapMode = false;
  emulator.setCommitteeState(emulator.cc, {
    hotCredentials: emulator.cc.members.reduce<
      Record<string, CredentialCore | undefined>
    >((credentials, member) => {
      credentials[member.coldCredential.hash] = undefined;
      return credentials;
    }, {}),
  });

  if (emulator.params.stakePoolVotingThresholds) {
    emulator.params.stakePoolVotingThresholds.securityRelevantParamVotingThreshold =
      {
        numerator: 0,
        denominator: 1,
      };
  }

  return emulator;
}

function logStep(message: string): void {
  console.log(`[governance-demo] ${message}`);
}

async function main(): Promise<void> {
  const emulator = createGovernanceEmulator();
  const startingMinFeeConstant = emulator.params.minFeeConstant;
  const newMinFeeConstant = startingMinFeeConstant + 42;

  logStep("Chang governance emulator demo");
  logStep(
    `start: slot=${emulator.clock.slot}, epoch=${emulator.clock.epoch}, minFeeConstant=${startingMinFeeConstant}`,
  );
  logStep(
    `target change: minFeeConstant ${startingMinFeeConstant} -> ${newMinFeeConstant}`,
  );

  await emulator.register("dRep", makeValue(1_000_000_000_000n));

  await emulator.as("dRep", async (blaze, address) => {
    const wallet = blaze as Blaze<Provider, HotWallet>;
    const drepAddress = address as Address;
    const stakeCred = drepAddress.getProps().delegationPart;

    if (!stakeCred) {
      throw new Error("Demo wallet must have a stake credential");
    }

    logStep(`1. funded wallet: ${drepAddress.toBech32()}`);
    logStep(`   stake credential: ${stakeCred.hash}`);

    emulator.stepForwardBlock();
    logStep(`2. advanced one block: slot=${emulator.clock.slot}`);

    emulator.stepForwardToNextEpoch();
    logStep(`3. initial stake snapshot: epoch=${emulator.clock.epoch}`);

    const stakeCredential = Credential.fromCore(stakeCred);
    const scriptVote = new GovernanceGuardVote(
      GOVERNANCE_REDEEMER,
      BigInt(hardCodedProtocolParams.governanceActionDeposit!),
    );
    const proposalPolicy = new GovernanceGuardPropose(
      GOVERNANCE_REDEEMER,
      BigInt(hardCodedProtocolParams.governanceActionDeposit!),
    );
    const scriptDrepCredential = Credential.fromCore({
      type: CredentialType.ScriptHash,
      hash: scriptVote.Script.hash(),
    });
    emulator.constitution.scriptHash = proposalPolicy.Script.hash();

    const stakeRegistrationTx = await wallet
      .newTransaction()
      .addRegisterStake(stakeCredential)
      .complete();
    const stakeRegistrationHash = await signAndSubmit(
      stakeRegistrationTx,
      wallet,
    );
    emulator.awaitTransactionConfirmation(stakeRegistrationHash);
    logStep(`4. registered stake credential: tx=${stakeRegistrationHash}`);

    const drepRegistrationTx = await wallet
      .newTransaction()
      .provideScript(scriptVote.Script)
      .addRegisterDRep(
        scriptDrepCredential,
        0n,
        undefined,
        scriptVote.redeemer(GOVERNANCE_REDEEMER),
      )
      .complete();
    const drepRegistrationHash = await signAndSubmit(
      drepRegistrationTx,
      wallet,
    );
    emulator.awaitTransactionConfirmation(drepRegistrationHash);
    logStep(`5. registered script DRep: tx=${drepRegistrationHash}`);
    logStep(`   PlutusV3 script hash: ${scriptVote.Script.hash()}`);

    const rewardAccount = RewardAccount.fromCredential(
      stakeCred,
      NetworkId.Testnet,
    );
    const account = emulator.accounts.get(rewardAccount);
    if (!account) {
      throw new Error(`Missing reward account ${rewardAccount}`);
    }
    account.balance = 1_000_000_000n;

    const delegationTx = await wallet
      .newTransaction()
      .addVoteDelegation(stakeCredential, scriptDrepCredential)
      .complete();
    const delegationHash = await signAndSubmit(delegationTx, wallet, true);
    emulator.awaitTransactionConfirmation(delegationHash);
    logStep(`6. delegated voting stake to script DRep: tx=${delegationHash}`);
    logStep(`   reward account: ${rewardAccount}`);

    emulator.stepForwardToNextEpoch();
    logStep(`7. script DRep voting power snapshotted: epoch=${emulator.clock.epoch}`);

    const parameterChange = ProposalProcedure.fromCore({
      deposit: BigInt(hardCodedProtocolParams.governanceActionDeposit!),
      rewardAccount,
      governanceAction: {
        // @ts-expect-error - GovernanceActionType is not exported by core.
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: {
          minFeeConstant: newMinFeeConstant,
        },
        policyHash: proposalPolicy.Script.hash(),
      },
      anchor: {
        url: "ipfs://blaze-emulator-governance-demo",
        dataHash: ZERO_HASH32,
      },
    });

    const proposalTx = await wallet
      .newTransaction()
      .provideScript(proposalPolicy.Script)
      .addProposal(
        parameterChange,
        proposalPolicy.redeemer(GOVERNANCE_REDEEMER),
      )
      .complete();
    const proposalTxHash = await signAndSubmit(proposalTx, wallet);
    emulator.awaitTransactionConfirmation(proposalTxHash);
    const actionId = new GovernanceActionId(TransactionId(proposalTxHash), 0n);
    const action = actionId.toCore();
    const actionKey = `${action.id}:${BigInt(action.actionIndex)}`;
    logStep(`8. proposal policy accepted parameter change: ${actionKey}`);
    logStep(`   payload: minFeeConstant=${newMinFeeConstant}`);

    const voter = Voter.newDrep(scriptDrepCredential.toCore());
    let rejectedInvalidRedeemer = false;
    try {
      await wallet
        .newTransaction()
        .provideScript(scriptVote.Script)
        .addVote({
          voter,
          actionId,
          vote: Vote.yes,
          redeemer: scriptVote.redeemer(GOVERNANCE_REDEEMER - 1n),
        })
        .complete();
    } catch {
      rejectedInvalidRedeemer = true;
    }
    if (!rejectedInvalidRedeemer) {
      throw new Error("Expected the PlutusV3 script to reject the wrong redeemer");
    }
    logStep("9. script rejected vote with the wrong redeemer");

    const voteTx = await wallet
      .newTransaction()
      .provideScript(scriptVote.Script)
      .addVote({
        voter,
        actionId,
        vote: Vote.yes,
        redeemer: scriptVote.redeemer(GOVERNANCE_REDEEMER),
      })
      .complete();
    const voteTxHash = await signAndSubmit(voteTx, wallet);
    emulator.awaitTransactionConfirmation(voteTxHash);
    logStep(`10. script accepted DRep yes vote: tx=${voteTxHash}`);

    emulator.stepForwardToNextEpoch();
    const status = emulator.getGovernanceProposalStatus(actionId);
    logStep(`11. advanced to epoch=${emulator.clock.epoch}: status=${status}`);
    logStep(`12. final minFeeConstant=${emulator.params.minFeeConstant}`);

    if (status !== "Enacted") {
      throw new Error(`Expected proposal status Enacted, got ${status}`);
    }

    if (emulator.params.minFeeConstant !== newMinFeeConstant) {
      throw new Error(
        `Expected minFeeConstant ${newMinFeeConstant}, got ${emulator.params.minFeeConstant}`,
      );
    }

    logStep("PASS: proposal enacted and protocol state updated");
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
