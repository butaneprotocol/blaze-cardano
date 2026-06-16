import { describe, expect, it } from "vitest";
import {
  HexBlob,
  NetworkId,
  PlutusData,
  PlutusV2Script,
  Script,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  addressFromValidator,
  hardCodedProtocolParams,
} from "@blaze-cardano/core";
import { TxBuilder, defineTypedScript, makeValue } from "../../src";

type DatumA = PlutusData & { readonly __datumA: "datum-a" };
type DatumB = PlutusData & { readonly __datumB: "datum-b" };
type RedeemerA = PlutusData & { readonly __redeemerA: "redeemer-a" };
type RedeemerB = PlutusData & { readonly __redeemerB: "redeemer-b" };

const script = Script.newPlutusV2Script(
  new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
);
const typedScript = defineTypedScript<DatumA, RedeemerA>(script);
const scriptAddress = addressFromValidator(NetworkId.Testnet, script);
const datumA = PlutusData.fromCbor(HexBlob("d87980")) as DatumA;
const datumB = PlutusData.fromCbor(HexBlob("d87980")) as DatumB;
const redeemerA = PlutusData.fromCbor(HexBlob("d87980")) as RedeemerA;
const redeemerB = PlutusData.fromCbor(HexBlob("d87980")) as RedeemerB;
const utxo = new TransactionUnspentOutput(
  new TransactionInput(TransactionId("1".repeat(64)), 0n),
  new TransactionOutput(scriptAddress, makeValue(2_000_000n)),
);

if (false) {
  const builder = new TxBuilder(hardCodedProtocolParams);
  builder.lockTypedAssets(
    typedScript,
    scriptAddress,
    makeValue(2_000_000n),
    datumA,
  );
  builder.addTypedInput(utxo, typedScript, redeemerA, datumA);

  builder.lockTypedAssets(
    typedScript,
    scriptAddress,
    makeValue(2_000_000n),
    // @ts-expect-error datum brand does not match the typed script.
    datumB,
  );
  // @ts-expect-error redeemer brand does not match the typed script.
  builder.addTypedInput(utxo, typedScript, redeemerB, datumA);
  // @ts-expect-error un-hashed datum brand does not match the typed script.
  builder.addTypedInput(utxo, typedScript, redeemerA, redeemerB);
}

describe("typed script compile-time checks", () => {
  it("keeps datum and redeemer brands tied to the script type", () => {
    expect(typedScript.script.hash()).toBe(script.hash());
  });
});
