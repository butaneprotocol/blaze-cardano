import {
  type TokenMap,
  HexBlob,
  PaymentAddress,
  TransactionId,
  TransactionUnspentOutput,
  Value,
  AssetId,
} from "@blaze-cardano/core";
import { createHash } from "node:crypto";
import { hvfSelector, recursive } from "../hvfSelector";
import { sortLargestFirst } from "../../utils";

const sha256 = (input: string) =>
  createHash("sha256").update(input).digest("hex");

const createDummyAssets = (lovelaceAmount: bigint, numAssets: number) => {
  const assets: Value = new Value(lovelaceAmount);
  const multiAsset: TokenMap = new Map();
  for (let i = 0; i < numAssets; i++) {
    const assetId = sha256(i.toString());
    const amount = BigInt(i);
    multiAsset.set(AssetId(assetId), amount);
  }

  assets.setMultiasset(multiAsset);
  return assets;
};

const createDummyUTxO = (
  index: number,
  lovelaceAmount: bigint,
  numAssets: number,
): TransactionUnspentOutput =>
  TransactionUnspentOutput.fromCore([
    {
      index,
      txId: TransactionId.fromHexBlob(HexBlob(sha256(index.toString()))),
    },
    {
      /**
       * @todo Generate a unique dummy address
       */
      // address: PaymentAddress(`addr_test${sha256(index.toString())}`),
      address: PaymentAddress(
        "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
      ),
      value: createDummyAssets(lovelaceAmount, numAssets).toCore(),
      scriptReference: undefined,
    },
  ]);

describe("recursive", () => {
  it("should select largest first , input index_1(9_798_383n) ", async () => {
    const inputs: TransactionUnspentOutput[] = [
      createDummyUTxO(0, 5_000_000n, 0),
      createDummyUTxO(1, 9_798_383n, 0),
      createDummyUTxO(2, 3_662_726n, 7),
    ];
    const program = recursive(sortLargestFirst(inputs), new Value(5_000_000n));

    expect(program.selectedInputs).toEqual([inputs[1]]);
  });
  it("should select largest first, and input index_1(5_000_000n), index_2(3_662_726n)", async () => {
    // console.log(selected);
    const inputs: TransactionUnspentOutput[] = [
      createDummyUTxO(0, 798_383n, 0),
      createDummyUTxO(1, 5_000_000n, 1),
      createDummyUTxO(2, 3_662_726n, 7),
    ];
    const program = recursive(sortLargestFirst(inputs), new Value(5_900_000n));

    expect(program.selectedInputs).toEqual([inputs[1], inputs[2]]);
  });

  it("should select largest first, and input index 1, 0, 2", async () => {
    const inputs: TransactionUnspentOutput[] = [
      createDummyUTxO(0, 798_383n, 0),
      createDummyUTxO(1, 5_000_000n, 0),
      createDummyUTxO(2, 466_272n, 0),
    ];
    const program = recursive(sortLargestFirst(inputs), new Value(5_200_000n));

    expect(program.selectedInputs).toEqual([inputs[1], inputs[0], inputs[2]]);
  });

  it("should select none", async () => {
    const inputs: TransactionUnspentOutput[] = [
      createDummyUTxO(0, 798_383n, 5),
      createDummyUTxO(1, 5_000_000n, 40),
      createDummyUTxO(2, 466_272n, 7),
    ];

    expect(() =>
      recursive(sortLargestFirst(inputs), new Value(5_200_000n)),
    ).toThrow(
      'Your wallet does not have enough funds to cover required minimum ADA for change output: {"coins":"6832057n"}. Or it contains UTxOs with reference scripts; which are excluded from coin selection.',
    );
  });

  it("should select all", async () => {
    const inputs: TransactionUnspentOutput[] = [
      createDummyUTxO(0, 798_383n, 5),
      createDummyUTxO(1, 5_000_000n, 40),
      createDummyUTxO(2, 466_272n, 7),
      createDummyUTxO(3, 1_000_000n, 0),
      createDummyUTxO(4, 1_000_000n, 0),
      createDummyUTxO(5, 1_000_000n, 0),
      createDummyUTxO(6, 1_000_000n, 0),
      createDummyUTxO(7, 1_000_000n, 0),
      createDummyUTxO(8, 1_000_000n, 0),
      createDummyUTxO(9, 905327n, 0),
      createDummyUTxO(10, 781143n, 0),
    ];

    const program = recursive(sortLargestFirst(inputs), new Value(5_200_000n));
    const expectedSelection = [
      inputs[1],
      inputs[3],
      inputs[4],
      inputs[5],
      inputs[6],
      inputs[7],
      inputs[8],
      inputs[9],
      inputs[0],
    ];

    expect(program.selectedInputs).toEqual(expectedSelection);
  });

  it("should select largest first, and input index 0, 2", async () => {
    const inputs: TransactionUnspentOutput[] = [
      createDummyUTxO(0, 798_383n, 0),
      createDummyUTxO(1, 100_000n, 0),
      createDummyUTxO(2, 466_272n, 0),
    ];
    const program = recursive(sortLargestFirst(inputs), new Value(5_000n));
    expect(program.selectedInputs).toEqual([inputs[0], inputs[2]]);
  });
});

describe("hvfSelector", () => {
  it("should consider the estimated fee, and select all", async () => {
    const inputs: TransactionUnspentOutput[] = [
      createDummyUTxO(0, 1_000_000n, 0),
      createDummyUTxO(1, 578_000n, 0),
      createDummyUTxO(2, 10_000n, 0),
    ];
    const program = hvfSelector(
      sortLargestFirst(inputs),
      new Value(600_000n),
      10_000,
    );
    expect(program.selectedInputs).toEqual([inputs[1], inputs[0], inputs[2]]);
  });
});
