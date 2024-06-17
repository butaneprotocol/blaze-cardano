import { Serialization } from "@cardano-sdk/core";
import { Parser as FlatDecoder } from "./flat";
import type { Byte, Data, ParsedProgram, ParsedTerm, SemVer } from "./types";
import { BuiltinFunctions, DataType, TermNames, termTags } from "./types";
import { HexBlob, fromHex, toHex } from "@blaze-cardano/core";
/*
  This is intended to be a clean-room of UPLC from spec however the real implementation functionally differs.
  * blame rvcas/microproofs for polluting the clean-room (helping me)
  Inconsistencies are noted:
    - Integer representation is not strictly lists, parseList2 fixes this
  Arbitrary:
    - Unit is Constr(0, []) simply because I know this is how aiken does it
*/

export class UPLCDecoder extends FlatDecoder {
  #decodeVersion(): SemVer {
    const major = this.popByte();
    const minor = this.popByte();
    const patch = this.popByte();
    return `${major}.${minor}.${patch}`;
  }

  #decodeList<Item>(decodeItem: () => Item): Item[] {
    const list: Item[] = [];
    let cont = this.popBit();
    while (cont == 1) {
      list.push(decodeItem());
      cont = this.popBit();
    }
    return list;
  }

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

  #decodeNatural() {
    const bytes = this.#decodeList2(() => this.popBits(7) as number);
    let val = 0n;
    for (let i = 0; i < bytes.length; i += 1) {
      val += BigInt(bytes[i]!) << (BigInt(i) * 7n);
    }
    return val;
  }

  #decodeInteger() {
    const nat = this.#decodeNatural();
    if (nat % 2n === 0n) {
      return nat / 2n;
    } else {
      return -((nat + 1n) / 2n);
    }
  }

  #decodeByteString() {
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
        "UPLCParser #decodeByteString: failed to decode any length.",
      );
    }
    return arr;
  }

  #decodeBool() {
    return { constructor: this.popBit() == 0 ? 0n : 1n, items: [] };
  }

  #decodeCborData() {
    return Serialization.PlutusData.fromCbor(
      HexBlob(toHex(this.#decodeByteString())),
    ).toCore();
  }

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
          throw new Error("UPLCParser #decodeType: invalid type application");
        }
      } else {
        return [DataType[head!]! as DataType, type.slice(1)];
      }
    }
  }

  #decodeConst() {
    const bits = this.#decodeList(() => this.popBits(4));
    const [dataType, remainder] = this.#decodeType(bits);
    if (remainder.length != 0) {
      throw new Error("UPLCParser #decodeConst: invalid type application");
    }
    const result = this.#decodeData(dataType);
    return result;
  }

  #decodeTerm(lamDepth: bigint): ParsedTerm {
    const termTag = this.popBits(4);
    const maybeTerm = Object.entries(
      termTags as Record<TermNames[keyof TermNames], number>,
    ).find(([, tag]) => tag == termTag) as
      | [TermNames[keyof TermNames], number]
      | undefined;
    if (!maybeTerm) {
      throw new Error(`UPLCParser: could not decode the term tag ${termTag}`);
    }
    const term = maybeTerm[0];
    if (term == "Var") {
      return {
        type: TermNames["var"],
        name: this.#decodeNatural(),
      };
    }
    if (term == "Lambda") {
      return {
        type: TermNames["lam"],
        name: lamDepth,
        body: this.#decodeTerm(lamDepth + 1n),
      };
    } else if (term == "Apply") {
      return {
        type: TermNames["apply"],
        function: this.#decodeTerm(lamDepth),
        argument: this.#decodeTerm(lamDepth),
      };
    } else if (term == "Constant") {
      return {
        type: TermNames["const"],
        value: this.#decodeConst(),
      };
    } else if (term == "Builtin") {
      return {
        type: TermNames["builtin"],
        function: BuiltinFunctions[this.popBits(7)]!,
      };
    } else if (term == "Delay") {
      return {
        type: TermNames["delay"],
        term: this.#decodeTerm(lamDepth),
      };
    } else if (term == "Force") {
      return {
        type: TermNames["force"],
        term: this.#decodeTerm(lamDepth),
      };
    } else if (term == "Constr") {
      throw new Error(
        `UPLCParser: decoder is not implemented for tag ${termTag} or term (${term})`,
      );
    } else if (term == "Case") {
      throw new Error(
        `UPLCParser: decoder is not implemented for tag ${termTag} or term (${term})`,
      );
    } else if (term == "Error") {
      return {
        type: TermNames["error"],
      };
    } else {
      throw new Error("UPLCParser: decoder no matching termType, UNREACHABLE!");
    }
  }

  #decodeProgram(): ParsedProgram {
    const version = this.#decodeVersion();
    const body = this.#decodeTerm(0n);
    return {
      version,
      body,
    };
  }

  decode(): ParsedProgram {
    return this.#decodeProgram();
  }

  static override fromHex(hex: string) {
    return new UPLCDecoder(fromHex(hex));
  }
}
