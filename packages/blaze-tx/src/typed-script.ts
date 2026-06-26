import type { PlutusData, Script } from "@blaze-cardano/core";

declare const datumBrand: unique symbol;
declare const redeemerBrand: unique symbol;

/** Script wrapper that binds a datum type and redeemer type to one script.
 *
 * @public
 */
export type TypedScript<
  DatumType extends PlutusData,
  RedeemerType extends PlutusData,
> = {
  readonly script: Script;
  readonly name?: string;
  readonly [datumBrand]?: DatumType;
  readonly [redeemerBrand]?: RedeemerType;
};

/** Extract the datum type bound to a typed script.
 *
 * @public
 */
export type TypedScriptDatum<T> =
  T extends TypedScript<infer DatumType, PlutusData> ? DatumType : never;

/** Extract the redeemer type bound to a typed script.
 *
 * @public
 */
export type TypedScriptRedeemer<T> =
  T extends TypedScript<PlutusData, infer RedeemerType> ? RedeemerType : never;

/** Bind a datum type and redeemer type to a script for typed builder calls.
 *
 * @public
 */
export const defineTypedScript = <
  DatumType extends PlutusData,
  RedeemerType extends PlutusData,
>(
  script: Script,
  options: { name?: string } = {},
): TypedScript<DatumType, RedeemerType> => ({
  script,
  name: options.name,
});
