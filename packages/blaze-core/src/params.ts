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
}
/**
 * Hard coded protocol parameters for the Cardano ledger.
 * These parameters are used as default values in the absence of network-provided parameters.
 */
export const hardCodedProtocolParams: ProtocolParameters = {
  coinsPerUtxoByte: 4310, // The number of coins per UTXO byte.
  maxTxSize: 16384, // The maximum transaction size.
  minFeeCoefficient: 44, // The minimum fee coefficient.
  minFeeConstant: 155381, // The minimum fee constant.
  maxBlockBodySize: 90112, // The maximum block body size.
  maxBlockHeaderSize: 1100, // The maximum block header size.
  stakeKeyDeposit: 2000000, // The stake key deposit.
  poolDeposit: 500000000, // The pool deposit.
  poolRetirementEpochBound: 18, // The pool retirement epoch bound.
  desiredNumberOfPools: 500, // The desired number of pools.
  poolInfluence: "3/10", // The pool influence.
  monetaryExpansion: "3/1000", // The monetary expansion.
  treasuryExpansion: "1/5", // The treasury expansion.
  minPoolCost: 170000000, // The minimum pool cost.
  protocolVersion: { major: 8, minor: 0 }, // The protocol version.
  maxValueSize: 5000, // The maximum value size.
  collateralPercentage: 150 / 100, // The collateral percentage.
  maxCollateralInputs: 3, // The maximum collateral inputs.
  costModels: new Map() // The cost models.
    .set(
      0,
      [
        205665, 812, 1, 1, 1000, 571, 0, 1, 1000, 24177, 4, 1, 1000, 32, 117366,
        10475, 4, 23000, 100, 23000, 100, 23000, 100, 23000, 100, 23000, 100,
        23000, 100, 100, 100, 23000, 100, 19537, 32, 175354, 32, 46417, 4,
        221973, 511, 0, 1, 89141, 32, 497525, 14068, 4, 2, 196500, 453240, 220,
        0, 1, 1, 1000, 28662, 4, 2, 245000, 216773, 62, 1, 1060367, 12586, 1,
        208512, 421, 1, 187000, 1000, 52998, 1, 80436, 32, 43249, 32, 1000, 32,
        80556, 1, 57667, 4, 1000, 10, 197145, 156, 1, 197145, 156, 1, 204924,
        473, 1, 208896, 511, 1, 52467, 32, 64832, 32, 65493, 32, 22558, 32,
        16563, 32, 76511, 32, 196500, 453240, 220, 0, 1, 1, 69522, 11687, 0, 1,
        60091, 32, 196500, 453240, 220, 0, 1, 1, 196500, 453240, 220, 0, 1, 1,
        806990, 30482, 4, 1927926, 82523, 4, 265318, 0, 4, 0, 85931, 32, 205665,
        812, 1, 1, 41182, 32, 212342, 32, 31220, 32, 32696, 32, 43357, 32,
        32247, 32, 38314, 32, 57996947, 18975, 10,
      ],
    )
    .set(
      1,
      [
        205665, 812, 1, 1, 1000, 571, 0, 1, 1000, 24177, 4, 1, 1000, 32, 117366,
        10475, 4, 23000, 100, 23000, 100, 23000, 100, 23000, 100, 23000, 100,
        23000, 100, 100, 100, 23000, 100, 19537, 32, 175354, 32, 46417, 4,
        221973, 511, 0, 1, 89141, 32, 497525, 14068, 4, 2, 196500, 453240, 220,
        0, 1, 1, 1000, 28662, 4, 2, 245000, 216773, 62, 1, 1060367, 12586, 1,
        208512, 421, 1, 187000, 1000, 52998, 1, 80436, 32, 43249, 32, 1000, 32,
        80556, 1, 57667, 4, 1000, 10, 197145, 156, 1, 197145, 156, 1, 204924,
        473, 1, 208896, 511, 1, 52467, 32, 64832, 32, 65493, 32, 22558, 32,
        16563, 32, 76511, 32, 196500, 453240, 220, 0, 1, 1, 69522, 11687, 0, 1,
        60091, 32, 196500, 453240, 220, 0, 1, 1, 196500, 453240, 220, 0, 1, 1,
        1159724, 392670, 0, 2, 806990, 30482, 4, 1927926, 82523, 4, 265318, 0,
        4, 0, 85931, 32, 205665, 812, 1, 1, 41182, 32, 212342, 32, 31220, 32,
        32696, 32, 43357, 32, 32247, 32, 38314, 32, 35892428, 10, 57996947,
        18975, 10, 38887044, 32947, 10,
      ],
    ),
  prices: { memory: 577 / 10000, steps: 0.0000721 }, // The prices.
  maxExecutionUnitsPerTransaction: { memory: 14000000, steps: 10000000000 }, // The maximum execution units per transaction.
  maxExecutionUnitsPerBlock: { memory: 62000000, steps: 20000000000 }, // The maximum execution units per block.
};
