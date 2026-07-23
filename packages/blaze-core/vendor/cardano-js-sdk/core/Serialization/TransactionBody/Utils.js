import { AssetId } from '../../Cardano/types/Asset.js';
export const sortCanonically = (lhs, rhs) => {
    if (lhs[0].length === rhs[0].length) {
        return lhs[0] > rhs[0] ? 1 : -1;
    }
    else if (lhs[0].length > rhs[0].length)
        return 1;
    return -1;
};
export const tokenMapToMultiAsset = (tokenMap) => {
    const multiassets = new Map();
    const sortedTokenMap = new Map([...tokenMap.entries()].sort(sortCanonically));
    for (const [assetId, quantity] of sortedTokenMap.entries()) {
        const policyId = AssetId.getPolicyId(assetId);
        const assetName = AssetId.getAssetName(assetId);
        if (!multiassets.has(policyId))
            multiassets.set(policyId, new Map());
        multiassets.get(policyId).set(assetName, quantity);
    }
    return multiassets;
};
export const multiAssetsToTokenMap = (multiassets) => {
    const tokenMap = new Map();
    for (const [scriptHash, assets] of multiassets.entries()) {
        for (const [assetName, quantity] of assets.entries()) {
            const assetId = AssetId.fromParts(scriptHash, assetName);
            tokenMap.set(assetId, quantity);
        }
    }
    return tokenMap;
};
