import { Lexer, ParseError } from "./lexer";
import type { Token, TokenType } from "./lexer";
import type {
  Name,
  Program,
  Term,
  Version,
  Constant,
  ConstantType,
  DefaultFunction,
  PlutusData,
} from "./types";

export { ParseError };

const BUILTIN_FUNCTIONS = new Set<string>([
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
  "keccak_256",
  "blake2b_224",
  "ripemd_160",
  "verifyEd25519Signature",
  "verifyEcdsaSecp256k1Signature",
  "verifySchnorrSecp256k1Signature",
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
  "bls12_381_G1_add",
  "bls12_381_G1_neg",
  "bls12_381_G1_scalarMul",
  "bls12_381_G1_equal",
  "bls12_381_G1_compress",
  "bls12_381_G1_uncompress",
  "bls12_381_G1_hashToGroup",
  "bls12_381_G2_add",
  "bls12_381_G2_neg",
  "bls12_381_G2_scalarMul",
  "bls12_381_G2_equal",
  "bls12_381_G2_compress",
  "bls12_381_G2_uncompress",
  "bls12_381_G2_hashToGroup",
  "bls12_381_millerLoop",
  "bls12_381_mulMlResult",
  "bls12_381_finalVerify",
  "integerToByteString",
  "byteStringToInteger",
  "andByteString",
  "orByteString",
  "xorByteString",
  "complementByteString",
  "readBit",
  "writeBits",
  "replicateByte",
  "shiftByteString",
  "rotateByteString",
  "countSetBits",
  "findFirstSetBit",
  "expModInteger",
  "dropList",
  "lengthOfArray",
  "listToArray",
  "indexArray",
  "bls12_381_G1_multiScalarMul",
  "bls12_381_G2_multiScalarMul",
  "insertCoin",
  "lookupCoin",
  "unionValue",
  "valueContains",
  "valueData",
  "unValueData",
  "scaleValue",
]);

// TypeSpec is ConstantType from types.ts
type TypeSpec = ConstantType;

// 2^127
const VALUE_LIMIT = 1n << 127n;
const VALUE_MAX = VALUE_LIMIT - 1n;
const VALUE_MIN = -VALUE_LIMIT;

class Parser {
  private lexer: Lexer;
  private current: Token;
  private previous: Token;
  private interned: Map<string, number>;
  private nextUnique: number;
  private version: Version;

  constructor(source: string) {
    this.lexer = new Lexer(source);
    this.interned = new Map();
    this.nextUnique = 0;
    this.version = { major: 0, minor: 0, patch: 0 };
    this.current = this.lexer.nextToken();
    this.previous = this.current;
  }

  private advance(): void {
    this.previous = this.current;
    this.current = this.lexer.nextToken();
  }

  /** Check current token type (avoids TS narrowing issues in switch cases) */
  private is(type: TokenType): boolean {
    return this.current.type === type;
  }

  private expect(type: TokenType): void {
    if (this.current.type !== type) {
      throw new ParseError(
        `expected ${type}, got ${this.current.type} at position ${this.current.position}`,
      );
    }
    this.advance();
  }

  private internName(text: string): Name {
    const existing = this.interned.get(text);
    if (existing !== undefined) {
      return { text, unique: existing };
    }
    const unique = this.nextUnique++;
    this.interned.set(text, unique);
    return { text, unique };
  }

  private isBeforeV1_1_0(): boolean {
    return this.version.major < 2 && this.version.minor < 1;
  }

  parseProgram(): Program<Name> {
    this.expect("lparen");
    this.expect("program");

    const versionParts: number[] = [];
    for (let i = 0; i < 3; i++) {
      if (!this.is("number")) {
        throw new ParseError(
          `expected version number, got ${this.current.type} at position ${this.current.position}`,
        );
      }
      const n = parseInt(this.current.value, 10);
      if (!Number.isFinite(n) || n < 0) {
        throw new ParseError(
          `invalid version number ${this.current.value} at position ${this.current.position}`,
        );
      }
      versionParts.push(n);
      this.advance();
      if (i < 2) {
        this.expect("dot");
      }
    }

    this.version = {
      major: versionParts[0]!,
      minor: versionParts[1]!,
      patch: versionParts[2]!,
    };

    const term = this.parseTerm();
    this.expect("rparen");

    if (!this.is("eof")) {
      throw new ParseError(
        `unexpected token ${this.current.type} after program at position ${this.current.position}`,
      );
    }

    return { version: this.version, term };
  }

