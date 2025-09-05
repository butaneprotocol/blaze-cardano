import type { Bip32PrivateKeyHex, Address } from "@blaze-cardano/core";
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
} from "@blaze-cardano/core";
import { HotWallet } from "@blaze-cardano/wallet";
import { Emulator, EmulatorProvider } from "../src";
import {
  ONE_PLUTUS_DATA,
  VOID_PLUTUS_DATA,
  alwaysTrueScript,
  generateAccount,
  generateGenesisOutputs,
  signAndSubmit,
} from "./util";
import { Blaze, Core, makeValue } from "@blaze-cardano/sdk";

function isDefined<T>(value: T | undefined): asserts value is T {
  expect(value).toBeDefined();
}

describe("Emulator", () => {
  let emulator: Emulator;
  let masterkeyHex1: Bip32PrivateKeyHex;
  let address1: Address;
  let wallet1: HotWallet;
  let masterkeyHex2: Bip32PrivateKeyHex;
  let address2: Address;
  let wallet2: HotWallet;
  let blaze: Blaze<EmulatorProvider, HotWallet>;
  let provider: EmulatorProvider;

  beforeAll(async () => {
    ({ address: address1, masterkeyHex: masterkeyHex1 } =
      await generateAccount());
    ({ address: address2, masterkeyHex: masterkeyHex2 } =
      await generateAccount());
  });

  beforeEach(async () => {
    emulator = new Emulator([
      ...generateGenesisOutputs(address1),
      ...generateGenesisOutputs(address2),
    ]);
    provider = new EmulatorProvider(emulator);
    wallet1 = await HotWallet.fromMasterkey(masterkeyHex1, provider);
    wallet2 = await HotWallet.fromMasterkey(masterkeyHex2, provider);
    blaze = await Blaze.from(provider, wallet1);
  });

  test("Should be able to get a genesis UTxO", async () => {
    const inp = new TransactionInput(TransactionId("00".repeat(32)), 0n);
    const out = emulator.getOutput(inp);
    isDefined(out);
    expect(out.address()).toEqual<Address>(wallet1.address);
    expect(out?.amount().coin()).toEqual(1_000_000_000n);
  });

  test("Should be able to pay from one wallet to another", async () => {
    const tx = await blaze
      .newTransaction()
      .payLovelace(wallet2.address, 2_000_000_000n)
      .complete();
    const txHash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(txHash);
    const out = emulator.getOutput(new TransactionInput(txHash, 0n));
    isDefined(out);
    expect(out.address()).toEqual(wallet2.address);
    expect(out.amount().coin()).toEqual(2_000_000_000n);
  });

  test("Should be able to spend from a script only", async () => {
    const tx = await blaze
      .newTransaction()
      .lockAssets(
        addressFromCredential(
          NetworkId.Testnet,
          Credential.fromCore({
            type: CredentialType.ScriptHash,
            hash: alwaysTrueScript.hash(),
          })
        ),
        makeValue(1_000_000_000n),
        ONE_PLUTUS_DATA
      )
      .complete();
    const txHash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(txHash);
    const inp = new TransactionInput(txHash, 0n);
    const out = emulator.getOutput(inp);
    isDefined(out);
    isDefined(out.datum());
    const spendTx = await blaze
      .newTransaction()
      .addInput(new TransactionUnspentOutput(inp, out), VOID_PLUTUS_DATA)
      .lockAssets(
        addressFromCredential(
          NetworkId.Testnet,
          Credential.fromCore({
            type: CredentialType.ScriptHash,
            hash: alwaysTrueScript.hash(),
          })
        ),
        makeValue(1_000_000_000n),
        ONE_PLUTUS_DATA
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
    const refTx = await blaze
      .newTransaction()
      .deployScript(alwaysTrueScript)
      .complete();
    const refTxHash = await signAndSubmit(refTx, blaze);
    emulator.awaitTransactionConfirmation(refTxHash);
    const refUtxo = await provider.resolveScriptRef(alwaysTrueScript);
    isDefined(refUtxo);
    // const refIn = new TransactionInput(refTxHash, 0n);
    // const refUtxo = new TransactionUnspentOutput(
    //   refIn,
    //   emulator.getOutput(refIn)!
    // );
    const tx = await blaze
      .newTransaction()
      .lockAssets(
        addressFromCredential(
          NetworkId.Testnet,
          Credential.fromCore({
            type: CredentialType.ScriptHash,
            hash: alwaysTrueScript.hash(),
          })
        ),
        makeValue(1_000_000_000n),
        ONE_PLUTUS_DATA
      )
      .complete();

    const txHash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(txHash);
    const inp = new TransactionInput(txHash, 0n);
    const out = emulator.getOutput(inp);

    isDefined(out);

    const spendTx = await blaze
      .newTransaction()
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
      })
    );

    const tx = await blaze
      .newTransaction()
      .lockAssets(
        addr,
        makeValue(1_000_000_000n),
        ONE_PLUTUS_DATA,
        alwaysTrueScript
      )
      .complete();

    const txHash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(txHash);
    const inp = new TransactionInput(txHash, 0n);
    const out = emulator.getOutput(inp);

    isDefined(out);

    const spendTx = await blaze
      .newTransaction()
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
    const tx = await blaze
      .newTransaction()
      .addMint(policy, new Map([[AssetName(""), 1n]]), VOID_PLUTUS_DATA)
      .provideScript(alwaysTrueScript)
      .complete();
    const txHash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(txHash);
    const out = emulator.getOutput(new TransactionInput(txHash, 0n));
    isDefined(out);
    expect(out.amount().multiasset()?.get(AssetId(policy))).toEqual(1n);
  });

  test("Should be able to register stake for a script", async () => {
    const cred = {
      hash: alwaysTrueScript.hash(),
      type: CredentialType.ScriptHash,
    };
    const rewardAccount = RewardAccount.fromCredential(cred, NetworkId.Testnet);
    expect(emulator.accounts).not.toHaveProperty(rewardAccount);

    const tx = await blaze
      .newTransaction()
      .addRegisterStake(Credential.fromCore(cred))
      .complete();

    const txHash = await signAndSubmit(tx, blaze);
    emulator.awaitTransactionConfirmation(txHash);

    expect(emulator.accounts.get(rewardAccount)).toEqual({ balance: 0n });
  });

  test("Should be able to withdraw from a script", async () => {
    const rewardAccount = RewardAccount.fromCredential(
      {
        hash: alwaysTrueScript.hash(),
        type: CredentialType.ScriptHash,
      },
      NetworkId.Testnet
    );

    emulator.accounts.set(rewardAccount, { balance: 10_000_000n });
    const tx = await blaze
      .newTransaction()
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

  test("Should not be able to spend if inputs/outputs are not balanced", async () => {
    const { address, masterkeyHex } = await generateAccount();
    const mockWallet = await HotWallet.fromMasterkey(masterkeyHex, provider);

    const mockUtxo = Core.TransactionUnspentOutput.fromCore([
      Core.TransactionInput.fromCore({
        index: 0,
        txId: Core.TransactionId("1".repeat(64)),
      }).toCore(),
      Core.TransactionOutput.fromCore({
        address: Core.PaymentAddress(address.toBech32()),
        value: makeValue(4_000_000n).toCore(),
      }).toCore(),
    ]);

    emulator.addUtxo(mockUtxo);

    blaze = await Blaze.from(provider, mockWallet);

    const tx = await blaze
      .newTransaction()
      .provideScript(alwaysTrueScript)
      .addInput(mockUtxo)
      .addMint(
        Core.PolicyId(alwaysTrueScript.hash()),
        new Map([[Core.AssetName("545450726576696577"), 1n]]),
        VOID_PLUTUS_DATA
      )
      .provideCollateral([mockUtxo])
      .payAssets(
        Core.Address.fromBech32(
          "addr_test1qq82re4ttqrnpnuyqp03fazf8psgckvwlj6482g8pcaeqgr5rr4au7zr2g79y6ggwm7l4hv6jqtzcy758gpu8ez69kwsc40mlq"
        ),
        makeValue(2_000_000n)
      )
      .payAssets(
        Core.Address.fromBech32(
          "addr_test1qq82re4ttqrnpnuyqp03fazf8psgckvwlj6482g8pcaeqgr5rr4au7zr2g79y6ggwm7l4hv6jqtzcy758gpu8ez69kwsc40mlq"
        ),
        makeValue(2_000_000n)
      )
      .complete({ useCoinSelection: false });

    expect(signAndSubmit(tx, blaze)).rejects.toThrowErrorMatchingSnapshot();
  });
});
