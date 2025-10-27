import { Bench } from "tinybench";
import type { Bip32PrivateKeyHex } from "@blaze-cardano/core";
import {
  Address,
  Credential,
  CredentialType,
  NetworkId,
  RewardAccount,
  TransactionInput,
  TransactionUnspentOutput,
  TransactionOutput,
  addressFromCredential,
  Ed25519KeyHashHex,
  DRep,
  ProposalProcedure,
  VotingProcedures,
  VotingProcedure,
  Voter,
  Vote,
  hardCodedProtocolParams,
  GovernanceActionId,
  TransactionId,
  Hash32ByteBase16,
} from "@blaze-cardano/core";
import { Blaze, makeValue } from "@blaze-cardano/sdk";
import { HotWallet } from "@blaze-cardano/wallet";
import { Emulator } from "../src/emulator";
import { EmulatorProvider } from "../src/provider";
import {
  alwaysTrueScript,
  generateAccount,
  generateGenesisOutputs,
  ONE_PLUTUS_DATA,
  signAndSubmit,
  VOID_PLUTUS_DATA,
} from "../test/util/index";

type AccountFixture = {
  address: Address;
  masterkeyHex: Bip32PrivateKeyHex;
};

const baseAccountsPromise = Promise.all<AccountFixture>([
  generateAccount(),
  generateAccount(),
]) as Promise<[AccountFixture, AccountFixture]>;

const bench = new Bench({
  name: "Blaze Emulator Benchmarks",
  iterations: 3,
  warmupIterations: 1,
});

const ensure = <T>(value: T | undefined, message: string): T => {
  if (!value) {
    throw new Error(message);
  }
  return value;
};

async function createWalletEnvironment() {
  const [accountA, accountB] = await baseAccountsPromise;
  const emulator = new Emulator([
    ...generateGenesisOutputs(accountA.address),
    ...generateGenesisOutputs(accountB.address),
  ]);
  const provider = new EmulatorProvider(emulator);
  const walletA = await HotWallet.fromMasterkey(accountA.masterkeyHex, provider);
  const walletB = await HotWallet.fromMasterkey(accountB.masterkeyHex, provider);
  const blaze = await Blaze.from(provider, walletA);
  return { emulator, provider, walletA, walletB, blaze };
}

async function registerMockWalletScenario() {
  const emulator = new Emulator([]);
  await emulator.register("bench", makeValue(100_000_000n));
  await emulator.as("bench", async () => undefined);
}

async function simplePaymentScenario() {
  const { emulator, walletB, blaze } = await createWalletEnvironment();
  const tx = await blaze
    .newTransaction()
    .payLovelace(walletB.address, 2_000_000n)
    .complete();
  const txHash = await signAndSubmit(tx, blaze);
  emulator.awaitTransactionConfirmation(txHash);
}

async function scriptRoundTripScenario() {
  const { emulator, walletB, blaze } = await createWalletEnvironment();
  const scriptAddress = addressFromCredential(
    NetworkId.Testnet,
    Credential.fromCore({
      type: CredentialType.ScriptHash,
      hash: alwaysTrueScript.hash(),
    }),
  );
  const lockTx = await blaze
    .newTransaction()
    .lockAssets(scriptAddress, makeValue(2_000_000n), ONE_PLUTUS_DATA)
    .complete();
  const lockHash = await signAndSubmit(lockTx, blaze);
  emulator.awaitTransactionConfirmation(lockHash);

  const scriptInput = new TransactionInput(lockHash, 0n);
  const scriptOutput = ensure(
    emulator.getOutput(scriptInput),
    "expected script output",
  );

  const spendTx = await blaze
    .newTransaction()
    .addInput(
      new TransactionUnspentOutput(scriptInput, scriptOutput),
      VOID_PLUTUS_DATA,
    )
    .payLovelace(walletB.address, 1_500_000n)
    .provideScript(alwaysTrueScript)
    .complete();
  const spendHash = await signAndSubmit(spendTx, blaze);
  emulator.awaitTransactionConfirmation(spendHash);
}

