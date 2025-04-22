import {
  Kind,
  Type,
  PatternStringExact,
  PatternNumberExact,
  type Static,
  type TEnum,
  type TSchema,
  type TObject,
  type TNumber,
  type TBigInt,
  type TString,
  type TArray,
  type TUnion,
  type TLiteral,
  type TRecord,
  type TBoolean,
  type TRef,
  type TThis,
} from "@sinclair/typebox";
import {
  ConstrPlutusData,
  fromHex,
  HexBlob,
  PlutusData,
  PlutusList,
  PlutusMap,
  toHex,
} from "@blaze-cardano/core";
export { Type, type TSchema, type TArray } from "@sinclair/typebox";

export const Void = (): PlutusData =>
  PlutusData.newConstrPlutusData(new ConstrPlutusData(0n, new PlutusList()));

export const TPlutusData: TSchema = Type.Unsafe<PlutusData>(Type.Any());

export type Exact<T> = T extends TSchema ? Static<T> : T;

const isArray = (t: TSchema): t is TArray => t[Kind] === "Array";
const isBigInt = (t: TSchema): t is TBigInt => t[Kind] === "BigInt";
const isBoolean = (t: TSchema): t is TBoolean => t[Kind] === "Boolean";
const isLiteral = (t: TSchema): t is TLiteral => t[Kind] === "Literal";
const isNumber = (t: TSchema): t is TNumber => t[Kind] === "Number";
const isObject = (t: TSchema): t is TObject => t[Kind] === "Object";
const isRecord = (t: TSchema): t is TRecord => t[Kind] === "Record";
const isRef = (t: TSchema): t is TRef => t[Kind] === "Ref";
const isString = (t: TSchema): t is TString => t[Kind] === "String";
const isThis = (t: TSchema): t is TThis => t[Kind] === "This";
const isUnion = (t: TSchema): t is TUnion => t[Kind] === "Union";

export function serialize<T extends TSchema>(
  type: T,
  data: Exact<T>,
): PlutusData {
  const result = _serialize(type, data, ["root"]);
  return result;
}

