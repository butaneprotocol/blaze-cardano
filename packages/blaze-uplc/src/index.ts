/* This package has basic UPLC manipulation but does not yet implement a machine */
import { Serialization } from "@cardano-sdk/core";
import { Parser as FlatParser } from "./flat";
import Hex from "hex-encoding"
import {type Byte} from "./flat"
import type { Data, ParsedProgram, ParsedTerm, SemVer, Some } from "./types";
import { BuiltinFunctions, TermNames, termTags } from "./types";
export const { CborReader, PlutusData, PlutusList } = Serialization;
import { HexBlob, toHex } from "@blaze-cardano/core";

/*
  This is intended to be a clean-room of UPLC from spec however the real implementation functionally differs.
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
    let blockLength = this.popByte();
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
      blockLength = this.popByte();
    }
    if (arr == undefined) {
      throw new Error(
        "UPLCParser #parseByteString: failed to parse any length.",
      );
    }
    return arr;
  }

  #parsePData(bits: Byte[], d: number): Some<Data> {
    const [constantType, ...bits2] = bits
    //console.log(`Parsing ${constantType}`)
    if (constantType == 0) {
      return { value: this.#parseInteger() };
    } else if (constantType == 1) {
      return { value: this.#parseByteString() };
    } else if (constantType == 3) {
      return { value: 0n };
    } else if (constantType == 4) {
      return {
        value: {
          constructor: this.popBit() == 0 ? 0n : 1n,
          fields: { items: [] },
        },
      };
    } else if (constantType == 7){
      const [a,b] = bits2
      if (a==5){
        //console.log(`Parsing a list of ${b}, depth ${d}`)
        return {
          value: {
            items: this.#parseList(() => this.#parsePData([b!], d+1)).map((x) => x.value),
          },
        }
      }else if (a == 7 && b==6){
        //console.log(`loading pairs 2 ${bits}`)
        // const a = this.#parsePData([], d+1).value;
        // const b = this.#parsePData([], d+1).value;
        // return { value: { items: [a, b] } };
        throw new Error("No pairs!")
      }else{
        //return this.#parsePData()
        throw new Error(`Type application cannot use tags ${bits}`)
      }
    } else if (constantType == 8) {
      return {
        value: PlutusData.fromCbor(
          HexBlob(toHex(this.#parseByteString())),
        ).toCore(),
      };
    } else {
      throw new Error(`Cannot parse type ${constantType}`);
    }
  }

  #parseConst(){
    const bits = this.#parseList(() => this.popBits(4));
    console.log(`Parsing with type ${bits}`)
    return this.#parsePData(bits, 0)
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
    return new UPLCParser(Hex.decode(hex));
  }
}
