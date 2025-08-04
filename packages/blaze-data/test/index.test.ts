import { Type } from "@sinclair/typebox";
import { parse, serialize } from "../src";
import {
  ConstrPlutusData,
  fromHex,
  PlutusData,
  PlutusList,
  PlutusMap,
} from "@blaze-cardano/core";

describe("serialize", () => {
  it("Should serialize an object into a constr", () => {
    const schema = Type.Object(
      {
        bigint: Type.BigInt(),
        lilint: Type.Number(),
        hex: Type.String(),
      },
      { ctor: 0 },
    );
    const inp = {
      bigint: 1337n,
      lilint: 42,
      hex: "cafebabe",
    };
    const out = serialize(schema, inp);
    const expected = newConstr(0n, [
      newInteger(1337n),
      newInteger(42n),
      newBytes("cafebabe"),
    ]);
    expect(out.toCbor()).toEqual(expected.toCbor());
  });

  it("Should serialize an object with missing fields into a constr", () => {
    const schema = Type.Object(
      {
        required: Type.BigInt(),
        optional: Type.Optional(Type.String()),
      },
      { ctor: 0 },
    );

    const inp1 = {
      required: 1337n,
      optional: "4242",
    };
    const out1 = serialize(schema, inp1);
    expect(out1.toCbor()).toEqual(
      newConstr(0n, [
        newInteger(1337n),
        newConstr(0n, [newBytes("4242")]),
      ]).toCbor(),
    );

    const inp2 = {
      required: 1337n,
    };
    const out2 = serialize(schema, inp2);
    expect(out2.toCbor()).toEqual(
      newConstr(0n, [newInteger(1337n), newConstr(1n, [])]).toCbor(),
    );
  });

  it("Should be able to serialize a literal into a constr", () => {
    const schema = Type.Literal("Foo", { ctor: 0 });

    const inp = "Foo";
    const out = serialize(schema, inp);
    expect(out.toCbor()).toEqual(newConstr(0n, []).toCbor());
  });

  it("Should be able to serialize a boolean into a constr", () => {
    const schema = Type.Boolean();

    const inp1 = false;
    const out1 = serialize(schema, inp1);
    expect(out1.toCbor()).toEqual(newConstr(0n, []).toCbor());

    const inp2 = true;
    const out2 = serialize(schema, inp2);
    expect(out2.toCbor()).toEqual(newConstr(1n, []).toCbor());
  });

  it("Should be able to serialize a nullable field into an Option", () => {
    const schema = Type.Optional(Type.BigInt());
    const inp = 1337n;
    const out = serialize(schema, inp);
    expect(out.toCbor()).toEqual(newConstr(0n, [newInteger(1337n)]).toCbor());
  });

  it("Should be able to serialize an array into a list", () => {
    const schema = Type.Array(Type.BigInt());

    const inp = [1337n, 9001n];
    const out = serialize(schema, inp);
    expect(out.toCbor()).toEqual(
      newList([newInteger(1337n), newInteger(9001n)]).toCbor(),
    );
  });

  it("Should be able to serialize a tuple into a list", () => {
    const schema = Type.Tuple([Type.BigInt(), Type.String()]);
    const inp: [bigint, string] = [1337n, "cafe"];

    const out = serialize(schema, inp);
    expect(out.toCbor()).toEqual(
      newList([newInteger(1337n), newBytes("cafe")]).toCbor(),
    );
  });

  it("Should be able to serialize a record into a map with numeric keys", () => {
    const schema = Type.Record(Type.Number(), Type.BigInt());

    const inp = {
      4: 8n,
      15: 16n,
      23: 42n,
    };
    const out = serialize(schema, inp);
    expect(out.toCbor()).toEqual(
      newMap([
        [newInteger(4n), newInteger(8n)],
        [newInteger(15n), newInteger(16n)],
        [newInteger(23n), newInteger(42n)],
      ]).toCbor(),
    );
  });

  it("Should be able to serialize a record into a map with string keys", () => {
    const schema = Type.Record(Type.String(), Type.BigInt());

    const inp = {
      cafe: 8n,
      d00d: 16n,
    };
    const out = serialize(schema, inp);
    expect(out.toCbor()).toEqual(
      newMap([
        [newBytes("cafe"), newInteger(8n)],
        [newBytes("d00d"), newInteger(16n)],
      ]).toCbor(),
    );
  });

  it("Should be able to serialize a union", () => {
    const schema = Type.Union([
      Type.Literal("Foo", { ctor: 0 }),
      Type.Literal("Bar", { ctor: 1 }),
    ]);

    const inp1 = "Foo";
    const out1 = serialize(schema, inp1);
    expect(out1.toCbor()).toEqual(newConstr(0n, []).toCbor());

    const inp2 = "Bar";
    const out2 = serialize(schema, inp2);
    expect(out2.toCbor()).toEqual(newConstr(1n, []).toCbor());
  });

  it("Should be able to serialize a union with object/tuple variants", () => {
    const schema = Type.Union([
      Type.Literal("Foo", { ctor: 0 }),
      Type.Object({
        Bar: Type.Object(
          {
            field: Type.Number(),
          },
          { ctor: 1 },
        ),
      }),
      Type.Object({
        Baz: Type.Tuple([Type.Number(), Type.String()], { ctor: 2 }),
      }),
    ]);

    const inp1 = "Foo";
    const out1 = serialize(schema, inp1);
    expect(out1.toCbor()).toEqual(newConstr(0n, []).toCbor());

    const inp2 = { Bar: { field: 1337 } };
    const out2 = serialize(schema, inp2);
    expect(out2.toCbor()).toEqual(newConstr(1n, [newInteger(1337n)]).toCbor());

    const inp3 = { Baz: [9001, "1337"] as [number, string] };
    const out3 = serialize(schema, inp3);
    expect(out3.toCbor()).toEqual(
      newConstr(2n, [newInteger(9001n), newBytes("1337")]).toCbor(),
    );
  });

  it("should be able to serialize with type references", () => {
    const defs = {
      T0: Type.Literal("Something", { ctor: 0 }),
    };
    const schema = Type.Union([
      Type.Ref("T0"),
      Type.Literal("Other", { ctor: 1 }),
    ]);

    const inp1 = "Something";
    const out1 = serialize(schema, inp1, defs);
    expect(out1.toCbor()).toEqual(newConstr(0n, []).toCbor());

    const inp2 = "Other";
    const out2 = serialize(schema, inp2, defs);
    expect(out2.toCbor()).toEqual(newConstr(1n, []).toCbor());
  });

  it("should be able to serialize with optional type references", () => {
    const defs = {
      T0: Type.Literal("Something", { ctor: 0 }),
    };
    const schema = Type.Object(
      {
        MyOption: Type.Optional(Type.Ref("T0")),
      },
      { ctor: 0 },
    );

    const inp1 = { MyOption: "Something" };
    const out1 = serialize(schema, inp1, defs);
    expect(out1.toCbor()).toEqual(
      newConstr(0n, [newConstr(0n, [newConstr(0n, [])])]).toCbor(),
    );

    const inp2 = { MyOption: undefined };
    const out2 = serialize(schema, inp2, defs);
    expect(out2.toCbor()).toEqual(newConstr(0n, [newConstr(1n, [])]).toCbor());
  });
});

