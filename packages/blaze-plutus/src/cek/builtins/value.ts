import type {
  CurrencyEntry,
  DefaultFunction,
  LedgerValue,
  PlutusData,
  TokenEntry,
} from "../../types";
import type { Value } from "../value";
import { EvaluationError } from "../error";
import { type BuiltinFn, unwrapByteString, unwrapInteger } from "./helpers";

// --- Constants ---

const QUANTITY_MAX = (1n << 127n) - 1n;
const QUANTITY_MIN = -(1n << 127n);
const MAX_KEY_LEN = 32;

// --- Helpers ---

function unwrapValue(val: Value): LedgerValue {
  if (val.tag === "constant" && val.value.type === "value") {
    return val.value.value;
  }
  throw new EvaluationError(
    `expected value constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

function unwrapData(val: Value): PlutusData {
  if (val.tag === "constant" && val.value.type === "data") {
    return val.value.value;
  }
  throw new EvaluationError(
    `expected data constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

function valueResult(v: LedgerValue): Value {
  return { tag: "constant", value: { type: "value", value: v } };
}

function dataResult(d: PlutusData): Value {
  return { tag: "constant", value: { type: "data", value: d } };
}

function checkQuantityRange(q: bigint): void {
  if (q < QUANTITY_MIN || q > QUANTITY_MAX) {
    throw new EvaluationError(`quantity ${q} out of 128-bit signed range`);
  }
}

function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i]! < b[i]!) return -1;
    if (a[i]! > b[i]!) return 1;
  }
  return a.length - b.length;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// --- lookupCoin ---

function lookupCoinImpl(
  ccy: Uint8Array,
  token: Uint8Array,
  v: LedgerValue,
): bigint {
  for (const entry of v.entries) {
    if (bytesEqual(entry.currency, ccy)) {
      for (const tok of entry.tokens) {
        if (bytesEqual(tok.name, token)) {
          return tok.quantity;
        }
      }
      return 0n;
    }
  }
  return 0n;
}

function lookupCoin(args: Value[]): Value {
  const ccy = unwrapByteString(args[0]!);
  const token = unwrapByteString(args[1]!);
  const v = unwrapValue(args[2]!);
  return {
    tag: "constant",
    value: { type: "integer", value: lookupCoinImpl(ccy, token, v) },
  };
}

// --- insertCoin ---

function deleteToken(
  v: LedgerValue,
  ccy: Uint8Array,
  token: Uint8Array,
): LedgerValue {
  const newEntries: CurrencyEntry[] = [];
  for (const entry of v.entries) {
    if (bytesEqual(entry.currency, ccy)) {
      const newTokens: TokenEntry[] = [];
      for (const tok of entry.tokens) {
        if (!bytesEqual(tok.name, token)) {
          newTokens.push(tok);
        }
      }
      if (newTokens.length > 0) {
        newEntries.push({ currency: entry.currency, tokens: newTokens });
      }
    } else {
      newEntries.push(entry);
    }
  }
  return { entries: newEntries };
}

function insertToken(
  v: LedgerValue,
  ccy: Uint8Array,
  token: Uint8Array,
  qty: bigint,
): LedgerValue {
  const newEntries: CurrencyEntry[] = [];
  let inserted = false;

  for (const entry of v.entries) {
    const cmp = compareBytes(entry.currency, ccy);
    if (cmp < 0) {
      newEntries.push(entry);
    } else if (cmp === 0) {
      // Found the currency — insert/replace token in sorted position
      const newTokens: TokenEntry[] = [];
      let tokenInserted = false;
      for (const tok of entry.tokens) {
        const tcmp = compareBytes(tok.name, token);
        if (tcmp < 0) {
          newTokens.push(tok);
        } else if (tcmp === 0) {
          // Replace existing token
          newTokens.push({ name: token, quantity: qty });
          tokenInserted = true;
        } else {
          if (!tokenInserted) {
            newTokens.push({ name: token, quantity: qty });
            tokenInserted = true;
          }
          newTokens.push(tok);
        }
      }
      if (!tokenInserted) {
        newTokens.push({ name: token, quantity: qty });
      }
      newEntries.push({ currency: entry.currency, tokens: newTokens });
      inserted = true;
    } else {
      if (!inserted) {
        // Insert new currency entry before this one
        newEntries.push({
          currency: ccy,
          tokens: [{ name: token, quantity: qty }],
        });
        inserted = true;
      }
      newEntries.push(entry);
    }
  }

  if (!inserted) {
    newEntries.push({
      currency: ccy,
      tokens: [{ name: token, quantity: qty }],
    });
  }

  return { entries: newEntries };
}

