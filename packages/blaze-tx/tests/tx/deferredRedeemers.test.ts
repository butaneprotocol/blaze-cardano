import {
  Address,
  Credential,
  CredentialType,
  Datum,
  hardCodedProtocolParams,
  HexBlob,
  NetworkId,
  PlutusData,
  PlutusV2Script,
  Script,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  addressFromCredential,
  RedeemerTag,
} from "@blaze-cardano/core";
import { makeUplcEvaluator } from "@blaze-cardano/vm";
import { Void } from "@blaze-cardano/data";
import * as value from "../../src/value";
import { TxBuilder } from "../../src/TxBuilder";
import type { DeferredRedeemer, RedeemerContext } from "../../src/types";

const testAddress = Address.fromBech32(
  "addr1q86ylp637q7hv7a9r387nz8d9zdhem2v06pjyg75fvcmen3rg8t4q3f80r56p93xqzhcup0w7e5heq7lnayjzqau3dfs7yrls5",
);

const alwaysTrueScript = Script.newPlutusV2Script(
  new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
);

const scriptCred = Credential.fromCore({
  hash: alwaysTrueScript.hash(),
  type: CredentialType.ScriptHash,
});

const scriptAddress = addressFromCredential(NetworkId.Testnet, scriptCred);

function makeScriptUtxo(
  txId: string,
  index: bigint,
  lovelace: bigint,
): TransactionUnspentOutput {
  const utxo = new TransactionUnspentOutput(
    new TransactionInput(TransactionId(txId.padStart(64, "0")), index),
    new TransactionOutput(scriptAddress, value.makeValue(lovelace)),
  );
  utxo.output().setDatum(Datum.newInlineData(Void()));
  return utxo;
}

function makeWalletUtxo(
  txId: string,
  index: bigint,
  lovelace: bigint,
): TransactionUnspentOutput {
  return new TransactionUnspentOutput(
    new TransactionInput(TransactionId(txId.padStart(64, "0")), index),
    new TransactionOutput(testAddress, value.makeValue(lovelace)),
  );
}