  private parseTerm(): Term<Name> {
    if (this.is("identifier")) {
      const name = this.internName(this.current.value);
      this.advance();
      return { tag: "var", name };
    }

    if (this.is("lparen")) {
      this.advance();
      return this.parseParenTerm();
    }

    if (this.is("lbracket")) {
      return this.parseApply();
    }

    throw new ParseError(
      `unexpected token ${this.current.type} in term at position ${this.current.position}`,
    );
  }

  private parseParenTerm(): Term<Name> {
    if (this.is("lam")) return this.parseLambda();
    if (this.is("delay")) return this.parseDelay();
    if (this.is("force")) return this.parseForce();
    if (this.is("builtin")) return this.parseBuiltin();
    if (this.is("con")) return this.parseConstantTerm();
    if (this.is("error")) {
      this.advance();
      this.expect("rparen");
      return { tag: "error" };
    }
    if (this.is("constr")) return this.parseConstr();
    if (this.is("case")) return this.parseCase();

    throw new ParseError(
      `unexpected token ${this.current.type} in term at position ${this.current.position}`,
    );
  }

  private parseLambda(): Term<Name> {
    this.expect("lam");

    if (!this.is("identifier")) {
      throw new ParseError(
        `expected identifier, got ${this.current.type} at position ${this.current.position}`,
      );
    }
    const name = this.internName(this.current.value);
    this.advance();

    const body = this.parseTerm();
    this.expect("rparen");

    return { tag: "lambda", parameter: name, body };
  }

  private parseDelay(): Term<Name> {
    this.expect("delay");
    const term = this.parseTerm();
    this.expect("rparen");
    return { tag: "delay", term };
  }

  private parseForce(): Term<Name> {
    this.expect("force");
    const term = this.parseTerm();
    this.expect("rparen");
    return { tag: "force", term };
  }

  private parseBuiltin(): Term<Name> {
    this.expect("builtin");

    if (!this.is("identifier")) {
      throw new ParseError(
        `expected builtin name, got ${this.current.type} at position ${this.current.position}`,
      );
    }

    const name = this.current.value;
    if (!BUILTIN_FUNCTIONS.has(name)) {
      throw new ParseError(
        `unknown builtin function ${name} at position ${this.current.position}`,
      );
    }

    this.advance();
    this.expect("rparen");

    return { tag: "builtin", function: name as DefaultFunction };
  }

  private parseConstr(): Term<Name> {
    if (this.isBeforeV1_1_0()) {
      throw new ParseError("constr can't be used before 1.1.0");
    }

    this.expect("constr");

    if (!this.is("number")) {
      throw new ParseError(
        `expected tag number, got ${this.current.type} at position ${this.current.position}`,
      );
    }

    const n = parseConstrTag(this.current.value, this.current.position);
    this.advance();

    const fields: Term<Name>[] = [];
    while (!this.is("rparen")) {
      fields.push(this.parseTerm());
    }

    this.expect("rparen");
    return { tag: "constr", index: n, fields };
  }

  private parseCase(): Term<Name> {
    if (this.isBeforeV1_1_0()) {
      throw new ParseError("case can't be used before 1.1.0");
    }

    this.expect("case");

    const constr = this.parseTerm();

    const branches: Term<Name>[] = [];
    while (!this.is("rparen")) {
      branches.push(this.parseTerm());
    }

    this.expect("rparen");
    return { tag: "case", constr, branches };
  }

  private parseApply(): Term<Name> {
    this.expect("lbracket");

    const terms: Term<Name>[] = [];
    while (!this.is("rbracket")) {
      terms.push(this.parseTerm());
    }

    if (terms.length < 2) {
      throw new ParseError(
        `application requires at least two terms, got ${terms.length} at position ${this.current.position}`,
      );
    }

    this.expect("rbracket");

    // Build left-nested Apply
    let result: Term<Name> = terms[0]!;
    for (let i = 1; i < terms.length; i++) {
      result = { tag: "apply", function: result, argument: terms[i]! };
    }

    return result;
  }

  private parseConstantTerm(): Term<Name> {
    this.expect("con");

    const typeSpec = this.parseTypeSpec();

    // Top-level data constants have an extra layer of parens: (con data (I 42))
    if (typeSpec.tag === "data") {
      this.expect("lparen");
      const data = this.parsePlutusData();
      this.expect("rparen");
      this.expect("rparen");
      return { tag: "constant", value: { type: "data", value: data } };
    }

    const value = this.parseConstantValue(typeSpec);

    this.expect("rparen");
    return { tag: "constant", value };
  }

