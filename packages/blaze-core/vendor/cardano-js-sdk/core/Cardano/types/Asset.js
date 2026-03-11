import * as Crypto from "../../../deps/crypto.js";
import { HexBlob, InvalidStringError, assertIsHexString, typedBech32 } from "../../../deps/util.js";
import { TextDecoder } from 'web-encoding';
export const AssetName = (value) => {
    if (value.length > 0) {
        assertIsHexString(value);
        if (value.length > 64) {
            throw new InvalidStringError('too long');
        }
    }
    return value.toLowerCase();
};
const utf8Decoder = new TextDecoder('utf8', { fatal: true });
AssetName.toUTF8 = (assetName, stripInvisibleCharacters = false) => {
    const assetNameBuffer = Buffer.from(assetName, 'hex');
    try {
        if (stripInvisibleCharacters) {
            return utf8Decoder.decode(assetNameBuffer.filter((v) => v > 31));
        }
        return utf8Decoder.decode(assetNameBuffer);
    }
    catch (error) {
        throw new InvalidStringError(`Cannot convert AssetName '${assetName}' to UTF8`, error);
    }
};
export const AssetId = (value) => {
    const normalizedValue = value.split('.').join('');
    assertIsHexString(normalizedValue);
    if (normalizedValue.length > 120)
        throw new InvalidStringError('too long');
    if (normalizedValue.length < 56)
        throw new InvalidStringError('too short');
    return normalizedValue;
};
export const PolicyId = (value) => Crypto.Hash28ByteBase16(value);
AssetId.getPolicyId = (id) => PolicyId(id.slice(0, 56));
AssetId.getAssetName = (id) => AssetName(id.slice(56));
AssetId.fromParts = (policyId, assetName) => AssetId(policyId + assetName);
export const AssetFingerprint = (value) => typedBech32(value, 'asset', 32);
AssetFingerprint.fromParts = (policyId, assetName) => {
    const policyBuf = Buffer.from(policyId, 'hex');
    const assetNameBuf = Buffer.from(assetName, 'hex');
    const hexDigest = Crypto.blake2b.hash(HexBlob.fromBytes(new Uint8Array([...policyBuf, ...assetNameBuf])), 20);
    return AssetFingerprint(HexBlob.toTypedBech32('asset', hexDigest));
};
