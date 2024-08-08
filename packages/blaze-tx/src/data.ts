import {
  PlutusData,
  fromHex,
  toHex,
  ConstrPlutusData,
  PlutusList,
  PlutusMap,
  PlutusDataKind,
} from "@blaze-cardano/core";
import type {
  Static as _Static,
  TEnum,
  TLiteral,
  TLiteralValue,
  TProperties,
  TSchema,
} from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";

export class Constr<T> {
  index: number;
  fields: Array<T>;

  constructor(index: number, fields: T[]) {
    this.index = index;
    this.fields = fields;
  }
}

function isVoidConstructor(shape: PConstructor): boolean {
  return shape.index === 0 && shape.fields.length === 0;
}

export type PConstructor = {
  dataType: "constructor";
  index: number;
  fields: PSchema[];
  title?: string;
};

export type PList = {
  dataType: "list";
  items: PSchema[] | PSchema;
  title?: string;
};

type PEnum = {
  title?: string;
  anyOf: PConstructor[];
};

type PMap = {
  dataType: "map";
  keys: PSchema;
  values: PSchema;
};

export type PSchema =
  | {
      dataType:
        | "integer"
        | "bytes"
        | `#${"unit" | "boolean" | "integer" | "bytes" | "string" | "pair" | "list"}`;
    }
  | PList
  | PConstructor
  | PEnum
  | PMap;

type P2Sum = TEnum & {
  anyOf: [PConstructor, PConstructor];
};

function isBoolean(bEnum: TEnum): bEnum is P2Sum {
  return (
    bEnum.anyOf.length === 2 &&
    bEnum.anyOf.some(
      (s) =>
        "dataType" in s &&
        s["dataType"] == "constructor" &&
        s["fields"].length == 0 &&
        s.title === "True",
    ) &&
    bEnum.anyOf.some(
      (s) =>
        "dataType" in s &&
        s["dataType"] == "constructor" &&
        s["fields"].length == 0 &&
        s.title === "False",
    )
  );
}

function isOptional(bEnum: TEnum): bEnum is P2Sum {
  return (
    bEnum.anyOf.length === 2 &&
    bEnum.anyOf.some(
      (s) =>
        "dataType" in s &&
        s["dataType"] == "constructor" &&
        s["fields"].length == 1 &&
        s.title === "Some",
    ) &&
    bEnum.anyOf.some(
      (s) =>
        "dataType" in s &&
        s["dataType"] == "constructor" &&
        s["fields"].length == 0 &&
        s.title === "None",
    )
  );
}

type Json = any;

function replaceProperties(object: Json, properties: Json) {
  Object.keys(object).forEach((key) => {
    delete object[key];
  });
  Object.assign(object, properties);
}

export type Static<T extends TSchema, P extends unknown[] = []> = _Static<T, P>;

export type Data =
  | bigint // Integer
  | string // Bytes in hex
  | Array<Data>
  | Map<Data, Data> // AssocList
  | Constr<Data>;

