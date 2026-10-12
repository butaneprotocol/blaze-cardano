import { describe, it, expect } from "vitest";
import {
  Address,
  AssetName,
  Credential,
  CredentialType,
  Datum,
  hardCodedProtocolParams,
  HexBlob,
  NetworkId,
  PlutusV2Script,
  PolicyId,
  Script,
  Transaction,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  addressFromCredential,
} from "@blaze-cardano/core";
import { makeUplcEvaluator } from "@blaze-cardano/vm";
import { Void } from "@blaze-cardano/data";
import * as value from "../../src/value";
import { TxBuilder } from "../../src/TxBuilder";

/**
 * Collateral must cover `collateralPercentage` of the transaction's final fee
 * (the ledger's feesOK rule, also enforced by the emulator). Until the scripts
 * are evaluated, every redeemer carries the per-transaction maximum budget as a
 * placeholder, so a fee computed before evaluation is far above the final one
 * and must not be used to size or select collateral.
 */

const walletAddress = Address.fromBech32(
  "addr1q86ylp637q7hv7a9r387nz8d9zdhem2v06pjyg75fvcmen3rg8t4q3f80r56p93xqzhcup0w7e5heq7lnayjzqau3dfs7yrls5",
);

const alwaysTrueScript = Script.newPlutusV2Script(
  new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
);
const scriptAddress = addressFromCredential(
  NetworkId.Mainnet,
  Credential.fromCore({
    hash: alwaysTrueScript.hash(),
    type: CredentialType.ScriptHash,
  }),
);

let nextId = 0;
function utxoAt(address: Address, lovelace: bigint) {
  return new TransactionUnspentOutput(
    new TransactionInput(
      TransactionId((nextId++).toString(16).padStart(64, "0")),
      0n,
    ),
    new TransactionOutput(address, value.makeValue(lovelace)),
  );
}

function lockedAtScript(lovelace: bigint) {
  const utxo = utxoAt(scriptAddress, lovelace);
  utxo.output().setDatum(Datum.newInlineData(Void()));
  return utxo;
}

function newBuilder() {
  return new TxBuilder(hardCodedProtocolParams)
    .setNetworkId(NetworkId.Testnet)
    .setChangeAddress(walletAddress)
    .useEvaluator(makeUplcEvaluator(hardCodedProtocolParams, 1, 1))
    .provideScript(alwaysTrueScript);
}

/** Lovelace the collateral actually puts up: its inputs less the collateral return. */
function collateralBalance(tx: Transaction, utxos: TransactionUnspentOutput[]) {
  const inputs = tx.body().collateral()?.values() ?? [];
  const total = inputs.reduce((sum, input) => {
    const utxo = utxos.find(
      (u) =>
        u.input().transactionId() === input.transactionId() &&
        u.input().index() === input.index(),
    );
    if (!utxo) throw new Error("collateral input is not a known UTxO");
    return sum + utxo.output().amount().coin();
  }, 0n);
  return total - (tx.body().collateralReturn()?.amount().coin() ?? 0n);
}

function minimumCollateral(tx: Transaction) {
  return BigInt(
    Math.ceil(
      (hardCodedProtocolParams.collateralPercentage / 100) *
        Number(tx.body().fee()),
    ),
  );
}

describe("collateral sizing", () => {
  it("covers the evaluated fee when the first pass has nothing to evaluate", async () => {
    // A mint and nothing else: on the first pass there are no inputs, so the
    // scripts are not evaluated and the fee still carries the placeholder
    // budget (about 2.5 ADA of collateral at 150%). The wallet's one UTxO
    // holds 3 ADA, far more than the transaction needs once evaluated.
    const wallet = [utxoAt(walletAddress, 3_000_000n)];
    const tx = await newBuilder()
      .addUnspentOutputs(wallet)
      .addMint(
        PolicyId(alwaysTrueScript.hash()),
        new Map([[AssetName("74657374"), 1n]]),
        Void(),
      )
      .complete();

    expect(tx.body().collateral()?.values()).toHaveLength(1);
    expect(tx.body().totalCollateral()).toBe(minimumCollateral(tx));
    expect(collateralBalance(tx, wallet)).toBeGreaterThanOrEqual(
      minimumCollateral(tx),
    );
  });

  it("keeps the provided collateral when the placeholder budget would exceed it", async () => {
    // Three script spends with no explicit outputs: the first pass skips
    // evaluation, and three placeholder budgets put the estimated collateral
    // above the 5 ADA the wallet set aside, though the evaluated transaction
    // needs well under 1 ADA. The wallet's chosen collateral must be used.
    const collateral = utxoAt(walletAddress, 5_000_000n);
    const scriptUtxos = [
      lockedAtScript(10_000_000n),
      lockedAtScript(10_000_000n),
      lockedAtScript(10_000_000n),
    ];
    const wallet = [utxoAt(walletAddress, 10_000_000_000n)];

    const builder = newBuilder()
      .addUnspentOutputs([...wallet, ...scriptUtxos])
      .provideCollateral([collateral]);
    for (const utxo of scriptUtxos) builder.addInput(utxo, Void());
    const tx = await builder.complete();

    const [used] = tx.body().collateral()?.values() ?? [];
    expect(used?.transactionId()).toBe(collateral.input().transactionId());
    expect(collateralBalance(tx, [collateral])).toBeGreaterThanOrEqual(
      minimumCollateral(tx),
    );
  });

  it("still rejects a wallet that cannot cover the evaluated collateral", async () => {
    // The script UTxO pays the fee, but the only key-locked UTxO is too small
    // to leave a valid collateral return once even the evaluated collateral
    // is taken from it.
    const scriptUtxo = lockedAtScript(20_000_000n);
    const tx = newBuilder()
      .addUnspentOutputs([utxoAt(walletAddress, 1_000_000n), scriptUtxo])
      .addInput(scriptUtxo, Void());

    await expect(tx.complete()).rejects.toThrow(
      /prepareCollateral: no inputs are sufficient/,
    );
  });
});
