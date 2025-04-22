import { Type } from "@sinclair/typebox";
import { parse } from "../src";
import {
  ConstrPlutusData,
  fromHex,
  PlutusData,
  PlutusList,
  PlutusMap,
} from "@blaze-cardano/core";

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
    const fields = new PlutusList();
    fields.add(PlutusData.newInteger(BigInt(1337)));
    fields.add(PlutusData.newInteger(BigInt(9001)));
    fields.add(PlutusData.newBytes(fromHex("cafebabe")));
    const inp = PlutusData.newConstrPlutusData(
      new ConstrPlutusData(BigInt(0), fields),
    );

    const out = parse(schema, inp);
    expect(out).toEqual({
      bigint: BigInt(1337),
      lilint: 9001,
      hex: "cafebabe",
    });
  });

  it("Should be able to parse a constr into a literal", () => {
    const schema = Type.Literal("Foo", { ctor: 0 });

    const inp = PlutusData.newConstrPlutusData(
      new ConstrPlutusData(BigInt(0), new PlutusList()),
    );
    const out = parse(schema, inp);
    expect(out).toEqual("Foo");
  });

  it("Should be able to parse a constr into a boolean", () => {
    const schema = Type.Boolean();

    const inp1 = PlutusData.newConstrPlutusData(
      new ConstrPlutusData(BigInt(0), new PlutusList()),
    );
    const out1 = parse(schema, inp1);
    expect(out1).toEqual(false);

    const inp2 = PlutusData.newConstrPlutusData(
      new ConstrPlutusData(BigInt(1), new PlutusList()),
    );
    const out2 = parse(schema, inp2);
    expect(out2).toEqual(true);
  });

  it("Should be able to parse a list into an array", () => {
    const schema = Type.Array(Type.BigInt());
    const list = new PlutusList();
    list.add(PlutusData.newInteger(BigInt(1337)));
    list.add(PlutusData.newInteger(BigInt(9001)));
    const inp = PlutusData.newList(list);

    const out = parse(schema, inp);
    expect(out).toEqual([BigInt(1337), BigInt(9001)]);
  });

  it("Should be able to parse a map with numeric keys into a record", () => {
    const schema = Type.Record(Type.Number(), Type.BigInt());

    const map = new PlutusMap();
    map.insert(
      PlutusData.newInteger(BigInt(4)),
      PlutusData.newInteger(BigInt(8)),
    );
    map.insert(
      PlutusData.newInteger(BigInt(15)),
      PlutusData.newInteger(BigInt(16)),
    );
    map.insert(
      PlutusData.newInteger(BigInt(23)),
      PlutusData.newInteger(BigInt(42)),
    );
    const inp = PlutusData.newMap(map);

    const out = parse(schema, inp);
    expect(out).toEqual({
      4: BigInt(8),
      15: BigInt(16),
      23: BigInt(42),
    });
  });

  it("Should be able to parse a map with string keys into a record", () => {
    const schema = Type.Record(Type.String(), Type.BigInt());

    const map = new PlutusMap();
    map.insert(
      PlutusData.newBytes(fromHex("cafe")),
      PlutusData.newInteger(BigInt(8)),
    );
    map.insert(
      PlutusData.newBytes(fromHex("d00d")),
      PlutusData.newInteger(BigInt(16)),
    );
    const inp = PlutusData.newMap(map);

    const out = parse(schema, inp);
    expect(out).toEqual({
      cafe: BigInt(8),
      d00d: BigInt(16),
    });
  });

  it("Should be able to parse a union", () => {
    const schema = Type.Union([
      Type.Literal("Foo", { ctor: 0 }),
      Type.Literal("Bar", { ctor: 1 }),
    ]);

    const inp1 = PlutusData.newConstrPlutusData(
      new ConstrPlutusData(BigInt(0), new PlutusList()),
    );
    const out1 = parse(schema, inp1);
    expect(out1).toEqual("Foo");

    const inp2 = PlutusData.newConstrPlutusData(
      new ConstrPlutusData(BigInt(1), new PlutusList()),
    );
    const out2 = parse(schema, inp2);
    expect(out2).toEqual("Bar");
  });

  it("Should be able to parse recursive types", () => {
    const schema = Type.Recursive((me) =>
      Type.Union([
        Type.Literal("None", { ctor: 0 }),
        Type.Object(
          {
            car: Type.Number(),
            cdr: me,
          },
          { ctor: 1 },
        ),
      ]),
    );

    let inp = PlutusData.newConstrPlutusData(
      new ConstrPlutusData(BigInt(0), new PlutusList()),
    );

    let list = new PlutusList();
    list.add(PlutusData.newInteger(BigInt(9001)));
    list.add(inp);
    inp = PlutusData.newConstrPlutusData(new ConstrPlutusData(BigInt(1), list));

    list = new PlutusList();
    list.add(PlutusData.newInteger(BigInt(1337)));
    list.add(inp);
    inp = PlutusData.newConstrPlutusData(new ConstrPlutusData(BigInt(1), list));

    const out = parse(schema, inp);
    expect(out).toEqual({
      car: 1337,
      cdr: {
        car: 9001,
        cdr: "None",
      },
    });
  });

  it("should be able to parse type references", () => {
    const defs = {
      T0: Type.Literal("Something", { ctor: 0 }),
    };
    const schema = Type.Union([
      Type.Ref("T0"),
      Type.Literal("Other", { ctor: 1 }),
    ]);

    const inp1 = PlutusData.newConstrPlutusData(
      new ConstrPlutusData(BigInt(0), new PlutusList()),
    );
    const out1 = parse(schema, inp1, defs);
    expect(out1).toEqual("Something");

    const inp2 = PlutusData.newConstrPlutusData(
      new ConstrPlutusData(BigInt(1), new PlutusList()),
    );
    const out2 = parse(schema, inp2, defs);
    expect(out2).toEqual("Other");
  });
});