export const Data = {
  Integer: function (options?: {
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
  }) {
    const integer = Type.Unsafe<bigint>({ dataType: "integer" });
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        integer[key] = value;
      });
    }
    return integer;
  },
  Bytes: function (options?: {
    minLength?: number;
    maxLength?: number;
    enum?: string[];
  }) {
    const bytes = Type.Unsafe<string>({ dataType: "bytes" });
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        bytes[key] = value;
      });
    }
    return bytes;
  },
  Boolean: function () {
    return Type.Unsafe<boolean>({
      anyOf: [
        {
          title: "False",
          dataType: "constructor",
          index: 0,
          fields: [],
        },
        {
          title: "True",
          dataType: "constructor",
          index: 1,
          fields: [],
        },
      ],
    });
  },
  Any: function (): TSchema {
    return Type.Unsafe<PlutusData>({ description: "Any Data." });
  },
  Array: function <T extends TSchema>(
    items: T,
    options?: { minItems?: number; maxItems?: number; uniqueItems?: boolean },
  ) {
    const array = Type.Array(items);
    replaceProperties(array, { dataType: "list", items });
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        array[key] = value;
      });
    }
    return array;
  },
  Map: function <T extends TSchema, U extends TSchema>(
    keys: T,
    values: U,
    options?: { minItems?: number; maxItems?: number },
  ) {
    const map = Type.Unsafe<Map<Static<T>, Static<U>>>({
      dataType: "map",
      keys,
      values,
    });
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        map[key] = value;
      });
    }
    return map;
  },
  /**
   * Object applies by default a PlutusData Constr with index 0.\
   * Set 'hasConstr' to false to serialize Object as PlutusData List.
   */
  Object: function <T extends TProperties>(
    properties: T,
    options?: { hasConstr?: boolean },
  ) {
    const object = Type.Object(properties);
    replaceProperties(object, {
      anyOf: [
        {
          dataType: "constructor",
          index: 0, // Will be replaced when using Data.Enum
          fields: Object.entries(properties).map(([title, p]) => ({
            ...p,
            title,
          })),
        },
      ],
    });
    object["anyOf"][0].hasConstr =
      typeof options?.hasConstr === "undefined" || options.hasConstr;
    return object;
  },
  Enum: function <T extends TSchema>(items: T[]) {
    const union = Type.Union(items);
    replaceProperties(union, {
      anyOf: items.map((item, index) =>
        item["anyOf"][0].fields.length === 0
          ? {
              ...item["anyOf"][0],
              index,
            }
          : {
              dataType: "constructor",
              title: (() => {
                const title = item["anyOf"][0].fields[0].title;
                if (
                  (title as string).charAt(0) !==
                  (title as string).charAt(0).toUpperCase()
                ) {
                  throw new Error(
                    `Enum '${title}' needs to start with an uppercase letter.`,
                  );
                }
                return item["anyOf"][0].fields[0].title;
              })(),
              index,
              fields:
                item["anyOf"][0].fields[0].items ||
                item["anyOf"][0].fields[0].anyOf[0].fields,
            },
      ),
    });
    return union;
  },
  /**
   * Tuple is by default a PlutusData List.\
   * Set 'hasConstr' to true to apply a PlutusData Constr with index 0.
   */
  Tuple: function <T extends TSchema[]>(
    items: [...T],
    options?: { hasConstr?: boolean },
  ) {
    const tuple = Type.Tuple(items);
    replaceProperties(tuple, {
      dataType: "list",
      items,
    });
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        tuple[key] = value;
      });
    }
    return tuple;
  },
  Literal: function <T extends TLiteralValue>(title: T): TLiteral<T> {
    if (
      (title as string).charAt(0) !== (title as string).charAt(0).toUpperCase()
    ) {
      throw new Error(
        `Enum '${title}' needs to start with an uppercase letter.`,
      );
    }
    const literal = Type.Literal(title);
    replaceProperties(literal, {
      anyOf: [
        {
          dataType: "constructor",
          title,
          index: 0, // Will be replaced in Data.Enum
          fields: [],
        },
      ],
    });
    return literal;
  },
  Nullable: function <T extends TSchema>(item: T) {
    return Type.Unsafe<Static<T> | null>({
      anyOf: [
        {
          title: "Some",
          description: "An optional value.",
          dataType: "constructor",
          index: 0,
          fields: [item],
        },
        {
          title: "None",
          description: "Nothing.",
          dataType: "constructor",
          index: 1,
          fields: [],
        },
      ],
    });
  },

  void: (): PlutusData =>
    PlutusData.newConstrPlutusData(new ConstrPlutusData(0n, new PlutusList())),

  castFrom,
  castTo,
  to,
  from,
};

