import { UPLCParser } from "../src/index";

describe("Script Deserialisation", () => {
//   it("Should be able to parse the spec example", () => {
//     const spend = "0500023371C911071A5F783625EE8C004838B40181".toLowerCase();
//     const AST = UPLCParser.fromHex(spend).parse();
//     console.dir(AST, { depth: null });
//     expect(AST).toBeTruthy();
//   });

//   it("Should be able to parse the optimised spend validator", () => {
//     const spend =
//       "01000032323232322222323330010010053756601260146014601460146014601460106EA8C024C020DD5001111299980419BAF3009300B00100214984CCC00C00C008C0300055CD2AB9D5573CAE855D11".toLowerCase();
//     const AST = UPLCParser.fromHex(spend).parse();
//     console.dir(AST, { depth: null });
//     expect(AST).toBeTruthy();
//   });

  it("Should be able to parse the Sundae validator", () => {
    const spend =
      "0100004BD6F7B63001".toLowerCase();
    const AST = UPLCParser.fromHex(spend).parse();
    console.dir(AST, { depth: null });
    expect(AST).toBeTruthy();
  });
});
