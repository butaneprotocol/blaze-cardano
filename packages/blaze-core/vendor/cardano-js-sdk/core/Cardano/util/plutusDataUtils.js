import { TextDecoder } from 'web-encoding';
export const isPlutusBoundedBytes = (plutusData) => ArrayBuffer.isView(plutusData);
export const isAnyPlutusDataCollection = (plutusData) => typeof plutusData === 'object' && !isPlutusBoundedBytes(plutusData);
export const isPlutusList = (plutusData) => isAnyPlutusDataCollection(plutusData) && 'items' in plutusData;
export const isPlutusMap = (plutusData) => isAnyPlutusDataCollection(plutusData) && 'data' in plutusData;
export const isConstrPlutusData = (plutusData) => isAnyPlutusDataCollection(plutusData) && 'fields' in plutusData;
export const isPlutusBigInt = (plutusData) => typeof plutusData === 'bigint';
const utf8Decoder = new TextDecoder('utf8', { fatal: true });
const tryConvertPlutusDataToUtf8String = (data) => {
    if (!isPlutusBoundedBytes(data))
        return data;
    try {
        return utf8Decoder.decode(data);
    }
    catch {
        return data;
    }
};
export const tryConvertPlutusMapToUtf8Record = (map, logger) => {
    const record = {};
    for (const [key, value] of map.data.entries()) {
        const keyAsStr = tryConvertPlutusDataToUtf8String(key);
        if (typeof keyAsStr !== 'string') {
            logger.warn('Failed to decode plutus map key', key);
            continue;
        }
        record[keyAsStr] = tryConvertPlutusDataToUtf8String(value);
    }
    return record;
};