describe("Deferred Redeemers", () => {
  it("deferred spend redeemer receives correct ownIndex after coin selection", async () => {
    // Script UTxO with txId starting with "a" — will sort after wallet UTxOs
    // that coin selection adds. Only 5 ADA so we force coin selection.
    const scriptUtxo = makeScriptUtxo("a".repeat(64), 0n, 5_000_000n);

    // Wallet UTxO for coin selection — sorts before the script UTxO ("0" < "a")
    const walletUtxo = makeWalletUtxo("0".repeat(64), 0n, 50_000_000n);

    let capturedContext: RedeemerContext | undefined;

    const deferredRedeemer: DeferredRedeemer = (ctx) => {
      capturedContext = ctx;
      // Return a simple PlutusData encoding the own index
      return PlutusData.newInteger(BigInt(ctx.ownIndex));
    };

    // Pay 10 ADA to force coin selection to add the wallet UTxO
    // (script input only has 5 ADA, need more for output + fee)
    const tx = new TxBuilder(hardCodedProtocolParams)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .useEvaluator(makeUplcEvaluator(hardCodedProtocolParams, 1, 1))
      .addUnspentOutputs([walletUtxo])
      .provideScript(alwaysTrueScript)
      .addInput(scriptUtxo, deferredRedeemer)
      .payAssets(testAddress, value.makeValue(10_000_000n))
      .provideCollateral([walletUtxo]);

    const completedTx = await tx.complete();

    // Verify the deferred redeemer was called
    expect(capturedContext).toBeDefined();

    // The script UTxO txId starts with "a", wallet UTxO txId starts with "0"
    // After coin selection adds the wallet input, it sorts before the script input.
    // So script input should be at index 1 (wallet at 0).
    expect(capturedContext!.ownIndex).toBe(1);

    // Verify sortedSpendInputs has the correct order
    expect(capturedContext!.sortedSpendInputs.length).toBe(2);
    expect(capturedContext!.sortedSpendInputs[0]!.transactionId()).toBe(
      walletUtxo.input().transactionId(),
    );
    expect(capturedContext!.sortedSpendInputs[1]!.transactionId()).toBe(
      scriptUtxo.input().transactionId(),
    );

    // The resolved redeemer data in the tx should be the ownIndex
    const redeemers = completedTx.witnessSet().redeemers();
    expect(redeemers).toBeDefined();
    const spendRedeemers = [...redeemers!.values()].filter(
      (r) => r.tag() === RedeemerTag.Spend,
    );
    expect(spendRedeemers.length).toBe(1);
    // The redeemer data should be an integer equal to the ownIndex
    const redeemerData = spendRedeemers[0]!.data();
    expect(redeemerData.asInteger()).toBe(BigInt(capturedContext!.ownIndex));
  });

  it("deferred redeemer with static redeemer on same tx works", async () => {
    // Two script UTxOs — one with deferred redeemer, one with static
    const scriptUtxo1 = makeScriptUtxo("1".padStart(64, "0"), 0n, 10_000_000n);
    const scriptUtxo2 = makeScriptUtxo("2".padStart(64, "0"), 0n, 10_000_000n);
    const walletUtxo = makeWalletUtxo(
      "f".repeat(64),
      0n,
      50_000_000n,
    );

    let deferredOwnIndex: number | undefined;

    const tx = new TxBuilder(hardCodedProtocolParams)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .useEvaluator(makeUplcEvaluator(hardCodedProtocolParams, 1, 1))
      .addUnspentOutputs([walletUtxo])
      .provideScript(alwaysTrueScript)
      // Static redeemer on first script input
      .addInput(scriptUtxo1, Void())
      // Deferred redeemer on second script input
      .addInput(scriptUtxo2, (ctx) => {
        deferredOwnIndex = ctx.ownIndex;
        return PlutusData.newInteger(BigInt(ctx.ownIndex));
      })
      .provideCollateral([walletUtxo]);

    const completedTx = await tx.complete();

    expect(deferredOwnIndex).toBeDefined();
    // scriptUtxo1 sorts before scriptUtxo2 ("1" < "2")
    // so scriptUtxo2 is at index 1 (or higher if coin selection added an input before it)
    expect(deferredOwnIndex).toBeGreaterThanOrEqual(1);

    // Verify the transaction built successfully
    expect(completedTx.body().inputs().size()).toBeGreaterThanOrEqual(2);
  });

  it("deferred redeemer provides fee in context", async () => {
    const scriptUtxo = makeScriptUtxo("a".repeat(64), 0n, 10_000_000n);
    const walletUtxo = makeWalletUtxo("0".repeat(64), 0n, 50_000_000n);

    let capturedFee: bigint | undefined;

    const tx = new TxBuilder(hardCodedProtocolParams)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .useEvaluator(makeUplcEvaluator(hardCodedProtocolParams, 1, 1))
      .addUnspentOutputs([walletUtxo])
      .provideScript(alwaysTrueScript)
      .addInput(scriptUtxo, (ctx) => {
        capturedFee = ctx.fee;
        return Void();
      })
      .provideCollateral([walletUtxo]);

    const completedTx = await tx.complete();

    // Fee should have been provided and match the final tx fee
    expect(capturedFee).toBeDefined();
    // The final tx fee should be close to what was captured
    // (it converges over iterations, so last call should match)
    expect(completedTx.body().fee()).toBe(capturedFee);
  });

  it("backwards compatible: static PlutusData redeemers still work", async () => {
    const scriptUtxo = makeScriptUtxo("a".repeat(64), 0n, 10_000_000n);
    const walletUtxo = makeWalletUtxo("0".repeat(64), 0n, 50_000_000n);

    const tx = new TxBuilder(hardCodedProtocolParams)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .useEvaluator(makeUplcEvaluator(hardCodedProtocolParams, 1, 1))
      .addUnspentOutputs([walletUtxo])
      .provideScript(alwaysTrueScript)
      .addInput(scriptUtxo, Void())
      .provideCollateral([walletUtxo]);

    const completedTx = await tx.complete();

    // Should have built successfully with static redeemer
    const redeemers = completedTx.witnessSet().redeemers();
    expect(redeemers).toBeDefined();
    expect(redeemers!.size()).toBe(1);
  });
});
