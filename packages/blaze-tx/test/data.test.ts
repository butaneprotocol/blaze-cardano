// describe("Data Serialisation", () => {
//   it("Should be able to serialise and deserialise string", () => {
//     const data: SyntheticsValidate["redeemer"] = "Auxilliary";
//     const serialised = Data.to(data, SyntheticsValidate["redeemer"]);
//     const deserialised = Data.from(serialised, SyntheticsValidate["redeemer"]);
//     expect(deserialised).toEqual(data);
//   });

//   it("Should be able to serialise and deserialise object", () => {
//     const data: SyntheticsValidate["redeemer"] = {
//       SyntheticsMain: {
//         spends: [
//           {
//             feeType: "FeeInSynthetic",
//             spendType: "LiquidateCDP",
//             paramsIdx: 1n,
//           },
//           {
//             feeType: "FeeInSynthetic",
//             spendType: "LiquidateCDP",
//             paramsIdx: 1n,
//           },
//         ],
//         creates: [3n, 2n],
//       },
//     };
//     const serialised = Data.to(data, SyntheticsValidate["redeemer"]);
//     const deserialised = Data.from(serialised, SyntheticsValidate["redeemer"]);
//     expect(deserialised).toEqual(data);
//   });
// });
