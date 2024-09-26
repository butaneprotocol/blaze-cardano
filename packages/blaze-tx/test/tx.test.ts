import {
  Address,
  hardCodedProtocolParams,
  NetworkId,
  RewardAccount,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  Value,
} from "@blaze-cardano/core";
import * as value from "../src/value";
import { TxBuilder } from "../src/tx";

function flatten<U>(iterator: IterableIterator<U> | undefined): U[] {
  if (!iterator) {
    return [];
  }
  const result: U[] = [];
  for (const item of iterator) {
    result.push(item);
  }
  return result;
}

const ASSETS = Array.from({ length: 1200 }, (_, i) =>
  i
    .toString(16)
    .padStart(2, "0")
    .concat("ef".repeat(56 / 2)),
);

describe("Transaction Building", () => {
  it("A complex transaction should balance correctly", async () => {
    const ASSET_NAME_1 = ASSETS[0]!;
    const ASSET_NAME_2 = ASSETS[1]!;
    // $hosky
    const testAddress = Address.fromBech32(
      "addr1q86ylp637q7hv7a9r387nz8d9zdhem2v06pjyg75fvcmen3rg8t4q3f80r56p93xqzhcup0w7e5heq7lnayjzqau3dfs7yrls5",
    );
    const utxos = [
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("0".repeat(64)), 0n),
        new TransactionOutput(
          testAddress,
          value.makeValue(50_000_000n, [ASSET_NAME_1, 1n], [ASSET_NAME_2, 1n]),
        ),
      ),
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("1".padStart(64, "0")), 0n),
        new TransactionOutput(
          testAddress,
          value.makeValue(40_000_000n, [ASSET_NAME_1, 1n], [ASSET_NAME_2, 1n]),
        ),
      ),
    ];
    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(utxos)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .payAssets(testAddress, value.makeValue(48_708_900n, [ASSET_NAME_1, 1n]))
      .complete();

    const inputValue =
      // value.merge(
      tx
        .body()
        .inputs()
        .values()
        .map((x) =>
          utxos
            .find((y) => y.input().toCbor() == x.toCbor())!
            .output()
            .amount(),
        )
        .reduce(value.merge, value.zero());
    //   ,new Value(
    //     flatten(tx.body().withdrawals()?.values()).reduce((x, y) => x + y, 0n),
    //   ),
    // )

    const outputValue = value.merge(
      flatten(tx.body().outputs().values())
        .map((x) => x.amount())
        .reduce(value.merge, value.zero()),
      new Value(tx.body().fee()),
    );

    console.log("Change: ", tx.body().outputs().at(1)?.amount().coin());

    console.dir(inputValue.toCore(), { depth: null });
    console.dir(outputValue.toCore(), { depth: null });

    // console.dir(tx.toCore(), {depth: null})
    expect(inputValue.toCbor()).toEqual(outputValue.toCbor());
  });

  it("Should correctly balance change for a really big output change", async () => {
    // $hosky
    const testAddress = Address.fromBech32(
      "addr1q86ylp637q7hv7a9r387nz8d9zdhem2v06pjyg75fvcmen3rg8t4q3f80r56p93xqzhcup0w7e5heq7lnayjzqau3dfs7yrls5",
    );
    const utxo1Assets: [string, bigint][] = ASSETS.slice(
      0,
      ASSETS.length / 2,
    ).map((x) => [x, 1n]);
    const utxo2Assets: [string, bigint][] = ASSETS.slice(ASSETS.length / 2).map(
      (x) => [x, 1n],
    );
    const utxos = [
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("0".repeat(64)), 0n),
        new TransactionOutput(
          testAddress,
          value.makeValue(10_000_000_000n, ...utxo1Assets),
        ),
      ),
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("1".padStart(64, "0")), 0n),
        new TransactionOutput(
          testAddress,
          value.makeValue(10_000_000_000n, ...utxo2Assets),
        ),
      ),
    ];
    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(utxos)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .payAssets(
        testAddress,
        value.makeValue(10_001_000_000n, [ASSETS[0]!, 1n]),
      )
      .complete();

    const inputValue =
      // value.merge(
      tx
        .body()
        .inputs()
        .values()
        .map((x) =>
          utxos
            .find((y) => {
              return y.input().toCbor() == x.toCbor();
            })!
            .output()
            .amount(),
        )
        .reduce(value.merge, value.zero());
    //   ,new Value(
    //     flatten(tx.body().withdrawals()?.values()).reduce((x, y) => x + y, 0n),
    //   ),
    // )
    //

    const outputValue = value.merge(
      Array.from(tx.body().outputs().values())
        .map((x) => x.amount())
        .reduce(value.merge, value.zero()),
      new Value(tx.body().fee()),
    );

    console.log("Change: ", tx.body().outputs().at(1)?.amount().coin());

    console.dir(inputValue.toCore(), { depth: null });
    console.dir(outputValue.toCore(), { depth: null });

    expect(inputValue.multiasset()?.size).toEqual(
      outputValue.multiasset()?.size,
    );
    expect(inputValue.toCbor()).toEqual(outputValue.toCbor());
  });

  it("A transaction should always have some inputs", async () => {
    // $hosky
    const testAddress = Address.fromBech32(
      "addr1q86ylp637q7hv7a9r387nz8d9zdhem2v06pjyg75fvcmen3rg8t4q3f80r56p93xqzhcup0w7e5heq7lnayjzqau3dfs7yrls5",
    );
    const utxos = [
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("0".repeat(64)), 0n),
        new TransactionOutput(testAddress, value.makeValue(50_000_000n)),
      ),
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("1".padStart(64, "0")), 0n),
        new TransactionOutput(testAddress, value.makeValue(40_000_000n)),
      ),
    ];
    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(utxos)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .addWithdrawal(
        RewardAccount.fromCredential(
          testAddress.getProps().paymentPart!,
          NetworkId.Testnet,
        ),
        100_000_000n,
      )
      .payAssets(testAddress, value.makeValue(48_708_900n))
      .complete();

    const inputValue = value.merge(
      tx
        .body()
        .inputs()
        .values()
        .map((x) =>
          utxos
            .find((y) => y.input().toCbor() == x.toCbor())!
            .output()
            .amount(),
        )
        .reduce(value.merge, value.zero()),
      value.makeValue(100_000_000n),
    );

    const outputValue = value.merge(
      flatten(tx.body().outputs().values())
        .map((x) => x.amount())
        .reduce(value.merge, value.zero()),
      new Value(tx.body().fee()),
    );
    expect(inputValue.toCbor()).toEqual(outputValue.toCbor());
    expect(tx.body().inputs().values().length).toBeGreaterThan(0);
  });
});
