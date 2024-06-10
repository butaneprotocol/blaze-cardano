import { Data, type PSchema } from "../src/data";

describe("Data Serialisation", () => {
  it("Should be able to serialise and deserialise string", () => {
    type stringData = "00";
    const stringDataSchema: PSchema = { dataType: "bytes" };

    const data: stringData = "00";

    const serialised = Data.to(data, stringDataSchema);
    const deserialised = Data.from(serialised, stringDataSchema);
    expect(deserialised).toEqual(data);
  });
});
