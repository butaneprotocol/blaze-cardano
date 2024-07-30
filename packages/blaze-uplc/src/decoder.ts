import { Parser as FlatDecoder } from "./flat";
import type { Byte, Data, ParsedProgram, ParsedTerm, SemVer } from "./types";
import { BuiltinFunctions, DataType, type TermNames, termTags } from "./types";
import { ConstrPlutusData, PlutusList } from "@blaze-cardano/core";
import { HexBlob, PlutusData, fromHex, toHex } from "@blaze-cardano/core";

/**
 * This class provides decoding functionality for UPLC (Untyped Plutus Core) programs.
 * It extends the FlatDecoder class to handle the specific structure of UPLC programs.
 * The decoding process involves interpreting binary data into structured UPLC terms and types.
 */
export class UPLCDecoder extends FlatDecoder {
  /**
   * Decodes a version number from the binary stream.
   * @returns {SemVer} The decoded semantic versioning number as a string.
   */
  #decodeVersion(): SemVer {
    const major = this.popByte();
    const minor = this.popByte();
    const patch = this.popByte();
    return `${major}.${minor}.${patch}`;
  }

  /**
   * Decodes a list of items from the binary stream.
   * @template Item The type of items in the list.
   * @param {() => Item} decodeItem A function to decode a single item.
   * @returns {Item[]} The decoded list of items.
   */
  #decodeList<Item>(decodeItem: () => Item): Item[] {
    const list: Item[] = [];
    let cont = this.popBit();
    while (cont == 1) {
      list.push(decodeItem());
      cont = this.popBit();
    }
    return list;
  }

  /**
   * Decodes a list of items where the list is expected to have at least one item.
   * @template Item The type of items in the list.
   * @param {() => Item} decodeItem A function to decode a single item.
   * @returns {Item[]} The decoded list of items.
   */
  #decodeList2<Item>(decodeItem: () => Item): Item[] {
    const list: Item[] = [];
    let cont = this.popBit();
    while (cont == 1) {
      list.push(decodeItem());
      cont = this.popBit();
    }
    list.push(decodeItem());
    return list;
  }

  /**
   * Decodes a natural number from the binary stream.
   * @returns {bigint} The decoded natural number.
   */
  #decodeNatural(): bigint {
    const bytes = this.#decodeList2(() => this.popBits(7) as number);
    let val = 0n;
    for (let i = 0; i < bytes.length; i += 1) {
      val += BigInt(bytes[i]!) << (BigInt(i) * 7n);
    }
    return val;
  }

  /**
   * Decodes an integer from the binary stream.
   * @returns {bigint} The decoded integer.
   */
  #decodeInteger(): bigint {
    const nat = this.#decodeNatural();
    return nat % 2n === 0n ? nat / 2n : -((nat + 1n) / 2n);
  }

  /**
   * Decodes a byte string from the binary stream.
   * @returns {Uint8Array} The decoded byte array.
   */
  #decodeByteString(): Uint8Array {
    this.skipByte();
    let blockLength: number = this.popByte();
    if (blockLength == 0) {
      return new Uint8Array();
    }
    let arr: Uint8Array | undefined;
    while (blockLength != 0) {
      if (arr == undefined) {
        arr = this.takeBytes(blockLength);
      } else {
        const takenSlice = this.takeBytes(blockLength);
        const newArray = new Uint8Array(arr.length + takenSlice.length);
        newArray.set(arr, 0);
        newArray.set(takenSlice, arr.length);
        arr = newArray;
      }
      blockLength = this.takeBytes(1)[0]!;
    }
    if (arr == undefined) {
      throw new Error(
        "UPLCDecoder #decodeByteString: failed to decode any length.",
      );
    }
    return arr;
  }

  /**
   * Decodes a boolean value from the binary stream.
   * @returns {object} The decoded boolean value as a UPLC data structure.
   */
  #decodeBool(): Data {
    return PlutusData.newConstrPlutusData(
      new ConstrPlutusData(this.popBit() == 0 ? 0n : 1n, new PlutusList()),
    ).toCore();
  }

  /**
   * Decodes CBOR data from the binary stream.
   * @returns {PlutusData} The decoded data in Plutus core format.
   */
  #decodeCborData(): Data {
    const cbor = this.#decodeByteString();
    return PlutusData.fromCbor(HexBlob(toHex(cbor))).toCore();
  }

  /**
   * Decodes data based on the specified data type.
   * @param {DataType} dataType The type of data to decode.
   * @returns {Data} The decoded data.
   */
  #decodeData(dataType: DataType): Data {
    if (dataType == "Integer") {
      return this.#decodeInteger();
    } else if (dataType == "ByteString") {
      return this.#decodeByteString();
    } else if (dataType == "String") {
      console.warn("ByteString needs to be decoded to string");
      return this.#decodeByteString();
    } else if (dataType == "Unit") {
      return 0n;
    } else if (dataType == "Bool") {
      return this.#decodeBool();
    } else if (dataType == "Data") {
      return this.#decodeCborData();
    } else if ("list" in dataType) {
      return { items: this.#decodeList(() => this.#decodeData(dataType.list)) };
    } else if (typeof dataType == "object" && "pair" in dataType) {
      return {
        items: [
          this.#decodeData(dataType.pair[0]),
          this.#decodeData(dataType.pair[1]),
        ],
      };
    } else {
      throw new Error(`Cannot decode type ${JSON.stringify(dataType)}`);
    }
  }

  /**
   * Decodes a type from the binary stream.
   * @param {Byte[]} type The binary representation of the type.
   * @returns {[DataType, Byte[]]} The decoded data type and the remaining bytes.
   */
  #decodeType(type: Byte[]): [DataType, Byte[]] {
    if (type.length == 0) {
      return ["Unit", type];
    } else {
      const head = type.at(0);
      if (head == 7) {
        const subtype = type.at(1);
        if (subtype == 5) {
          const [innerType, remainer] = this.#decodeType(type.slice(2));
          return [{ list: innerType }, remainer];
        } else if (subtype == 7 && type.at(2) == 6) {
          const [innerType, remainer] = this.#decodeType(type.slice(3));
          const [innerType2, remainer2] = this.#decodeType(remainer);
          return [{ pair: [innerType, innerType2] }, remainer2];
        } else {
          throw new Error("UPLCDecoder #decodeType: invalid type application");
        }
      } else {
        return [DataType[head!]! as DataType, type.slice(1)];
      }
    }
  }

  /**
   * Decodes a constant from the binary stream.
   * @returns {Data} The decoded constant.
   */
  #decodeConst(): [DataType, Data] {
    const bits = this.#decodeList(() => this.popBits(4));
    const [dataType, remainder] = this.#decodeType(bits);
    if (remainder.length != 0) {
      throw new Error("UPLCDecoder #decodeConst: invalid type application");
    }
    const result = this.#decodeData(dataType);
    return [dataType, result];
  }

  /**
   * Decodes a term from the binary stream.
   * @param {bigint} lamDepth The current lambda depth in the term structure.
   * @returns {ParsedTerm} The decoded term.
   */
  #decodeTerm(lamDepth: bigint): ParsedTerm {
    const termTag = this.popBits(4);
    const maybeTerm = Object.entries(
      termTags as Record<TermNames[keyof TermNames], number>,
    ).find(([, tag]) => tag == termTag) as
      | [TermNames[keyof TermNames], number]
      | undefined;
    if (!maybeTerm) {
      throw new Error(`UPLCDecoder: could not decode the term tag ${termTag}`);
    }
    const term = maybeTerm[0];
    if (term == "Var") {
      return {
        type: "Var",
        name: this.#decodeNatural(),
      };
    }
    if (term == "Lambda") {
      return {
        type: "Lambda",
        name: lamDepth,
        body: this.#decodeTerm(lamDepth + 1n),
      };
    } else if (term == "Apply") {
      return {
        type: "Apply",
        function: this.#decodeTerm(lamDepth),
        argument: this.#decodeTerm(lamDepth),
      };
    } else if (term == "Constant") {
      const result = this.#decodeConst();
      return {
        type: "Constant",
        valueType: result[0],
        value: result[1],
      };
    } else if (term == "Builtin") {
      return {
        type: "Builtin",
        function: BuiltinFunctions[this.popBits(7)]!,
      };
    } else if (term == "Delay") {
      return {
        type: "Delay",
        term: this.#decodeTerm(lamDepth),
      };
    } else if (term == "Force") {
      return {
        type: "Force",
        term: this.#decodeTerm(lamDepth),
      };
    } else if (term == "Constr") {
      throw new Error(
        `UPLCDecoder: decoder is not implemented for tag ${termTag} or term (${term})`,
      );
    } else if (term == "Case") {
      throw new Error(
        `UPLCDecoder: decoder is not implemented for tag ${termTag} or term (${term})`,
      );
    } else if (term == "Error") {
      return {
        type: "Error",
      };
    } else {
      throw new Error(
        "UPLCDecoder: decoder no matching termType, UNREACHABLE!",
      );
    }
  }

  /**
   * Decodes the entire UPLC program from the binary stream.
   * @returns {ParsedProgram} The decoded program.
   */
  #decodeProgram(): ParsedProgram {
    const version = this.#decodeVersion();
    const body = this.#decodeTerm(0n);
    return {
      version,
      body,
    };
  }

  /**
   * Public method to decode a UPLC program from the UPLCDecoder instance
   * @returns {ParsedProgram} The decoded UPLC program.
   */
  decode(): ParsedProgram {
    return this.#decodeProgram();
  }

  /**
   * Creates a UPLCDecoder instance from a hexadecimal string.
   * @param {string} hex Hexadecimal string of a UPLC program's binary data.
   * @returns {UPLCDecoder} Initialized UPLCDecoder with the decoded data.
   */
  static override fromHex(hex: string) {
    return new UPLCDecoder(fromHex(hex));
  }

  /**
   * Decodes a UPLC program from a hexadecimal string.
   * This method utilizes the `fromHex` method to create an instance of UPLCDecoder
   * and then decodes the program using the `decode` method.
   *
   * @param {string} hex - The hexadecimal string representing the binary data of a UPLC program.
   * @returns {ParsedProgram} - The decoded UPLC program.
   */
  static decodeFromHex(hex: string): ParsedProgram {
    return this.fromHex(hex).decode();
  }
}
