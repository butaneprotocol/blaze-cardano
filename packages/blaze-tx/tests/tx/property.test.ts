import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { AssetName } from "@blaze-cardano/core";
import {
  TransactionSafetyError,
  assertPositiveAssetQuantities,
  negateAssetQuantities,
} from "../../src";

const assetName = (index: number) =>
  AssetName(Buffer.from(`asset-${index}`, "utf8").toString("hex"));

describe("transaction safety properties", () => {
  it("negates every positive asset quantity exactly once", () => {
    fc.assert(
      fc.property(
        fc.array(fc.bigInt({ min: 1n, max: 1_000_000n }), {
          minLength: 1,
          maxLength: 20,
        }),
        (quantities) => {
          const assets = new Map(
            quantities.map((quantity, index) => [assetName(index), quantity]),
          );
          assertPositiveAssetQuantities("property", assets);
          const negated = negateAssetQuantities(assets);

          for (const [name, quantity] of assets) {
            expect(negated.get(name)).toBe(-quantity);
          }
        },
      ),
    );
  });

  it("rejects every non-positive asset quantity", () => {
    fc.assert(
      fc.property(fc.bigInt({ max: 0n }), (quantity) => {
        const assets = new Map([[assetName(0), quantity]]);

        expect(() => assertPositiveAssetQuantities("property", assets)).toThrow(
          TransactionSafetyError,
        );
      }),
    );
  });
});
