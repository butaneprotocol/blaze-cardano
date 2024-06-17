/* This package has basic UPLC manipulation but does not yet implement a machine */
import { Serialization } from "@cardano-sdk/core";
import { Parser as FlatParser, Encoder as FlatEncoder } from "./flat";
import type { Byte, Data, ParsedProgram, ParsedTerm, SemVer } from "./types";
import { BuiltinFunctions, DataType, TermNames, termTags } from "./types";
export const { CborReader, PlutusData, PlutusList } = Serialization;
import { HexBlob, fromHex, toHex } from "@blaze-cardano/core";

/*
  This is intended to be a clean-room of UPLC from spec however the real implementation functionally differs.
  * blame rvcas/microproofs for polluting the clean-room (helping me)
  Inconsistencies are noted:
    - Integer representation is not strictly lists, parseList2 fixes this
  Arbitrary:
    - Unit is Constr(0, []) simply because I know this is how aiken does it
*/

export class UPLCParser extends FlatParser {
  #parseVersion(): SemVer {
    const major = this.popByte();
    const minor = this.popByte();
    const patch = this.popByte();
    return `${major}.${minor}.${patch}`;
  }

  #parseList<Item>(parseItem: () => Item): Item[] {
    const list: Item[] = [];
    let cont = this.popBit();
    while (cont == 1) {
      list.push(parseItem());
      cont = this.popBit();
    }
    return list;
  }

  #parseList2<Item>(parseItem: () => Item): Item[] {
    const list: Item[] = [];
    let cont = this.popBit();
    while (cont == 1) {
      list.push(parseItem());
      cont = this.popBit();
    }
    list.push(parseItem());
    return list;
  }

  #parseNatural() {
    const bytes = this.#parseList2(() => this.popBits(7) as number);
    let val = 0n;
    for (let i = 0; i < bytes.length; i += 1) {
      val += BigInt(bytes[i]!) << (BigInt(i) * 7n);
    }
    return val;
  }

  #parseInteger() {
    const nat = this.#parseNatural();
    if (nat % 2n === 0n) {
      return nat / 2n;
    } else {
      return -((nat + 1n) / 2n);
    }
  }

  #parseByteString() {
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
        "UPLCParser #parseByteString: failed to parse any length.",
      );
    }
    return arr;
  }

  #parseBool() {
    return { constructor: this.popBit() == 0 ? 0n : 1n, items: [] };
  }

  #parseCborData() {
    return PlutusData.fromCbor(
      HexBlob(toHex(this.#parseByteString())),
    ).toCore();
  }

  #parseData(dataType: DataType): Data {
    if (dataType == "Integer") {
      return this.#parseInteger();
    } else if (dataType == "ByteString") {
      return this.#parseByteString();
    } else if (dataType == "String") {
      console.warn("ByteString needs to be decoded to string");
      return this.#parseByteString();
    } else if (dataType == "Unit") {
      return 0n;
    } else if (dataType == "Bool") {
      return this.#parseBool();
    } else if (dataType == "Data") {
      return this.#parseCborData();
    } else if ("list" in dataType) {
      return { items: this.#parseList(() => this.#parseData(dataType.list)) };
    } else if (typeof dataType == "object" && "pair" in dataType) {
      return {
        items: [
          this.#parseData(dataType.pair[0]),
          this.#parseData(dataType.pair[1]),
        ],
      };
    } else {
      throw new Error(`Cannot parse type ${JSON.stringify(dataType)}`);
    }
  }

  #parseType(type: Byte[]): [DataType, Byte[]] {
    if (type.length == 0) {
      return ["Unit", type];
    } else {
      const head = type.at(0);
      if (head == 7) {
        const subtype = type.at(1);
        if (subtype == 5) {
          const [innerType, remainer] = this.#parseType(type.slice(2));
          return [{ list: innerType }, remainer];
        } else if (subtype == 7 && type.at(2) == 6) {
          const [innerType, remainer] = this.#parseType(type.slice(3));
          const [innerType2, remainer2] = this.#parseType(remainer);
          return [{ pair: [innerType, innerType2] }, remainer2];
        } else {
          throw new Error("UPLCParser #parseType: invalid type application");
        }
      } else {
        return [DataType[head!]! as DataType, type.slice(1)];
      }
    }
  }

  #parseConst() {
    const bits = this.#parseList(() => this.popBits(4));
    const [dataType, remainder] = this.#parseType(bits);
    if (remainder.length != 0) {
      throw new Error("UPLCParser #parseConst: invalid type application");
    }
    const result = this.#parseData(dataType);
    return result;
  }

  #parseTerm(lamDepth: bigint): ParsedTerm {
    const termTag = this.popBits(4);
    const maybeTerm = Object.entries(
      termTags as Record<TermNames[keyof TermNames], number>,
    ).find(([, tag]) => tag == termTag) as
      | [TermNames[keyof TermNames], number]
      | undefined;
    if (!maybeTerm) {
      throw new Error(`UPLCParser: could not parse the term tag ${termTag}`);
    }
    const term = maybeTerm[0];
    if (term == "Var") {
      return {
        type: TermNames["var"],
        name: this.#parseNatural(),
      };
    }
    if (term == "Lambda") {
      return {
        type: TermNames["lam"],
        name: lamDepth,
        body: this.#parseTerm(lamDepth + 1n),
      };
    } else if (term == "Apply") {
      return {
        type: TermNames["apply"],
        function: this.#parseTerm(lamDepth),
        argument: this.#parseTerm(lamDepth),
      };
    } else if (term == "Constant") {
      return {
        type: TermNames["const"],
        value: this.#parseConst(),
      };
    } else if (term == "Builtin") {
      return {
        type: TermNames["builtin"],
        function: BuiltinFunctions[this.popBits(7)]!,
      };
    } else if (term == "Delay") {
      return {
        type: TermNames["delay"],
        term: this.#parseTerm(lamDepth),
      };
    } else if (term == "Force") {
      return {
        type: TermNames["force"],
        term: this.#parseTerm(lamDepth),
      };
    } else if (term == "Constr") {
      throw new Error(
        `UPLCParser: parser is not implemented for tag ${termTag} or term (${term})`,
      );
    } else if (term == "Case") {
      throw new Error(
        `UPLCParser: parser is not implemented for tag ${termTag} or term (${term})`,
      );
    } else if (term == "Error") {
      return {
        type: TermNames["error"],
      };
    } else {
      throw new Error("UPLCParser: parser no matching termType, UNREACHABLE!");
    }
  }

  #parseProgram(): ParsedProgram {
    const version = this.#parseVersion();
    const body = this.#parseTerm(0n);
    return {
      version,
      body,
    };
  }

  parse(): ParsedProgram {
    return this.#parseProgram();
  }

  static override fromHex(hex: string) {
    return new UPLCParser(fromHex(hex));
  }
}

