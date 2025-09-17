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
  // Conway params are optional while not on mainnet
  // TODO: all of the new params
  minFeeReferenceScripts?: MinFeeReferenceScripts;
  /** Raw cost-per-byte parameter for reference scripts (Conway) */
  minFeeRefScriptCostPerByte?: number;
  /** Maximum reference scripts size (bytes) */
  maxReferenceScriptsSize?: number;
  /** Stake pool voting thresholds (Conway/Chang) */
  stakePoolVotingThresholds?: Cardano.PoolVotingThresholds;
  /** dRep voting thresholds (Conway/Chang) */
  delegateRepresentativeVotingThresholds?: Cardano.DelegateRepresentativeThresholds;
  /** Minimum constitutional committee size */
  constitutionalCommitteeMinSize?: number;
  /** Maximum constitutional committee term length (epochs) */
  constitutionalCommitteeMaxTermLength?: number;
  /** Governance action lifetime (epochs) */
  governanceActionLifetime?: number;
  /** Governance action deposit (lovelace) */
  governanceActionDeposit?: number;
  /** dRep registration deposit (lovelace) */
  delegateRepresentativeDeposit?: number;
  /** dRep maximum idle time (epochs) */
  delegateRepresentativeMaxIdleTime?: number;
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
  poolInfluence: "0.3", // The pool influence.
  monetaryExpansion: "0.003", // The monetary expansion.
  treasuryExpansion: "0.2", // The treasury expansion.
  minPoolCost: 170000000, // The minimum pool cost.
  protocolVersion: { major: 9, minor: 0 }, // The protocol version.
  maxValueSize: 5000, // The maximum value size.
  collateralPercentage: 150, // The collateral percentage.
  maxCollateralInputs: 3, // The maximum collateral inputs.
  costModels: new Map() // The cost models.
    .set(
      0,
      [
        100788, 420, 1, 1, 1000, 173, 0, 1, 1000, 59957, 4, 1, 11183, 32,
        201305, 8356, 4, 16000, 100, 16000, 100, 16000, 100, 16000, 100, 16000,
        100, 16000, 100, 100, 100, 16000, 100, 94375, 32, 132994, 32, 61462, 4,
        72010, 178, 0, 1, 22151, 32, 91189, 769, 4, 2, 85848, 228465, 122, 0, 1,
        1, 1000, 42921, 4, 2, 24548, 29498, 38, 1, 898148, 27279, 1, 51775, 558,
        1, 39184, 1000, 60594, 1, 141895, 32, 83150, 32, 15299, 32, 76049, 1,
        13169, 4, 22100, 10, 28999, 74, 1, 28999, 74, 1, 43285, 552, 1, 44749,
        541, 1, 33852, 32, 68246, 32, 72362, 32, 7243, 32, 7391, 32, 11546, 32,
        85848, 228465, 122, 0, 1, 1, 90434, 519, 0, 1, 74433, 32, 85848, 228465,
        122, 0, 1, 1, 85848, 228465, 122, 0, 1, 1, 270652, 22588, 4, 1457325,
        64566, 4, 20467, 1, 4, 0, 141992, 32, 100788, 420, 1, 1, 81663, 32,
        59498, 32, 20142, 32, 24588, 32, 20744, 32, 25933, 32, 24623, 32,
        53384111, 14333, 10,
      ],
    )
    .set(
      1,
      [
        100788, 420, 1, 1, 1000, 173, 0, 1, 1000, 59957, 4, 1, 11183, 32,
        201305, 8356, 4, 16000, 100, 16000, 100, 16000, 100, 16000, 100, 16000,
        100, 16000, 100, 100, 100, 16000, 100, 94375, 32, 132994, 32, 61462, 4,
        72010, 178, 0, 1, 22151, 32, 91189, 769, 4, 2, 85848, 228465, 122, 0, 1,
        1, 1000, 42921, 4, 2, 24548, 29498, 38, 1, 898148, 27279, 1, 51775, 558,
        1, 39184, 1000, 60594, 1, 141895, 32, 83150, 32, 15299, 32, 76049, 1,
        13169, 4, 22100, 10, 28999, 74, 1, 28999, 74, 1, 43285, 552, 1, 44749,
        541, 1, 33852, 32, 68246, 32, 72362, 32, 7243, 32, 7391, 32, 11546, 32,
        85848, 228465, 122, 0, 1, 1, 90434, 519, 0, 1, 74433, 32, 85848, 228465,
        122, 0, 1, 1, 85848, 228465, 122, 0, 1, 1, 955506, 213312, 0, 2, 270652,
        22588, 4, 1457325, 64566, 4, 20467, 1, 4, 0, 141992, 32, 100788, 420, 1,
        1, 81663, 32, 59498, 32, 20142, 32, 24588, 32, 20744, 32, 25933, 32,
        24623, 32, 43053543, 10, 53384111, 14333, 10, 43574283, 26308, 10,
      ],
    )
    .set(
      2,
      [
        100788, 420, 1, 1, 1000, 173, 0, 1, 1000, 59957, 4, 1, 11183, 32,
        201305, 8356, 4, 16000, 100, 16000, 100, 16000, 100, 16000, 100, 16000,
        100, 16000, 100, 100, 100, 16000, 100, 94375, 32, 132994, 32, 61462, 4,
        72010, 178, 0, 1, 22151, 32, 91189, 769, 4, 2, 85848, 123203, 7305,
        -900, 1716, 549, 57, 85848, 0, 1, 1, 1000, 42921, 4, 2, 24548, 29498,
        38, 1, 898148, 27279, 1, 51775, 558, 1, 39184, 1000, 60594, 1, 141895,
        32, 83150, 32, 15299, 32, 76049, 1, 13169, 4, 22100, 10, 28999, 74, 1,
        28999, 74, 1, 43285, 552, 1, 44749, 541, 1, 33852, 32, 68246, 32, 72362,
        32, 7243, 32, 7391, 32, 11546, 32, 85848, 123203, 7305, -900, 1716, 549,
        57, 85848, 0, 1, 90434, 519, 0, 1, 74433, 32, 85848, 123203, 7305, -900,
        1716, 549, 57, 85848, 0, 1, 1, 85848, 123203, 7305, -900, 1716, 549, 57,
        85848, 0, 1, 955506, 213312, 0, 2, 270652, 22588, 4, 1457325, 64566, 4,
        20467, 1, 4, 0, 141992, 32, 100788, 420, 1, 1, 81663, 32, 59498, 32,
        20142, 32, 24588, 32, 20744, 32, 25933, 32, 24623, 32, 43053543, 10,
        53384111, 14333, 10, 43574283, 26308, 10, 16000, 100, 16000, 100,
        962335, 18, 2780678, 6, 442008, 1, 52538055, 3756, 18, 267929, 18,
        76433006, 8868, 18, 52948122, 18, 1995836, 36, 3227919, 12, 901022, 1,
        166917843, 4307, 36, 284546, 36, 158221314, 26549, 36, 74698472, 36,
        333849714, 1, 254006273, 72, 2174038, 72, 2261318, 64571, 4, 207616,
        8310, 4, 1293828, 28716, 63, 0, 1, 1006041, 43623, 251, 0, 1, 100181,
        726, 719, 0, 1, 100181, 726, 719, 0, 1, 100181, 726, 719, 0, 1, 107878,
        680, 0, 1, 95336, 1, 281145, 18848, 0, 1, 180194, 159, 1, 1, 158519,
        8942, 0, 1, 159378, 8813, 0, 1, 107490, 3298, 1, 106057, 655, 1,
        1964219, 24520, 3,
      ],
    ),
  prices: { memory: 577 / 10000, steps: 0.0000721 }, // The prices.
  maxExecutionUnitsPerTransaction: { memory: 14000000, steps: 10000000000 }, // The maximum execution units per transaction.
  maxExecutionUnitsPerBlock: { memory: 62000000, steps: 20000000000 }, // The maximum execution units per block.
  // Conway/Chang governance-related defaults (may be overridden by provider on Chang networks)
  maxReferenceScriptsSize: 204800,
  stakePoolVotingThresholds: {
    motionNoConfidence: { numerator: 51, denominator: 100 },
    committeeNormal: { numerator: 51, denominator: 100 },
    committeeNoConfidence: { numerator: 51, denominator: 100 },
    hardForkInitiation: { numerator: 51, denominator: 100 },
    securityRelevantParamVotingThreshold: { numerator: 51, denominator: 100 },
  },
  delegateRepresentativeVotingThresholds: {
    motionNoConfidence: { numerator: 67, denominator: 100 },
    committeeNormal: { numerator: 67, denominator: 100 },
    committeeNoConfidence: { numerator: 3, denominator: 5 },
    hardForkInitiation: { numerator: 3, denominator: 5 },
    updateConstitution: { numerator: 3, denominator: 4 },
    ppNetworkGroup: { numerator: 67, denominator: 100 },
    ppEconomicGroup: { numerator: 67, denominator: 100 },
    ppTechnicalGroup: { numerator: 67, denominator: 100 },
    ppGovernanceGroup: { numerator: 3, denominator: 4 },
    treasuryWithdrawal: { numerator: 67, denominator: 100 },
  },
  constitutionalCommitteeMinSize: 7,
  constitutionalCommitteeMaxTermLength: 146,
  governanceActionLifetime: 6,
  governanceActionDeposit: 100_000_000_000,
  delegateRepresentativeDeposit: 0,
  // delegateRepresentativeMaxIdleTime: undefined,
  minFeeReferenceScripts: { base: 15, range: 25600, multiplier: 1.2 },
};
export interface MinFeeReferenceScripts {
  base: number;
  range: number;
  multiplier: number;
}
