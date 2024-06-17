import Hex from "hex-encoding"

export type Bit = 0 | 1;
export type Byte = number & { __opaqueNumber: "Byte" };
export const Byte = (number: number): Byte => {
  if (!Number.isInteger(number) || number < 0 || number > 255) {
    throw new Error("Number must be an integer within the byte range 0-255");
  }
  return number as Byte;
};

export class Parser {
  #bytes: Uint8Array;
  #index = 0;
  #bitAccessor = 128; // Start with the highest bit in a byte

  constructor(bytes: Uint8Array) {
    this.#bytes = bytes;
  }

  static fromHex(hex: string) {
    return new this(Hex.decode(hex));
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
    this.#index += 1;
    this.#bitAccessor = 128;
  }

  getIndex() {
    return this.#index
  }
}
