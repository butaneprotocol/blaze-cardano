import { fromHex } from "@blaze-cardano/core";
import { type Bit, Byte } from "./types";

export class Parser {
  #bytes: Uint8Array;
  #index = 0;
  #bitAccessor = 128; // Start with the highest bit in a byte

  constructor(bytes: Uint8Array) {
    this.#bytes = bytes;
  }

  static fromHex(hex: string) {
    return new this(fromHex(hex));
  }

  popBit(): Bit {
    if (this.#bitAccessor < 1) {
      this.#bitAccessor = 128;
      this.#index += 1;
    }
    if (this.#index < this.#bytes.length) {
      const ret = this.#bytes[this.#index]! & this.#bitAccessor ? 1 : 0;
      this.#bitAccessor >>= 1;
      return ret;
    } else {
      throw new Error("Flat Parser: popBit failed end-of-array.");
    }
  }

  popBits(n: number): Byte {
    if (n > 8) {
      throw new Error("Flat Parser: popBits cannot pop more than 8");
    }
    let l = 0;
    while (n > 0) {
      l = (l << 1) | this.popBit();
      n--;
    }
    return Byte(l);
  }

  popByte(): Byte {
    if (this.#bitAccessor !== 128) {
      console.warn("Flat Parser: popByte unaligned, trailing bits discarded.");
      this.#bitAccessor = 128;
      this.#index += 1;
    }
    if (this.#index < this.#bytes.length) {
      const ret = this.#bytes[this.#index]!;
      this.#index += 1;
      return Byte(ret);
    } else {
      throw new Error("Flat Parser: popByte failed end-of-array.");
    }
  }

  takeBytes(n: number): Uint8Array {
    if (this.#index + n > this.#bytes.length) {
      throw new Error("Flat Parser: takeBytes failed end-of-array.");
    }
    if (this.#bitAccessor != 128) {
      // Throw if bad bit accessor
      throw new Error(
        "Flat Parser: takeBytes failed without resetting bit accessor.",
      );
    }
    const slice = this.#bytes.slice(this.#index, this.#index + n);
    this.#index += n;
    return slice;
  }

  skipByte(): void {
    if (this.#bitAccessor < 1) {
      this.#bitAccessor = 128;
      this.#index += 1;
    }
    this.#index += 1;
    this.#bitAccessor = 128;
  }

  getIndex() {
    return this.#index;
  }

  getAlign() {
    return this.#bitAccessor;
  }
}

export class Encoder {
  #bytes: Uint8Array;
  #index: number;
  #bitAccessor: number;
  #arraySize: number;

  constructor() {
    this.#arraySize = 1024; // Initial size
    this.#bytes = new Uint8Array(this.#arraySize);
    this.#index = 0;
    this.#bitAccessor = 128;
  }

  #ensureCapacity(requiredCapacity: number): void {
    if (requiredCapacity > this.#arraySize) {
      while (this.#arraySize < requiredCapacity) {
        this.#arraySize *= 2;
      }
      const newBytes = new Uint8Array(this.#arraySize);
      newBytes.set(this.#bytes);
      this.#bytes = newBytes;
    }
  }

  pushBit(bit: number): void {
    if (this.#bitAccessor === 128) {
      this.#ensureCapacity(this.#index + 1);
      this.#bitAccessor = 1;
      this.#bytes[this.#index] = 0;
    } else {
      this.#bitAccessor <<= 1;
    }

    if (bit) {
      this.#bytes[this.#index] |= this.#bitAccessor;
    }

    if (this.#bitAccessor === 128) {
      this.#index++;
    }
  }

  pushBits(bits: number, n: number): void {
    for (let i = 0; i < n; i++) {
      this.pushBit((bits & (1 << i)) !== 0 ? 1 : 0);
    }
  }

  pushByte(byte: number): void {
    this.#ensureCapacity(this.#index + 1);
    if (this.#bitAccessor !== 128) {
      this.#index++;
      this.#bitAccessor = 128;
    }
    this.#bytes[this.#index] = byte;
    this.#index++;
  }

  pushBytes(bytes: Uint8Array): void {
    this.#ensureCapacity(this.#index + bytes.length);
    if (this.#bitAccessor !== 128) {
      this.#index++;
      this.#bitAccessor = 128;
    }
    bytes.forEach((byte) => {
      this.#bytes[this.#index] = byte;
      this.#index++;
    });
  }

  pad(): void {
    while (this.#bitAccessor !== 128) {
      this.pushBit(0);
    }
    this.#bitAccessor >>= 1;
    this.#bytes[this.#index] |= this.#bitAccessor;
  }

  getBytes(): Uint8Array {
    return this.#bytes.slice(0, this.#index);
  }
}
