import { Exact } from '@blaze-cardano/data';
import { HexBlob } from '@blaze-cardano/core';
import { PlutusData } from '@blaze-cardano/core';
import { Script } from '@blaze-cardano/core';
import { TArray } from '@blaze-cardano/data';

/**
 * Applies parameters to a UPLC program encoded as a hex blob.
 *
 * This function takes a hex-encoded UPLC program and applies one or more
 * Plutus data parameters to it. It does this by decoding the program,
 * modifying its AST to apply the parameters, and then re-encoding it.
 *
 * @param hex - The hex-encoded UPLC program.
 * @param params - The Plutus data parameters to apply to the program.
 * @returns A new hex-encoded UPLC program with the parameters applied.
 */
export declare function applyParams(hex: HexBlob, ...params: PlutusData[]): HexBlob;

/**
 * Applies the given Plutus data parameters to a hex-encoded Plutus script.
 *
 * This function decodes the provided Plutus script, applies the given parameters
 * to it, and then re-encodes the script. The parameters are cast to the specified
 * type and converted to a list of PlutusData before being applied.
 *
 * @template T - The type of the parameters list.
 * @param {HexBlob} plutusScript - The hex-encoded Plutus script to which the parameters will be applied.
 * @param {Exact<T>} params - The parameters to apply to the Plutus script.
 * @param {T} type - The type of the parameters list.
 * @returns {HexBlob} - A new hex-encoded Plutus script with the parameters applied.
 */
export declare function applyParamsToScript<T extends TArray>(plutusScript: string, type: T, params: Exact<T>): HexBlob;

declare type Bit = 0 | 1;

declare type BuiltinFunction = (typeof BuiltinFunctions)[number];

declare const BuiltinFunctions: readonly ["addInteger", "subtractInteger", "multiplyInteger", "divideInteger", "quotientInteger", "remainderInteger", "modInteger", "equalsInteger", "lessThanInteger", "lessThanEqualsInteger", "appendByteString", "consByteString", "sliceByteString", "lengthOfByteString", "indexByteString", "equalsByteString", "lessThanByteString", "lessThanEqualsByteString", "sha2_256", "sha3_256", "blake2b_256", "verifyEd25519Signature", "appendString", "equalsString", "encodeUtf8", "decodeUtf8", "ifThenElse", "chooseUnit", "trace", "fstPair", "sndPair", "chooseList", "mkCons", "headList", "tailList", "nullList", "chooseData", "constrData", "mapData", "listData", "iData", "bData", "unConstrData", "unMapData", "unListData", "unIData", "unBData", "equalsData", "mkPairData", "mkNilData", "mkNilPairData", "serialiseData", "verifyEcdsaSecp256k1Signature", "verifySchnorrSecp256k1Signature"];

declare type BuiltinFunctions = typeof BuiltinFunctions;

declare type Byte = number & {
    __opaqueNumber: "Byte";
};

declare const Byte: (number: number) => Byte;

/**
 * Converts the compiled code of a UPLC program into a Script based on the specified script type, handling possible double-CBOR encoding.
 *
 * @param {HexBlob} cbor - The script, possibly double-CBOR-encoded.
 * @param {ScriptType} type - The type of the script (Native, PlutusV1, or PlutusV2).
 * @returns {Script} - The Script created from the hex blob.
 * @throws {Error} - Throws an error if the script type is unsupported.
 */
export declare function cborToScript(cbor: string, type: ScriptType): Script;

declare type Data = ReturnType<PlutusData["toCore"]>;

declare const DataType: Record<Byte, DataType>;

declare type DataType = "Integer" | "ByteString" | "String" | "Unit" | "Bool" | "Data" | {
    pair: [DataType, DataType];
} | {
    list: DataType;
};

declare class Encoder {
    private buffer;
    private currentByte;
    private bitIndex;
    pushBit(bit: 0 | 1): void;
    pushBits(value: number, numBits: number): void;
    pushByte(byte: number): void;
    pad(): void;
    getBytes(): Uint8Array;
}

declare type ParsedProgram = Program<bigint, BuiltinFunction>;

declare type ParsedTerm = Term<bigint, BuiltinFunction>;

declare class Parser {
    #private;
    constructor(bytes: Uint8Array);
    static fromHex(hex: string): Parser;
    popBit(): Bit;
    popBits(n: number): Byte;
    popByte(): Byte;
    takeBytes(n: number): Uint8Array;
    skipByte(): void;
}

declare type Program<name, fun> = {
    version: SemVer;
    body: Term<name, fun>;
};

export declare type ScriptType = "Native" | "PlutusV1" | "PlutusV2" | "PlutusV3";

declare type SemVer = `${number}.${number}.${number}`;

declare type Term<name, fun> = {
    type: TermNames["var"];
    name: name;
} | {
    type: TermNames["lam"];
    name: name;
    body: Term<name, fun>;
} | {
    type: TermNames["apply"];
    function: Term<name, fun>;
    argument: Term<name, fun>;
} | {
    type: TermNames["const"];
    valueType: DataType;
    value: Data;
} | {
    type: TermNames["builtin"];
    function: fun;
} | {
    type: TermNames["delay"];
    term: Term<name, fun>;
} | {
    type: TermNames["force"];
    term: Term<name, fun>;
} | {
    type: TermNames["constr"];
    tag: bigint;
    terms: Term<name, fun>[];
} | {
    type: TermNames["case"];
    term: Term<name, fun>;
    cases: Term<name, fun>[];
} | {
    type: TermNames["error"];
};

declare const TermNames: {
    readonly var: "Var";
    readonly lam: "Lambda";
    readonly apply: "Apply";
    readonly const: "Constant";
    readonly builtin: "Builtin";
    readonly delay: "Delay";
    readonly force: "Force";
    readonly constr: "Constr";
    readonly case: "Case";
    readonly error: "Error";
};

declare type TermNames = typeof TermNames;

/**
 * This class provides decoding functionality for UPLC (Untyped Plutus Core) programs.
 * It extends the FlatDecoder class to handle the specific structure of UPLC programs.
 * The decoding process involves interpreting binary data into structured UPLC terms and types.
 */
export declare class UPLCDecoder extends Parser {
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

/**
 * UPLCEncoder class for encoding Untyped Plutus Core (UPLC) programs.
 * Extends the FlatEncoder class to provide UPLC-specific encoding functionality.
 */
export declare class UPLCEncoder extends Encoder {
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
    encodeData(type: DataType, data: Data): void;
    /**
     * Encodes a data type.
     * @param type - The data type to encode.
     * @returns An array of numbers representing the encoded type.
     * @throws {Error} If the type cannot be encoded.
     */
    encodeType(type: DataType): number[];
    /**
     * Encodes a constant value with its type.
     * @param type - The type of the constant.
     * @param value - The value of the constant.
     */
    encodeConst(type: DataType, value: Data): void;
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

export { }
