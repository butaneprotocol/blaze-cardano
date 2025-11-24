// Static constants and parameter group field sets used by the emulator.

export const DREP_KIND_ABSTAIN = 2;
export const DREP_KIND_NO_CONFIDENCE = 3;

export const NETWORK_GROUP_FIELDS = Object.freeze(
  new Set([
    "maxBlockBodySize",
    "maxTxSize",
    "maxBlockHeaderSize",
    "maxExecutionUnitsPerTransaction",
    "maxExecutionUnitsPerBlock",
    "maxValueSize",
    "maxCollateralInputs",
  ]),
);

export const ECONOMIC_GROUP_FIELDS = Object.freeze(
  new Set([
    "minFeeCoefficient",
    "minFeeConstant",
    "stakeKeyDeposit",
    "poolDeposit",
    "minPoolCost",
    "monetaryExpansion",
    "treasuryExpansion",
    "coinsPerUtxoByte",
    "prices",
    "minFeeRefScriptCostPerByte",
    "maxReferenceScriptsSize",
    "minFeeReferenceScripts",
  ]),
);

export const TECHNICAL_GROUP_FIELDS = Object.freeze(
  new Set([
    "poolRetirementEpochBound",
    "desiredNumberOfPools",
    "poolInfluence",
    "collateralPercentage",
    "costModels",
  ]),
);

export const GOVERNANCE_GROUP_FIELDS = Object.freeze(
  new Set([
    "stakePoolVotingThresholds",
    "delegateRepresentativeVotingThresholds",
    "constitutionalCommitteeMinSize",
    "constitutionalCommitteeMaxTermLength",
    "governanceActionLifetime",
    "governanceActionDeposit",
    "delegateRepresentativeDeposit",
    "delegateRepresentativeMaxIdleTime",
  ]),
);

export const SECURITY_GROUP_FIELDS = Object.freeze(
  new Set([
    "maxBlockBodySize",
    "maxTxSize",
    "maxBlockHeaderSize",
    "maxExecutionUnitsPerBlock",
    "maxValueSize",
    "minFeeCoefficient",
    "minFeeConstant",
    "minFeeRefScriptCostPerByte",
    "coinsPerUtxoByte",
    "governanceActionDeposit",
  ]),
);

export const identifyParameterGroups = (
  update: Record<string, unknown>,
): Set<
  | "NetworkGroup"
  | "EconomicGroup"
  | "TechnicalGroup"
  | "GovernanceGroup"
  | "SecurityGroup"
> => {
  const groups = new Set<
    | "NetworkGroup"
    | "EconomicGroup"
    | "TechnicalGroup"
    | "GovernanceGroup"
    | "SecurityGroup"
  >();
  const hasField = (field: string): boolean =>
    isParameterUpdatePresent(update, field);

  if ([...NETWORK_GROUP_FIELDS].some(hasField)) {
    groups.add("NetworkGroup");
  }
  if ([...ECONOMIC_GROUP_FIELDS].some(hasField)) {
    groups.add("EconomicGroup");
  }
  if ([...TECHNICAL_GROUP_FIELDS].some(hasField)) {
    groups.add("TechnicalGroup");
  }
  if ([...GOVERNANCE_GROUP_FIELDS].some(hasField)) {
    groups.add("GovernanceGroup");
  }
  if ([...SECURITY_GROUP_FIELDS].some(hasField)) {
    groups.add("SecurityGroup");
  }
  return groups;
};

export const isParameterUpdatePresent = (
  update: Record<string, unknown>,
  field: string,
): boolean => {
  if (!Object.prototype.hasOwnProperty.call(update, field)) return false;
  const value = update[field];
  if (value === undefined) return false;
  if (value === null) return true;
  if (typeof value === "object") {
    if (value instanceof Map) {
      return value.size > 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return Object.keys(value).length > 0;
  }
  return true;
};
