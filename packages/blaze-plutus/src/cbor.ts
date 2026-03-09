import type { PlutusData } from "./types";

const CHUNK_SIZE = 64;

// --- CBOR Encoder ---

export function encodePlutusData(data: PlutusData): Uint8Array {
  const buf: number[] = [];
  encodeData(buf, data);
  return new Uint8Array(buf);
}

function encodeData(buf: number[], data: PlutusData): void {
  switch (data.tag) {
    case "constr":
      encodeConstr(buf, data.index, data.fields);
      break;
    case "map":
      encodeMap(buf, data.entries);
      break;
    case "list":
      encodeList(buf, data.values);
      break;
    case "integer":
      encodeInteger(buf, data.value);
      break;
    case "bytestring":
      encodeByteString(buf, data.value);
      break;
  }
}

function encodeConstr(
  buf: number[],
  tag: bigint,
  fields: ReadonlyArray<PlutusData>,
): void {
  if (tag <= 6n) {
    writeTag(buf, 121n + tag);
  } else if (tag <= 127n) {
    writeTag(buf, 1280n + (tag - 7n));
  } else {
    writeTag(buf, 102n);
    writeArrayHeader(buf, 2);
    writeUint(buf, tag);
  }

  if (fields.length === 0) {
    writeArrayHeader(buf, 0);
  } else {
    buf.push(0x9f);
    for (const field of fields) {
      encodeData(buf, field);
    }
    buf.push(0xff);
  }
}

function encodeMap(
  buf: number[],
  entries: ReadonlyArray<readonly [PlutusData, PlutusData]>,
): void {
  writeMapHeader(buf, entries.length);
  for (const [key, value] of entries) {
    encodeData(buf, key);
    encodeData(buf, value);
  }
}

function encodeList(buf: number[], items: ReadonlyArray<PlutusData>): void {
  if (items.length === 0) {
    writeArrayHeader(buf, 0);
  } else {
    buf.push(0x9f);
    for (const item of items) {
      encodeData(buf, item);
    }
    buf.push(0xff);
  }
}

function encodeInteger(buf: number[], value: bigint): void {
  if (value === 0n) {
    buf.push(0x00);
    return;
  }

  if (value > 0n) {
    if (value < 0x10000000000000000n) {
      writeUint(buf, value);
    } else {
      writeTag(buf, 2n);
      encodeByteString(buf, bigintToBigEndianBytes(value));
    }
  } else {
    const absMinusOne = -value - 1n;
    if (absMinusOne < 0x10000000000000000n) {
      writeNint(buf, absMinusOne);
    } else {
      writeTag(buf, 3n);
      encodeByteString(buf, bigintToBigEndianBytes(absMinusOne));
    }
  }
}

function bigintToBigEndianBytes(value: bigint): Uint8Array {
  if (value === 0n) return new Uint8Array([0]);
  const bytes: number[] = [];
  let v = value;
  while (v > 0n) {
    bytes.unshift(Number(v & 0xffn));
    v >>= 8n;
  }
  return new Uint8Array(bytes);
}

function encodeByteString(buf: number[], bs: Uint8Array): void {
  if (bs.length <= CHUNK_SIZE) {
    writeBytesHeader(buf, bs.length);
    for (let i = 0; i < bs.length; i++) buf.push(bs[i]!);
  } else {
    buf.push(0x5f);
    let offset = 0;
    while (offset < bs.length) {
      const end = Math.min(offset + CHUNK_SIZE, bs.length);
      const chunkLen = end - offset;
      writeBytesHeader(buf, chunkLen);
      for (let i = offset; i < end; i++) buf.push(bs[i]!);
      offset = end;
    }
    buf.push(0xff);
  }
}

// --- Low-level CBOR writers ---

function writeUint(buf: number[], val: bigint): void {
  writeTypedInt(buf, 0x00, val);
}

function writeNint(buf: number[], val: bigint): void {
  writeTypedInt(buf, 0x20, val);
}

function writeTag(buf: number[], val: bigint): void {
  writeTypedInt(buf, 0xc0, val);
}

