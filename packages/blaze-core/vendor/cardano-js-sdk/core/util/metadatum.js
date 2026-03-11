import { InvalidArgumentError } from '@cardano-sdk/util';
export const asMetadatumMap = (metadatum) => {
    if (metadatum instanceof Map) {
        return metadatum;
    }
    return null;
};
export const asMetadatumArray = (metadatum) => {
    if (Array.isArray(metadatum)) {
        return metadatum;
    }
    return null;
};
export const jsonToMetadatum = (json) => {
    if (json === null)
        throw new InvalidArgumentError('json', 'JSON value can not be null');
    switch (typeof json) {
        case 'boolean':
        case 'undefined':
            throw new InvalidArgumentError('json', `JSON value can not be ${typeof json}`);
        case 'number':
        case 'bigint': {
            return BigInt(json);
        }
        case 'string':
            return String(json);
        default: {
            if (Array.isArray(json)) {
                const array = [];
                for (const metadataItem of json) {
                    array.push(jsonToMetadatum(metadataItem));
                }
                return array;
            }
            else if (ArrayBuffer.isView(json)) {
                return new Uint8Array(json.buffer);
            }
            const metadataMap = new Map();
            for (const key in json) {
                const val = json[key];
                metadataMap.set(jsonToMetadatum(key), jsonToMetadatum(val));
            }
            return metadataMap;
        }
    }
};
export const metadatumToJson = (metadatum) => {
    if (metadatum === null)
        throw new InvalidArgumentError('data', 'Metadatum value can not be null');
    switch (typeof metadatum) {
        case 'boolean':
        case 'undefined':
        case 'number':
            throw new InvalidArgumentError('metadatum', `Metadatum value can not be ${typeof metadatum}`);
        case 'bigint': {
            return metadatum;
        }
        case 'string':
            return metadatum;
        default: {
            if (Array.isArray(metadatum)) {
                const array = [];
                for (const metadataItem of metadatum) {
                    array.push(metadatumToJson(metadataItem));
                }
                return array;
            }
            else if (ArrayBuffer.isView(metadatum)) {
                return new Uint8Array(metadatum);
            }
            const object = {};
            for (const [key, value] of metadatum.entries()) {
                object[metadatumToJson(key)] = metadatumToJson(value);
            }
            return object;
        }
    }
};
