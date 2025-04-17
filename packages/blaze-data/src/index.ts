import { type TEnum, Type, type Static, type TSchema } from "@sinclair/typebox";
import {
  ConstrPlutusData,
  fromHex,
  HexBlob,
  PlutusData,
  PlutusList,
  PlutusMap,
} from "@blaze-cardano/core";
export { Type, type TSchema, type TArray } from "@sinclair/typebox";

export const Void = (): PlutusData =>
  PlutusData.newConstrPlutusData(new ConstrPlutusData(0n, new PlutusList()));

export const TPlutusData: TSchema = Type.Unsafe<PlutusData>(Type.Any());

export type Exact<T> = T extends TSchema ? Static<T> : T;

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