function insertCoin(args: Value[]): Value {
  const ccy = unwrapByteString(args[0]!);
  const token = unwrapByteString(args[1]!);
  const qty = unwrapInteger(args[2]!);
  const v = unwrapValue(args[3]!);

  if (qty === 0n) {
    if (ccy.length > MAX_KEY_LEN || token.length > MAX_KEY_LEN) {
      // Oversized keys with zero qty → no-op
      return valueResult(v);
    }
    // Delete the entry
    return valueResult(deleteToken(v, ccy, token));
  }

  // Non-zero qty
  if (ccy.length > MAX_KEY_LEN) {
    throw new EvaluationError(
      `insertCoin: currency key too long (${ccy.length} bytes)`,
    );
  }
  if (token.length > MAX_KEY_LEN) {
    throw new EvaluationError(
      `insertCoin: token key too long (${token.length} bytes)`,
    );
  }
  checkQuantityRange(qty);

  return valueResult(insertToken(v, ccy, token, qty));
}

// --- unionValue ---

function mergeTokenLists(
  a: ReadonlyArray<TokenEntry>,
  b: ReadonlyArray<TokenEntry>,
): TokenEntry[] {
  const result: TokenEntry[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    const cmp = compareBytes(a[i]!.name, b[j]!.name);
    if (cmp < 0) {
      result.push(a[i]!);
      i++;
    } else if (cmp > 0) {
      result.push(b[j]!);
      j++;
    } else {
      // Same token — sum quantities
      const sum = a[i]!.quantity + b[j]!.quantity;
      checkQuantityRange(sum);
      if (sum !== 0n) {
        result.push({ name: a[i]!.name, quantity: sum });
      }
      i++;
      j++;
    }
  }

  while (i < a.length) {
    result.push(a[i]!);
    i++;
  }
  while (j < b.length) {
    result.push(b[j]!);
    j++;
  }

  return result;
}

function unionValue(args: Value[]): Value {
  const v1 = unwrapValue(args[0]!);
  const v2 = unwrapValue(args[1]!);

  const result: CurrencyEntry[] = [];
  let i = 0;
  let j = 0;

  while (i < v1.entries.length && j < v2.entries.length) {
    const cmp = compareBytes(
      v1.entries[i]!.currency,
      v2.entries[j]!.currency,
    );
    if (cmp < 0) {
      result.push(v1.entries[i]!);
      i++;
    } else if (cmp > 0) {
      result.push(v2.entries[j]!);
      j++;
    } else {
      // Same currency — merge token lists
      const merged = mergeTokenLists(
        v1.entries[i]!.tokens,
        v2.entries[j]!.tokens,
      );
      if (merged.length > 0) {
        result.push({
          currency: v1.entries[i]!.currency,
          tokens: merged,
        });
      }
      i++;
      j++;
    }
  }

  while (i < v1.entries.length) {
    result.push(v1.entries[i]!);
    i++;
  }
  while (j < v2.entries.length) {
    result.push(v2.entries[j]!);
    j++;
  }

  return valueResult({ entries: result });
}

// --- valueContains ---

function valueContains(args: Value[]): Value {
  const v1 = unwrapValue(args[0]!);
  const v2 = unwrapValue(args[1]!);

  // Check both values for negative quantities
  for (const entry of v1.entries) {
    for (const tok of entry.tokens) {
      if (tok.quantity < 0n) {
        throw new EvaluationError(
          "valueContains: negative quantity in first value",
        );
      }
    }
  }
  for (const entry of v2.entries) {
    for (const tok of entry.tokens) {
      if (tok.quantity < 0n) {
        throw new EvaluationError(
          "valueContains: negative quantity in second value",
        );
      }
    }
  }

  // For each (ccy, token, qty) in v2, check v1 has >= qty
  for (const entry of v2.entries) {
    for (const tok of entry.tokens) {
      const v1Qty = lookupCoinImpl(entry.currency, tok.name, v1);
      if (v1Qty < tok.quantity) {
        return { tag: "constant", value: { type: "bool", value: false } };
      }
    }
  }

  return { tag: "constant", value: { type: "bool", value: true } };
}

