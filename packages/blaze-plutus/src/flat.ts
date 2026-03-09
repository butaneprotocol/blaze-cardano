import type {
  Constant,
  ConstantType,
  DeBruijn,
  DefaultFunction,
  Program,
  Term,
} from "./types";
import { decodePlutusData, encodePlutusData } from "./cbor";

// --- Zigzag encoding ---

function zigzag(n: bigint): bigint {
  return n >= 0n ? n * 2n : -n * 2n - 1n;
}

function unzigzag(n: bigint): bigint {
  return (n & 1n) === 0n ? n >> 1n : -(n >> 1n) - 1n;
}

// --- Builtin tag mapping ---

const BUILTIN_TAG_TO_NAME: DefaultFunction[] = [
  "addInteger", // 0
  "subtractInteger", // 1
  "multiplyInteger", // 2
  "divideInteger", // 3
  "quotientInteger", // 4
  "remainderInteger", // 5
  "modInteger", // 6
  "equalsInteger", // 7
  "lessThanInteger", // 8
  "lessThanEqualsInteger", // 9
  "appendByteString", // 10
  "consByteString", // 11
  "sliceByteString", // 12
  "lengthOfByteString", // 13
  "indexByteString", // 14
  "equalsByteString", // 15
  "lessThanByteString", // 16
  "lessThanEqualsByteString", // 17
  "sha2_256", // 18
  "sha3_256", // 19
  "blake2b_256", // 20
  "verifyEd25519Signature", // 21
  "appendString", // 22
  "equalsString", // 23
  "encodeUtf8", // 24
  "decodeUtf8", // 25
  "ifThenElse", // 26
  "chooseUnit", // 27
  "trace", // 28
  "fstPair", // 29
  "sndPair", // 30
  "chooseList", // 31
  "mkCons", // 32
  "headList", // 33
  "tailList", // 34
  "nullList", // 35
  "chooseData", // 36
  "constrData", // 37
  "mapData", // 38
  "listData", // 39
  "iData", // 40
  "bData", // 41
  "unConstrData", // 42
  "unMapData", // 43
  "unListData", // 44
  "unIData", // 45
  "unBData", // 46
  "equalsData", // 47
  "mkPairData", // 48
  "mkNilData", // 49
  "mkNilPairData", // 50
  "serialiseData", // 51
  "verifyEcdsaSecp256k1Signature", // 52
  "verifySchnorrSecp256k1Signature", // 53
  "bls12_381_G1_add", // 54
  "bls12_381_G1_neg", // 55
  "bls12_381_G1_scalarMul", // 56
  "bls12_381_G1_equal", // 57
  "bls12_381_G1_compress", // 58
  "bls12_381_G1_uncompress", // 59
  "bls12_381_G1_hashToGroup", // 60
  "bls12_381_G2_add", // 61
  "bls12_381_G2_neg", // 62
  "bls12_381_G2_scalarMul", // 63
  "bls12_381_G2_equal", // 64
  "bls12_381_G2_compress", // 65
  "bls12_381_G2_uncompress", // 66
  "bls12_381_G2_hashToGroup", // 67
  "bls12_381_millerLoop", // 68
  "bls12_381_mulMlResult", // 69
  "bls12_381_finalVerify", // 70
  "keccak_256", // 71
  "blake2b_224", // 72
  "integerToByteString", // 73
  "byteStringToInteger", // 74
  "andByteString", // 75
  "orByteString", // 76
  "xorByteString", // 77
  "complementByteString", // 78
  "readBit", // 79
  "writeBits", // 80
  "replicateByte", // 81
  "shiftByteString", // 82
  "rotateByteString", // 83
  "countSetBits", // 84
  "findFirstSetBit", // 85
  "ripemd_160", // 86
  "expModInteger", // 87
  "dropList", // 88
  "lengthOfArray", // 89
  "listToArray", // 90
  "indexArray", // 91
  "bls12_381_G1_multiScalarMul", // 92
  "bls12_381_G2_multiScalarMul", // 93
  "insertCoin", // 94
  "lookupCoin", // 95
  "unionValue", // 96
  "valueContains", // 97
  "valueData", // 98
  "unValueData", // 99
  "scaleValue", // 100
];

