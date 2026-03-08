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
  readonly function: DefaultFunction;
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

// --- DefaultFunction (string literal union) ---

export type DefaultFunction =
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

// --- DefaultFunction metadata ---

const DEFAULT_FUNCTION_ARITIES: Record<DefaultFunction, number> = {
  addInteger: 2,
  subtractInteger: 2,
  multiplyInteger: 2,
  divideInteger: 2,
  quotientInteger: 2,
  remainderInteger: 2,
  modInteger: 2,
  equalsInteger: 2,
  lessThanInteger: 2,
  lessThanEqualsInteger: 2,
  appendByteString: 2,
  consByteString: 2,
  sliceByteString: 3,
  lengthOfByteString: 1,
  indexByteString: 2,
  equalsByteString: 2,
  lessThanByteString: 2,
  lessThanEqualsByteString: 2,
  sha2_256: 1,
  sha3_256: 1,
  blake2b_256: 1,
  keccak_256: 1,
  blake2b_224: 1,
  ripemd_160: 1,
  verifyEd25519Signature: 3,
  verifyEcdsaSecp256k1Signature: 3,
  verifySchnorrSecp256k1Signature: 3,
  appendString: 2,
  equalsString: 2,
  encodeUtf8: 1,
  decodeUtf8: 1,
  ifThenElse: 3,
  chooseUnit: 2,
  trace: 2,
  fstPair: 1,
  sndPair: 1,
  chooseList: 3,
  mkCons: 2,
  headList: 1,
  tailList: 1,
  nullList: 1,
  chooseData: 6,
  constrData: 2,
  mapData: 1,
  listData: 1,
  iData: 1,
  bData: 1,
  unConstrData: 1,
  unMapData: 1,
  unListData: 1,
  unIData: 1,
  unBData: 1,
  equalsData: 2,
  mkPairData: 2,
  mkNilData: 1,
  mkNilPairData: 1,
  serialiseData: 1,
  bls12_381_G1_add: 2,
  bls12_381_G1_neg: 1,
  bls12_381_G1_scalarMul: 2,
  bls12_381_G1_equal: 2,
  bls12_381_G1_compress: 1,
  bls12_381_G1_uncompress: 1,
  bls12_381_G1_hashToGroup: 2,
  bls12_381_G2_add: 2,
  bls12_381_G2_neg: 1,
  bls12_381_G2_scalarMul: 2,
  bls12_381_G2_equal: 2,
  bls12_381_G2_compress: 1,
  bls12_381_G2_uncompress: 1,
  bls12_381_G2_hashToGroup: 2,
  bls12_381_millerLoop: 2,
  bls12_381_mulMlResult: 2,
  bls12_381_finalVerify: 2,
  integerToByteString: 3,
  byteStringToInteger: 2,
  andByteString: 3,
  orByteString: 3,
  xorByteString: 3,
  complementByteString: 1,
  readBit: 2,
  writeBits: 3,
  replicateByte: 2,
  shiftByteString: 2,
  rotateByteString: 2,
  countSetBits: 1,
  findFirstSetBit: 1,
  expModInteger: 3,
  dropList: 2,
  lengthOfArray: 1,
  listToArray: 1,
  indexArray: 2,
  bls12_381_G1_multiScalarMul: 2,
  bls12_381_G2_multiScalarMul: 2,
  insertCoin: 4,
  lookupCoin: 3,
  unionValue: 2,
  valueContains: 2,
  valueData: 1,
  unValueData: 1,
  scaleValue: 2,
};

const DEFAULT_FUNCTION_FORCE_COUNTS: Record<DefaultFunction, number> = {
  addInteger: 0,
  subtractInteger: 0,
  multiplyInteger: 0,
  divideInteger: 0,
  quotientInteger: 0,
  remainderInteger: 0,
  modInteger: 0,
  equalsInteger: 0,
  lessThanInteger: 0,
  lessThanEqualsInteger: 0,
  appendByteString: 0,
  consByteString: 0,
  sliceByteString: 0,
  lengthOfByteString: 0,
  indexByteString: 0,
  equalsByteString: 0,
  lessThanByteString: 0,
  lessThanEqualsByteString: 0,
  sha2_256: 0,
  sha3_256: 0,
  blake2b_256: 0,
  keccak_256: 0,
  blake2b_224: 0,
  ripemd_160: 0,
  verifyEd25519Signature: 0,
  verifyEcdsaSecp256k1Signature: 0,
  verifySchnorrSecp256k1Signature: 0,
  appendString: 0,
  equalsString: 0,
  encodeUtf8: 0,
  decodeUtf8: 0,
  ifThenElse: 1,
  chooseUnit: 1,
  trace: 1,
  fstPair: 2,
  sndPair: 2,
  chooseList: 1,
  mkCons: 1,
  headList: 1,
  tailList: 1,
  nullList: 1,
  chooseData: 0,
  constrData: 0,
  mapData: 0,
  listData: 0,
  iData: 0,
  bData: 0,
  unConstrData: 0,
  unMapData: 0,
  unListData: 0,
  unIData: 0,
  unBData: 0,
  equalsData: 0,
  mkPairData: 0,
  mkNilData: 0,
  mkNilPairData: 0,
  serialiseData: 0,
  bls12_381_G1_add: 0,
  bls12_381_G1_neg: 0,
  bls12_381_G1_scalarMul: 0,
  bls12_381_G1_equal: 0,
  bls12_381_G1_compress: 0,
  bls12_381_G1_uncompress: 0,
  bls12_381_G1_hashToGroup: 0,
  bls12_381_G2_add: 0,
  bls12_381_G2_neg: 0,
  bls12_381_G2_scalarMul: 0,
  bls12_381_G2_equal: 0,
  bls12_381_G2_compress: 0,
  bls12_381_G2_uncompress: 0,
  bls12_381_G2_hashToGroup: 0,
  bls12_381_millerLoop: 0,
  bls12_381_mulMlResult: 0,
  bls12_381_finalVerify: 0,
  integerToByteString: 0,
  byteStringToInteger: 0,
  andByteString: 0,
  orByteString: 0,
  xorByteString: 0,
  complementByteString: 0,
  readBit: 0,
  writeBits: 0,
  replicateByte: 0,
  shiftByteString: 0,
  rotateByteString: 0,
  countSetBits: 0,
  findFirstSetBit: 0,
  expModInteger: 0,
  dropList: 1,
  lengthOfArray: 1,
  listToArray: 1,
  indexArray: 1,
  bls12_381_G1_multiScalarMul: 0,
  bls12_381_G2_multiScalarMul: 0,
  insertCoin: 0,
  lookupCoin: 0,
  unionValue: 0,
  valueContains: 0,
  valueData: 0,
  unValueData: 0,
  scaleValue: 0,
};

export function defaultFunctionArity(fn: DefaultFunction): number {
  return DEFAULT_FUNCTION_ARITIES[fn];
}

export function defaultFunctionForceCount(fn: DefaultFunction): number {
  return DEFAULT_FUNCTION_FORCE_COUNTS[fn];
}
