// --- Binder types ---

export interface Name {
  readonly text: string;
  readonly unique: number;
}

export interface DeBruijn {
  readonly index: number;
}

// --- Version ---

export interface Version {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

// --- Program ---

export interface Program<Binder> {
  readonly version: Version;
  readonly term: Term<Binder>;
}

// --- Term (discriminated union) ---

export type Term<Binder> =
  | VarTerm<Binder>
  | LambdaTerm<Binder>
  | ApplyTerm<Binder>
  | ConstantTerm
  | BuiltinTerm
  | DelayTerm<Binder>
  | ForceTerm<Binder>
  | ConstrTerm<Binder>
  | CaseTerm<Binder>
  | ErrorTerm;

export interface VarTerm<Binder> {
  readonly tag: "var";
  readonly name: Binder;
}

export interface LambdaTerm<Binder> {
  readonly tag: "lambda";
  readonly parameter: Binder;
  readonly body: Term<Binder>;
}

export interface ApplyTerm<Binder> {
  readonly tag: "apply";
  readonly function: Term<Binder>;
  readonly argument: Term<Binder>;
}

export interface ConstantTerm {
  readonly tag: "constant";
  readonly value: Constant;
}

export interface BuiltinTerm {
  readonly tag: "builtin";
  readonly function: BuiltinFunction;
}

export interface DelayTerm<Binder> {
  readonly tag: "delay";
  readonly term: Term<Binder>;
}

export interface ForceTerm<Binder> {
  readonly tag: "force";
  readonly term: Term<Binder>;
}

export interface ConstrTerm<Binder> {
  readonly tag: "constr";
  readonly index: number;
  readonly fields: ReadonlyArray<Term<Binder>>;
}

export interface CaseTerm<Binder> {
  readonly tag: "case";
  readonly constr: Term<Binder>;
  readonly branches: ReadonlyArray<Term<Binder>>;
}

export interface ErrorTerm {
  readonly tag: "error";
}

// --- Constant (discriminated union) ---

export type Constant =
  | IntegerConstant
  | ByteStringConstant
  | StringConstant
  | BoolConstant
  | UnitConstant
  | ListConstant
  | PairConstant
  | DataConstant
  | Bls12_381G1ElementConstant
  | Bls12_381G2ElementConstant
  | Bls12_381MlResultConstant
  | ValueConstant;

export interface IntegerConstant {
  readonly type: "integer";
  readonly value: bigint;
}

export interface ByteStringConstant {
  readonly type: "bytestring";
  readonly value: Uint8Array;
}

export interface StringConstant {
  readonly type: "string";
  readonly value: string;
}

export interface BoolConstant {
  readonly type: "bool";
  readonly value: boolean;
}

export interface UnitConstant {
  readonly type: "unit";
}

export interface ListConstant {
  readonly type: "list";
  readonly values: ReadonlyArray<Constant>;
}

export interface PairConstant {
  readonly type: "pair";
  readonly first: Constant;
  readonly second: Constant;
}

export interface DataConstant {
  readonly type: "data";
  readonly value: PlutusData;
}

export interface Bls12_381G1ElementConstant {
  readonly type: "bls12_381_g1_element";
  readonly value: Uint8Array;
}

export interface Bls12_381G2ElementConstant {
  readonly type: "bls12_381_g2_element";
  readonly value: Uint8Array;
}

export interface Bls12_381MlResultConstant {
  readonly type: "bls12_381_ml_result";
  readonly value: Uint8Array;
}

export interface ValueConstant {
  readonly type: "value";
  readonly value: LedgerValue;
}

// --- LedgerValue ---

export interface LedgerValue {
  readonly entries: ReadonlyArray<CurrencyEntry>;
}

export interface CurrencyEntry {
  readonly currency: Uint8Array;
  readonly tokens: ReadonlyArray<TokenEntry>;
}

export interface TokenEntry {
  readonly name: Uint8Array;
  readonly quantity: bigint;
}

// --- PlutusData (recursive discriminated union) ---

export type PlutusData =
  | PlutusDataConstr
  | PlutusDataMap
  | PlutusDataList
  | PlutusDataInteger
  | PlutusDataByteString;

export interface PlutusDataConstr {
  readonly tag: "constr";
  readonly index: bigint;
  readonly fields: ReadonlyArray<PlutusData>;
}

export interface PlutusDataMap {
  readonly tag: "map";
  readonly entries: ReadonlyArray<readonly [PlutusData, PlutusData]>;
}

export interface PlutusDataList {
  readonly tag: "list";
  readonly values: ReadonlyArray<PlutusData>;
}

export interface PlutusDataInteger {
  readonly tag: "integer";
  readonly value: bigint;
}

export interface PlutusDataByteString {
  readonly tag: "bytestring";
  readonly value: Uint8Array;
}

// --- ExBudget ---

export interface ExBudget {
  readonly cpu: bigint;
  readonly mem: bigint;
}

export function unlimitedBudget(): ExBudget {
  return { cpu: BigInt("10000000000000000"), mem: BigInt("10000000000000000") };
}

export function zeroBudget(): ExBudget {
  return { cpu: 0n, mem: 0n };
}

// --- BuiltinFunction (string literal union) ---

export type BuiltinFunction =
  | "addInteger"
  | "subtractInteger"
  | "multiplyInteger"
  | "divideInteger"
  | "quotientInteger"
  | "remainderInteger"
  | "modInteger"
  | "equalsInteger"
  | "lessThanInteger"
  | "lessThanEqualsInteger"
  | "appendByteString"
  | "consByteString"
  | "sliceByteString"
  | "lengthOfByteString"
  | "indexByteString"
  | "equalsByteString"
  | "lessThanByteString"
  | "lessThanEqualsByteString"
  | "sha2_256"
  | "sha3_256"
  | "blake2b_256"
  | "keccak_256"
  | "blake2b_224"
  | "ripemd_160"
  | "verifyEd25519Signature"
  | "verifyEcdsaSecp256k1Signature"
  | "verifySchnorrSecp256k1Signature"
  | "appendString"
  | "equalsString"
  | "encodeUtf8"
  | "decodeUtf8"
  | "ifThenElse"
  | "chooseUnit"
  | "trace"
  | "fstPair"
  | "sndPair"
  | "chooseList"
  | "mkCons"
  | "headList"
  | "tailList"
  | "nullList"
  | "chooseData"
  | "constrData"
  | "mapData"
  | "listData"
  | "iData"
  | "bData"
  | "unConstrData"
  | "unMapData"
  | "unListData"
  | "unIData"
  | "unBData"
  | "equalsData"
  | "mkPairData"
  | "mkNilData"
  | "mkNilPairData"
  | "serialiseData"
  | "bls12_381_G1_add"
  | "bls12_381_G1_neg"
  | "bls12_381_G1_scalarMul"
  | "bls12_381_G1_equal"
  | "bls12_381_G1_compress"
  | "bls12_381_G1_uncompress"
  | "bls12_381_G1_hashToGroup"
  | "bls12_381_G2_add"
  | "bls12_381_G2_neg"
  | "bls12_381_G2_scalarMul"
  | "bls12_381_G2_equal"
  | "bls12_381_G2_compress"
  | "bls12_381_G2_uncompress"
  | "bls12_381_G2_hashToGroup"
  | "bls12_381_millerLoop"
  | "bls12_381_mulMlResult"
  | "bls12_381_finalVerify"
  | "integerToByteString"
  | "byteStringToInteger"
  | "andByteString"
  | "orByteString"
  | "xorByteString"
  | "complementByteString"
  | "readBit"
  | "writeBits"
  | "replicateByte"
  | "shiftByteString"
  | "rotateByteString"
  | "countSetBits"
  | "findFirstSetBit"
  | "expModInteger"
  | "dropList"
  | "lengthOfArray"
  | "listToArray"
  | "indexArray"
  | "bls12_381_G1_multiScalarMul"
  | "bls12_381_G2_multiScalarMul"
  | "insertCoin"
  | "lookupCoin"
  | "unionValue"
  | "valueContains"
  | "valueData"
  | "unValueData"
  | "scaleValue";