const BUILTIN_NAME_TO_TAG: Record<string, number> = {};
for (let i = 0; i < BUILTIN_TAG_TO_NAME.length; i++) {
  BUILTIN_NAME_TO_TAG[BUILTIN_TAG_TO_NAME[i]!] = i;
}

// --- Flat Decoder ---

class FlatDecoder {
  private readonly buffer: Uint8Array;
  private pos: number;
  private usedBits: number;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.pos = 0;
    this.usedBits = 0;
  }

  bit(): boolean {
    if (this.pos >= this.buffer.length) throw new Error("flat: end of input");
    const b = (this.buffer[this.pos]! & (128 >> this.usedBits)) !== 0;
    if (this.usedBits === 7) {
      this.usedBits = 0;
      this.pos++;
    } else {
      this.usedBits++;
    }
    return b;
  }

  bits8(n: number): number {
    if (n === 0) return 0;
    let result = 0;
    for (let i = 0; i < n; i++) {
      result = (result << 1) | (this.bit() ? 1 : 0);
    }
    return result;
  }

  word(): number {
    let result = 0;
    let shift = 0;
    for (;;) {
      const b = this.bits8(8);
      result |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    return result;
  }

  bigWord(): bigint {
    const chunks: number[] = [];
    for (;;) {
      const b = this.bits8(8);
      chunks.push(b & 0x7f);
      if ((b & 0x80) === 0) break;
    }
    let result = 0n;
    for (let i = chunks.length - 1; i >= 0; i--) {
      result = (result << 7n) | BigInt(chunks[i]!);
    }
    return result;
  }

  integer(): bigint {
    return unzigzag(this.bigWord());
  }

  filler(): void {
    while (!this.bit()) {
      // skip 0-bits until 1-bit
    }
  }

  bytes(): Uint8Array {
    this.filler();
    const result: number[] = [];
    for (;;) {
      if (this.pos >= this.buffer.length) throw new Error("flat: end of input");
      const chunkLen = this.buffer[this.pos]!;
      this.pos++;
      if (chunkLen === 0) break;
      if (this.pos + chunkLen > this.buffer.length)
        throw new Error("flat: end of input");
      for (let i = 0; i < chunkLen; i++) {
        result.push(this.buffer[this.pos + i]!);
      }
      this.pos += chunkLen;
    }
    return new Uint8Array(result);
  }
}

// --- Decode program ---

export function decodeFlatDeBruijn(buffer: Uint8Array): Program<DeBruijn> {
  const d = new FlatDecoder(buffer);
  const major = d.word();
  const minor = d.word();
  const patch = d.word();
  const term = decodeTerm(d);
  d.filler();
  return { version: { major, minor, patch }, term };
}

function decodeTerm(d: FlatDecoder): Term<DeBruijn> {
  const tag = d.bits8(4);
  switch (tag) {
    case 0: {
      const index = d.word();
      return { tag: "var", name: { index } };
    }
    case 1: {
      const body = decodeTerm(d);
      return { tag: "delay", term: body };
    }
    case 2: {
      const body = decodeTerm(d);
      return { tag: "lambda", parameter: { index: 0 }, body };
    }
    case 3: {
      const func = decodeTerm(d);
      const arg = decodeTerm(d);
      return { tag: "apply", function: func, argument: arg };
    }
    case 4: {
      const con = decodeConstant(d);
      return { tag: "constant", value: con };
    }
    case 5: {
      const body = decodeTerm(d);
      return { tag: "force", term: body };
    }
    case 6:
      return { tag: "error" };
    case 7: {
      const fnTag = d.bits8(7);
      const name = BUILTIN_TAG_TO_NAME[fnTag];
      if (name === undefined)
        throw new Error(`flat: invalid builtin tag ${fnTag}`);
      return { tag: "builtin", function: name };
    }
    case 8: {
      const index = d.word();
      const fields = decodeBitPrefixedTermList(d);
      return { tag: "constr", index, fields };
    }
    case 9: {
      const constr = decodeTerm(d);
      const branches = decodeBitPrefixedTermList(d);
      return { tag: "case", constr, branches };
    }
    default:
      throw new Error(`flat: invalid term tag ${tag}`);
  }
}