export type Exact<T> = T extends TSchema ? Static<T> : T;
function to<T>(data: Exact<T>, type: T): PlutusData;
function to(data: Data, type?: never): PlutusData;
function to<T extends TSchema>(
  data: T extends undefined ? Data : Exact<T>,
  type: T,
): PlutusData {
  if (type === undefined || type.description == "Any Data.") {
    if (typeof data == "bigint") {
      return PlutusData.newInteger(data);
    } else if (typeof data === "string") {
      return PlutusData.newBytes(fromHex(data));
    } else if (typeof data === "boolean") {
      return PlutusData.newConstrPlutusData(
        new ConstrPlutusData(BigInt(data ? 1 : 0), new PlutusList()),
      );
    } else if (typeof data == "object") {
      if (data instanceof Array) {
        const list = new PlutusList();
        for (let i = 0; i < data.length; i++) {
          list.add(to(data[i], type[0]));
        }
        return PlutusData.newList(list);
      } else if (data instanceof Map) {
        const plutusMap = new PlutusMap();

        for (const [key, value] of data.entries()) {
          plutusMap.insert(to(key), to(value));
        }

        return PlutusData.newMap(plutusMap);
      } else if (data instanceof Constr) {
        return PlutusData.newConstrPlutusData(
          new ConstrPlutusData(BigInt(data.index), to(data.fields).asList()!),
        );
      }
    }
  }
  return castTo(data as Exact<T>, type);
}

function from<T = undefined>(
  data: PlutusData,
  type?: T,
): T extends undefined ? Data : Exact<T> {
  if (
    type == undefined ||
    (type != null &&
      typeof type == "object" &&
      "description" in type &&
      type.description == "Any Data.")
  ) {
    const kind = data.getKind();
    if (kind == PlutusDataKind.Integer) {
      return data.asInteger()! as T extends undefined ? Data : Exact<T>;
    } else if (kind == PlutusDataKind.Bytes) {
      return toHex(data.asBoundedBytes()!) as Data as T extends undefined
        ? Data
        : Exact<T>;
    } else if (kind == PlutusDataKind.ConstrPlutusData) {
      const constr = data.asConstrPlutusData()!;
      const list = from(PlutusData.newList(constr.getData())) as Array<Data>;
      return new Constr(
        Number(constr.getAlternative()),
        list,
      ) as Data as T extends undefined ? Data : Exact<T>;
    } else if (kind == PlutusDataKind.List) {
      const list = data.asList()!;
      const returnList = [];
      for (let i = 0; i < list.getLength(); i++) {
        returnList.push(from(list.get(i)));
      }
      return returnList as Data as T extends undefined ? Data : Exact<T>;
    } else if (kind == PlutusDataKind.Map) {
      const map = new Map<Data, Data>();
      const plutusMap = data.asMap()!;
      const keys = plutusMap.getKeys();
      for (let i = 0; i < plutusMap.getLength(); i++) {
        const key = keys.get(i);
        map.set(from(key), from(plutusMap.get(key)!));
      }
      return map as Data as T extends undefined ? Data : Exact<T>;
    }
  }
  return castFrom(
    data,
    type as unknown as TSchema,
  ) as Exact<T> as T extends undefined ? Data : Exact<T>;
}

