/**
 * The portion of cardano-js-sdk/core that Blaze exposes and consumes.
 *
 * Keeping this facade deliberately narrow prevents unrelated provider and
 * wallet-facing modules from becoming part of Blaze's declaration surface.
 */
export * as Cardano from "./core/Cardano";
export * as Serialization from "./core/Serialization";
export { setInConwayEra } from "./core/util/conwayEra";
