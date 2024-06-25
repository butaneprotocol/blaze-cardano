import { PlutusData, PlutusDataKind, type HexBlob } from "@blaze-cardano/core";
import { UPLCDecoder } from "./decoder";
import { type ParsedProgram, TermNames, DataType, Data } from "./types";
import { Serialization } from "@cardano-sdk/core";
import { UPLCEncoder } from "./encoder";
const { CborReader, CborWriter } = Serialization;

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

  console.dir(ast, { depth: null });

  // Apply each parameter to the AST
  for (const param of params) {
    param.getKind();
    const newBody = {
      type: TermNames["apply"],
      function: ast.body,
      argument: { type: TermNames["const"], value: param.toCore(), valueType },
    } as ParsedProgram["body"];
    ast.body = newBody;
  }

  console.dir(ast, { depth: null });

  // Encode the modified AST back into a byte string
  const newFlatString = new UPLCEncoder().encodeProgram(ast);

  // Encode the byte string back into a hex blob
  const writer = new CborWriter();
  writer.writeByteString(newFlatString);
  return writer.encodeAsHex();
}

export function typeOfPlutusData(data: PlutusData): ParsedProgram["body"] {
  switch (data.getKind()) {
    case PlutusDataKind.ConstrPlutusData:
      return {
        type: TermNames["apply"],
        function: {
          type: TermNames["apply"],
          function: { type: TermNames["builtin"], function: "mkCons" },
          argument: typeOfPlutusData(
            PlutusData.newInteger(data.asConstrPlutusData()!.getAlternative()!)
          ),
        },
        argument: typeOfPlutusData(
          PlutusData.newList(data.asConstrPlutusData()!.getData()!)
        ),
      };
    case PlutusDataKind.Map:
      // return {
      //   type: TermNames["const"],
      //   value: data.toCore(),
      //   valueType: DataType.Map,
      // };
      const firstKey = data.asMap()!.getKeys().get(0);
      const mapTypes: [DataType, DataType] = [
        typeOfPlutusData(firstKey).type,
        typeOfPlutusData(data.asMap()!.get(firstKey)!).type,
      ];
      return {
        type: TermNames["apply"],
        function: {
          type: TermNames["builtin"],
          function: "mapData",
        },
        argument: {
          type: TermNames["const"],
          valueType: {
            list: { pair: mapTypes },
          },
        },
      };
    case PlutusDataKind.List:
      return {
        type: TermNames["const"],
        value: data.toCore(),
        valueType: DataType.List,
      };
    case PlutusDataKind.Integer:
      return {
        type: TermNames["const"],
        value: data.toCore(),
        valueType: DataType.Integer,
      };
    case PlutusDataKind.Bytes:
      return {
        type: TermNames["const"],
        value: data.toCore(),
        valueType: DataType.Bytes,
      };
    default:
      throw new Error(`Unsupported Plutus data kind: ${data.getKind()}`);
  }
}
