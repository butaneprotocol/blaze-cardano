var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Costmdls_models, _Costmdls_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { CostModel } from './CostModel.js';
import { InvalidStateError } from '@cardano-sdk/util';
import { PlutusLanguageVersion } from '../../../Cardano/types/Script.js';
export class Costmdls {
    constructor(models = new Map()) {
        _Costmdls_models.set(this, void 0);
        _Costmdls_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _Costmdls_models, models, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _Costmdls_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Costmdls_originalBytes, "f");
        const sortedCanonically = new Map([...__classPrivateFieldGet(this, _Costmdls_models, "f")].sort((a, b) => (a > b ? 1 : -1)));
        writer.writeStartMap(sortedCanonically.size);
        for (const [key, value] of sortedCanonically) {
            writer.writeInt(key);
            writer.writeStartArray(value.costs().length);
            for (const cost of value.costs()) {
                writer.writeInt(cost);
            }
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        reader.readStartMap();
        const models = new Map();
        while (reader.peekState() !== CborReaderState.EndMap) {
            const language = Number(reader.readInt());
            const costs = new Array();
            reader.readStartArray();
            while (reader.peekState() !== CborReaderState.EndArray) {
                costs.push(Number(reader.readInt()));
            }
            reader.readEndArray();
            models.set(language, new CostModel(language, costs));
        }
        reader.readEndMap();
        const costmdl = new Costmdls(models);
        __classPrivateFieldSet(costmdl, _Costmdls_originalBytes, cbor, "f");
        return costmdl;
    }
    toCore() {
        const models = new Map();
        for (const [key, value] of __classPrivateFieldGet(this, _Costmdls_models, "f")) {
            models.set(key, value.costs());
        }
        return models;
    }
    static fromCore(costModels) {
        const models = new Map();
        for (const [key, value] of costModels) {
            models.set(key, new CostModel(key, value));
        }
        return new Costmdls(models);
    }
    size() {
        return __classPrivateFieldGet(this, _Costmdls_models, "f").size;
    }
    insert(value) {
        __classPrivateFieldGet(this, _Costmdls_models, "f").set(value.language(), value);
        __classPrivateFieldSet(this, _Costmdls_originalBytes, undefined, "f");
    }
    get(key) {
        return __classPrivateFieldGet(this, _Costmdls_models, "f").get(key);
    }
    keys() {
        return [...__classPrivateFieldGet(this, _Costmdls_models, "f").keys()];
    }
    languageViewsEncoding() {
        const encodedLanguageViews = new CborWriter();
        const sortedCanonically = new Map([...__classPrivateFieldGet(this, _Costmdls_models, "f")].sort((a, b) => {
            const lhs = a[0] === PlutusLanguageVersion.V1 ? 0x41 : a[0];
            const rhs = b[0] === PlutusLanguageVersion.V1 ? 0x41 : b[0];
            return lhs > rhs ? 1 : -1;
        }));
        encodedLanguageViews.writeStartMap(sortedCanonically.size);
        for (const [key, value] of sortedCanonically) {
            switch (key) {
                case PlutusLanguageVersion.V1: {
                    const writer = new CborWriter();
                    writer.writeStartArray();
                    for (const cost of value.costs()) {
                        writer.writeInt(cost);
                    }
                    writer.writeEndArray();
                    const innerCbor = writer.encode();
                    encodedLanguageViews.writeByteString(new Uint8Array([0]));
                    encodedLanguageViews.writeByteString(innerCbor);
                    break;
                }
                case PlutusLanguageVersion.V2:
                case PlutusLanguageVersion.V3:
                    encodedLanguageViews.writeInt(key);
                    encodedLanguageViews.writeStartArray(value.costs().length);
                    for (const cost of value.costs()) {
                        encodedLanguageViews.writeInt(cost);
                    }
                    break;
                default:
                    throw new InvalidStateError('Invalid plutus language version.');
            }
        }
        return encodedLanguageViews.encodeAsHex();
    }
}
_Costmdls_models = new WeakMap(), _Costmdls_originalBytes = new WeakMap();