async function governanceParameterChangeScenario() {
  const [account] = await baseAccountsPromise;
  const faucetOutputs = Array.from({ length: 4 }, () =>
    new TransactionOutput(account.address, makeValue(50_000_000_000n)),
  );
  const emulator = new Emulator([
    ...generateGenesisOutputs(account.address),
    ...faucetOutputs,
  ]);
  emulator.bootstrapMode = false;
  const provider = new EmulatorProvider(emulator);
  const wallet = await HotWallet.fromMasterkey(account.masterkeyHex, provider);
  const blaze = await Blaze.from(provider, wallet);

  const stakeCred = wallet.address.getProps().delegationPart!;
  const stakeCredential = Credential.fromCore(stakeCred);

  const registrationTx = await blaze
    .newTransaction()
    .addRegisterStake(stakeCredential)
    .addRegisterDRep(stakeCredential, 0n)
    .complete();
  const registrationHash = await signAndSubmit(registrationTx, blaze, true);
  emulator.awaitTransactionConfirmation(registrationHash);

  const rewardAccount = RewardAccount.fromCredential(
    stakeCred,
    NetworkId.Testnet,
  );
  const accountState = ensure(
    emulator.accounts.get(rewardAccount),
    "expected reward account",
  );
  accountState.balance = 1_000_000_000n;
  accountState.drep = DRep.newKeyHash(Ed25519KeyHashHex(stakeCred.hash));

  emulator.stepForwardToNextEpoch();

  const newConstant = hardCodedProtocolParams.minFeeConstant! + 10;
  const procedure = ProposalProcedure.fromCore({
    deposit: BigInt(hardCodedProtocolParams.governanceActionDeposit!),
    rewardAccount,
    governanceAction: {
      // @ts-expect-error - GovernanceActionType is not exported
      __typename: "parameter_change_action",
      governanceActionId: null,
      protocolParamUpdate: { minFeeConstant: newConstant },
      policyHash: emulator.constitution.scriptHash,
    },
    anchor: {
      url: "ipfs://bench-parameter-change",
      dataHash: Hash32ByteBase16("".padStart(64, "0")),
    },
  });

  const actionId = await submitProposal(blaze, emulator, procedure);

  const procedures = new VotingProcedures();
  const voter = Voter.newDrep(stakeCredential.toCore());
  procedures.insert(voter, actionId, new VotingProcedure(Vote.yes));

  const voteTx = await blaze
    .newTransaction()
    .setVotingProcedures(procedures)
    .addRequiredSigner(Ed25519KeyHashHex(stakeCred.hash))
    .complete();
  const voteHash = await signAndSubmit(voteTx, blaze, true);
  emulator.awaitTransactionConfirmation(voteHash);

  emulator.stepForwardToNextEpoch();
}

async function submitProposal(
  blaze: Blaze<EmulatorProvider, HotWallet>,
  emulator: Emulator,
  procedure: ProposalProcedure,
): Promise<GovernanceActionId> {
  const tx = await blaze.newTransaction().addProposal(procedure).complete();
  const hash = await signAndSubmit(tx, blaze);
  emulator.awaitTransactionConfirmation(hash);
  return new GovernanceActionId(TransactionId(hash), 0n);
}

bench
  .add("register mocked wallet", registerMockWalletScenario)
  .add("simple payment", simplePaymentScenario)
  .add("script lock -> spend", scriptRoundTripScenario)
  .add(
    "parameter change governance flow",
    governanceParameterChangeScenario,
  );

async function main() {
  await bench.run();
  console.log(`\n${bench.name}`);
  console.table(bench.table());
  for (const task of bench.tasks) {
    if (task.result?.error) {
      console.error(`Task ${task.name} failed:`, task.result.error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
