import { type Bit, Byte } from "./types";
export declare class Parser {
    #private;
    constructor(bytes: Uint8Array);
    static fromHex(hex: string): Parser;
    popBit(): Bit;
    popBits(n: number): Byte;
    popByte(): Byte;
    takeBytes(n: number): Uint8Array;
    skipByte(): void;
}
export declare class Encoder {
    private buffer;
    private currentByte;
    private bitIndex;
    pushBit(bit: 0 | 1): void;
    pushBits(value: number, numBits: number): void;
    pushByte(byte: number): void;
    pad(): void;
    getBytes(): Uint8Array;
}
//# sourceMappingURL=flat.d.ts.map