import { CostModels, ExUnits, Prices, ProtocolVersion } from "@cardano-sdk/core/dist/cjs/Cardano";

interface ProtocolParameters {
    coinsPerUtxoByte: number,
    maxTxSize: number,
    minFeeCoefficient: number;
    minFeeConstant: number;
    maxBlockBodySize: number;
    maxBlockHeaderSize: number;
    stakeKeyDeposit: number;
    poolDeposit: number | null;
    poolRetirementEpochBound: number;
    desiredNumberOfPools: number;
    poolInfluence: string;
    monetaryExpansion: string;
    treasuryExpansion: string;
    decentralizationParameter: string;
    minUtxoValue: number;
    minPoolCost: number;
    extraEntropy: 'neutral' | string;
    protocolVersion: ProtocolVersion;
    maxValueSize: number;
    collateralPercentage: number;
    maxCollateralInputs: number;
    costModels: CostModels;
    prices: Prices;
    maxExecutionUnitsPerTransaction: ExUnits;
    maxExecutionUnitsPerBlock: ExUnits;
}

let params: ProtocolParameters = {
    coinsPerUtxoByte: 0,
    maxTxSize: 0,
    minFeeCoefficient: 0,
    minFeeConstant: 0,
    maxBlockBodySize: 0,
    maxBlockHeaderSize: 0,
    stakeKeyDeposit: 0,
    poolDeposit: null,
    poolRetirementEpochBound: 0,
    desiredNumberOfPools: 0,
    poolInfluence: "",
    monetaryExpansion: "",
    treasuryExpansion: "",
    decentralizationParameter: "",
    minUtxoValue: 0,
    minPoolCost: 0,
    extraEntropy: 'neutral',
    protocolVersion: {
        major: 0,
        minor: 0,
    },
    maxValueSize: 0,
    collateralPercentage: 0,
    maxCollateralInputs: 0,
    costModels: new Map(),
    prices: {
        memory: 0,
        steps: 0,
    },
    maxExecutionUnitsPerTransaction: {
        memory: 0,
        steps: 0
    },
    maxExecutionUnitsPerBlock: {
        memory: 0,
        steps: 0
    },
}