function decodeBitPrefixedTermList(d: FlatDecoder): Term<DeBruijn>[] {
  const items: Term<DeBruijn>[] = [];
  while (d.bit()) {
    items.push(decodeTerm(d));
  }
  return items;
}

// --- Constant decoding ---

function decodeConstant(d: FlatDecoder): Constant {
  const tags: number[] = [];
  while (d.bit()) {
    tags.push(d.bits8(4));
  }
  let idx = 0;

  function parseType(): ConstantType {
    if (idx >= tags.length) throw new Error("flat: invalid constant type tags");
    const tag = tags[idx]!;
    idx++;
    switch (tag) {
      case 0:
        return { tag: "integer" };
      case 1:
        return { tag: "bytestring" };
      case 2:
        return { tag: "string" };
      case 3:
        return { tag: "unit" };
      case 4:
        return { tag: "bool" };
      case 5: {
        const elem = parseType();
        return { tag: "list", element: elem };
      }
      case 6: {
        const first = parseType();
        const second = parseType();
        return { tag: "pair", first, second };
      }
      case 7: {
        if (idx >= tags.length)
          throw new Error("flat: invalid constant type tags");
        const next = tags[idx]!;
        idx++;
        if (next === 5) {
          const elem = parseType();
          return { tag: "list", element: elem };
        } else if (next === 7) {
          if (idx >= tags.length)
            throw new Error("flat: invalid constant type tags");
          const inner = tags[idx]!;
          idx++;
          if (inner === 6) {
            const first = parseType();
            const second = parseType();
            return { tag: "pair", first, second };
          }
          throw new Error(`flat: unknown type application 7,7,${inner}`);
        }
        throw new Error(`flat: unknown type application 7,${next}`);
      }
      case 8:
        return { tag: "data" };
      default:
        throw new Error(`flat: unknown constant type tag ${tag}`);
    }
  }

  const typ = parseType();
  return decodeConstantValue(d, typ);
}

function decodeConstantValue(d: FlatDecoder, typ: ConstantType): Constant {
  switch (typ.tag) {
    case "integer":
      return { type: "integer", value: d.integer() };
    case "bytestring":
      return { type: "bytestring", value: d.bytes() };
    case "string": {
      const bs = d.bytes();
      const decoder = new TextDecoder("utf-8", { fatal: true });
      return { type: "string", value: decoder.decode(bs) };
    }
    case "unit":
      return { type: "unit" };
    case "bool":
      return { type: "bool", value: d.bit() };
    case "data": {
      const bs = d.bytes();
      const data = decodePlutusData(bs);
      return { type: "data", value: data };
    }
    case "list": {
      const values: Constant[] = [];
      while (d.bit()) {
        values.push(decodeConstantValue(d, typ.element));
      }
      return { type: "list", itemType: typ.element, values };
    }
    case "pair": {
      const first = decodeConstantValue(d, typ.first);
      const second = decodeConstantValue(d, typ.second);
      return {
        type: "pair",
        fstType: typ.first,
        sndType: typ.second,
        first,
        second,
      };
    }
    default:
      throw new Error(
        `flat: unsupported constant type ${(typ as ConstantType).tag}`,
      );
  }
}

// --- Flat Encoder ---

class FlatEncoder {
  private readonly buffer: number[];
  private currentByte: number;
  private usedBits: number;

  constructor() {
    this.buffer = [];
    this.currentByte = 0;
    this.usedBits = 0;
  }