  private parseTypeSpec(): TypeSpec {
    // Check for bare list/pair/array (requires parens)
    if (this.is("list") || this.is("pair") || this.is("array")) {
      throw new ParseError(
        `expected left parenthesis for ${this.current.type} type at position ${this.current.position}`,
      );
    }

    if (this.is("lparen")) {
      this.advance();
      const ts = this.parseInnerTypeSpec();
      if (!this.is("rparen")) {
        throw new ParseError(
          `expected right parenthesis after type spec, got ${this.current.type} at position ${this.current.position}`,
        );
      }
      this.advance();
      return ts;
    }

    return this.parseInnerTypeSpec();
  }

  private parseInnerTypeSpec(): TypeSpec {
    if (this.is("identifier")) {
      const name = this.current.value;
      this.advance();
      switch (name) {
        case "integer":
          return { tag: "integer" };
        case "bytestring":
          return { tag: "bytestring" };
        case "string":
          return { tag: "string" };
        case "unit":
          return { tag: "unit" };
        case "bool":
          return { tag: "bool" };
        case "data":
          return { tag: "data" };
        case "bls12_381_G1_element":
          return { tag: "bls12_381_G1_element" };
        case "bls12_381_G2_element":
          return { tag: "bls12_381_G2_element" };
        case "bls12_381_mlresult":
          return { tag: "bls12_381_ml_result" };
        case "value":
          return { tag: "value" };
        default:
          throw new ParseError(
            `unknown type ${name} at position ${this.previous.position}`,
          );
      }
    }

    if (this.is("list")) {
      this.advance();
      const elemType = this.parseTypeSpec();
      return { tag: "list", element: elemType };
    }

    if (this.is("array")) {
      this.advance();
      const elemType = this.parseTypeSpec();
      return { tag: "array", element: elemType };
    }

    if (this.is("pair")) {
      this.advance();
      const first = this.parseTypeSpec();
      const second = this.parseTypeSpec();
      return { tag: "pair", first, second };
    }

    throw new ParseError(
      `expected type identifier, got ${this.current.type} at position ${this.current.position}`,
    );
  }

  private parseConstantValue(typeSpec: TypeSpec): Constant {
    switch (typeSpec.tag) {
      case "integer": {
        if (!this.is("number")) {
          throw new ParseError(
            `expected integer value, got ${this.current.type} at position ${this.current.position}`,
          );
        }
        const value = BigInt(this.current.value);
        this.advance();
        return { type: "integer", value };
      }

      case "bytestring": {
        if (!this.is("bytestring")) {
          throw new ParseError(
            `expected bytestring value, got ${this.current.type} at position ${this.current.position}`,
          );
        }
        const bytes = hexToBytes(this.current.value);
        this.advance();
        return { type: "bytestring", value: bytes };
      }

      case "string": {
        if (!this.is("string")) {
          throw new ParseError(
            `expected string value, got ${this.current.type} at position ${this.current.position}`,
          );
        }
        const s = this.current.value;
        this.advance();
        return { type: "string", value: s };
      }

      case "bool": {
        if (this.is("true")) {
          this.advance();
          return { type: "bool", value: true };
        }
        if (this.is("false")) {
          this.advance();
          return { type: "bool", value: false };
        }
        throw new ParseError(
          `expected bool value, got ${this.current.type} at position ${this.current.position}`,
        );
      }

      case "unit": {
        if (!this.is("unit")) {
          throw new ParseError(
            `expected unit value, got ${this.current.type} at position ${this.current.position}`,
          );
        }
        this.advance();
        return { type: "unit" };
      }

      case "data": {
        // Nested data (inside list/pair) — no wrapping parens
        const data = this.parsePlutusData();
        return { type: "data", value: data };
      }

      case "list": {
        this.expect("lbracket");
        const values: Constant[] = [];
        while (!this.is("rbracket")) {
          values.push(this.parseConstantValue(typeSpec.element));
          if (!this.is("rbracket")) {
            this.expect("comma");
          }
        }
        this.expect("rbracket");
        return { type: "list", itemType: typeSpec.element, values };
      }

      case "array": {
        this.expect("lbracket");
        const values: Constant[] = [];
        while (!this.is("rbracket")) {
          values.push(this.parseConstantValue(typeSpec.element));
          if (!this.is("rbracket")) {
            this.expect("comma");
          }
        }
        this.expect("rbracket");
        return { type: "array", itemType: typeSpec.element, values };
      }

      case "pair": {
        this.expect("lparen");
        const first = this.parseConstantValue(typeSpec.first);
        this.expect("comma");
        const second = this.parseConstantValue(typeSpec.second);
        this.expect("rparen");
        return {
          type: "pair",
          fstType: typeSpec.first,
          sndType: typeSpec.second,
          first,
          second,
        };
      }

      case "bls12_381_G1_element": {
        if (!this.is("point")) {
          throw new ParseError(
            `expected point value, got ${this.current.type} at position ${this.current.position}`,
          );
        }
        const bytes = hexToBytes(this.current.value);
        this.advance();
        if (bytes.length !== 48) {
          throw new ParseError(
            `bls12_381_G1_element must be 48 bytes, got ${bytes.length}`,
          );
        }
        return { type: "bls12_381_g1_element", value: bytes };
      }

      case "bls12_381_G2_element": {
        if (!this.is("point")) {
          throw new ParseError(
            `expected point value, got ${this.current.type} at position ${this.current.position}`,
          );
        }
        const bytes = hexToBytes(this.current.value);
        this.advance();
        if (bytes.length !== 96) {
          throw new ParseError(
            `bls12_381_G2_element must be 96 bytes, got ${bytes.length}`,
          );
        }
        return { type: "bls12_381_g2_element", value: bytes };
      }

      case "bls12_381_ml_result": {
        if (!this.is("point")) {
          throw new ParseError(
            `expected point value, got ${this.current.type} at position ${this.current.position}`,
          );
        }
        const bytes = hexToBytes(this.current.value);
        this.advance();
        return { type: "bls12_381_ml_result", value: bytes };
      }

      case "value":
        return this.parseValueConstant();
    }
  }

