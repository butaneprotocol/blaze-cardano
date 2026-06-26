import { describe, expect, it } from "vitest";
import {
  Address,
  AssetId,
  AssetName,
  HexBlob,
  NetworkId,
  PlutusData,
  PlutusV2Script,
  PolicyId,
  Script,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  addressFromValidator,
  hardCodedProtocolParams,
} from "@blaze-cardano/core";
import {
  TransactionSafetyError,
  TxBuilder,
  TxBuilderReuseError,
  defineTypedScript,
  makeValue,
} from "../../src";

const paymentAddress = Address.fromBech32(
  "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
);

const alwaysTrueScript = Script.newPlutusV2Script(
  new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
);

const datum = PlutusData.fromCbor(HexBlob("d87980"));
const policy = PolicyId(alwaysTrueScript.hash());
const assetName = AssetName("74657374");

const fundedUtxo = () =>
  new TransactionUnspentOutput(
    new TransactionInput(TransactionId("1".repeat(64)), 0n),
    new TransactionOutput(paymentAddress, makeValue(10_000_000n)),
  );

describe("TxBuilder safety helpers", () => {
  it("makes burns explicit and rejects non-positive quantities", () => {
    const tx = new TxBuilder(hardCodedProtocolParams);

    expect(() => tx.burnAssets(policy, new Map([[assetName, 0n]]))).toThrow(
      TransactionSafetyError,
    );

    tx.burnAssets(policy, new Map([[assetName, 1n]]));

    const body = (
      tx as unknown as {
        body: {
          mint: () => Map<AssetId, bigint> | undefined;
        };
      }
    ).body;

    expect(body.mint()?.get(AssetId.fromParts(policy, assetName))).toBe(-1n);
  });

  it("makes transfers explicit through a named wrapper", () => {
    const tx = new TxBuilder(hardCodedProtocolParams);

    expect(() =>
      tx.transferAssets(paymentAddress, makeValue(2_000_000n)),
    ).not.toThrow();

    const body = (
      tx as unknown as {
        body: {
          outputs: () => unknown[];
        };
      }
    ).body;

    expect(body.outputs()).toHaveLength(1);
  });

  it("locks and spends through typed script wrappers", () => {
    const typedScript = defineTypedScript<PlutusData, PlutusData>(
      alwaysTrueScript,
      { name: "always-true" },
    );
    const scriptAddress = addressFromValidator(
      NetworkId.Testnet,
      alwaysTrueScript,
    );
    const tx = new TxBuilder(hardCodedProtocolParams);

    expect(() =>
      tx.lockTypedAssets(
        typedScript,
        scriptAddress,
        makeValue(2_000_000n),
        datum,
      ),
    ).not.toThrow();

    const scriptUtxo = new TransactionUnspentOutput(
      new TransactionInput(TransactionId("2".repeat(64)), 0n),
      new TransactionOutput(scriptAddress, makeValue(2_000_000n)),
    );

    expect(() =>
      tx.addTypedInput(scriptUtxo, typedScript, datum),
    ).not.toThrow();
  });

  it("requires a network id before using the deployScript burn address convenience", () => {
    const tx = new TxBuilder(hardCodedProtocolParams);

    expect(() => tx.deployScript(alwaysTrueScript)).toThrow(/network id/);
  });

  it("updates the burn address when the builder network changes", () => {
    const tx = new TxBuilder(hardCodedProtocolParams);

    tx.setNetworkId(NetworkId.Testnet);
    expect(tx.burnAddress.getNetworkId()).toBe(NetworkId.Testnet);

    tx.setNetworkId(NetworkId.Mainnet);
    expect(tx.burnAddress.getNetworkId()).toBe(NetworkId.Mainnet);
  });

  it("rejects completing the same builder twice", async () => {
    const tx = new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs([fundedUtxo()])
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(paymentAddress)
      .payAssets(paymentAddress, makeValue(2_000_000n));

    await tx.complete();

    await expect(tx.complete()).rejects.toThrow(TxBuilderReuseError);
  });
});