  bit(val: boolean): void {
    if (val) {
      this.currentByte |= 128 >> this.usedBits;
    }
    if (this.usedBits === 7) {
      this.buffer.push(this.currentByte);
      this.currentByte = 0;
      this.usedBits = 0;
    } else {
      this.usedBits++;
    }
  }

  bits(n: number, val: number): void {
    for (let i = n - 1; i >= 0; i--) {
      this.bit((val & (1 << i)) !== 0);
    }
  }

  byte8(val: number): void {
    this.bits(8, val);
  }

  word(val: number): void {
    let v = val;
    for (;;) {
      const chunk = v & 0x7f;
      v >>>= 7;
      if (v === 0) {
        this.byte8(chunk);
        break;
      } else {
        this.byte8(chunk | 0x80);
      }
    }
  }

  bigWord(val: bigint): void {
    if (val === 0n) {
      this.byte8(0);
      return;
    }
    const chunks: number[] = [];
    let v = val;
    while (v > 0n) {
      chunks.push(Number(v & 0x7fn));
      v >>= 7n;
    }
    for (let i = 0; i < chunks.length; i++) {
      if (i < chunks.length - 1) {
        this.byte8(chunks[i]! | 0x80);
      } else {
        this.byte8(chunks[i]!);
      }
    }
  }

  integer(val: bigint): void {
    this.bigWord(zigzag(val));
  }

  byteArray(data: Uint8Array): void {
    this.filler();
    let offset = 0;
    while (offset < data.length) {
      const remaining = data.length - offset;
      const chunkLen = Math.min(remaining, 255);
      this.buffer.push(chunkLen);
      for (let i = 0; i < chunkLen; i++) {
        this.buffer.push(data[offset + i]!);
      }
      offset += chunkLen;
    }
    this.buffer.push(0);
  }

