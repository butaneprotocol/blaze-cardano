import type { AssetName } from "@blaze-cardano/core";
import { TransactionSafetyError } from "./errors";

/** Assert that every asset quantity is positive before mint or burn conversion.
 *
 * @public
 */
export const assertPositiveAssetQuantities = (
  operation: string,
  assets: ReadonlyMap<AssetName, bigint>,
): void => {
  for (const [assetName, quantity] of assets) {
    if (quantity <= 0n) {
      throw new TransactionSafetyError(
        `${operation}: asset "${assetName}" quantity must be positive.`,
      );
    }
  }
};

/** Convert positive asset quantities into negative mint quantities for burns.
 *
 * @public
 */
export const negateAssetQuantities = (
  assets: ReadonlyMap<AssetName, bigint>,
): Map<AssetName, bigint> =>
  new Map([...assets].map(([assetName, quantity]) => [assetName, -quantity]));
