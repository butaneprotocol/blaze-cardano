import { describe, expect, test } from "vitest";
import {
  Cardano as BlazeCardano,
  initCrypto as initBlazeCrypto,
  Serialization as BlazeSerialization,
} from "../src";
import * as BlazeCrypto from "../src/internal/cardano-sdk/crypto";
import { HexBlob as BlazeHexBlob } from "../src/internal/cardano-sdk/util";

const transactionId = "00".repeat(32);
const paymentAddress =
  "addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4";

describe("internal Cardano ledger conformance", () => {
  test("matches the transaction-input golden vector", () => {
    const blaze = new BlazeSerialization.TransactionInput(
      BlazeCardano.TransactionId(transactionId),
      3n,
    );

    expect(blaze.toCbor()).toBe(
      "825820000000000000000000000000000000000000000000000000000000000000000003",
    );
    expect(
      BlazeSerialization.TransactionInput.fromCbor(blaze.toCbor()).toCore(),
    ).toEqual(blaze.toCore());
  });

  test("matches the canonical multi-asset value golden vector", () => {
    const assetId = `${"11".repeat(28)}746f6b656e`;
    const blaze = new BlazeSerialization.Value(
      5_000_000n,
      new Map([[assetId as BlazeCardano.AssetId, 9n]]),
    );

    expect(blaze.toCbor()).toBe(
      "821a004c4b40a1581c11111111111111111111111111111111111111111111111111111111a145746f6b656e09",
    );
    expect(BlazeSerialization.Value.fromCbor(blaze.toCbor()).toCore()).toEqual(
      blaze.toCore(),
    );
  });

  test("matches large-integer and chunked-byte Plutus golden vectors", () => {
    const largeInteger = 1n << 130n;
    const bytes = new Uint8Array(129).fill(0xab);

    expect(
      BlazeSerialization.PlutusData.newInteger(largeInteger).toCbor(),
    ).toBe("c2510400000000000000000000000000000000");
    expect(BlazeSerialization.PlutusData.newBytes(bytes).toCbor()).toBe(
      "5f5840abababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababab5840abababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababab41abff",
    );
  });

  test("matches the address byte golden vector", () => {
    const blaze = BlazeCardano.Address.fromBech32(paymentAddress);

    expect(blaze.toBytes()).toBe(
      "013258f32901c7ac8acfb0815ac78515d7e27f949e7ec71f23ee1aa7bc9f132e134cb8aa14921b341ff73d0a80dee2d5c80994d4c61287f9cf",
    );
    expect(BlazeCardano.Address.fromBytes(blaze.toBytes()).toBech32()).toBe(
      paymentAddress,
    );
  });

  test("matches Ed25519 public-key and signature golden vectors", async () => {
    await initBlazeCrypto();

    const privateKeyHex = "11".repeat(32);
    const message = "22".repeat(32);
    const blazePrivateKey = BlazeCrypto.Ed25519PrivateKey.fromNormalHex(
      privateKeyHex as BlazeCrypto.Ed25519PrivateNormalKeyHex,
    );
    expect(blazePrivateKey.toPublic().hex()).toBe(
      "d04ab232742bb4ab3a1368bd4615e4e6d0224ab71a016baf8520a332c9778737",
    );
    expect(blazePrivateKey.sign(BlazeHexBlob(message)).hex()).toBe(
      "c4b371034c0d5a237e488cc2ee251c25921803e405ffb3693bc9db400bc8b6751db32b0a7f9099c2063b5d3bea18b1b730dfb097e9b227cd8e71d97e70dbee03",
    );
  });
});
