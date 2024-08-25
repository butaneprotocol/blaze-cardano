import { Encoder as FlatEncoder } from "./flat";
import { BuiltinFunctions, DataType, TermNames, termTags } from "./types";
import type {
  Data,
  ParsedProgram,
  ParsedTerm,
  SemVer,
  DataType as DataTypeType,
} from "./types";
import { PlutusData, fromHex } from "@blaze-cardano/core";

/**
 * UPLCEncoder class for encoding Untyped Plutus Core (UPLC) programs.
 * Extends the FlatEncoder class to provide UPLC-specific encoding functionality.
 */
export class UPLCEncoder extends FlatEncoder {
  /**
   * Encodes a semantic version number.
   * @param version - The semantic version as a string (e.g., "1.0.0").
   * @throws {Error} If the version format is invalid.
   */
  encodeVersion(version: SemVer): void {
    const [major, minor, patch] = version.split(".").map(Number);
    if (major === undefined || minor === undefined || patch === undefined) {
      throw new Error("Invalid version format");
    }
    this.pushByte(major);
    this.pushByte(minor);
    this.pushByte(patch);
  }

  /**
   * Encodes a natural number (non-negative integer).
   * @param n - The natural number to encode.
   */
  encodeNatural(n: bigint): void {
    if (n == 0n) {
      this.pushBits(0, 8);
      return;
    }
    const bits: number[] = [];
    while (n > 0) {
      bits.push(Number(n & 0x7fn));
      n >>= 7n;
    }
    for (let i = 0; i < bits.length; i++) {
      this.pushBit(i !== bits.length - 1 ? 1 : 0);
      this.pushBits(bits[i]!, 7);
    }
  }

  /**
   * Encodes an integer (positive or negative).
   * @param i - The integer to encode.
   */
  encodeInteger(i: bigint): void {
    const n = i >= 0 ? i * 2n : -i * 2n - 1n;
    this.encodeNatural(n);
  }

  /**
   * Encodes a byte string.
   * @param bytes - The byte string to encode as a Uint8Array.
   */
  encodeByteString(bytes: Uint8Array): void {
    this.pad(); // Ensure byte alignment before encoding bytestring

    if (bytes.length === 0) {
      this.pushByte(0);
      return;
    }

    const chunks: Uint8Array[] = [];
    for (let i = 0; i < bytes.length; i += 255) {
      chunks.push(bytes.slice(i, i + 255));
    }

    for (const chunk of chunks) {
      this.pushByte(chunk.length);
      for (const byte of chunk) {
        this.pushByte(byte);
      }
    }
    this.pushByte(0); // End of encoding marker
  }

  /**
   * Encodes a boolean value.
   * @param value - The boolean value to encode.
   */
  encodeBool(value: boolean): void {
    this.pushBit(value ? 1 : 0);
  }

  /**
   * Encodes data based on its type.
   * @param type - The type of the data to encode.
   * @param data - The data to encode.
   * @throws {Error} If the data type is not supported.
   */
  encodeData(type: DataTypeType, data: Data): void {
    if (type === "Integer") {
      this.encodeInteger(data as bigint);
    } else if (type === "ByteString") {
      this.encodeByteString(data as Uint8Array);
    } else if (type === "String") {
      this.encodeByteString(data as Uint8Array);
    } else if (type === "Unit") {
      // No data to encode for Unit type
    } else if (type === "Bool") {
      if (typeof data == "object" && "constructor" in data) {
        this.encodeBool(data.constructor === 1n);
      } else {
        throw new Error(`Cannot encode data of type ${JSON.stringify(type)}`);
      }
    } else if (type === "Data") {
      this.encodeByteString(fromHex(PlutusData.fromCore(data).toCbor()));
    } else if (typeof type === "object" && "list" in type) {
      if (typeof data == "object" && "items" in data) {
        const list = data.items;
        for (let i = 0; i < list.length; i++) {
          this.pushBit(1);
          this.encodeData(type.list, list[i]!);
        }
        this.pushBit(0);
      } else {
        throw new Error(`Cannot encode data of type ${JSON.stringify(type)}`);
      }
    } else if (typeof type === "object" && "pair" in type) {
      if (typeof data == "object" && "items" in data) {
        const pair = data.items as [Data, Data];
        this.encodeData(type.pair[0], pair[0]);
        this.encodeData(type.pair[1], pair[1]);
      } else {
        throw new Error(`Cannot encode data of type ${JSON.stringify(type)}`);
      }
    } else {
      throw new Error(`Cannot encode data of type ${JSON.stringify(type)}`);
    }
  }

  /**
   * Encodes a data type.
   * @param type - The data type to encode.
   * @returns An array of numbers representing the encoded type.
   * @throws {Error} If the type cannot be encoded.
   */
  encodeType(type: DataTypeType): number[] {
    if (typeof type === "string") {
      const typeCode = Object.entries(DataType).find(
        ([, v]) => v === type,
      )?.[0];
      if (typeCode) {
        return [Number(typeCode)];
      } else {
        throw new Error(`Unknown data type: ${type}`);
      }
    } else if ("list" in type) {
      return [7, 5, ...this.encodeType(type.list)];
    } else if ("pair" in type) {
      return [
        7,
        7,
        6,
        ...this.encodeType(type.pair[0]),
        ...this.encodeType(type.pair[1]),
      ];
    } else {
      throw new Error(`Cannot encode type ${JSON.stringify(type)}`);
    }
  }

  /**
   * Encodes a constant value with its type.
   * @param type - The type of the constant.
   * @param value - The value of the constant.
   */
  encodeConst(type: DataTypeType, value: Data): void {
    const type_numbers = this.encodeType(type);
    for (let i = 0; i < type_numbers.length; i += 1) {
      this.pushBit(1);
      this.pushBits(type_numbers[i]!, 4);
    }
    this.pushBit(0);
    this.encodeData(type, value);
  }

  /**
   * Encodes a UPLC term.
   * @param term - The parsed term to encode.
   * @throws {Error} If the term type is not supported.
   */
  encodeTerm(term: ParsedTerm): void {
    const termTag = termTags[term.type];
    this.pushBits(termTag, 4);

    if (term.type === TermNames.var) {
      this.encodeNatural(term.name);
    } else if (term.type === TermNames.lam) {
      this.encodeTerm(term.body);
    } else if (term.type === TermNames.apply) {
      this.encodeTerm(term.function);
      this.encodeTerm(term.argument);
    } else if (term.type === TermNames.const) {
      this.encodeConst(term.valueType, term.value);
    } else if (term.type === TermNames.builtin) {
      const builtinIndex = BuiltinFunctions.indexOf(term.function);
      this.pushBits(builtinIndex, 7);
    } else if (term.type === TermNames.delay) {
      this.encodeTerm(term.term);
    } else if (term.type === TermNames.force) {
      this.encodeTerm(term.term);
    } else if (term.type === TermNames.error) {
      // No additional data to encode for error
    } else {
      throw new Error(`Unsupported term type: ${term.type}`);
    }
  }

  /**
   * Encodes a complete UPLC program.
   * @param program - The parsed program to encode.
   * @returns A Uint8Array containing the encoded program.
   */
  encodeProgram(program: ParsedProgram): Uint8Array {
    this.encodeVersion(program.version);
    this.encodeTerm(program.body);
    this.pad();
    return this.getBytes();
  }
}
