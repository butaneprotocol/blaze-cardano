import type { Ed25519PrivateNormalKeyHex, Address } from "@blaze-cardano/core";
import {
  NetworkId,
  TransactionInput,
  TransactionId,
  PolicyId,
  AssetName,
  AssetId,
  addressFromCredential,
  Credential,
  CredentialType,
  TransactionUnspentOutput,
  RewardAccount,
  RewardAddress,
} from "@blaze-cardano/core";
import { HotWallet } from "@blaze-cardano/wallet";
import { Emulator, EmulatorProvider } from "../src";
import {
  DEPLOYMENT_ADDR,
  ONE_PLUTUS_DATA,
  VOID_PLUTUS_DATA,
  alwaysTrueScript,
  generateAccount,
  generateGenesisOutputs,
  signAndSubmit,
} from "./util";
import { Blaze, makeValue } from "@blaze-cardano/sdk";

function isDefined<T>(value: T | undefined): asserts value is T {
  expect(value).toBeDefined();
}

describe("Emulator", () => {
  let emulator: Emulator;
  let privateKeyHex1: Ed25519PrivateNormalKeyHex;
  let address1: Address;
  let wallet1: HotWallet;
  let privateKeyHex2: Ed25519PrivateNormalKeyHex;
  let address2: Address;
  let wallet2: HotWallet;
  let blaze: Blaze<EmulatorProvider, HotWallet>;
  let provider: EmulatorProvider;

  beforeAll(async () => {
    ({ address: address1, privateKeyHex: privateKeyHex1 } =
      await generateAccount());
    ({ address: address2, privateKeyHex: privateKeyHex2 } =
      await generateAccount());
  });

  beforeEach(() => {
    emulator = new Emulator([
      ...generateGenesisOutputs(address1),
      ...generateGenesisOutputs(address2),
    ]);
    provider = new EmulatorProvider(emulator);
    wallet1 = new HotWallet(privateKeyHex1, NetworkId.Testnet, provider);
    wallet2 = new HotWallet(privateKeyHex2, NetworkId.Testnet, provider);
    blaze = new Blaze(provider, wallet1);
  });

  test("Should be able to get a genesis UTxO", async () => {
    const inp = new TransactionInput(TransactionId("00".repeat(32)), 0n);
    const out = emulator.getOutput(inp);
    isDefined(out);
    expect(out.address()).toEqual<Address>(wallet1.address);
    expect(out?.amount().coin()).toEqual(1_000_000_000n);
  });

  test("Should be able to pay from one wallet to another", async () => {
    const tx = await (await blaze.newTransaction())
      .payLovelace(wallet2.address, 2_000_000_000n)
      .complete();
    const txHash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(txHash);
    const out = emulator.getOutput(new TransactionInput(txHash, 0n));
    isDefined(out);
    expect(out.address()).toEqual(wallet2.address);
    expect(out.amount().coin()).toEqual(2_000_000_000n);
  });

  test("Should be able to spend from a script", async () => {
    const tx = await (
      await blaze.newTransaction()
    )
      .lockAssets(
        addressFromCredential(
          NetworkId.Testnet,
          Credential.fromCore({
            type: CredentialType.ScriptHash,
            hash: alwaysTrueScript.hash(),
          }),
        ),
        makeValue(1_000_000_000n),
        ONE_PLUTUS_DATA,
      )
      .complete();
    const txHash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(txHash);
    const inp = new TransactionInput(txHash, 0n);
    const out = emulator.getOutput(inp);
    isDefined(out);
    isDefined(out.datum());
    const spendTx = await (
      await blaze.newTransaction()
    )
      .addInput(new TransactionUnspentOutput(inp, out), VOID_PLUTUS_DATA)
      .lockAssets(
        addressFromCredential(
          NetworkId.Testnet,
          Credential.fromCore({
            type: CredentialType.ScriptHash,
            hash: alwaysTrueScript.hash(),
          }),
        ),
        makeValue(1_000_000_000n),
        ONE_PLUTUS_DATA,
      )
      .provideScript(alwaysTrueScript)
      .complete();
    const spendTxHash = await signAndSubmit(spendTx, blaze);
    emulator.awaitTransactionConfirmation(spendTxHash);
    const out2 = emulator.getOutput(new TransactionInput(spendTxHash, 0n));
    isDefined(out2);
    expect(out2.address()).toEqual(wallet1.address);
  });

  test("Should be able to spend from a script with a reference input", async () => {
    const refTx = await (await blaze.newTransaction())
      .lockAssets(
        DEPLOYMENT_ADDR,
        makeValue(1_000_000_000n),
        ONE_PLUTUS_DATA,
        alwaysTrueScript,
      )
      .complete();
    const refTxHash = await signAndSubmit(refTx, blaze);
    emulator.awaitTransactionConfirmation(refTxHash);
    const refIn = new TransactionInput(refTxHash, 0n);
    const refUtxo = new TransactionUnspentOutput(
      refIn,
      emulator.getOutput(refIn)!,
    );

    const tx = await (
      await blaze.newTransaction()
    )
      .lockAssets(
        addressFromCredential(
          NetworkId.Testnet,
          Credential.fromCore({
            type: CredentialType.ScriptHash,
            hash: alwaysTrueScript.hash(),
          }),
        ),
        makeValue(1_000_000_000n),
        ONE_PLUTUS_DATA,
      )
      .complete();

    const txHash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(txHash);
    const inp = new TransactionInput(txHash, 0n);
    const out = emulator.getOutput(inp);

    isDefined(out);

    const spendTx = await (await blaze.newTransaction())
      .addInput(new TransactionUnspentOutput(inp, out), VOID_PLUTUS_DATA)
      .addReferenceInput(refUtxo)
      .complete();
    const spendTxHash = await signAndSubmit(spendTx, blaze);
    emulator.awaitTransactionConfirmation(spendTxHash);
    const out2 = emulator.getOutput(new TransactionInput(spendTxHash, 0n));
    isDefined(out2);
    expect(out2.address()).toEqual(wallet1.address);
  });

  test("Should be able to spend a UTxO with a self-reference script", async () => {
    const addr = addressFromCredential(
      NetworkId.Testnet,
      Credential.fromCore({
        type: CredentialType.ScriptHash,
        hash: alwaysTrueScript.hash(),
      }),
    );

    const tx = await (await blaze.newTransaction())
      .lockAssets(
        addr,
        makeValue(1_000_000_000n),
        ONE_PLUTUS_DATA,
        alwaysTrueScript,
      )
      .complete();

    const txHash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(txHash);
    const inp = new TransactionInput(txHash, 0n);
    const out = emulator.getOutput(inp);

    isDefined(out);

    const spendTx = await (await blaze.newTransaction())
      .addInput(new TransactionUnspentOutput(inp, out), VOID_PLUTUS_DATA)
      .complete();
    const spendTxHash = await signAndSubmit(spendTx, blaze);
    emulator.awaitTransactionConfirmation(spendTxHash);
    const out2 = emulator.getOutput(new TransactionInput(spendTxHash, 0n));
    isDefined(out2);
    expect(out2.address()).toEqual(wallet1.address);
  });

  test("Should be able to mint from a policy", async () => {
    const policy = PolicyId(alwaysTrueScript.hash());
    const tx = await (
      await blaze.newTransaction()
    )
      .addMint(policy, new Map([[AssetName(""), 1n]]), VOID_PLUTUS_DATA)
      .provideScript(alwaysTrueScript)
      .complete();
    const txHash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(txHash);
    const out = emulator.getOutput(new TransactionInput(txHash, 0n));
    isDefined(out);
    expect(out.amount().multiasset()?.get(AssetId(policy))).toEqual(1n);
  });

  test("Should be able to withdraw from a script", async () => {
    const rewardAddr = RewardAddress.fromCredentials(NetworkId.Testnet, {
      hash: alwaysTrueScript.hash(),
      type: CredentialType.ScriptHash,
    });
    const rewardAccount = RewardAccount(rewardAddr.toAddress().toBech32());

    emulator.accounts.set(rewardAccount, 10_000_000n);

    const tx = await (
      await blaze.newTransaction()
    )
      .addWithdrawal(rewardAccount, 10_000_000n, VOID_PLUTUS_DATA)
      .provideScript(alwaysTrueScript)
      // TODO: fix coin selection so you don't have to do this
      .addInput((await wallet1.getUnspentOutputs())[0]!)
      .complete();

    const txHash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(txHash);
    const out = emulator.getOutput(new TransactionInput(txHash, 0n));
    isDefined(out);
    expect(out.address()).toEqual(wallet1.address);
  });
});
