import { describe, expect, test } from "vitest";
import { Maestro, Provider } from "../src";

describe("public API", () => {
  test("exports Maestro from the package entrypoint", () => {
    const provider = new Maestro({ network: "preview", apiKey: "test" });

    expect(Maestro).toBeTypeOf("function");
    expect(provider).toBeInstanceOf(Provider);
  });
});