  private parsePlutusData(): PlutusData {
    if (this.is("I")) {
      this.advance();
      if (!this.is("number")) {
        throw new ParseError(
          `expected integer value for I, got ${this.current.type} at position ${this.current.position}`,
        );
      }
      const value = BigInt(this.current.value);
      this.advance();
      return { tag: "integer", value };
    }

    if (this.is("B")) {
      this.advance();
      if (!this.is("bytestring")) {
        throw new ParseError(
          `expected bytestring value for B, got ${this.current.type} at position ${this.current.position}`,
        );
      }
      const bytes = hexToBytes(this.current.value);
      this.advance();
      return { tag: "bytestring", value: bytes };
    }

    if (this.is("List")) {
      this.advance();
      this.expect("lbracket");
      const items: PlutusData[] = [];
      while (!this.is("rbracket")) {
        items.push(this.parsePlutusData());
        if (!this.is("rbracket")) {
          this.expect("comma");
        }
      }
      this.expect("rbracket");
      return { tag: "list", values: items };
    }

    if (this.is("Map")) {
      this.advance();
      this.expect("lbracket");
      const entries: [PlutusData, PlutusData][] = [];
      while (!this.is("rbracket")) {
        this.expect("lparen");
        const key = this.parsePlutusData();
        this.expect("comma");
        const value = this.parsePlutusData();
        this.expect("rparen");
        entries.push([key, value]);
        if (!this.is("rbracket")) {
          this.expect("comma");
        }
      }
      this.expect("rbracket");
      return { tag: "map", entries };
    }

    if (this.is("Constr")) {
      this.advance();
      if (!this.is("number")) {
        throw new ParseError(
          `expected tag number for Constr, got ${this.current.type} at position ${this.current.position}`,
        );
      }
      const tag = BigInt(this.current.value);
      if (tag < 0n) {
        throw new ParseError(
          `invalid Constr tag ${this.current.value} at position ${this.current.position}`,
        );
      }
      this.advance();
      this.expect("lbracket");
      const fields: PlutusData[] = [];
      while (!this.is("rbracket")) {
        fields.push(this.parsePlutusData());
        if (!this.is("rbracket")) {
          this.expect("comma");
        }
      }
      this.expect("rbracket");
      return { tag: "constr", index: tag, fields };
    }

    throw new ParseError(
      `expected PlutusData constructor (I, B, List, Map, Constr), got ${this.current.type} at position ${this.current.position}`,
    );
  }