// --- scaleValue ---

function scaleValue(args: Value[]): Value {
  const scalar = unwrapInteger(args[0]!);
  const v = unwrapValue(args[1]!);

  if (scalar === 0n) {
    return valueResult({ entries: [] });
  }

  const newEntries: CurrencyEntry[] = [];
  for (const entry of v.entries) {
    const newTokens: TokenEntry[] = [];
    for (const tok of entry.tokens) {
      const product = tok.quantity * scalar;
      checkQuantityRange(product);
      if (product !== 0n) {
        newTokens.push({ name: tok.name, quantity: product });
      }
    }
    if (newTokens.length > 0) {
      newEntries.push({ currency: entry.currency, tokens: newTokens });
    }
  }

  return valueResult({ entries: newEntries });
}

// --- valueData ---

function valueData(args: Value[]): Value {
  const v = unwrapValue(args[0]!);

  const outerEntries: [PlutusData, PlutusData][] = [];

  for (const entry of v.entries) {
    const innerEntries: [PlutusData, PlutusData][] = [];
    for (const tok of entry.tokens) {
      innerEntries.push([
        { tag: "bytestring", value: tok.name },
        { tag: "integer", value: tok.quantity },
      ]);
    }
    outerEntries.push([
      { tag: "bytestring", value: entry.currency },
      { tag: "map", entries: innerEntries },
    ]);
  }

  return dataResult({ tag: "map", entries: outerEntries });
}

// --- unValueData ---

function unValueData(args: Value[]): Value {
  const d = unwrapData(args[0]!);

  if (d.tag !== "map") {
    throw new EvaluationError(
      `unValueData: expected map data, got ${d.tag}`,
    );
  }

  const entries: CurrencyEntry[] = [];
  let prevCurrency: Uint8Array | null = null;

  for (const [key, val] of d.entries) {
    // Currency key must be ByteString
    if (key.tag !== "bytestring") {
      throw new EvaluationError(
        `unValueData: expected bytestring currency key, got ${key.tag}`,
      );
    }
    if (key.value.length > MAX_KEY_LEN) {
      throw new EvaluationError(
        `unValueData: currency key too long (${key.value.length} bytes)`,
      );
    }

    // Strictly ascending currency keys
    if (prevCurrency !== null) {
      if (compareBytes(prevCurrency, key.value) >= 0) {
        throw new EvaluationError(
          "unValueData: currency keys not in strictly ascending order",
        );
      }
    }
    prevCurrency = key.value;

    // Inner value must be Map
    if (val.tag !== "map") {
      throw new EvaluationError(
        `unValueData: expected map for token entries, got ${val.tag}`,
      );
    }

    // Must not be empty
    if (val.entries.length === 0) {
      throw new EvaluationError("unValueData: empty token map");
    }

    const tokens: TokenEntry[] = [];
    let prevToken: Uint8Array | null = null;

    for (const [tKey, tVal] of val.entries) {
      // Token key must be ByteString
      if (tKey.tag !== "bytestring") {
        throw new EvaluationError(
          `unValueData: expected bytestring token key, got ${tKey.tag}`,
        );
      }
      if (tKey.value.length > MAX_KEY_LEN) {
        throw new EvaluationError(
          `unValueData: token key too long (${tKey.value.length} bytes)`,
        );
      }

      // Strictly ascending token keys
      if (prevToken !== null) {
        if (compareBytes(prevToken, tKey.value) >= 0) {
          throw new EvaluationError(
            "unValueData: token keys not in strictly ascending order",
          );
        }
      }
      prevToken = tKey.value;

      // Quantity must be Integer
      if (tVal.tag !== "integer") {
        throw new EvaluationError(
          `unValueData: expected integer quantity, got ${tVal.tag}`,
        );
      }

      // Quantity must be non-zero
      if (tVal.value === 0n) {
        throw new EvaluationError("unValueData: zero quantity");
      }

      // Quantity must be in 128-bit range
      checkQuantityRange(tVal.value);

      tokens.push({ name: tKey.value, quantity: tVal.value });
    }

    entries.push({ currency: key.value, tokens });
  }

  return valueResult({ entries });
}

// --- Export dispatch record ---

export const builtins: Partial<Record<DefaultFunction, BuiltinFn>> = {
  insertCoin,
  lookupCoin,
  unionValue,
  valueContains,
  scaleValue,
  valueData,
  unValueData,
};
