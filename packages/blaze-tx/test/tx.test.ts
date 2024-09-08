import {
  Address,
  hardCodedProtocolParams,
  NetworkId,
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

const ASSET_NAME_1 = "ab".repeat(56 / 2);
const ASSET_NAME_2 = "cd".repeat(56 / 2);
// const ASSET_NAME_3 = "ef".repeat(56/2)

describe("Transaction Building", () => {
  it("A complex transaction should balance correctly", async () => {
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
});
