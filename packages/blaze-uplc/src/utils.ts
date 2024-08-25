import {
  NativeScript,
  type PlutusData,
  PlutusV1Script,
  PlutusV2Script,
  Script,
  CborReader,
  CborWriter,
  CborReaderState,
} from "@blaze-cardano/core";
import { HexBlob } from "@blaze-cardano/core";
import { UPLCDecoder } from "./decoder";
import { type ParsedProgram, TermNames } from "./types";
import { UPLCEncoder } from "./encoder";
import { type Exact, Data } from "@blaze-cardano/tx";
import type { TArray } from "@sinclair/typebox";

// TODO: Use the c-js-sdk enums for this if possible
export type ScriptType = "Native" | "PlutusV1" | "PlutusV2";

/**
 * Applies parameters to a UPLC program encoded as a hex blob.
 *
 * This function takes a hex-encoded UPLC program and applies one or more
 * Plutus data parameters to it. It does this by decoding the program,
 * modifying its AST to apply the parameters, and then re-encoding it.
 *
 * @param hex - The hex-encoded UPLC program.
 * @param params - The Plutus data parameters to apply to the program.
 * @returns A new hex-encoded UPLC program with the parameters applied.
 */
export function applyParams(hex: HexBlob, ...params: PlutusData[]): HexBlob {
  // Decode the hex blob into a byte string
  const reader = new CborReader(hex);
  const flatString = reader.readByteString();

  // Decode the byte string into an AST
  const ast = new UPLCDecoder(flatString).decode();

  // Apply each parameter to the AST
  for (const param of params) {
    const newBody = {
      type: TermNames["apply"],
      function: ast.body,
      argument: {
        type: TermNames["const"],
        value: param.toCore(),
        valueType: "Data",
      },
    } as ParsedProgram["body"];
    ast.body = newBody;
  }

  // Encode the modified AST back into a byte string
  const newFlatString = new UPLCEncoder().encodeProgram(ast);

  // Encode the byte string back into a hex blob
  const writer = new CborWriter();
  writer.writeByteString(newFlatString);
  return writer.encodeAsHex();
}

function stripCbor(cbor: string) {
  const cborReader = new CborReader(HexBlob(cbor));
  while (cborReader.peekState() != CborReaderState.ByteString) {
    cborReader.readTag();
  }
  const cborBytes = cborReader.readByteString();
  const cborWriter = new CborWriter();
  cborWriter.writeByteString(cborBytes);
  const cborHex = cborWriter.encodeAsHex();
  return cborHex;
}

/**
 * Applies the given Plutus data parameters to a hex-encoded Plutus script.
 *
 * This function decodes the provided Plutus script, applies the given parameters
 * to it, and then re-encodes the script. The parameters are cast to the specified
 * type and converted to a list of PlutusData before being applied.
 *
 * @template T - The type of the parameters list.
 * @param {HexBlob} plutusScript - The hex-encoded Plutus script to which the parameters will be applied.
 * @param {Exact<T>} params - The parameters to apply to the Plutus script.
 * @param {T} type - The type of the parameters list.
 * @returns {HexBlob} - A new hex-encoded Plutus script with the parameters applied.
 */
export function applyParamsToScript<T extends TArray>(
  plutusScript: string,
  params: Exact<T>,
  type: T,
): HexBlob {
  const p = Data.castTo(params, type).asList()!;
  const paramsList: PlutusData[] = [];
  for (let i = 0; i < p.getLength(); i++) {
    paramsList.push(p.get(i));
  }
  return applyParams(HexBlob(stripCbor(plutusScript)), ...paramsList);
}

/**
 * Converts the compiled code of a UPLC program into a Script based on the specified script type, handling possible double-CBOR encoding.
 *
 * @param {HexBlob} cbor - The script, possibly double-CBOR-encoded.
 * @param {ScriptType} type - The type of the script (Native, PlutusV1, or PlutusV2).
 * @returns {Script} - The Script created from the hex blob.
 * @throws {Error} - Throws an error if the script type is unsupported.
 */
export function cborToScript(cbor: string, type: ScriptType): Script {
  if (type === "Native") {
    return Script.newNativeScript(NativeScript.fromCbor(HexBlob(cbor)));
  } else {
    const cborReader = new CborReader(HexBlob(cbor));
    while (cborReader.peekState() != CborReaderState.ByteString) {
      cborReader.readTag();
    }
    const cborBytes = cborReader.readByteString();
    const cborWriter = new CborWriter();
    cborWriter.writeByteString(cborBytes);
    const cborHex = cborWriter.encodeAsHex();
    if (type === "PlutusV1") {
      return Script.newPlutusV1Script(new PlutusV1Script(cborHex));
    } else if (type === "PlutusV2") {
      return Script.newPlutusV2Script(new PlutusV2Script(cborHex));
    } else {
      throw new Error("Unsupported script type");
    }
  }
}