  private parseValueConstant(): Constant {
    this.expect("lbracket");

    const rawEntries: Array<{
      currency: Uint8Array;
      tokens: Array<{ name: Uint8Array; quantity: bigint }>;
    }> = [];

    while (!this.is("rbracket")) {
      this.expect("lparen");

      if (!this.is("bytestring")) {
        throw new ParseError(
          `expected bytestring key for value, got ${this.current.type} at position ${this.current.position}`,
        );
      }
      const currency = hexToBytes(this.current.value);
      if (currency.length > 32) {
        throw new ParseError(
          `policy key too long (${currency.length} bytes) at position ${this.current.position}`,
        );
      }
      this.advance();
      this.expect("comma");

      this.expect("lbracket");
      const tokens: Array<{ name: Uint8Array; quantity: bigint }> = [];

      while (!this.is("rbracket")) {
        this.expect("lparen");

        if (!this.is("bytestring")) {
          throw new ParseError(
            `expected bytestring in inner pair, got ${this.current.type} at position ${this.current.position}`,
          );
        }
        const tokenName = hexToBytes(this.current.value);
        if (tokenName.length > 32) {
          throw new ParseError(
            `token key too long (${tokenName.length} bytes) at position ${this.current.position}`,
          );
        }
        this.advance();
        this.expect("comma");

        if (!this.is("number")) {
          throw new ParseError(
            `expected integer in inner pair, got ${this.current.type} at position ${this.current.position}`,
          );
        }
        const qty = BigInt(this.current.value);
        if (qty > VALUE_MAX || qty < VALUE_MIN) {
          throw new ParseError(
            `integer in value token out of range ${this.current.value} at position ${this.current.position}`,
          );
        }
        this.advance();
        this.expect("rparen");

        tokens.push({ name: tokenName, quantity: qty });

        if (!this.is("rbracket")) {
          this.expect("comma");
        }
      }
      this.expect("rbracket");
      this.expect("rparen");

      rawEntries.push({ currency, tokens });

      if (!this.is("rbracket")) {
        this.expect("comma");
      }
    }
    this.expect("rbracket");

    // Canonicalize: merge duplicates, sum quantities, sort, remove zeros
    const merged = new Map<string, Map<string, bigint>>();

    for (const entry of rawEntries) {
      const polKey = bytesToKey(entry.currency);
      let tokenMap = merged.get(polKey);
      if (!tokenMap) {
        tokenMap = new Map();
        merged.set(polKey, tokenMap);
      }
      for (const tok of entry.tokens) {
        const tokKey = bytesToKey(tok.name);
        const existing = tokenMap.get(tokKey) ?? 0n;
        tokenMap.set(tokKey, existing + tok.quantity);
      }
    }

    // Validate summed amounts
    for (const [polKey, tokenMap] of merged) {
      for (const [tokKey, amt] of tokenMap) {
        if (amt > VALUE_MAX || amt < VALUE_MIN) {
          throw new ParseError(
            `summed token amount for policy "${polKey}" key "${tokKey}" out of range ${amt}`,
          );
        }
      }
    }

    // Sort and build result, removing zero-quantity entries
    const sortedPolicies = [...merged.keys()].sort();
    const entries: Array<{
      currency: Uint8Array;
      tokens: Array<{ name: Uint8Array; quantity: bigint }>;
    }> = [];

    for (const polKey of sortedPolicies) {
      const tokenMap = merged.get(polKey)!;
      const sortedTokenKeys = [...tokenMap.keys()].sort();
      const nonZeroTokens: Array<{ name: Uint8Array; quantity: bigint }> = [];
      for (const tokKey of sortedTokenKeys) {
        const qty = tokenMap.get(tokKey)!;
        if (qty !== 0n) {
          nonZeroTokens.push({ name: keyToBytes(tokKey), quantity: qty });
        }
      }
      if (nonZeroTokens.length > 0) {
        entries.push({
          currency: keyToBytes(polKey),
          tokens: nonZeroTokens,
        });
      }
    }

    return {
      type: "value",
      value: {
        entries: entries.map((e) => ({
          currency: e.currency,
          tokens: e.tokens,
        })),
      },
    };
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToKey(bytes: Uint8Array): string {
  let key = "";
  for (let i = 0; i < bytes.length; i++) {
    key += String.fromCharCode(bytes[i]!);
  }
  return key;
}

function keyToBytes(key: string): Uint8Array {
  const bytes = new Uint8Array(key.length);
  for (let i = 0; i < key.length; i++) {
    bytes[i] = key.charCodeAt(i);
  }
  return bytes;
}

const MAX_CONSTR_TAG = 0xffff_ffff_ffff_ffffn; // 2^64 - 1

function parseConstrTag(value: string, position: number): number {
  let n: bigint;
  try {
    n = BigInt(value);
  } catch {
    throw new ParseError(`invalid constr tag ${value} at position ${position}`);
  }
  if (n < 0n || n > MAX_CONSTR_TAG) {
    throw new ParseError(`invalid constr tag ${value} at position ${position}`);
  }
  return Number(n);
}

export function parse(source: string): Program<Name> {
  const parser = new Parser(source);
  return parser.parseProgram();
}
