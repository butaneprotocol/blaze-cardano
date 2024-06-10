import {
  PlutusData,
  fromHex,
  toHex,
  ConstrPlutusData,
  PlutusList,
  PlutusMap,
  PlutusDataKind,
  HexBlob,
} from "@blaze-cardano/core";

const listToCbor = PlutusList.prototype.toCbor;

PlutusList.prototype.toCbor = function (this) {
  this.toCbor = listToCbor;
  const res = this.toCbor();
  this.toCbor = PlutusList.prototype.toCbor;
  if (res == "9fff") {
    return HexBlob("80");
  }
  return res;
};

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

type P2Sum = {
  anyOf: [PConstructor, PConstructor];
};
function isBoolean(bEnum: PEnum): bEnum is P2Sum {
  return (
    bEnum.anyOf.length === 2 &&
    bEnum.anyOf.some(
      (s) =>
        "dataType" in s &&
        s.dataType == "constructor" &&
        s.fields.length == 0 &&
        s.title === "True",
    ) &&
    bEnum.anyOf.some(
      (s) =>
        "dataType" in s &&
        s.dataType == "constructor" &&
        s.fields.length == 0 &&
        s.title === "False",
    )
  );
}

function isOptional(bEnum: PEnum): bEnum is P2Sum {
  return (
    bEnum.anyOf.length === 2 &&
    bEnum.anyOf.some(
      (s) =>
        "dataType" in s &&
        s.dataType == "constructor" &&
        s.fields.length == 1 &&
        s.title === "Some",
    ) &&
    bEnum.anyOf.some(
      (s) =>
        "dataType" in s &&
        s.dataType == "constructor" &&
        s.fields.length == 0 &&
        s.title === "None",
    )
  );
}

export const Data = {
  castFrom,
  castTo,
  to,
  from,
  void: (): PlutusData =>
    PlutusData.newConstrPlutusData(new ConstrPlutusData(0n, new PlutusList())),
};

function to<T extends PSchema>(
  data: Record<string, object> | string,
  type: T,
): PlutusData {
  return castTo(data, type);
}

function from<T>(data: PlutusData, type: PSchema): T {
  return castFrom(data, type);
}

function castTo<T extends PSchema>(
  struct: Record<string, object> | string,
  type: T,
): PlutusData {
  if (!type) throw new Error("Could not type cast struct.");

  if (struct instanceof PlutusData) {
    return struct;
  }

  if ("anyOf" in type) {
    if (type.anyOf.length === 1) {
      return castTo(struct, type.anyOf[0]!);
    }

    if (isBoolean(type)) {
      if (typeof struct !== "boolean") {
        throw new Error("Could not type cast to boolean.");
      }
      const trueIdx = type.anyOf.find((s) => s.title === "True")!.index;
      const falseIdx = type.anyOf.find((s) => s.title === "False")!.index;
      return PlutusData.newConstrPlutusData(
        new ConstrPlutusData(
          struct ? BigInt(trueIdx) : BigInt(falseIdx),
          new PlutusList(),
        ),
      );
    } else if (isOptional(type)) {
      const someIdx = type.anyOf.find((s) => s.title === "Some")!.index;
      const noneIdx = type.anyOf.find((s) => s.title === "None")!.index;
      if (struct === null) {
        return PlutusData.newConstrPlutusData(
          new ConstrPlutusData(BigInt(noneIdx), new PlutusList()),
        );
      } else {
        const fields = type.anyOf[0].fields;
        if (fields.length !== 1) {
          throw new Error("Could not type cast to nullable object.");
        }
        const someList = new PlutusList();
        someList.add(castTo(struct, fields[someIdx]!));
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
        const enumIndex = type.anyOf.findIndex(
          (s) =>
            s.dataType === "constructor" &&
            s.fields.length === 0 &&
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
        const enumEntry = type.anyOf.find(
          (s) => s.dataType === "constructor" && s.title === structTitle,
        );

        if (!enumEntry) throw new Error("Could not type cast to enum.");

        const args = struct[structTitle]!;

        const fields =
          args instanceof Array
            ? args.map((item, index) => castTo(item, enumEntry.fields[index]!))
            : enumEntry.fields.map((entry) => {
                const [, item] = Object.entries(args).find(
                  ([title]) => "title" in entry && title === entry.title,
                )!;
                return castTo(item as Record<string, object> | string, entry);
              });

        const plutusList = new PlutusList();
        fields.forEach((f) => plutusList.add(f));

        return PlutusData.newConstrPlutusData(
          new ConstrPlutusData(BigInt(enumEntry.index), plutusList),
        );
      }
    }
  }

  switch (type.dataType) {
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
      if (type.fields.length == 0 && typeof struct == "string") {
        if (struct != type.title) {
          throw new Error(
            `Could not cast string ${struct} to constructor with title ${type.title}`,
          );
        }
        return PlutusData.newConstrPlutusData(
          new ConstrPlutusData(BigInt(type.index), new PlutusList()),
        );
      }
      if (isVoidConstructor(type)) {
        if (struct !== undefined) {
          throw new Error("Could not type cast to void.");
        }
        return PlutusData.newConstrPlutusData(
          new ConstrPlutusData(0n, new PlutusList()),
        );
      } else if (
        typeof struct !== "object" ||
        struct === null ||
        type.fields.length !== Object.keys(struct).length
      ) {
        throw new Error("Could not type cast to constructor.");
      }
      const fields = new PlutusList();

      for (const field of type.fields) {
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
        new ConstrPlutusData(BigInt(type.index), fields),
      );
    }
    case "list": {
      if (!(struct instanceof Array)) {
        throw new Error("Could not type cast to array/tuple.");
      }
      if (type.items instanceof Array) {
        const tupleItems = type.items;
        // tuple
        const fields = new PlutusList();
        if (tupleItems.length != struct.length) {
          throw new Error(
            `Could not cast wrong number of values (${struct.length}) to tuple of length ${tupleItems.length}`,
          );
        }
        for (let index = 0; index < type.items.length; index++) {
          fields.add(castTo(struct[index], type.items[index]!));
        }
        return PlutusData.newList(fields);
      } else {
        const arrayType = type.items;
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
        map.insert(castTo(key, type.keys), castTo(value, type.values));
      }
      return PlutusData.newMap(map);
    }
  }
  throw new Error("Could not type cast struct.");
}

