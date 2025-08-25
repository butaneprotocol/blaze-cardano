import { Parser as FlatDecoder } from "./flat";
import type { ParsedProgram } from "./types";
/**
 * This class provides decoding functionality for UPLC (Untyped Plutus Core) programs.
 * It extends the FlatDecoder class to handle the specific structure of UPLC programs.
 * The decoding process involves interpreting binary data into structured UPLC terms and types.
 */
export declare class UPLCDecoder extends FlatDecoder {
    #private;
    /**
     * Public method to decode a UPLC program from the UPLCDecoder instance
     * @returns {ParsedProgram} The decoded UPLC program.
     */
    decode(): ParsedProgram;
    /**
     * Creates a UPLCDecoder instance from a hexadecimal string.
     * @param {string} hex Hexadecimal string of a UPLC program's binary data.
     * @returns {UPLCDecoder} Initialized UPLCDecoder with the decoded data.
     */
    static fromHex(hex: string): UPLCDecoder;
    /**
     * Decodes a UPLC program from a hexadecimal string.
     * This method utilizes the `fromHex` method to create an instance of UPLCDecoder
     * and then decodes the program using the `decode` method.
     *
     * @param {string} hex - The hexadecimal string representing the binary data of a UPLC program.
     * @returns {ParsedProgram} - The decoded UPLC program.
     */
    static decodeFromHex(hex: string): ParsedProgram;
}
//# sourceMappingURL=decoder.d.ts.map