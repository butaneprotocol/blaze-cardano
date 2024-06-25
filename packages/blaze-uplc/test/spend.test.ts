import {
  HexBlob,
  PlutusData,
  PlutusList,
  fromHex,
  toHex,
} from "@blaze-cardano/core";
import { UPLCDecoder, UPLCEncoder, applyParams } from "../src/index";
import { apply_params_to_script } from "uplc-node";

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

describe("Apply params", () => {
  it("Should be able to apply parameters to a script", () => {
    const script = HexBlob(
      "5866010000323232323232223222533300632330010013756601660186018601860186018601860126ea8c02cc024dd50011129998058008a5013253330093375e0106014601a00429444cc00c00c004c03400452613656375a002ae6955ceaab9e5573eae855d11"
    );
    const params = [
      PlutusData.newBytes(fromHex("abcdef")),
      PlutusData.newInteger(BigInt(123)),
    ];
    const paramsList = new PlutusList();
    params.forEach(x => paramsList.add(x));
    const aikenApply = apply_params_to_script(
      fromHex(paramsList.toCbor()),
      fromHex(script)
    );
    const blazeApply = applyParams(script, ...params);
    expect(toHex(aikenApply).toUpperCase()).toBe(blazeApply.toUpperCase());
  });
});
