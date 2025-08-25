import { Encoder as FlatEncoder } from "./flat";
import type { Data, ParsedProgram, ParsedTerm, SemVer, DataType as DataTypeType } from "./types";
/**
 * UPLCEncoder class for encoding Untyped Plutus Core (UPLC) programs.
 * Extends the FlatEncoder class to provide UPLC-specific encoding functionality.
 */
export declare class UPLCEncoder extends FlatEncoder {
    /**
     * Encodes a semantic version number.
     * @param version - The semantic version as a string (e.g., "1.0.0").
     * @throws {Error} If the version format is invalid.
     */
    encodeVersion(version: SemVer): void;
    encodeList<T>(items: T[], encode: (t: T) => void): void;
    /**
     * Encodes a natural number (non-negative integer).
     * @param n - The natural number to encode.
     */
    encodeNatural(n: bigint): void;
    /**
     * Encodes an integer (positive or negative).
     * @param i - The integer to encode.
     */
    encodeInteger(i: bigint): void;
    /**
     * Encodes a byte string.
     * @param bytes - The byte string to encode as a Uint8Array.
     */
    encodeByteString(bytes: Uint8Array): void;
    /**
     * Encodes a boolean value.
     * @param value - The boolean value to encode.
     */
    encodeBool(value: boolean): void;
    /**
     * Encodes data based on its type.
     * @param type - The type of the data to encode.
     * @param data - The data to encode.
     * @throws {Error} If the data type is not supported.
     */
    encodeData(type: DataTypeType, data: Data): void;
    /**
     * Encodes a data type.
     * @param type - The data type to encode.
     * @returns An array of numbers representing the encoded type.
     * @throws {Error} If the type cannot be encoded.
     */
    encodeType(type: DataTypeType): number[];
    /**
     * Encodes a constant value with its type.
     * @param type - The type of the constant.
     * @param value - The value of the constant.
     */
    encodeConst(type: DataTypeType, value: Data): void;
    /**
     * Encodes a UPLC term.
     * @param term - The parsed term to encode.
     * @throws {Error} If the term type is not supported.
     */
    encodeTerm(term: ParsedTerm): void;
    /**
     * Encodes a complete UPLC program.
     * @param program - The parsed program to encode.
     * @returns A Uint8Array containing the encoded program.
     */
    encodeProgram(program: ParsedProgram): Uint8Array;
}
//# sourceMappingURL=encoder.d.ts.map