  filler(): void {
    if (this.usedBits === 0) {
      this.buffer.push(0x01);
    } else {
      const remaining = 8 - this.usedBits;
      for (let i = 0; i < remaining - 1; i++) {
        this.bit(false);
      }
      this.bit(true);
    }
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

// --- Encode program ---

export function encodeFlatDeBruijn(program: Program<DeBruijn>): Uint8Array {
  const e = new FlatEncoder();
  e.word(program.version.major);
  e.word(program.version.minor);
  e.word(program.version.patch);
  encodeTermFlat(e, program.term);
  e.filler();
  return e.toBytes();
}

function encodeTermFlat(e: FlatEncoder, term: Term<DeBruijn>): void {
  switch (term.tag) {
    case "var":
      e.bits(4, 0);
      e.word(term.name.index);
      break;
    case "delay":
      e.bits(4, 1);
      encodeTermFlat(e, term.term);
      break;
    case "lambda":
      e.bits(4, 2);
      encodeTermFlat(e, term.body);
      break;
    case "apply":
      e.bits(4, 3);
      encodeTermFlat(e, term.function);
      encodeTermFlat(e, term.argument);
      break;
    case "constant":
      e.bits(4, 4);
      encodeConstantFlat(e, term.value);
      break;
    case "force":
      e.bits(4, 5);
      encodeTermFlat(e, term.term);
      break;
    case "error":
      e.bits(4, 6);
      break;
    case "builtin": {
      e.bits(4, 7);
      const fnTag = BUILTIN_NAME_TO_TAG[term.function];
      if (fnTag === undefined)
        throw new Error(`flat: unknown builtin ${term.function}`);
      e.bits(7, fnTag);
      break;
    }
    case "constr":
      e.bits(4, 8);
      e.word(term.index);
      encodeBitPrefixedTermListFlat(e, term.fields);
      break;
    case "case":
      e.bits(4, 9);
      encodeTermFlat(e, term.constr);
      encodeBitPrefixedTermListFlat(e, term.branches);
      break;
  }
}

function encodeBitPrefixedTermListFlat(
  e: FlatEncoder,
  terms: ReadonlyArray<Term<DeBruijn>>,
): void {
  for (const term of terms) {
    e.bit(true);
    encodeTermFlat(e, term);
  }
  e.bit(false);
}

// --- Constant encoding ---

function encodeTypeTag(e: FlatEncoder, tag: number): void {
  e.bit(true);
  e.bits(4, tag);
}

function encodeTypeEnd(e: FlatEncoder): void {
  e.bit(false);
}

function encodeTypeTags(e: FlatEncoder, typ: ConstantType): void {
  switch (typ.tag) {
    case "integer":
      encodeTypeTag(e, 0);
      break;
    case "bytestring":
      encodeTypeTag(e, 1);
      break;
    case "string":
      encodeTypeTag(e, 2);
      break;
    case "unit":
      encodeTypeTag(e, 3);
      break;
    case "bool":
      encodeTypeTag(e, 4);
      break;
    case "data":
      encodeTypeTag(e, 8);
      break;
    case "list":
      encodeTypeTag(e, 7);
      encodeTypeTag(e, 5);
      encodeTypeTags(e, typ.element);
      break;
    case "pair":
      encodeTypeTag(e, 7);
      encodeTypeTag(e, 7);
      encodeTypeTag(e, 6);
      encodeTypeTags(e, typ.first);
      encodeTypeTags(e, typ.second);
      break;
    default:
      throw new Error(
        `flat: unsupported type for encoding: ${(typ as ConstantType).tag}`,
      );
  }
}

function encodeConstantFlat(e: FlatEncoder, con: Constant): void {
  switch (con.type) {
    case "integer":
      encodeTypeTag(e, 0);
      encodeTypeEnd(e);
      e.integer(con.value);
      break;
    case "bytestring":
      encodeTypeTag(e, 1);
      encodeTypeEnd(e);
      e.byteArray(con.value);
      break;
    case "string": {
      encodeTypeTag(e, 2);
      encodeTypeEnd(e);
      const encoded = new TextEncoder().encode(con.value);
      e.byteArray(encoded);
      break;
    }
    case "unit":
      encodeTypeTag(e, 3);
      encodeTypeEnd(e);
      break;
    case "bool":
      encodeTypeTag(e, 4);
      encodeTypeEnd(e);
      e.bit(con.value);
      break;
    case "data": {
      encodeTypeTag(e, 8);
      encodeTypeEnd(e);
      const cbor = encodePlutusData(con.value);
      e.byteArray(cbor);
      break;
    }
    case "list":
      encodeTypeTag(e, 7);
      encodeTypeTag(e, 5);
      encodeTypeTags(e, con.itemType);
      encodeTypeEnd(e);
      for (const val of con.values) {
        e.bit(true);
        encodeConstantValueFlat(e, val);
      }
      e.bit(false);
      break;
    case "pair":
      encodeTypeTag(e, 7);
      encodeTypeTag(e, 7);
      encodeTypeTag(e, 6);
      encodeTypeTags(e, con.fstType);
      encodeTypeTags(e, con.sndType);
      encodeTypeEnd(e);
      encodeConstantValueFlat(e, con.first);
      encodeConstantValueFlat(e, con.second);
      break;
    default:
      throw new Error(
        `flat: unsupported constant type for encoding: ${con.type}`,
      );
  }
}

function encodeConstantValueFlat(e: FlatEncoder, con: Constant): void {
  switch (con.type) {
    case "integer":
      e.integer(con.value);
      break;
    case "bytestring":
      e.byteArray(con.value);
      break;
    case "string":
      e.byteArray(new TextEncoder().encode(con.value));
      break;
    case "unit":
      break;
    case "bool":
      e.bit(con.value);
      break;
    case "data":
      e.byteArray(encodePlutusData(con.value));
      break;
    case "list":
      for (const val of con.values) {
        e.bit(true);
        encodeConstantValueFlat(e, val);
      }
      e.bit(false);
      break;
    case "pair":
      encodeConstantValueFlat(e, con.first);
      encodeConstantValueFlat(e, con.second);
      break;
    default:
      throw new Error(
        `flat: unsupported constant type for encoding: ${con.type}`,
      );
  }
}
