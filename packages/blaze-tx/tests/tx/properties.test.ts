import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  AssetId,
  AssetName,
  NetworkId,
  Value,
  hardCodedProtocolParams,
  type TransactionBody,
  type TransactionUnspentOutput,
} from "@blaze-cardano/core";
import { TxBuilder, calculateMinAda, makeValue } from "../../src";
import * as value from "../../src/value";
import {
  arbAssetEntries,
  arbPayments,
  arbUtxoSpecs,
  buildUtxos,
  changeAddress,
  policyA,
  policyB,
  recipientAddress,
  type UtxoSpec,
} from "./arbitraries";

const newBuilder = (utxos: TransactionUnspentOutput[]) =>
  new TxBuilder(hardCodedProtocolParams)
    .addUnspentOutputs(utxos)
    .setNetworkId(NetworkId.Testnet)
    .setChangeAddress(changeAddress);

const payAll = (builder: TxBuilder, payments: bigint[]) =>
  payments.reduce(
    (tx, lovelace) => tx.payAssets(recipientAddress, makeValue(lovelace)),
    builder,
  );

const selectedInputValue = (
  body: TransactionBody,
  utxos: TransactionUnspentOutput[],
): Value =>
  value.sum(
    [...body.inputs().values()].map((input) => {
      const match = utxos.find(
        (utxo) =>
          utxo.input().transactionId() === input.transactionId() &&
          utxo.input().index() === input.index(),
      );
      if (!match) throw new Error("selected input not among provided UTxOs");
      return match.output().amount();
    }),
  );

const outputValueAt = (body: TransactionBody, addressBech32: string): Value =>
  value.sum(
    [...body.outputs().values()]
      .filter((output) => output.address().toBech32() === addressBech32)
      .map((output) => output.amount()),
  );

const totalOutputValue = (body: TransactionBody): Value =>
  value.sum([...body.outputs().values()].map((output) => output.amount()));

const expectValueEqual = (a: Value, b: Value) => {
  expect(value.empty(value.sub(a, b))).toBe(true);
};

describe("transaction construction properties", () => {
  it("conserves value: selected inputs equal outputs plus fee", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUtxoSpecs,
        arbPayments,
        async (specs: UtxoSpec[], payments: bigint[]) => {
          const utxos = buildUtxos(specs);
          const tx = await payAll(newBuilder(utxos), payments).complete();
          const body = tx.body();

          expectValueEqual(
            selectedInputValue(body, utxos),
            value.merge(totalOutputValue(body), new Value(body.fee())),
          );
        },
      ),
      { numRuns: 30 },
    );
  });

  it("loses no assets: tokens on selected inputs all arrive at the change address", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUtxoSpecs,
        arbPayments,
        async (specs: UtxoSpec[], payments: bigint[]) => {
          const utxos = buildUtxos(specs);
          const tx = await payAll(newBuilder(utxos), payments).complete();
          const body = tx.body();

          const inputTokens =
            selectedInputValue(body, utxos).multiasset() ??
            new Map<AssetId, bigint>();
          const changeTokens =
            outputValueAt(body, changeAddress.toBech32()).multiasset() ??
            new Map<AssetId, bigint>();

          for (const [asset, quantity] of inputTokens) {
            expect(changeTokens.get(asset)).toBe(quantity);
          }
          expect(changeTokens.size).toBe(inputTokens.size);
        },
      ),
      { numRuns: 30 },
    );
  });

  it("pays the recipient the same total regardless of payment order", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUtxoSpecs,
        arbPayments,
        async (specs: UtxoSpec[], payments: bigint[]) => {
          const forward = await payAll(
            newBuilder(buildUtxos(specs)),
            payments,
          ).complete();
          const reversed = await payAll(
            newBuilder(buildUtxos(specs)),
            [...payments].reverse(),
          ).complete();

          expectValueEqual(
            outputValueAt(forward.body(), recipientAddress.toBech32()),
            outputValueAt(reversed.body(), recipientAddress.toBech32()),
          );
        },
      ),
      { numRuns: 20 },
    );
  });

  it("gives every output at least the required minimum ADA", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUtxoSpecs,
        arbPayments,
        async (specs: UtxoSpec[], payments: bigint[]) => {
          const utxos = buildUtxos(specs);
          const tx = await payAll(newBuilder(utxos), payments).complete();

          for (const output of tx.body().outputs().values()) {
            const minAda = calculateMinAda(
              output,
              hardCodedProtocolParams.coinsPerUtxoByte,
            );
            expect(output.amount().coin()).toBeGreaterThanOrEqual(minAda);
          }
        },
      ),
      { numRuns: 30 },
    );
  });

  it("pays at least the minimum fee for the final transaction size", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUtxoSpecs,
        arbPayments,
        async (specs: UtxoSpec[], payments: bigint[]) => {
          const utxos = buildUtxos(specs);
          const tx = await payAll(newBuilder(utxos), payments).complete();

          const sizeBytes = BigInt(tx.toCbor().length / 2);
          const minimumFee =
            BigInt(hardCodedProtocolParams.minFeeConstant) +
            BigInt(hardCodedProtocolParams.minFeeCoefficient) * sizeBytes;
          expect(tx.body().fee()).toBeGreaterThanOrEqual(minimumFee);
        },
      ),
      { numRuns: 30 },
    );
  });

  it("builds deterministically: the same scenario twice yields identical bytes", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUtxoSpecs,
        arbPayments,
        async (specs: UtxoSpec[], payments: bigint[]) => {
          const first = await payAll(
            newBuilder(buildUtxos(specs)),
            payments,
          ).complete();
          const second = await payAll(
            newBuilder(buildUtxos(specs)),
            payments,
          ).complete();

          expect(second.toCbor()).toBe(first.toCbor());
        },
      ),
      { numRuns: 20 },
    );
  });

  it("records mints positive and burns negative, and nothing else", () => {
    fc.assert(
      fc.property(
        arbAssetEntries,
        arbAssetEntries,
        (minted: Map<AssetName, bigint>, burned: Map<AssetName, bigint>) => {
          const tx = new TxBuilder(hardCodedProtocolParams);
          if (minted.size > 0) tx.mintAssets(policyA, minted);
          if (burned.size > 0) tx.burnAssets(policyB, burned);

          const mint = tx["body"].mint() ?? new Map<AssetId, bigint>();
          for (const [name, quantity] of minted) {
            expect(mint.get(AssetId.fromParts(policyA, name))).toBe(quantity);
          }
          for (const [name, quantity] of burned) {
            expect(mint.get(AssetId.fromParts(policyB, name))).toBe(-quantity);
          }
          expect(mint.size).toBe(minted.size + burned.size);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("rejects a second mint or burn on a policy already used in the transaction", () => {
    fc.assert(
      fc.property(
        arbAssetEntries.filter((entries) => entries.size > 0),
        (entries: Map<AssetName, bigint>) => {
          const tx = new TxBuilder(hardCodedProtocolParams).mintAssets(
            policyA,
            entries,
          );
          expect(() => tx.burnAssets(policyA, entries)).toThrow(
            /duplicate policy/i,
          );
        },
      ),
      { numRuns: 50 },
    );
  });
});
