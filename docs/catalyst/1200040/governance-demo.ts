import {
  Address,
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
  Transaction,
  TransactionId,
  Vote,
  Voter,
  VotingProcedure,
  VotingProcedures,
  hardCodedProtocolParams,
  type CommitteeMember,
  type CredentialCore,
} from "@blaze-cardano/core";
import { Blaze, makeValue, type Provider } from "@blaze-cardano/sdk";
import { HotWallet } from "@blaze-cardano/wallet";
import { Emulator } from "@blaze-cardano/emulator";

const ZERO_HASH32 = Hash32ByteBase16("".padStart(64, "0"));

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
    const setupTx = await wallet
      .newTransaction()
      .addRegisterStake(stakeCredential)
      .addRegisterDRep(stakeCredential, 0n)
      .complete();
    const setupTxHash = await signAndSubmit(setupTx, wallet, true);
    emulator.awaitTransactionConfirmation(setupTxHash);
    logStep(`4. registered stake credential and DRep: tx=${setupTxHash}`);

    const rewardAccount = RewardAccount.fromCredential(
      stakeCred,
      NetworkId.Testnet,
    );
    const account = emulator.accounts.get(rewardAccount);
    if (!account) {
      throw new Error(`Missing reward account ${rewardAccount}`);
    }
    account.balance = 1_000_000_000n;
    account.drep = DRep.newKeyHash(Ed25519KeyHashHex(stakeCred.hash));
    logStep(`   delegated voting stake: rewardAccount=${rewardAccount}`);

    emulator.stepForwardToNextEpoch();
    logStep(`5. DRep voting power snapshotted: epoch=${emulator.clock.epoch}`);

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
        policyHash: emulator.constitution.scriptHash,
      },
      anchor: {
        url: "ipfs://blaze-emulator-governance-demo",
        dataHash: ZERO_HASH32,
      },
    });

    const proposalTx = await wallet
      .newTransaction()
      .addProposal(parameterChange)
      .complete();
    const proposalTxHash = await signAndSubmit(proposalTx, wallet);
    emulator.awaitTransactionConfirmation(proposalTxHash);
    const actionId = new GovernanceActionId(TransactionId(proposalTxHash), 0n);
    const action = actionId.toCore();
    const actionKey = `${action.id}:${BigInt(action.actionIndex)}`;
    logStep(`6. submitted parameter-change proposal: ${actionKey}`);
    logStep(`   payload: minFeeConstant=${newMinFeeConstant}`);

    const votingProcedures = new VotingProcedures();
    votingProcedures.insert(
      Voter.newDrep(Credential.fromCore(stakeCred).toCore()),
      actionId,
      new VotingProcedure(Vote.yes),
    );
    const voteTx = await wallet
      .newTransaction()
      .setVotingProcedures(votingProcedures)
      .addRequiredSigner(Ed25519KeyHashHex(stakeCred.hash))
      .complete();
    const voteTxHash = await signAndSubmit(voteTx, wallet, true);
    emulator.awaitTransactionConfirmation(voteTxHash);
    logStep(`7. submitted DRep yes vote: tx=${voteTxHash}`);

    emulator.stepForwardToNextEpoch();
    const status = emulator.getGovernanceProposalStatus(actionId);
    logStep(`8. advanced to epoch=${emulator.clock.epoch}: status=${status}`);
    logStep(`9. final minFeeConstant=${emulator.params.minFeeConstant}`);

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
