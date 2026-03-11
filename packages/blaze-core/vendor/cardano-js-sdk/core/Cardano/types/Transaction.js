import * as Crypto from '@cardano-sdk/crypto';
export const TransactionId = (value) => Crypto.Hash32ByteBase16(value);
TransactionId.fromHexBlob = (value) => Crypto.Hash32ByteBase16.fromHexBlob(value);
export var InputSource;
(function (InputSource) {
    InputSource["inputs"] = "inputs";
    InputSource["collaterals"] = "collaterals";
})(InputSource || (InputSource = {}));
export var RedeemerPurpose;
(function (RedeemerPurpose) {
    RedeemerPurpose["spend"] = "spend";
    RedeemerPurpose["mint"] = "mint";
    RedeemerPurpose["certificate"] = "certificate";
    RedeemerPurpose["withdrawal"] = "withdrawal";
    RedeemerPurpose["propose"] = "propose";
    RedeemerPurpose["vote"] = "vote";
})(RedeemerPurpose || (RedeemerPurpose = {}));
