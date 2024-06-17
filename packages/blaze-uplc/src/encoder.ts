/* This package has basic UPLC manipulation but does not yet implement a machine */
import { Encoder as FlatEncoder } from "./flat";
import type { ParsedProgram, ParsedTerm } from "./types";
import { BuiltinFunctions, TermNames, termTags } from "./types";
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