export function _serialize<T extends TSchema>(
  type: T,
  data: Exact<T>,
  path: string[],
  defs?: Record<string, TSchema>,
): PlutusData {
  if (!type) {
    throw new Error(
      `Cannot serialize ${data} without a type. Found at ${path.join(".")}`,
    );
  }

  if (data instanceof PlutusData) {
    return data;
  }

  if ("$ref" in type) {
    defs ??= type["$defs"];
    if (!defs) {
      throw new Error(
        `Could not resolve type ${type["$ref"]} at ${path.join(".")} because we don't have a definitions dictionary`,
      );
    }

    const resolvedType = defs[type["$ref"]];
    if (!resolvedType) {
      throw new Error(
        `Could not resolve type ${type["$ref"]} at ${path.join(".")}`,
      );
    }
    return _serialize(resolvedType, data, path, defs);
  }

  if ("anyOf" in type) {
    const enumType = type as unknown as TEnum;
    if (enumType.anyOf.length === 1) {
      return _serialize(type["anyOf"][0]! as T, data, path, defs);
    }
  }

  if ("type" in type) {
    switch (type["type"]) {
      case "bigint":
        {
          if (data instanceof BigInt || typeof data === "bigint") {
            return PlutusData.newInteger(data as bigint);
          } else if (typeof data === "number") {
            return PlutusData.newInteger(BigInt(data));
          } else if (typeof data === "string") {
            return PlutusData.newInteger(BigInt(data));
          }
          throw new Error(
            `Invalid data for plutus integer at path ${path.join(".")}: ${typeof data}`,
          );
        }
        break;
      case "string":
        {
          return PlutusData.newBytes(fromHex(data as string));
        }
        break;
      case "array":
        {
          // Handle tuple-enums
          if ("ctor" in type) {
            if (
              typeof type["ctor"] !== "bigint" &&
              typeof type["ctor"] !== "number"
            ) {
              throw new Error(
                `Invalid object at ${path.join(".")}: Enum variant constructor index must be a number`,
              );
            }

            const constructor = BigInt(type["ctor"]);
            const fieldData = new PlutusList();

            const array = data as Array<any>;
            for (let idx = 0; idx < array.length; idx++) {
              let fieldType: any = undefined;
              if (Array.isArray(type["items"])) {
                // A tuple will be a schema with an array of item types
                fieldType = type["items"][idx];
              } else {
                // Otherwise it's just a homogeneous array, reusing the same type each time
                fieldType = type["items"];
              }
              fieldData.add(
                _serialize(
                  fieldType,
                  array[idx],
                  [...path, idx.toString()],
                  defs,
                ),
              );
            }

            return PlutusData.newConstrPlutusData(
              new ConstrPlutusData(constructor, fieldData),
            );
          } else {
            const items = new PlutusList();
            const array = data as Array<any>;
            for (let idx = 0; idx < array.length; idx++) {
              let itemType: any = undefined;
              if (Array.isArray(type["items"])) {
                // A tuple will be a schema with an array of item types
                itemType = type["items"][idx];
              } else {
                // Otherwise it's just a homogeneous array, reusing the same type each time
                itemType = type["items"];
              }
              items.add(
                _serialize(
                  itemType,
                  array[idx],
                  [...path, idx.toString()],
                  defs,
                ),
              );
            }
            return PlutusData.newList(items);
          }
        }
        break;
      case "object":
        {
          // Deal with maps
          if ("patternProperties" in type) {
            const valueType = type["patternProperties"]["^(.*)$"];
            const dataMap = new PlutusMap();
            const object = data as Record<string, any>;
            for (const key in object) {
              const plutusKey = PlutusData.newBytes(fromHex(key));
              const plutusValue = _serialize(
                valueType,
                object[key],
                [...path, key],
                defs,
              );
              dataMap.insert(plutusKey, plutusValue);
            }
            return PlutusData.newMap(dataMap);
          }
          if (typeof type["ctor"] === "undefined") {
            throw new Error(
              `Invalid object at ${path.join(".")}: Enum variant must have a constructor index`,
            );
          }
          if (
            typeof type["ctor"] !== "bigint" &&
            typeof type["ctor"] !== "number"
          ) {
            throw new Error(
              `Invalid object at ${path.join(".")}: Enum variant constructor index must be a number`,
            );
          }
          const constructor = BigInt(type["ctor"]);
          const object = data as Record<string, any>;
          const fields = type["properties"] as Record<string, T>;
          const fieldData = new PlutusList();
          for (const [field, fieldType] of Object.entries(fields)) {
            fieldData.add(
              _serialize(fieldType, object[field], [...path, field], defs),
            );
          }
          return PlutusData.newConstrPlutusData(
            new ConstrPlutusData(constructor, fieldData),
          );
        }
        break;
      default: {
        console.log("Unhandled: ", type["type"]);
      }
    }
  } else if ("anyOf" in type) {
    // This is a plutus data constructor
    if (type["anyOf"].length === 1) {
      // Just one variant, so we can directly serialize it
      return _serialize(type["anyOf"][0], data, path, defs);
    }
    // Otherwise, it could be either boolean or optional
    // Finally, we should try to identify which variant this is:
    switch (typeof data) {
      case "string": {
        if (!/[A-Z]/.test(data[0]!)) {
          throw new Error(
            `Invalid enum variant at ${path.join(".")}: Enum variants must start with an uppercase letter`,
          );
        }

        const variant = type["anyOf"].find(
          (variant: TSchema) =>
            variant["type"] === "string" && variant["const"] === data,
        );
        if (!variant) {
          throw new Error(
            `Invalid enum variant at ${path.join(".")}: Enum variant not found`,
          );
        }
        if (typeof variant["ctor"] === "undefined") {
          throw new Error(
            `Invalid enum variant at ${path.join(".")}: Enum variant constructor index must be defined`,
          );
        }
        if (
          typeof variant["ctor"] !== "bigint" &&
          typeof variant["ctor"] !== "number"
        ) {
          throw new Error(
            `Invalid enum variant at ${path.join(".")}: Enum variant constructor index must be a number`,
          );
        }

        return PlutusData.newConstrPlutusData(
          new ConstrPlutusData(BigInt(variant["ctor"]), new PlutusList()),
        );
      }
      case "object": {
        if (typeof data === "undefined" || data === null) {
          throw new Error(
            `Invalid object at ${path.join(".")}: Enum variants cannot be empty`,
          );
        }
        const variantTitle = Object.keys(data)[0];
        if (!variantTitle) {
          throw new Error(
            `Invalid object at ${path.join(".")}: Enum has no keys`,
          );
        }
        if (!/^[A-Z]/.test(variantTitle)) {
          throw new Error(
            `Invalid object at ${path.join(".")}: Enum variants must start with an uppercase letter`,
          );
        }
        // Find which variant this is
        const variant = type["anyOf"].find(
          (variant: TSchema) =>
            variant["type"] === "object" &&
            Object.keys(variant["properties"])[0] === variantTitle,
        );
        if (!variant) {
          throw new Error(
            `Invalid object at ${path.join(".")}: Enum variant not found`,
          );
        }
        const schema = variant["properties"][variantTitle];
        return _serialize(schema, (data as any)[variantTitle], [
          ...path,
          variantTitle,
        ]);
      }
    }
  }

  return PlutusData.fromCbor(HexBlob("01"));
}

