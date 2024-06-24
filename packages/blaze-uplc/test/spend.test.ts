import { toHex } from "@blaze-cardano/core";
import { UPLCDecoder, UPLCEncoder } from "../src/index";

describe("Script Deserialisation", () => {
  it("Should be able to parse the spec example", () => {
    const spend = "0500023371C911071A5F783625EE8C004838B40181".toLowerCase();
    const AST = UPLCDecoder.decodeFromHex(spend);
    expect(AST).toBeTruthy();
  });

  it("Should be able to parse the spec example", () => {
    const spend = "010000480081".toLowerCase();
    const AST = UPLCDecoder.decodeFromHex(spend);
    expect(AST).toBeTruthy();
  });

  it("Should be able to parse the optimised spend validator", () => {
    const spend =
      "01000032323232322222323330010010053756601260146014601460146014601460106EA8C024C020DD5001111299980419BAF3009300B00100214984CCC00C00C008C0300055CD2AB9D5573CAE855D11".toLowerCase();
    const AST = UPLCDecoder.decodeFromHex(spend);
    expect(AST).toBeTruthy();
  });
});

const roundTrips = [
  "010000480081",
  "0500023371C911071A5F783625EE8C004838B40181",
  "01000032323232322222323330010010053756601260146014601460146014601460106EA8C024C020DD5001111299980419BAF3009300B00100214984CCC00C00C008C0300055CD2AB9D5573CAE855D11",
];

describe("Decode . Encode = Identity", () => {
  it("Should be able to decode and invert the roundtrip example", () => {
    for (const rtExample of roundTrips) {
      const AST = UPLCDecoder.decodeFromHex(rtExample);
      const reencoded = new UPLCEncoder().encodeProgram(AST);
      expect(toHex(reencoded).toUpperCase()).toBe(rtExample.toUpperCase());
      expect(toHex(reencoded).length).toBe(rtExample.length);
    }
  });
});
