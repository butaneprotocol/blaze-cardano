import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  Address,
  AssetId,
  AssetName,
  Credential,
  CredentialType,
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
  makeValue,
  TypedScript,
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
  it("keeps burn quantities negative across positive asset maps", () => {
    fc.assert(
      fc.property(
        fc.array(fc.bigInt({ min: 1n, max: 1_000_000n }), {
          minLength: 1,
          maxLength: 20,
        }),
        (quantities) => {
          const tx = new TxBuilder(hardCodedProtocolParams);
          const assets = new Map(
            quantities.map((quantity, index) => [
              AssetName(Buffer.from(`asset-${index}`, "utf8").toString("hex")),
              quantity,
            ]),
          );

          tx.burnAssets(policy, assets);

          const body = (
            tx as unknown as {
              body: {
                mint: () => Map<AssetId, bigint> | undefined;
              };
            }
          ).body;

          for (const [name, quantity] of assets) {
            expect(body.mint()?.get(AssetId.fromParts(policy, name))).toBe(
              -quantity,
            );
          }
        },
      ),
    );
  });

  it("rejects non-positive mint and burn quantities", () => {
    fc.assert(
      fc.property(fc.bigInt({ max: 0n }), (quantity) => {
        const assets = new Map([[assetName, quantity]]);

        expect(() =>
          new TxBuilder(hardCodedProtocolParams).mintAssets(policy, assets),
        ).toThrow(TransactionSafetyError);
        expect(() =>
          new TxBuilder(hardCodedProtocolParams).burnAssets(policy, assets),
        ).toThrow(TransactionSafetyError);
      }),
    );
  });

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

  it("locks typed script assets and spends with typed addInput arguments", () => {
    const typedScript = new TypedScript<PlutusData, PlutusData>(
      alwaysTrueScript,
      "always-true",
    );
    const scriptAddress = addressFromValidator(
      NetworkId.Testnet,
      alwaysTrueScript,
    );
    const tx = new TxBuilder(hardCodedProtocolParams).setNetworkId(
      NetworkId.Testnet,
    );

    expect(() =>
      tx.lockScriptAssets(typedScript, makeValue(2_000_000n), datum),
    ).not.toThrow();

    const body = (
      tx as unknown as {
        body: {
          outputs: () => TransactionOutput[];
        };
      }
    ).body;

    expect(body.outputs()[0]!.address().toBech32()).toBe(
      scriptAddress.toBech32(),
    );

    const scriptUtxo = new TransactionUnspentOutput(
      new TransactionInput(TransactionId("2".repeat(64)), 0n),
      new TransactionOutput(scriptAddress, makeValue(2_000_000n)),
    );

    expect(() =>
      tx.addInput<typeof typedScript>(scriptUtxo, datum),
    ).not.toThrow();
  });

  it("locks typed scripts with a stake credential or explicit script address", () => {
    const typedScript = new TypedScript<PlutusData, PlutusData>(
      alwaysTrueScript,
    );
    const stakeCredential = Credential.fromCore({
      hash: paymentAddress.getProps().delegationPart!.hash,
      type: CredentialType.KeyHash,
    });
    const tx = new TxBuilder(hardCodedProtocolParams).setNetworkId(
      NetworkId.Testnet,
    );

    expect(() =>
      tx.lockScriptAssets(typedScript, makeValue(2_000_000n), datum, {
        stakeCredential,
      }),
    ).not.toThrow();

    const scriptAddress = addressFromValidator(
      NetworkId.Testnet,
      alwaysTrueScript,
    );
    expect(() =>
      tx.lockScriptAssets(typedScript, makeValue(2_000_000n), datum, {
        address: scriptAddress,
      }),
    ).not.toThrow();

    expect(() =>
      tx.lockScriptAssets(typedScript, makeValue(2_000_000n), datum, {
        address: paymentAddress,
      }),
    ).toThrow(/script hash/i);
  });

  it("names the typed script in the missing-network-id error", () => {
    const namedScript = new TypedScript<PlutusData, PlutusData>(
      alwaysTrueScript,
      "order-validator",
    );
    const tx = new TxBuilder(hardCodedProtocolParams);

    expect(() =>
      tx.lockScriptAssets(namedScript, makeValue(2_000_000n), datum),
    ).toThrow(/typed script "order-validator".*network id/);
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
