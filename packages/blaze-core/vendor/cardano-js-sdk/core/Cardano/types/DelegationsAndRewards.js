import { metadatumToJson } from '../../util/metadatum.js';
export var StakeCredentialStatus;
(function (StakeCredentialStatus) {
    StakeCredentialStatus["Registering"] = "REGISTERING";
    StakeCredentialStatus["Registered"] = "REGISTERED";
    StakeCredentialStatus["Unregistering"] = "UNREGISTERING";
    StakeCredentialStatus["Unregistered"] = "UNREGISTERED";
})(StakeCredentialStatus || (StakeCredentialStatus = {}));
export const DelegationMetadataLabel = 6862n;
export const portfolioMetadataFromCip17 = (cip17) => {
    const portfolio = { ...cip17 };
    portfolio.pools = cip17.pools.map((pool) => ({
        id: pool.id,
        weight: pool.weight
    }));
    return portfolio;
};
export const cip17FromMetadatum = (portfolio) => {
    const cip17 = metadatumToJson(portfolio);
    for (const pool of cip17.pools) {
        pool.weight = Number(pool.weight);
    }
    return cip17;
};
