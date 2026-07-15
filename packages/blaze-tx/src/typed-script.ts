import type { PlutusData, Script } from "@blaze-cardano/core";

/** Script wrapper that binds a datum type and redeemer type to one script.
 *
 * @public
 */
export class TypedScript<
  DatumType extends PlutusData,
  RedeemerType extends PlutusData,
> {
  /** Type-only datum marker used for generic inference. */
  declare protected readonly __datum?: DatumType;
  /** Type-only redeemer marker used for generic inference. */
  declare protected readonly __redeemer?: RedeemerType;

  constructor(
    public readonly Script: Script,
    /** Human-readable identifier included in builder error messages. Blueprint codegen sets it to the validator's blueprint title. */
    public readonly name?: string,
  ) {}
}

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
