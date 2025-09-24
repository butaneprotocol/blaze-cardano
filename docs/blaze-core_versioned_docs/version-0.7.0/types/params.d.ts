import type { Cardano } from "@cardano-sdk/core";
/**
 * Cardano ledger protocol parameters.
 */
export interface ProtocolParameters {
    /** The number of coins per UTXO byte. */
    coinsPerUtxoByte: number;
    /** The maximum transaction size. */
    maxTxSize: number;
    /** The minimum fee coefficient. */
    minFeeCoefficient: number;
    /** The minimum fee constant. */
    minFeeConstant: number;
    /** The maximum block body size. */
    maxBlockBodySize: number;
    /** The maximum block header size. */
    maxBlockHeaderSize: number;
    /** The stake key deposit. */
    stakeKeyDeposit: number;
    /** The pool deposit. */
    poolDeposit: number | null;
    /** The pool retirement epoch bound. */
    poolRetirementEpochBound: number;
    /** The desired number of pools. */
    desiredNumberOfPools: number;
    /** The pool influence. */
    poolInfluence: string;
    /** The monetary expansion. */
    monetaryExpansion: string;
    /** The treasury expansion. */
    treasuryExpansion: string;
    /** The minimum pool cost. */
    minPoolCost: number;
    /** The protocol version. */
    protocolVersion: Cardano.ProtocolVersion;
    /** The maximum value size. */
    maxValueSize: number;
    /** The collateral percentage. */
    collateralPercentage: number;
    /** The maximum collateral inputs. */
    maxCollateralInputs: number;
    /** The cost models. */
    costModels: Cardano.CostModels;
    /** The prices. */
    prices: Cardano.Prices;
    /** The maximum execution units per transaction. */
    maxExecutionUnitsPerTransaction: Cardano.ExUnits;
    /** The maximum execution units per block. */
    maxExecutionUnitsPerBlock: Cardano.ExUnits;
    /** Params used for calculating the minimum fee from reference inputs (see https://github.com/CardanoSolutions/ogmios/releases/tag/v6.5.0) */
    minFeeReferenceScripts?: MinFeeReferenceScripts;
}
/**
 * Hard coded protocol parameters for the Cardano ledger.
 * These parameters are used as default values in the absence of network-provided parameters.
 */
export declare const hardCodedProtocolParams: ProtocolParameters;
export interface MinFeeReferenceScripts {
    base: number;
    range: number;
    multiplier: number;
}
//# sourceMappingURL=params.d.ts.map