function writeArrayHeader(buf: number[], len: number): void {
  writeTypedInt(buf, 0x80, BigInt(len));
}

function writeMapHeader(buf: number[], len: number): void {
  writeTypedInt(buf, 0xa0, BigInt(len));
}

function writeBytesHeader(buf: number[], len: number): void {
  writeTypedInt(buf, 0x40, BigInt(len));
}

function writeTypedInt(buf: number[], major: number, val: bigint): void {
  if (val < 24n) {
    buf.push(major | Number(val));
  } else if (val <= 0xffn) {
    buf.push(major | 24);
    buf.push(Number(val));
  } else if (val <= 0xffffn) {
    buf.push(major | 25);
    buf.push(Number((val >> 8n) & 0xffn));
    buf.push(Number(val & 0xffn));
  } else if (val <= 0xffffffffn) {
    buf.push(major | 26);
    buf.push(Number((val >> 24n) & 0xffn));
    buf.push(Number((val >> 16n) & 0xffn));
    buf.push(Number((val >> 8n) & 0xffn));
    buf.push(Number(val & 0xffn));
  } else {
    buf.push(major | 27);
    buf.push(Number((val >> 56n) & 0xffn));
    buf.push(Number((val >> 48n) & 0xffn));
    buf.push(Number((val >> 40n) & 0xffn));
    buf.push(Number((val >> 32n) & 0xffn));
    buf.push(Number((val >> 24n) & 0xffn));
    buf.push(Number((val >> 16n) & 0xffn));
    buf.push(Number((val >> 8n) & 0xffn));
    buf.push(Number(val & 0xffn));
  }
}

// --- CBOR Decoder ---

export function decodePlutusData(bytes: Uint8Array): PlutusData {
  const state = { data: bytes, pos: 0 };
  return decodeDataItem(state);
}

interface CborState {
  data: Uint8Array;
  pos: number;
}

function readByte(state: CborState): number {
  if (state.pos >= state.data.length) throw new Error("CBOR: end of input");
  return state.data[state.pos++]!;
}

function readBytes(state: CborState, n: number): Uint8Array {
  if (state.pos + n > state.data.length) throw new Error("CBOR: end of input");
  const slice = state.data.subarray(state.pos, state.pos + n);
  state.pos += n;
  return slice;
}

function readArgument(state: CborState, additional: number): bigint {
  if (additional < 24) return BigInt(additional);
  switch (additional) {
    case 24:
      return BigInt(readByte(state));
    case 25: {
      const bytes = readBytes(state, 2);
      return BigInt((bytes[0]! << 8) | bytes[1]!);
    }
    case 26: {
      const bytes = readBytes(state, 4);
      return BigInt(
        ((bytes[0]! << 24) |
          (bytes[1]! << 16) |
          (bytes[2]! << 8) |
          bytes[3]!) >>>
          0,
      );
    }
    case 27: {
      const bytes = readBytes(state, 8);
      let val = 0n;
      for (let i = 0; i < 8; i++) {
        val = (val << 8n) | BigInt(bytes[i]!);
      }
      return val;
    }
    default:
      throw new Error(`CBOR: invalid additional info ${additional}`);
  }
}

