import { Serialization } from "@cardano-sdk/core";
export const { CborReader, PlutusData } = Serialization;

export interface Some<T> {
  value: T;
}

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

export type Data = ReturnType<Serialization.PlutusData["toCore"]>;

export type Term<name, fun> =
  | { type: TermNames["var"]; name: name }
  | { type: TermNames["lam"]; name: name; body: Term<name, fun> }
  | {
      type: TermNames["apply"];
      function: Term<name, fun>;
      argument: Term<name, fun>;
    }
  | { type: TermNames["const"]; value: Some<Data> }
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
export type BuiltinFunction = BuiltinFunctions[keyof BuiltinFunctions];

export type ParsedTerm = Term<bigint, BuiltinFunction>;
export type ParsedProgram = Program<bigint, BuiltinFunction>;