describe("parse", () => {
  it("Should be able to parse a constr into an object", () => {
    const schema = Type.Object(
      {
        bigint: Type.BigInt(),
        lilint: Type.Number(),
        hex: Type.String(),
      },
      { ctor: 0 },
    );
    const inp = newConstr(0n, [
      newInteger(1337n),
      newInteger(9001n),
      newBytes("cafebabe"),
    ]);

    const out = parse(schema, inp);
    expect(out).toEqual({
      bigint: BigInt(1337),
      lilint: 9001,
      hex: "cafebabe",
    });
  });

  it("Should be able to parse a constr into an object with optional fields", () => {
    const schema = Type.Object(
      {
        required: Type.BigInt(),
        optional: Type.Optional(Type.String()),
      },
      { ctor: 0 },
    );

    const inp1 = newConstr(0n, [
      newInteger(1337n),
      newConstr(0n, [newBytes("4242")]),
    ]);
    const out1 = parse(schema, inp1);
    expect(out1).toEqual({
      required: 1337n,
      optional: "4242",
    });

    const inp2 = newConstr(0n, [newInteger(1337n), newConstr(1n, [])]);
    const out2 = parse(schema, inp2);
    expect(out2).toEqual({
      required: 1337n,
    });

    const inp3 = newConstr(0n, [newInteger(1337n)]);
    const out3 = parse(schema, inp3);
    expect(out3).toEqual({
      required: 1337n,
    });
  });

  it("Should be able to parse a constr into a literal", () => {
    const schema = Type.Literal("Foo", { ctor: 0 });

    const inp = newConstr(0n, []);
    const out = parse(schema, inp);
    expect(out).toEqual("Foo");
  });

  it("Should be able to parse a constr into a boolean", () => {
    const schema = Type.Boolean();

    const inp1 = newConstr(0n, []);
    const out1 = parse(schema, inp1);
    expect(out1).toEqual(false);

    const inp2 = newConstr(1n, []);
    const out2 = parse(schema, inp2);
    expect(out2).toEqual(true);
  });

  it("Should be able to parse an Option into a nullable field", () => {
    const schema = Type.Optional(Type.BigInt());

    const inp1 = newConstr(0n, [newInteger(1337n)]);
    const out1 = parse(schema, inp1);
    expect(out1).toEqual(1337n);

    const inp2 = newConstr(1n, []);
    const out2 = parse(schema, inp2);
    expect(out2).toBeUndefined();
  });

  it("Should be able to parse a list into an array", () => {
    const schema = Type.Array(Type.BigInt());
    const inp = newList([newInteger(1337n), newInteger(9001n)]);

    const out = parse(schema, inp);
    expect(out).toEqual([1337n, 9001n]);
  });

  it("Should be able to parse a list into a tuple", () => {
    const schema = Type.Tuple([Type.BigInt(), Type.String()]);
    const inp = newList([newInteger(1337n), newBytes("cafe")]);

    const out = parse(schema, inp);
    expect(out).toEqual([1337n, "cafe"]);
  });

  it("Should be able to parse a map with numeric keys into a record", () => {
    const schema = Type.Record(Type.Number(), Type.BigInt());

    const inp = newMap([
      [newInteger(4n), newInteger(8n)],
      [newInteger(15n), newInteger(16n)],
      [newInteger(23n), newInteger(42n)],
    ]);

    const out = parse(schema, inp);
    expect(out).toEqual({
      4: 8n,
      15: 16n,
      23: 42n,
    });
  });

  it("Should be able to parse a map with string keys into a record", () => {
    const schema = Type.Record(Type.String(), Type.BigInt());

    const inp = newMap([
      [newBytes("cafe"), newInteger(8n)],
      [newBytes("d00d"), newInteger(16n)],
    ]);

    const out = parse(schema, inp);
    expect(out).toEqual({
      cafe: 8n,
      d00d: 16n,
    });
  });

  it("Should be able to parse a union", () => {
    const schema = Type.Union([
      Type.Literal("Foo", { ctor: 0 }),
      Type.Literal("Bar", { ctor: 1 }),
    ]);

    const inp1 = newConstr(0n, []);
    const out1 = parse(schema, inp1);
    expect(out1).toEqual("Foo");

    const inp2 = newConstr(1n, []);
    const out2 = parse(schema, inp2);
    expect(out2).toEqual("Bar");
  });

  it("Should be able to parse a union with object/tuple variants", () => {
    const schema = Type.Union([
      Type.Literal("Foo", { ctor: 0 }),
      Type.Object({
        Bar: Type.Object(
          {
            field: Type.Number(),
          },
          { ctor: 1 },
        ),
      }),
      Type.Object({
        Baz: Type.Tuple([Type.Number(), Type.String()], { ctor: 2 }),
      }),
    ]);

    const inp1 = newConstr(0n, []);
    const out1 = parse(schema, inp1);
    expect(out1).toEqual("Foo");

    const inp2 = newConstr(1n, [newInteger(1337n)]);
    const out2 = parse(schema, inp2);
    expect(out2).toEqual({ Bar: { field: 1337 } });

    const inp3 = newConstr(2n, [newInteger(9001n), newBytes("1337")]);
    const out3 = parse(schema, inp3);
    expect(out3).toEqual({ Baz: [9001, "1337"] });
  });

  it("should be able to parse type references", () => {
    const defs = {
      T0: Type.Literal("Something", { ctor: 0 }),
    };
    const schema = Type.Union([
      Type.Ref("T0"),
      Type.Literal("Other", { ctor: 1 }),
    ]);

    const inp1 = newConstr(0n, []);
    const out1 = parse(schema, inp1, defs);
    expect(out1).toEqual("Something");

    const inp2 = newConstr(1n, []);
    const out2 = parse(schema, inp2, defs);
    expect(out2).toEqual("Other");
  });

  it("should be able to parse optional type references", () => {
    const defs = {
      T0: Type.String(),
    };
    const schema = Type.Object(
      {
        required: Type.BigInt(),
        optional: Type.Optional(Type.Ref("T0")),
      },
      { ctor: 0 },
    );

    const inp1 = newConstr(0n, [
      newInteger(1337n),
      newConstr(0n, [newBytes("4242")]),
    ]);
    const out1 = parse(schema, inp1, defs);
    expect(out1).toEqual({
      required: 1337n,
      optional: "4242",
    });

    const inp2 = newConstr(0n, [newInteger(1337n), newConstr(1n, [])]);
    const out2 = parse(schema, inp2, defs);
    expect(out2).toEqual({
      required: 1337n,
    });

    const inp3 = newConstr(0n, [newInteger(1337n)]);
    const out3 = parse(schema, inp3, defs);
    expect(out3).toEqual({
      required: 1337n,
    });
  });
});

// factories to make tests less obnoxious
function newConstr(index: bigint, fields: PlutusData[]): PlutusData {
  const data = new PlutusList();
  for (const field of fields) {
    data.add(field);
  }
  const constr = new ConstrPlutusData(index, data);
  return PlutusData.newConstrPlutusData(constr);
}

function newList(elements: PlutusData[]): PlutusData {
  const list = new PlutusList();
  for (const element of elements) {
    list.add(element);
  }
  return PlutusData.newList(list);
}

function newMap(elements: [PlutusData, PlutusData][]): PlutusData {
  const map = new PlutusMap();
  for (const [key, value] of elements) {
    map.insert(key, value);
  }
  return PlutusData.newMap(map);
}

function newInteger(value: bigint): PlutusData {
  return PlutusData.newInteger(value);
}

function newBytes(hex: string): PlutusData {
  return PlutusData.newBytes(fromHex(hex));
}