function decodeDataItem(state: CborState): PlutusData {
  const initial = readByte(state);
  const major = initial >> 5;
  const additional = initial & 0x1f;

  switch (major) {
    case 0: {
      const val = readArgument(state, additional);
      return { tag: "integer", value: val };
    }
    case 1: {
      const val = readArgument(state, additional);
      return { tag: "integer", value: -1n - val };
    }
    case 2: {
      if (additional === 31) {
        const chunks: number[] = [];
        while (true) {
          const next = readByte(state);
          if (next === 0xff) break;
          const chunkMajor = next >> 5;
          if (chunkMajor !== 2)
            throw new Error("CBOR: invalid byte string chunk");
          const chunkAdd = next & 0x1f;
          const chunkLen = Number(readArgument(state, chunkAdd));
          const chunk = readBytes(state, chunkLen);
          for (let i = 0; i < chunk.length; i++) chunks.push(chunk[i]!);
        }
        return { tag: "bytestring", value: new Uint8Array(chunks) };
      } else {
        const len = Number(readArgument(state, additional));
        const bytes = readBytes(state, len);
        return { tag: "bytestring", value: new Uint8Array(bytes) };
      }
    }
    case 4: {
      if (additional === 31) {
        const items: PlutusData[] = [];
        while (true) {
          if (state.pos >= state.data.length)
            throw new Error("CBOR: end of input");
          if (state.data[state.pos] === 0xff) {
            state.pos++;
            break;
          }
          items.push(decodeDataItem(state));
        }
        return { tag: "list", values: items };
      } else {
        const len = Number(readArgument(state, additional));
        const items: PlutusData[] = [];
        for (let i = 0; i < len; i++) {
          items.push(decodeDataItem(state));
        }
        return { tag: "list", values: items };
      }
    }
    case 5: {
      const len = Number(readArgument(state, additional));
      const entries: [PlutusData, PlutusData][] = [];
      for (let i = 0; i < len; i++) {
        const key = decodeDataItem(state);
        const value = decodeDataItem(state);
        entries.push([key, value]);
      }
      return { tag: "map", entries };
    }
    case 6: {
      const tagVal = readArgument(state, additional);
      return decodeTagged(state, tagVal);
    }
    default:
      throw new Error(`CBOR: unsupported major type ${major}`);
  }
}

function decodeTagged(state: CborState, tag: bigint): PlutusData {
  if (tag >= 121n && tag <= 127n) {
    const index = tag - 121n;
    const fields = decodeArrayFields(state);
    return { tag: "constr", index, fields };
  } else if (tag >= 1280n && tag <= 1400n) {
    const index = 7n + (tag - 1280n);
    const fields = decodeArrayFields(state);
    return { tag: "constr", index, fields };
  } else if (tag === 102n) {
    const initial = readByte(state);
    const major = initial >> 5;
    if (major !== 4) throw new Error("CBOR: expected array for tag 102");
    const add = initial & 0x1f;
    const arrLen = Number(readArgument(state, add));
    if (arrLen !== 2)
      throw new Error("CBOR: expected 2-element array for tag 102");

    const discByte = readByte(state);
    const discMajor = discByte >> 5;
    if (discMajor !== 0)
      throw new Error("CBOR: expected unsigned int discriminator");
    const discAdd = discByte & 0x1f;
    const disc = readArgument(state, discAdd);

    const fields = decodeArrayFields(state);
    return { tag: "constr", index: disc, fields };
  } else if (tag === 2n) {
    const bsData = decodeDataItem(state);
    if (bsData.tag !== "bytestring")
      throw new Error("CBOR: expected byte string for big int");
    let val = 0n;
    for (const b of bsData.value) {
      val = (val << 8n) | BigInt(b);
    }
    return { tag: "integer", value: val };
  } else if (tag === 3n) {
    const bsData = decodeDataItem(state);
    if (bsData.tag !== "bytestring")
      throw new Error("CBOR: expected byte string for big nint");
    let val = 0n;
    for (const b of bsData.value) {
      val = (val << 8n) | BigInt(b);
    }
    return { tag: "integer", value: -(val + 1n) };
  } else {
    throw new Error(`CBOR: unsupported tag ${tag}`);
  }
}

function decodeArrayFields(state: CborState): PlutusData[] {
  const initial = readByte(state);
  const major = initial >> 5;
  if (major !== 4) throw new Error("CBOR: expected array");
  const additional = initial & 0x1f;

  if (additional === 31) {
    const items: PlutusData[] = [];
    while (true) {
      if (state.pos >= state.data.length) throw new Error("CBOR: end of input");
      if (state.data[state.pos] === 0xff) {
        state.pos++;
        break;
      }
      items.push(decodeDataItem(state));
    }
    return items;
  } else {
    const len = Number(readArgument(state, additional));
    const items: PlutusData[] = [];
    for (let i = 0; i < len; i++) {
      items.push(decodeDataItem(state));
    }
    return items;
  }
}