function castTo<T extends TSchema>(struct: Exact<T>, schema: T): PlutusData {
  // const type = typeRaw as unknown as PSchema;
  if (!schema) throw new Error("Could not type cast struct.");

  if (struct instanceof PlutusData) {
    return struct;
  }

  if ("anyOf" in schema) {
    const schemaEnum = schema as unknown as TEnum;
    if (schema["anyOf"].length === 1) {
      return castTo(struct, schema["anyOf"][0]! as T);
    }

    if (isBoolean(schemaEnum)) {
      if (typeof struct !== "boolean") {
        throw new Error("Could not type cast to boolean.");
      }
      const trueIdx = schemaEnum["anyOf"].find((s) => s.title === "True")![
        "index"
      ];
      const falseIdx = schemaEnum["anyOf"].find((s) => s.title === "False")![
        "index"
      ];
      return PlutusData.newConstrPlutusData(
        new ConstrPlutusData(
          struct ? BigInt(trueIdx) : BigInt(falseIdx),
          new PlutusList(),
        ),
      );
    } else if (isOptional(schemaEnum)) {
      const someIdx = schemaEnum["anyOf"].find((s) => s.title === "Some")![
        "index"
      ];
      const noneIdx = schemaEnum["anyOf"].find((s) => s.title === "None")![
        "index"
      ];
      if (struct === null) {
        return PlutusData.newConstrPlutusData(
          new ConstrPlutusData(BigInt(noneIdx), new PlutusList()),
        );
      } else {
        const fields = schema["anyOf"][0].fields;
        if (fields.length !== 1) {
          throw new Error("Could not type cast to nullable object.");
        }
        const someList = new PlutusList();
        someList.add(castTo(struct, fields[someIdx]! as T));
        return PlutusData.newConstrPlutusData(
          new ConstrPlutusData(BigInt(someIdx), someList),
        );
      }
    }

    switch (typeof struct) {
      case "string": {
        if (!/[A-Z]/.test(struct[0]!)) {
          throw new Error(
            "Could not type cast to enum. Enum needs to start with an uppercase letter.",
          );
        }
        const enumIndex = schemaEnum["anyOf"].findIndex(
          (s) =>
            s["dataType"] === "constructor" &&
            s["fields"].length === 0 &&
            s.title === struct,
        );
        if (enumIndex === -1) throw new Error("Could not type cast to enum.");
        return PlutusData.newConstrPlutusData(
          new ConstrPlutusData(BigInt(enumIndex), new PlutusList()),
        );
      }
      case "object": {
        if (struct === null) throw new Error("Could not type cast to enum.");
        const structTitle = Object.keys(struct)[0]!;

        if (!/[A-Z]/.test(structTitle)) {
          throw new Error(
            "Could not type cast to enum. Enum needs to start with an uppercase letter.",
          );
        }
        const enumEntry = schemaEnum["anyOf"].find(
          (s) => s["dataType"] === "constructor" && s.title === structTitle,
        );

        if (!enumEntry) throw new Error("Could not type cast to enum.");

        const args = (struct as Record<string, T[] | Json>)[structTitle];

        const fields =
          args instanceof Array
            ? args.map((item, index) =>
                castTo(item, enumEntry["fields"][index]!),
              )
            : enumEntry["fields"].map((entry: Json) => {
                const [, item] = Object.entries(args).find(
                  ([title]) => "title" in entry && title === entry.title,
                )!;
                return castTo(item as Exact<T>, entry as T);
              });

        const plutusList = new PlutusList();
        fields.forEach((f: PlutusData) => plutusList.add(f));

        return PlutusData.newConstrPlutusData(
          new ConstrPlutusData(BigInt(enumEntry["index"]), plutusList),
        );
      }
    }
  }

  if (!("dataType" in schema)) {
    throw new Error("Could not type cast struct.");
  }

  switch (schema["dataType"]) {
    case "integer": {
      if (typeof struct !== "bigint") {
        throw new Error("Could not type cast to integer.");
      }
      return PlutusData.newInteger(struct as bigint);
    }
    case "bytes": {
      if (typeof struct !== "string") {
        throw new Error("Could not type cast to bytes.");
      }
      return PlutusData.newBytes(fromHex(struct as string));
    }
    case "constructor": {
      if (schema["fields"].length == 0 && typeof struct == "string") {
        if (struct != schema.title) {
          throw new Error(
            `Could not cast string ${struct} to constructor with title ${schema.title}`,
          );
        }
        return PlutusData.newConstrPlutusData(
          new ConstrPlutusData(BigInt(schema["index"]), new PlutusList()),
        );
      }
      if (isVoidConstructor(schema as unknown as PConstructor)) {
        if (struct !== undefined) {
          throw new Error("Could not type cast to void.");
        }
        return PlutusData.newConstrPlutusData(
          new ConstrPlutusData(0n, new PlutusList()),
        );
      } else if (
        typeof struct !== "object" ||
        struct === null ||
        schema["fields"].length !== Object.keys(struct).length
      ) {
        throw new Error("Could not type cast to constructor.");
      }
      const fields = new PlutusList();

      for (const field of schema["fields"]) {
        fields.add(
          castTo(
            (struct as Record<string, any>)[
              "title" in field ? field.title! : "wrapper"
            ],
            field,
          ),
        );
      }

      return PlutusData.newConstrPlutusData(
        new ConstrPlutusData(BigInt(schema["index"]), fields),
      );
    }
    case "list": {
      if (!(struct instanceof Array)) {
        throw new Error("Could not type cast to array/tuple.");
      }
      if (schema["items"] instanceof Array) {
        const tupleItems = schema["items"];
        // tuple
        const fields = new PlutusList();
        if (tupleItems.length != struct.length) {
          throw new Error(
            `Could not cast wrong number of values (${struct.length}) to tuple of length ${tupleItems.length}`,
          );
        }
        for (let index = 0; index < schema["items"].length; index++) {
          fields.add(castTo(struct[index], schema["items"][index]!));
        }
        return PlutusData.newList(fields);
      } else {
        const arrayType = schema["items"];
        const list = new PlutusList();
        struct.forEach((item) => list.add(castTo(item, arrayType)));
        return PlutusData.newList(list);
      }
    }
    case "map": {
      if (!(struct instanceof Map)) {
        throw new Error("Could not type cast to map.");
      }
      const map = new PlutusMap();
      for (const [key, value] of struct.entries()) {
        map.insert(
          castTo(key, schema["keys"]),
          castTo(value, schema["values"]),
        );
      }
      return PlutusData.newMap(map);
    }
  }
  throw new Error("Could not type cast struct.");
}

