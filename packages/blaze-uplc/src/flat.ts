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
}

export class Encoder {
  private buffer: number[] = [];
  private currentByte: number = 0;
  private bitIndex: number = 0;

  pushBit(bit: 0 | 1): void {
    this.currentByte = (this.currentByte << 1) | bit;
    this.bitIndex++;

    if (this.bitIndex === 8) {
      this.buffer.push(this.currentByte);
      this.currentByte = 0;
      this.bitIndex = 0;
    }
  }

  pushBits(value: number, numBits: number): void {
    for (let i = numBits - 1; i >= 0; i--) {
      this.pushBit(((value >> i) & 1) as 0 | 1);
    }
  }

  pushByte(byte: number): void {
    if (this.bitIndex !== 0) {
      this.buffer.push(this.currentByte);
      throw new Error(
        "pushByte called when not byte-aligned. This may lead to unexpected results.",
      );
    }
    this.buffer.push(byte);
    this.currentByte = 0;
    this.bitIndex = 0;
  }

  pad(): void {
    if (this.bitIndex === 0) {
      this.pushByte(1);
      return;
    }
    while (this.bitIndex < 7) {
      this.pushBit(0);
    }
    this.pushBit(1);
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
