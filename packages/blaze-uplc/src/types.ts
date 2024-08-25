import type { PlutusData } from "@blaze-cardano/core";

export type Bit = 0 | 1;
export type Byte = number & { __opaqueNumber: "Byte" };
export const Byte = (number: number): Byte => {
  if (Number.isInteger(number) && number >= 0 && number <= 255) {
    return number as Byte;
  }
  throw new Error("Number must be an integer within the byte range 0-255");
};

export const TermNames = {
  var: "Var",
  lam: "Lambda",
  apply: "Apply",
  const: "Constant",
  builtin: "Builtin",
  delay: "Delay",
  force: "Force",
  constr: "Constr",
  case: "Case",
  error: "Error",
} as const;
export type TermNames = typeof TermNames;

export type Data = ReturnType<PlutusData["toCore"]>;

export const DataType = {
  0: "Integer",
  1: "ByteString",
  2: "String",
  3: "Unit",
  4: "Bool",
  8: "Data",
} as Record<Byte, DataType>;
export type DataType =
  | "Integer"
  | "ByteString"
  | "String"
  | "Unit"
  | "Bool"
  | "Data"
  | { pair: [DataType, DataType] }
  | { list: DataType };

export type Term<name, fun> =
  | { type: TermNames["var"]; name: name }
  | { type: TermNames["lam"]; name: name; body: Term<name, fun> }
  | {
      type: TermNames["apply"];
      function: Term<name, fun>;
      argument: Term<name, fun>;
    }
  | { type: TermNames["const"]; valueType: DataType; value: Data }
  | { type: TermNames["builtin"]; function: fun }
  | { type: TermNames["delay"]; term: Term<name, fun> }
  | { type: TermNames["force"]; term: Term<name, fun> }
  /* note: we need to validate constructor is properly bounded due to overflow */
  | { type: TermNames["constr"]; tag: bigint; terms: Term<name, fun>[] }
  | { type: TermNames["case"]; term: Term<name, fun>; cases: Term<name, fun>[] }
  | { type: TermNames["error"] };

export type AnnotatedTerm<name, fun> = Term<name, fun> & {
  annotation: string;
};

export type SemVer = `${number}.${number}.${number}`; // Advanced string typing for SemVer
export type Program<name, fun> = { version: SemVer; body: Term<name, fun> };

export const termTags = {
  [TermNames["var"]]: 0,
  [TermNames["delay"]]: 1,
  [TermNames["lam"]]: 2,
  [TermNames["apply"]]: 3,
  [TermNames["const"]]: 4,
  [TermNames["force"]]: 5,
  [TermNames["error"]]: 6,
  [TermNames["builtin"]]: 7,
  [TermNames["constr"]]: 8,
  [TermNames["case"]]: 9,
  /* note: gt 9 should fail, reserved for future expansion */
} as const;

export const BuiltinFunctions = [
  "addInteger",
  "subtractInteger",
  "multiplyInteger",
  "divideInteger",
  "quotientInteger",
  "remainderInteger",
  "modInteger",
  "equalsInteger",
  "lessThanInteger",
  "lessThanEqualsInteger",
  "appendByteString",
  "consByteString",
  "sliceByteString",
  "lengthOfByteString",
  "indexByteString",
  "equalsByteString",
  "lessThanByteString",
  "lessThanEqualsByteString",
  "sha2_256",
  "sha3_256",
  "blake2b_256",
  "verifyEd25519Signature",
  "appendString",
  "equalsString",
  "encodeUtf8",
  "decodeUtf8",
  "ifThenElse",
  "chooseUnit",
  "trace",
  "fstPair",
  "sndPair",
  "chooseList",
  "mkCons",
  "headList",
  "tailList",
  "nullList",
  "chooseData",
  "constrData",
  "mapData",
  "listData",
  "iData",
  "bData",
  "unConstrData",
  "unMapData",
  "unListData",
  "unIData",
  "unBData",
  "equalsData",
  "mkPairData",
  "mkNilData",
  "mkNilPairData",
  "serialiseData",
  "verifyEcdsaSecp256k1Signature",
  "verifySchnorrSecp256k1Signature",
] as const;
export type BuiltinFunctions = typeof BuiltinFunctions;
export type BuiltinFunction = (typeof BuiltinFunctions)[number];

export type ParsedTerm = Term<bigint, BuiltinFunction>;
export type ParsedProgram = Program<bigint, BuiltinFunction>;