export function parse<T extends TSchema>(
  type: T,
  data: PlutusData,
  defs?: Record<string, TSchema>,
): Exact<T> {
  return _parse(type, data, ["root"], { ...defs });
}

export function _parse<T extends TSchema>(
  type: T,
  data: PlutusData,
  path: string[],
  defs: Record<string, TSchema>,
): Exact<T> {
  if (type.$id) {
    defs[type.$id] = type;
  }
  type = resolveType<T>(type, path, defs);
  if (isRef(type) || isThis(type)) {
    const realType = defs[type.$ref];
    if (!realType) {
      throw new Error(
        `Invalid type at ${path.join(".")}: Unrecognized reference ${type.$ref}`,
      );
    }
    return _parse(realType, data, path, defs) as Exact<T>;
  }
  if (isBigInt(type)) {
    const value = data.asInteger();
    if (value === undefined) {
      throw new Error(
        `Invalid type at ${path.join(".")}: Expected integer, got ${data.getKind()}.`,
      );
    }
    return value as Exact<T>;
  }
  if (isNumber(type)) {
    const value = data.asInteger();
    if (value === undefined) {
      throw new Error(
        `Invalid type at ${path.join(".")}: Expected integer, got ${data.getKind()}.`,
      );
    }
    if (value < Number.MIN_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Invalid number at ${path.join(".")}: out of range`);
    }
    return Number(value) as Exact<T>;
  }
  if (isString(type)) {
    const value = data.asBoundedBytes();
    if (!value) {
      throw new Error(
        `Invalid type at ${path.join(".")}: Expected bytes, got ${data.getKind()}.`,
      );
    }
    return toHex(value) as Exact<T>;
  }
  if (isBoolean(type)) {
    return _parse(BOOLEAN_ENUM_SCHEMA, data, path, defs) as Exact<T>;
  }
  if (isLiteral(type)) {
    const value = data.asConstrPlutusData();
    if (!value) {
      throw new Error(
        `Invalid type at ${path.join(".")}: Expected constr, got ${data.getKind()}.`,
      );
    }
    if ("ctor" in type) {
      const ctor = BigInt(type["ctor"]);
      if (ctor !== value.getAlternative()) {
        throw new Error(
          `Invalid literal at ${path.join(".")}: Expected alternative ${ctor}, got ${value.getAlternative()}.`,
        );
      }
    } else {
      throw new Error(
        `Invalid literal at ${path.join(".")}: Enum variant not found.`,
      );
    }
    if (value.getData().getLength()) {
      throw new Error(
        `Invalid literal at ${path.join(".")}: Enum variants are not expected to have fields.`,
      );
    }
    return type.const as Exact<T>;
  }
  if (isRecord(type)) {
    const value = data.asMap();
    if (!value) {
      throw new Error(
        `Invalid type at ${path.join(".")}: Expected map, got ${data.getKind()}.`,
      );
    }
    const result: Record<any, any> = {};
    const keys = value.getKeys();
    for (let i = 0; i < value.getLength(); ++i) {
      const key = keys.get(i);
      const item = value.get(key)!;
      if (key.asInteger() !== undefined) {
        const intKey = Number(key.asInteger());
        const itemType = type.patternProperties[PatternNumberExact];
        if (!itemType) {
          throw new Error(
            `Invalid map at ${path.join(".")}: Unexpected numeric key.`,
          );
        }
        result[intKey] = _parse(
          itemType,
          item,
          [...path, intKey.toString()],
          defs,
        );
      } else if (key.asBoundedBytes()) {
        const bytesKey = toHex(key.asBoundedBytes()!);
        const itemType = type.patternProperties[PatternStringExact];
        if (!itemType) {
          throw new Error(
            `Invalid map at ${path.join(".")}: Unexpected non-numeric key.`,
          );
        }
        result[bytesKey] = _parse(itemType, item, [...path, bytesKey], defs);
      } else {
        throw new Error(
          `Invalid map at ${path.join(".")}: Keys of type ${key.getKind()} are not supported.`,
        );
      }
    }
    return result as Exact<T>;
  }
  if (isArray(type)) {
    const value = data.asList();
    if (!value) {
      throw new Error(
        `Invalid type at ${path.join(".")}: Expected list, got ${data.getKind()}.`,
      );
    }
    const result = [];
    for (let i = 0; i < value.getLength(); ++i) {
      const item = value.get(i);
      result.push(_parse(type.items, item, [...path, i.toString()], defs));
    }
    return result as Exact<T>;
  }
  if (isObject(type)) {
    const value = data.asConstrPlutusData();
    if (!value) {
      throw new Error(
        `Invalid type at ${path.join(".")}: Expected constr, got ${data.getKind()}.`,
      );
    }
    if ("ctor" in type) {
      const ctor = BigInt(type["ctor"]);
      if (ctor !== value.getAlternative()) {
        throw new Error(
          `Invalid constr at ${path.join(".")}: Expected alternative ${ctor}, got ${value.getAlternative()}.`,
        );
      }
    }
    const result: Record<string, unknown> = {};

    const fields = value.getData();
    let fieldIndex = 0;
    for (const [fieldName, fieldType] of Object.entries(type.properties)) {
      const fieldData = fields.get(fieldIndex);
      if (!fieldData) {
        const required = (type.required?.indexOf(fieldName) ?? -1) >= 0;
        if (required && !fieldData) {
          throw new Error(
            `Invalid object at ${path.join(".")}: Missing required field ${fieldName}`,
          );
        }
      } else {
        result[fieldName] = _parse(
          fieldType,
          fieldData,
          [...path, fieldName],
          defs,
        );
      }
      ++fieldIndex;
    }
    return result as Exact<T>;
  }
  if (isUnion(type)) {
    const value = data.asConstrPlutusData();
    if (!value) {
      throw new Error(
        `Invalid type at ${path.join(".")}: Expected constr, got ${data.getKind()}.`,
      );
    }
    const actualCtor = value.getAlternative();
    const variantIndex = type.anyOf.findIndex((s) => {
      const resolved = resolveType(s, path, defs);
      return "ctor" in resolved && BigInt(resolved["ctor"]) === actualCtor;
    });
    if (variantIndex < 0) {
      throw new Error(
        `Invalid union at ${path.join(".")}: Unrecognized variant ${actualCtor}.`,
      );
    }
    return _parse(
      type.anyOf[variantIndex]!,
      data,
      [...path, variantIndex.toString()],
      defs,
    ) as Exact<T>;
  }
  throw new Error(
    `Invalid type at ${path.join(".")}: Unrecognized type "${type[Kind]}".`,
  );
}

function resolveType<T extends TSchema>(
  type: T,
  path: string[],
  defs: Record<string, TSchema>,
): T {
  if (isRef(type) || isThis(type)) {
    const realType = defs[type.$ref];
    if (!realType) {
      throw new Error(
        `Invalid type at ${path.join(".")}: Unrecognized reference ${type.$ref}`,
      );
    }
    return resolveType(realType, path, defs) as T;
  }
  return type;
}

const BOOLEAN_ENUM_SCHEMA = Type.Union([
  Type.Literal(false, { ctor: 0 }),
  Type.Literal(true, { ctor: 1 }),
]);
