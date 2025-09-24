import type { PlutusData } from "@blaze-cardano/core";
export type Bit = 0 | 1;
export type Byte = number & {
    __opaqueNumber: "Byte";
};
export declare const Byte: (number: number) => Byte;
export declare const TermNames: {
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
export type TermNames = typeof TermNames;
export type Data = ReturnType<PlutusData["toCore"]>;
export declare const DataType: Record<Byte, DataType>;
export type DataType = "Integer" | "ByteString" | "String" | "Unit" | "Bool" | "Data" | {
    pair: [DataType, DataType];
} | {
    list: DataType;
};
export type Term<name, fun> = {
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
export type AnnotatedTerm<name, fun> = Term<name, fun> & {
    annotation: string;
};
export type SemVer = `${number}.${number}.${number}`;
export type Program<name, fun> = {
    version: SemVer;
    body: Term<name, fun>;
};
export declare const termTags: {
    readonly Var: 0;
    readonly Delay: 1;
    readonly Lambda: 2;
    readonly Apply: 3;
    readonly Constant: 4;
    readonly Force: 5;
    readonly Error: 6;
    readonly Builtin: 7;
    readonly Constr: 8;
    readonly Case: 9;
};
export declare const BuiltinFunctions: readonly ["addInteger", "subtractInteger", "multiplyInteger", "divideInteger", "quotientInteger", "remainderInteger", "modInteger", "equalsInteger", "lessThanInteger", "lessThanEqualsInteger", "appendByteString", "consByteString", "sliceByteString", "lengthOfByteString", "indexByteString", "equalsByteString", "lessThanByteString", "lessThanEqualsByteString", "sha2_256", "sha3_256", "blake2b_256", "verifyEd25519Signature", "appendString", "equalsString", "encodeUtf8", "decodeUtf8", "ifThenElse", "chooseUnit", "trace", "fstPair", "sndPair", "chooseList", "mkCons", "headList", "tailList", "nullList", "chooseData", "constrData", "mapData", "listData", "iData", "bData", "unConstrData", "unMapData", "unListData", "unIData", "unBData", "equalsData", "mkPairData", "mkNilData", "mkNilPairData", "serialiseData", "verifyEcdsaSecp256k1Signature", "verifySchnorrSecp256k1Signature"];
export type BuiltinFunctions = typeof BuiltinFunctions;
export type BuiltinFunction = (typeof BuiltinFunctions)[number];
export type ParsedTerm = Term<bigint, BuiltinFunction>;
export type ParsedProgram = Program<bigint, BuiltinFunction>;
//# sourceMappingURL=types.d.ts.map