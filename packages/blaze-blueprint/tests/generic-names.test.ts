import { describe, it, expect } from "vitest";
import {
  lastPathSegment,
  splitTopLevelCommas,
  parseDoubleAngleGeneric,
  parseSingleAngleGeneric,
} from "../src/generic-names";

describe("lastPathSegment", () => {
  it("returns the final slash-separated segment", () => {
    expect(lastPathSegment("aiken/crypto/VerificationKey")).toBe(
      "VerificationKey",
    );
  });

  it("returns the whole string when there is no slash", () => {
    expect(lastPathSegment("Int")).toBe("Int");
  });
});

describe("splitTopLevelCommas", () => {
  it("splits flat comma-separated params", () => {
    expect(splitTopLevelCommas("Void,types/CommitteeAction")).toEqual([
      "Void",
      "types/CommitteeAction",
    ]);
  });

  it("does not split commas nested inside angle brackets", () => {
    expect(
      splitTopLevelCommas("Void,SignedPayload<CommitteeAction,Int>"),
    ).toEqual(["Void", "SignedPayload<CommitteeAction,Int>"]);
  });

  it("handles deeply nested generics", () => {
    expect(splitTopLevelCommas("A<B<C,D>,E>,F")).toEqual(["A<B<C,D>,E>", "F"]);
  });

  it("returns a single element when there are no top-level commas", () => {
    expect(splitTopLevelCommas("Void")).toEqual(["Void"]);
  });
});

describe("parseDoubleAngleGeneric", () => {
  it("parses a double-angle tuple, reducing params to last segments", () => {
    expect(parseDoubleAngleGeneric("Tuple<<types/AssetClass,Int>>")).toBe(
      "Tuple_AssetClass_Int",
    );
  });

  it("replaces `~` with `_` in param names", () => {
    expect(parseDoubleAngleGeneric("Tuple<<a~b,c~d>>")).toBe("Tuple_a_b_c_d");
  });

  it("returns null for non-double-angle names", () => {
    expect(parseDoubleAngleGeneric("types/SignedRedeemer<Void>")).toBeNull();
    expect(parseDoubleAngleGeneric("Foo$Bar")).toBeNull();
    expect(parseDoubleAngleGeneric("Int")).toBeNull();
  });
});

describe("parseSingleAngleGeneric", () => {
  it("parses base name and raw params", () => {
    expect(
      parseSingleAngleGeneric(
        "types/SignedRedeemer<Void,types/CommitteeAction>",
      ),
    ).toEqual({
      baseName: "SignedRedeemer",
      rawParams: ["Void", "types/CommitteeAction"],
    });
  });

  it("keeps nested generics intact in raw params for the caller to recurse", () => {
    expect(
      parseSingleAngleGeneric("A<SignedPayload<CommitteeAction>,Void>"),
    ).toEqual({
      baseName: "A",
      rawParams: ["SignedPayload<CommitteeAction>", "Void"],
    });
  });

  it("returns null for the double-angle form", () => {
    expect(parseSingleAngleGeneric("Tuple<<types/AssetClass,Int>>")).toBeNull();
  });

  it("returns null for names ending in '>>' (disambiguates from double-angle)", () => {
    // A single-angle generic whose final param is itself a generic ends in
    // ">>", so it is intentionally excluded here (matching the original
    // Generator behavior) and handled by other branches instead.
    expect(
      parseSingleAngleGeneric("A<Void,SignedPayload<CommitteeAction>>"),
    ).toBeNull();
  });

  it("returns null for names without angle brackets", () => {
    expect(parseSingleAngleGeneric("types/SignedRedeemer")).toBeNull();
  });

  it("returns null when there is no base, no closing '>', or empty inner", () => {
    expect(parseSingleAngleGeneric("<Void>")).toBeNull(); // empty base
    expect(parseSingleAngleGeneric("Foo<Void")).toBeNull(); // no closing '>'
    expect(parseSingleAngleGeneric("Foo<>")).toBeNull(); // empty inner
  });

  it("does not backtrack on adversarial input (ReDoS guard)", () => {
    // The previous /^(.+?)<(.+)>$/ implementation was polynomial on strings
    // like "a<a<a<...". This must return quickly regardless of length.
    const adversarial = "a<".repeat(50_000) + "a";
    const start = performance.now();
    const result = parseSingleAngleGeneric(adversarial);
    const elapsedMs = performance.now() - start;
    expect(result).toBeNull(); // no trailing '>', so not a match
    expect(elapsedMs).toBeLessThan(1_000);
  });
});
