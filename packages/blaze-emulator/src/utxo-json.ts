import {
  Address,
  TransactionUnspentOutput,
  TransactionInput,
  TransactionOutput,
  PlutusData,
  TransactionId,
  Datum,
  Value,
  Script,
  HexBlob,
  TokenMap,
  AssetId,
  PolicyId,
  AssetName,
  PlutusV1Script,
  PlutusV2Script,
  PlutusV3Script,
  NativeScript,
} from "@blaze-cardano/core";

/**
 * Value object in UTxO JSON format
 */
export interface JsonValue {
  lovelace: number;
  [policyId: string]: number | { [assetName: string]: number };
}

/**
 * Script object in UTxO JSON format
 */
export interface JsonScript {
  scriptLanguage: string;
  script: {
    cborHex: string;
    description: string;
    type: "SimpleScript" | "PlutusScriptV1" | "PlutusScriptV2" | "PlutusScriptV3";
  };
}

/**
 * Transaction output in UTxO JSON format
 */
export interface JsonTxOut {
  address: string;
  value: JsonValue;
  datumhash: string | null;
  inlineDatum: unknown | null;
  inlineDatumhash: string | null;
  inlineDatumRaw: string | null;
  datum: string | null;
  referenceScript: JsonScript | null;
}

/**
 * UTxO set as a JSON object mapping "{txHash}#{index}" to TxOut
 */
export interface UtxoJson {
  [txRef: string]: JsonTxOut;
}

/**
 * Parse a JSON value object into a blaze Value
 */
function parseJsonValue(jsonValue: JsonValue): Value {
  const lovelace = BigInt(jsonValue.lovelace ?? 0);

  // Check if there are any native assets
  const policyIds = Object.keys(jsonValue).filter((k) => k !== "lovelace");
  if (policyIds.length === 0) {
    return new Value(lovelace);
  }

  // Build the multiasset map
  const tokenMap = new Map<AssetId, bigint>();

  for (const policyId of policyIds) {
    const assets = jsonValue[policyId];
    if (typeof assets === "number") {
      // Shouldn't happen based on schema, but handle it
      continue;
    }

    for (const [assetName, quantity] of Object.entries(assets)) {
      const assetId = AssetId.fromParts(
        PolicyId(policyId),
        AssetName(assetName),
      );
      tokenMap.set(assetId, BigInt(quantity));
    }
  }

  return new Value(lovelace, tokenMap as TokenMap);
}

/**
 * Parse a single JSON TxOut into a TransactionUnspentOutput
 */
function parseJsonTxOut(
  txHash: string,
  index: number,
  output: JsonTxOut,
): TransactionUnspentOutput {
  const address = Address.fromBech32(output.address);
  const value = parseJsonValue(output.value);
  const txOut = new TransactionOutput(address, value);

  // Handle inline datum (preferred) or datum hash
  if (output.inlineDatumRaw) {
    // We have the raw CBOR of the inline datum
    const plutusData = PlutusData.fromCbor(HexBlob(output.inlineDatumRaw));
    txOut.setDatum(Datum.newInlineData(plutusData));
  } else if (output.datumhash) {
    // We have a datum hash reference
    txOut.setDatum(Datum.newDataHash(output.datumhash as any));
  }

  // Handle reference script
  if (output.referenceScript) {
    const cborHex = HexBlob(output.referenceScript.script.cborHex);
    let script: Script;
    switch (output.referenceScript.script.type) {
      case "PlutusScriptV1":
        script = Script.newPlutusV1Script(new PlutusV1Script(cborHex));
        break;
      case "PlutusScriptV2":
        script = Script.newPlutusV2Script(new PlutusV2Script(cborHex));
        break;
      case "PlutusScriptV3":
        script = Script.newPlutusV3Script(new PlutusV3Script(cborHex));
        break;
      case "SimpleScript":
        script = Script.newNativeScript(NativeScript.fromCbor(cborHex));
        break;
      default:
        throw new Error(`Unknown script type: ${output.referenceScript.script.type}`);
    }
    txOut.setScriptRef(script);
  }

  const txIn = new TransactionInput(TransactionId(txHash), BigInt(index));
  return new TransactionUnspentOutput(txIn, txOut);
}

/**
 * Parse a UTxO JSON object into an array of TransactionUnspentOutput.
 *
 * The JSON format uses keys "{txHash}#{index}" and values are TxOut objects
 * with address, value, datums, and optional reference scripts.
 *
 * @example
 * ```typescript
 * import { readFileSync } from "fs";
 * import { parseUtxoJson, Emulator } from "@blaze-cardano/emulator";
 *
 * const utxoJson = JSON.parse(readFileSync("utxo.json", "utf-8"));
 * const utxos = parseUtxoJson(utxoJson);
 * const emulator = Emulator.fromUtxos(utxos);
 * ```
 */
export function parseUtxoJson(utxoJson: UtxoJson): TransactionUnspentOutput[] {
  const utxos: TransactionUnspentOutput[] = [];

  for (const [txRef, output] of Object.entries(utxoJson)) {
    const [txHash, indexStr] = txRef.split("#");
    if (!txHash || indexStr === undefined) {
      throw new Error(`Invalid UTxO reference format: ${txRef}`);
    }

    const index = parseInt(indexStr, 10);
    if (isNaN(index)) {
      throw new Error(`Invalid UTxO index: ${indexStr}`);
    }

    utxos.push(parseJsonTxOut(txHash, index, output));
  }

  return utxos;
}

/**
 * Parse a UTxO JSON string into an array of TransactionUnspentOutput.
 */
export function parseUtxoJsonString(
  jsonString: string,
): TransactionUnspentOutput[] {
  const utxoJson = JSON.parse(jsonString) as UtxoJson;
  return parseUtxoJson(utxoJson);
}
