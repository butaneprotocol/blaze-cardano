import type { Constant, ConstantType, DefaultFunction, PlutusData } from "../../types";
import type { Value } from "../value";
import { EvaluationError } from "../error";
import {
  type BuiltinFn,
  unwrapByteString,
  unwrapInteger,
  boolResult,
} from "./helpers";

// --- Common type constants ---

const T_DATA: ConstantType = { tag: "data" };
const T_INTEGER: ConstantType = { tag: "integer" };
const T_LIST_DATA: ConstantType = { tag: "list", element: T_DATA };
const T_PAIR_DATA_DATA: ConstantType = {
  tag: "pair",
  first: T_DATA,
  second: T_DATA,
};
// --- Module-specific unwrap helpers ---

function unwrapData(val: Value): PlutusData {
  if (val.tag === "constant" && val.value.type === "data") {
    return val.value.value;
  }
  throw new EvaluationError(
    `expected data constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

function unwrapList(val: Value): ReadonlyArray<Constant> {
  if (val.tag === "constant" && val.value.type === "list") {
    return val.value.values;
  }
  throw new EvaluationError(
    `expected list constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

function unwrapUnit(val: Value): void {
  if (val.tag === "constant" && val.value.type === "unit") {
    return;
  }
  throw new EvaluationError(
    `expected unit constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

// --- Result builders ---

function dataResult(d: PlutusData): Value {
  return { tag: "constant", value: { type: "data", value: d } };
}

// --- Deep equality for PlutusData ---

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function plutusDataEquals(a: PlutusData, b: PlutusData): boolean {
  if (a.tag !== b.tag) return false;
  switch (a.tag) {
    case "constr": {
      const bc = b as typeof a;
      if (a.index !== bc.index) return false;
      if (a.fields.length !== bc.fields.length) return false;
      for (let i = 0; i < a.fields.length; i++) {
        if (!plutusDataEquals(a.fields[i]!, bc.fields[i]!)) return false;
      }
      return true;
    }
    case "map": {
      const bm = b as typeof a;
      if (a.entries.length !== bm.entries.length) return false;
      for (let i = 0; i < a.entries.length; i++) {
        if (
          !plutusDataEquals(a.entries[i]![0], bm.entries[i]![0]) ||
          !plutusDataEquals(a.entries[i]![1], bm.entries[i]![1])
        )
          return false;
      }
      return true;
    }
    case "list": {
      const bl = b as typeof a;
      if (a.values.length !== bl.values.length) return false;
      for (let i = 0; i < a.values.length; i++) {
        if (!plutusDataEquals(a.values[i]!, bl.values[i]!)) return false;
      }
      return true;
    }
    case "integer":
      return a.value === (b as typeof a).value;
    case "bytestring":
      return bytesEqual(a.value, (b as typeof a).value);
  }
}

// --- Data constructors ---

function constrData(args: Value[]): Value {
  const tag = unwrapInteger(args[0]!);
  const fieldConstants = unwrapList(args[1]!);
  const fields: PlutusData[] = [];
  for (const c of fieldConstants) {
    if (c.type !== "data") {
      throw new EvaluationError(
        `constrData: expected list of data, got ${c.type}`,
      );
    }
    fields.push(c.value);
  }
  return dataResult({ tag: "constr", index: tag, fields });
}

function mapData(args: Value[]): Value {
  const pairConstants = unwrapList(args[0]!);
  const entries: [PlutusData, PlutusData][] = [];
  for (const c of pairConstants) {
    if (c.type !== "pair") {
      throw new EvaluationError(
        `mapData: expected list of pairs, got ${c.type}`,
      );
    }
    if (c.first.type !== "data" || c.second.type !== "data") {
      throw new EvaluationError(
        `mapData: expected pair of data, got pair<${c.first.type}, ${c.second.type}>`,
      );
    }
    entries.push([c.first.value, c.second.value]);
  }
  return dataResult({ tag: "map", entries });
}

function listData(args: Value[]): Value {
  const elConstants = unwrapList(args[0]!);
  const values: PlutusData[] = [];
  for (const c of elConstants) {
    if (c.type !== "data") {
      throw new EvaluationError(
        `listData: expected list of data, got ${c.type}`,
      );
    }
    values.push(c.value);
  }
  return dataResult({ tag: "list", values });
}

function iData(args: Value[]): Value {
  const n = unwrapInteger(args[0]!);
  return dataResult({ tag: "integer", value: n });
}

function bData(args: Value[]): Value {
  const bs = unwrapByteString(args[0]!);
  return dataResult({ tag: "bytestring", value: bs });
}

// --- Data deconstructors ---

function unConstrData(args: Value[]): Value {
  const d = unwrapData(args[0]!);
  if (d.tag !== "constr") {
    throw new EvaluationError(`unConstrData: expected constr data, got ${d.tag}`);
  }
  return {
    tag: "constant",
    value: {
      type: "pair",
      fstType: T_INTEGER,
      sndType: T_LIST_DATA,
      first: { type: "integer", value: d.index },
      second: {
        type: "list",
        itemType: T_DATA,
        values: d.fields.map((f): Constant => ({ type: "data", value: f })),
      },
    },
  };
}

function unMapData(args: Value[]): Value {
  const d = unwrapData(args[0]!);
  if (d.tag !== "map") {
    throw new EvaluationError(`unMapData: expected map data, got ${d.tag}`);
  }
  return {
    tag: "constant",
    value: {
      type: "list",
      itemType: T_PAIR_DATA_DATA,
      values: d.entries.map(
        ([k, v]): Constant => ({
          type: "pair",
          fstType: T_DATA,
          sndType: T_DATA,
          first: { type: "data", value: k },
          second: { type: "data", value: v },
        }),
      ),
    },
  };
}

function unListData(args: Value[]): Value {
  const d = unwrapData(args[0]!);
  if (d.tag !== "list") {
    throw new EvaluationError(`unListData: expected list data, got ${d.tag}`);
  }
  return {
    tag: "constant",
    value: {
      type: "list",
      itemType: T_DATA,
      values: d.values.map((v): Constant => ({ type: "data", value: v })),
    },
  };
}

function unIData(args: Value[]): Value {
  const d = unwrapData(args[0]!);
  if (d.tag !== "integer") {
    throw new EvaluationError(`unIData: expected integer data, got ${d.tag}`);
  }
  return { tag: "constant", value: { type: "integer", value: d.value } };
}

function unBData(args: Value[]): Value {
  const d = unwrapData(args[0]!);
  if (d.tag !== "bytestring") {
    throw new EvaluationError(
      `unBData: expected bytestring data, got ${d.tag}`,
    );
  }
  return { tag: "constant", value: { type: "bytestring", value: d.value } };
}

// --- equalsData ---

function equalsData(args: Value[]): Value {
  const a = unwrapData(args[0]!);
  const b = unwrapData(args[1]!);
  return boolResult(plutusDataEquals(a, b));
}

// --- chooseData ---

function chooseData(args: Value[]): Value {
  const d = unwrapData(args[0]!);
  switch (d.tag) {
    case "constr":
      return args[1]!;
    case "map":
      return args[2]!;
    case "list":
      return args[3]!;
    case "integer":
      return args[4]!;
    case "bytestring":
      return args[5]!;
  }
}

// --- mkPairData ---

function mkPairData(args: Value[]): Value {
  const a = unwrapData(args[0]!);
  const b = unwrapData(args[1]!);
  return {
    tag: "constant",
    value: {
      type: "pair",
      fstType: T_DATA,
      sndType: T_DATA,
      first: { type: "data", value: a },
      second: { type: "data", value: b },
    },
  };
}

// --- mkNilData / mkNilPairData ---

function mkNilData(args: Value[]): Value {
  unwrapUnit(args[0]!);
  return {
    tag: "constant",
    value: { type: "list", itemType: T_DATA, values: [] },
  };
}

function mkNilPairData(args: Value[]): Value {
  unwrapUnit(args[0]!);
  return {
    tag: "constant",
    value: { type: "list", itemType: T_PAIR_DATA_DATA, values: [] },
  };
}

// --- Export dispatch record ---

export const builtins: Partial<Record<DefaultFunction, BuiltinFn>> = {
  constrData,
  mapData,
  listData,
  iData,
  bData,
  unConstrData,
  unMapData,
  unListData,
  unIData,
  unBData,
  equalsData,
  chooseData,
  mkPairData,
  mkNilData,
  mkNilPairData,
};
