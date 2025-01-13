import { ConstrPlutusData, PlutusData, PlutusList } from "@blaze-cardano/core";
import { Constr, Data, type Static } from "../src/data";
export interface BtnMint {
  _r: "Mint" | "Burn";
}

export const BtnMint = Object.assign({
  _r: {
    title: "Redeemer",
    anyOf: [
      { title: "Mint", dataType: "constructor", index: 0, fields: [] },
      { title: "Burn", dataType: "constructor", index: 1, fields: [] },
    ],
  },
}) as unknown as BtnMint;

describe("Data Serialisation", () => {
  it("Should be able to serialise and deserialise string", () => {
    const stringDataSchema = Data.Bytes();
    type stringData = Static<typeof stringDataSchema>;

    const data: stringData = "00";

    const serialised = Data.to(data, stringDataSchema);
    const deserialised = Data.from(serialised, stringDataSchema);
    expect(deserialised).toEqual<stringData>(data);
  });

  it("Should be able to serialise and deserialise string from blueprint", () => {
    const data: BtnMint["_r"] = "Burn";

    const serialised = Data.to(data, BtnMint["_r"]);
    const deserialised = Data.from(serialised, BtnMint["_r"]);
    expect(deserialised).toEqual(data);
  });

  it("Should be able to serialise credential", () => {
    const cred = {
      title: "Referenced",
      description:
        "Represent a type of object that can be represented either inline (by hash)\n or via a reference (i.e. a pointer to an on-chain location).\n\n This is mainly use for capturing pointers to a stake credential\n registration certificate in the case of so-called pointer addresses.",
      anyOf: [
        {
          title: "Inline",
          dataType: "constructor",
          index: 0,
          fields: [
            {
              description:
                "A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).",
              anyOf: [
                {
                  title: "VerificationKeyCredential",
                  dataType: "constructor",
                  index: 0,
                  fields: [{ dataType: "bytes" }],
                },
                {
                  title: "ScriptCredential",
                  dataType: "constructor",
                  index: 1,
                  fields: [{ dataType: "bytes" }],
                },
              ],
            },
          ],
        },
        {
          title: "Pointer",
          dataType: "constructor",
          index: 1,
          fields: [
            { dataType: "integer", title: "slotNumber" },
            { dataType: "integer", title: "transactionIndex" },
            { dataType: "integer", title: "certificateIndex" },
          ],
        },
      ],
    } as unknown as cred;

    type cred =
      | {
          Inline: [
            | {
                VerificationKeyCredential: [string];
              }
            | {
                ScriptCredential: [string];
              },
          ];
        }
      | {
          Pointer: {
            slotNumber: bigint;
            transactionIndex: bigint;
            certificateIndex: bigint;
          };
        };

    const data: cred = {
      Inline: [{ ScriptCredential: ["00112233"] }],
    };

    const serialised = Data.to(data, cred);
    const deserialised = Data.from(serialised, cred);
    expect(deserialised).toEqual(data);
  });

  it("Should be able to serialise and deserialise object", () => {
    // From https://aiken-lang.org/example--vesting
    const Datum = Data.Object({
      lock_until: Data.Integer(), // this is POSIX time, you can check and set it here: https://www.unixtimestamp.com
      owner: Data.Bytes(), // we can pass owner's verification key hash as byte array but also as a string
      beneficiary: Data.Bytes(), // we can beneficiary's hash as byte array but also as a string
    });
    type Datum = Static<typeof Datum>;

    const data: Datum = {
      lock_until: 0n,
      owner: "00",
      beneficiary: "00",
    };
    const serialised = Data.to(data, Datum);
    const deserialised = Data.from(serialised, Datum);
    expect(deserialised).toEqual(data);
  });

  it("Should be able to serialise integers with no type", () => {
    const data = Data.to(1234n);
    expect(data.toCbor()).toEqual(PlutusData.newInteger(1234n).toCbor());
  });

  it("Should be able to serialise constructors with no type", () => {
    const data = Data.to(new Constr(0, []));
    expect(data.toCbor()).toEqual(
      PlutusData.newConstrPlutusData(
        new ConstrPlutusData(0n, new PlutusList()),
      ).toCbor(),
    );
  });
});