export class UPLCEncoder extends FlatEncoder {
  // Implementation of UPLCEncoder extending FlatEncoder

  encodeProgram(program: ParsedProgram): Uint8Array {
    this.encodeVersion(program.version);
    this.encodeTerm(program.body);
    this.pad();
    return this.getBytes();
  }

  encodeVersion(version: ParsedProgram["version"]) {
    // Parsing version from string format 'major.minor.patch' to Uint8Array
    const versionParts = version.split(".").map(Number);
    versionParts.forEach((part) => this.pushByte(part));
  }

  encodeList<Item>(list: Item[], encoder: (item: Item) => void) {
    this.pushBit(1);
    for (const item of list) {
      encoder(item);
      this.pushBit(1);
    }
    this.pushBit(0);
  }

  encodeList2<Item>(list: Item[], encoder: (item: Item) => void) {
    this.pushBit(1);
    const lastIndex = list.length - 1;
    for (const [index, item] of list.entries()) {
      encoder(item);
      if (index !== lastIndex) {
        this.pushBit(1);
      }
    }
    this.pushBit(0);
  }

  encodeNatural(natural: bigint) {
    const bytes = [];
    let value = natural;
    while (value > 0n) {
      bytes.push(Number(value & 0x7fn));
      value >>= 7n;
    }
    if (bytes.length === 0) {
      bytes.push(0);
    }
    this.encodeList(bytes, (byte) => this.pushBits(byte, 7));
  }

  encodeInteger(integer: bigint) {
    const natural = integer >= 0 ? integer * 2n : -integer * 2n - 1n;
    this.encodeNatural(natural);
  }

  encodeByteString(byteString: Uint8Array) {
    this.pushBit(1); // Start of byte string marker
    this.encodeNatural(BigInt(byteString.length)); // Encode the length of the byte string
    for (const byte of byteString) {
      this.pushByte(byte); // Encode each byte
    }
    this.pushBit(0); // End of byte string marker
  }

  // encodeData(data: Data) {
  //   const { value } = data;
  //   if (typeof value === 'bigint') {
  //     this.encodeInteger(value);
  //   } else if (typeof value === 'string') {
  //     this.encodeByteString(value);
  //   }
  // }

  encodeTerm(term: ParsedTerm) {
    const termTag = termTags[term.type];
    this.pushBits(termTag, 4);

    if (term.type == TermNames["var"]) {
      this.encodeNatural(term.name);
    } else if (term.type === TermNames["lam"]) {
      this.encodeTerm(term.body);
    } else if (term.type === TermNames["const"]) {
      // this.encodeTerm()
    } else if (term.type == TermNames["builtin"]) {
      const builtinIndex = BuiltinFunctions.indexOf(term.function);
      this.encodeNatural(BigInt(builtinIndex));
    } else if (term.type === TermNames["apply"]) {
      this.encodeTerm(term.function);
      this.encodeTerm(term.argument);
    } else if (term.type === TermNames["delay"]) {
      this.encodeTerm(term.term);
    } else if (term.type === TermNames["force"]) {
      this.encodeTerm(term.term);
    } else if (term.type === TermNames["error"]) {
      return;
    } else {
      throw new Error(
        `UPLCEncoder: No encoder implemented for term type ${term.type}`,
      );
    }
  }
}