function castFrom<T extends TSchema>(rawData: PlutusData, schema: T): Exact<T> {
  // const type = rawType as unknown as PSchema;
  if (!schema) throw new Error("Could not type cast data.");

  const kind = rawData.getKind();

  if ("anyOf" in schema) {
    const schemaEnum = schema as unknown as TEnum;
    // When enum has only one entry it's a single constructor/record object
    if (schemaEnum["anyOf"].length === 1) {
      return castFrom<T>(rawData, schema["anyOf"][0]! as T);
    }

    if (!(kind == PlutusDataKind.ConstrPlutusData)) {
      throw new Error("Could not type cast to enum.");
    }
    const data = rawData.asConstrPlutusData()!;
    const index = data.getAlternative();
    const fields = data.getData();
    const fieldsLen = fields.getLength();

    const enumShape = schemaEnum["anyOf"].find(
      (entry) => BigInt(entry["index"]) === index,
    );
    if (!enumShape || enumShape["fields"].length !== fieldsLen) {
      throw new Error("Could not type cast to enum.");
    }
    if (isBoolean(schemaEnum)) {
      if (fieldsLen !== 0) {
        throw new Error("Could not type cast to boolean.");
      }
      switch (index) {
        case 0n:
          return false as Exact<T>;
        case 1n:
          return true as Exact<T>;
      }
      throw new Error("Could not type cast to boolean.");
    } else if (isOptional(schemaEnum)) {
      switch (index) {
        case 0n: {
          if (fieldsLen !== 1) {
            throw new Error("Could not type cast to nullable object.");
          }
          return castFrom<T>(fields.get(0), schema["anyOf"][0].fields[0]! as T);
        }
        case 1n: {
          if (fieldsLen !== 0) {
            throw new Error("Could not type cast to nullable object.");
          }
          return null as Exact<T>;
        }
      }
      throw new Error("Could not type cast to nullable object.");
    }
    switch (enumShape["dataType"]) {
      case "constructor": {
        if (enumShape["fields"].length === 0) {
          if (/[A-Z]/.test(enumShape.title![0]!)) {
            return enumShape.title as Exact<T>;
          }
          throw new Error("Could not type cast to enum.");
        } else {
          if (!/[A-Z]/.test(enumShape.title!)) {
            throw new Error(
              "Could not type cast to enum. Enums need to start with an uppercase letter.",
            );
          }

          if (enumShape["fields"].length !== fieldsLen) {
            throw new Error("Could not type cast to enum.");
          }

          // check if named args
          const args =
            "title" in enumShape["fields"][0]!
              ? Object.fromEntries(
                  enumShape["fields"].map((field: Json, index: Json) => [
                    field.title,
                    castFrom<T>(fields.get(index), field),
                  ]),
                )
              : enumShape["fields"].map((field: Json, index: Json) =>
                  castFrom<T>(fields.get(index), field as T),
                );

          return {
            [enumShape.title!]: args,
          } as Exact<T>;
        }
      }
    }
  }

  switch (schema["dataType"]) {
    case "integer": {
      if (kind !== PlutusDataKind.Integer) {
        throw new Error("Could not type cast to integer.");
      }
      return rawData.asInteger() as Exact<T>;
    }
    case "bytes": {
      if (kind !== PlutusDataKind.Bytes) {
        throw new Error("Could not type cast to integer.");
      }
      return toHex(rawData.asBoundedBytes()!) as Exact<T>;
    }
    case "constructor": {
      if (kind !== PlutusDataKind.ConstrPlutusData) {
        throw new Error("Could not type cast to constructor.");
      }
      const constr = rawData.asConstrPlutusData()!;
      if (isVoidConstructor(schema as unknown as PConstructor)) {
        if (
          constr.getAlternative() !== 0n ||
          constr.getData().getLength() !== 0
        ) {
          throw new Error("Could not type cast to void.");
        }
        return undefined as Exact<T>;
      } else if (constr.getAlternative() === BigInt(schema["index"])) {
        const fields: Record<string, Exact<T>> = {};
        if (schema["fields"].length !== constr.getData().getLength()) {
          throw new Error(
            "Could not type cast to object. Fields do not match.",
          );
        }
        schema["fields"].forEach((field: any, fieldIndex: number) => {
          const title = field.title || "wrapper";
          if (/[A-Z]/.test(title[0])) {
            throw new Error(
              "Could not type cast to object. Object properties need to start with a lowercase letter.",
            );
          }
          fields[title] = castFrom<T>(constr.getData().get(fieldIndex), field);
        });
        return fields as Exact<T>;
      }
      throw new Error("Could not type cast to object.");
    }

    case "list": {
      if (kind !== PlutusDataKind.List) {
        throw new Error("Could not type cast to list.");
      }
      const data = rawData.asList()!;
      if (schema["items"] instanceof Array) {
        // tuple
        const res = [];
        for (let i = 0; i < data.getLength(); i++) {
          res.push(castFrom<T>(data.get(i), schema["items"][i]! as T));
        }
        return res as Exact<T>;
      } else {
        // array
        const res = [];
        for (let i = 0; i < data.getLength(); i++) {
          res.push(castFrom<T>(data.get(i), schema["items"] as T));
        }
        return res as Exact<T>;
      }
    }
    case "map": {
      if (!(kind == PlutusDataKind.Map)) {
        throw new Error("Could not type cast to map.");
      }
      const data = rawData.asMap()!;

      const map = new Map();
      const keys = data.getKeys();
      for (let i = 0; i < keys.getLength(); i++) {
        map.set(
          castFrom<T>(keys.get(i), schema["keys"] as T),
          castFrom<T>(data.get(keys.get(i))!, schema["values"] as T),
        );
      }
      return map as Exact<T>;
    }
    case undefined: {
      return rawData as Exact<T>;
    }
  }
  throw new Error("Could not type cast data.");
}