function castFrom<T>(rawData: PlutusData, type: PSchema): T {
  if (!type) throw new Error("Could not type cast data.");
  const kind = rawData.getKind();

  if ("anyOf" in type) {
    // When enum has only one entry it's a single constructor/record object
    if (type.anyOf.length === 1) {
      return castFrom<T>(rawData, type.anyOf[0]!);
    }

    if (!(kind == PlutusDataKind.ConstrPlutusData)) {
      throw new Error("Could not type cast to enum.");
    }
    const data = rawData.asConstrPlutusData()!;
    const index = data.getAlternative();
    const fields = data.getData();
    const fieldsLen = fields.getLength();

    const enumShape = type.anyOf.find((entry) => BigInt(entry.index) === index);
    if (!enumShape || enumShape.fields.length !== fieldsLen) {
      throw new Error("Could not type cast to enum.");
    }
    if (isBoolean(type)) {
      if (fieldsLen !== 0) {
        throw new Error("Could not type cast to boolean.");
      }
      switch (index) {
        case 0n:
          return false as T;
        case 1n:
          return true as T;
      }
      throw new Error("Could not type cast to boolean.");
    } else if (isOptional(type)) {
      switch (index) {
        case 0n: {
          if (fieldsLen !== 1) {
            throw new Error("Could not type cast to nullable object.");
          }
          return castFrom<T>(fields.get(0), type.anyOf[0].fields[0]!);
        }
        case 1n: {
          if (fieldsLen !== 0) {
            throw new Error("Could not type cast to nullable object.");
          }
          return null as T;
        }
      }
      throw new Error("Could not type cast to nullable object.");
    }
    switch (enumShape.dataType) {
      case "constructor": {
        if (enumShape.fields.length === 0) {
          if (/[A-Z]/.test(enumShape.title![0]!)) {
            return enumShape.title as T;
          }
          throw new Error("Could not type cast to enum.");
        } else {
          if (!/[A-Z]/.test(enumShape.title!)) {
            throw new Error(
              "Could not type cast to enum. Enums need to start with an uppercase letter.",
            );
          }

          if (enumShape.fields.length !== fieldsLen) {
            throw new Error("Could not type cast to enum.");
          }

          // check if named args
          const args =
            "title" in enumShape.fields[0]!
              ? Object.fromEntries(
                  enumShape.fields.map((field: any, index) => [
                    field.title,
                    castFrom<T>(fields.get(index), field),
                  ]),
                )
              : enumShape.fields.map((field, index) =>
                  castFrom<T>(fields.get(index), field),
                );

          return {
            [enumShape.title!]: args,
          } as T;
        }
      }
    }
  }

  switch (type.dataType) {
    case "integer": {
      if (kind !== PlutusDataKind.Integer) {
        throw new Error("Could not type cast to integer.");
      }
      return rawData.asInteger() as T;
    }
    case "bytes": {
      if (kind !== PlutusDataKind.Bytes) {
        throw new Error("Could not type cast to integer.");
      }
      return toHex(rawData.asBoundedBytes()!) as T;
    }
    case "constructor": {
      if (kind !== PlutusDataKind.ConstrPlutusData) {
        throw new Error("Could not type cast to constructor.");
      }
      const constr = rawData.asConstrPlutusData()!;
      if (isVoidConstructor(type)) {
        if (
          constr.getAlternative() !== 0n ||
          constr.getData().getLength() !== 0
        ) {
          throw new Error("Could not type cast to void.");
        }
        return undefined as T;
      } else if (constr.getAlternative() === BigInt(type.index)) {
        const fields: Record<string, T> = {};
        if (type.fields.length !== constr.getData().getLength()) {
          throw new Error(
            "Could not type cast to object. Fields do not match.",
          );
        }
        type.fields.forEach((field: any, fieldIndex: number) => {
          const title = field.title || "wrapper";
          if (/[A-Z]/.test(title[0])) {
            throw new Error(
              "Could not type cast to object. Object properties need to start with a lowercase letter.",
            );
          }
          fields[title] = castFrom<T>(constr.getData().get(fieldIndex), field);
        });
        return fields as T;
      }
      throw new Error("Could not type cast to object.");
    }

    case "list": {
      if (kind !== PlutusDataKind.List) {
        throw new Error("Could not type cast to list.");
      }
      const data = rawData.asList()!;
      if (type.items instanceof Array) {
        // tuple
        const res = [];
        for (let i = 0; i < data.getLength(); i++) {
          res.push(castFrom<T>(data.get(i), type.items[i]!));
        }
        return res as T;
      } else {
        // array
        const res = [];
        for (let i = 0; i < data.getLength(); i++) {
          res.push(castFrom<T>(data.get(i), type.items));
        }
        return res as T;
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
          castFrom<T>(keys.get(i), type.keys),
          castFrom<T>(data.get(keys.get(i))!, type.values),
        );
      }
      return map as T;
    }
    case undefined: {
      return rawData as T;
    }
  }
  throw new Error("Could not type cast data.");
}
