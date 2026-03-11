var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _TransactionMetadatum_map, _TransactionMetadatum_list, _TransactionMetadatum_integer, _TransactionMetadatum_bytes, _TransactionMetadatum_text, _TransactionMetadatum_kind, _TransactionMetadatum_originalBytes;
import { CborReader, CborReaderState, CborTag, CborWriter } from '../../CBOR/index.js';
import { HexBlob } from "../../../../deps/util.js";
import { MetadatumList } from './MetadatumList.js';
import { MetadatumMap } from './MetadatumMap.js';
import { NotImplementedError, SerializationError, SerializationFailure } from '../../../errors.js';
import { TransactionMetadatumKind } from './TransactionMetadatumKind.js';
import { bytesToHex } from '../../../util/misc/index.js';
const MAX_WORD64 = 18446744073709551615n;
const check64Length = (metadatum) => {
    const len = typeof metadatum === 'string' ? Buffer.from(metadatum, 'utf8').length : metadatum.length;
    if (len > 64)
        throw new SerializationError(SerializationFailure.MaxLengthLimit, `Metadatum value '${metadatum}' is too long. Length is ${len}. Max length is 64 bytes`);
};
export class TransactionMetadatum {
    constructor() {
        _TransactionMetadatum_map.set(this, undefined);
        _TransactionMetadatum_list.set(this, undefined);
        _TransactionMetadatum_integer.set(this, undefined);
        _TransactionMetadatum_bytes.set(this, undefined);
        _TransactionMetadatum_text.set(this, undefined);
        _TransactionMetadatum_kind.set(this, TransactionMetadatumKind.Map);
        _TransactionMetadatum_originalBytes.set(this, undefined);
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _TransactionMetadatum_originalBytes, "f"))
            return __classPrivateFieldGet(this, _TransactionMetadatum_originalBytes, "f");
        let cbor;
        switch (__classPrivateFieldGet(this, _TransactionMetadatum_kind, "f")) {
            case TransactionMetadatumKind.Map: {
                cbor = __classPrivateFieldGet(this, _TransactionMetadatum_map, "f").toCbor();
                break;
            }
            case TransactionMetadatumKind.List: {
                cbor = __classPrivateFieldGet(this, _TransactionMetadatum_list, "f").toCbor();
                break;
            }
            case TransactionMetadatumKind.Bytes: {
                const writer = new CborWriter();
                check64Length(__classPrivateFieldGet(this, _TransactionMetadatum_bytes, "f"));
                writer.writeByteString(__classPrivateFieldGet(this, _TransactionMetadatum_bytes, "f"));
                cbor = bytesToHex(writer.encode());
                break;
            }
            case TransactionMetadatumKind.Text: {
                const writer = new CborWriter();
                check64Length(__classPrivateFieldGet(this, _TransactionMetadatum_text, "f"));
                writer.writeTextString(__classPrivateFieldGet(this, _TransactionMetadatum_text, "f"));
                cbor = bytesToHex(writer.encode());
                break;
            }
            case TransactionMetadatumKind.Integer: {
                const writer = new CborWriter();
                if ((__classPrivateFieldGet(this, _TransactionMetadatum_integer, "f") >= 0 && __classPrivateFieldGet(this, _TransactionMetadatum_integer, "f") <= MAX_WORD64) ||
                    (__classPrivateFieldGet(this, _TransactionMetadatum_integer, "f") < 0 && __classPrivateFieldGet(this, _TransactionMetadatum_integer, "f") >= -1n - MAX_WORD64)) {
                    writer.writeInt(__classPrivateFieldGet(this, _TransactionMetadatum_integer, "f"));
                }
                else {
                    writer.writeBigInteger(__classPrivateFieldGet(this, _TransactionMetadatum_integer, "f"));
                }
                cbor = bytesToHex(writer.encode());
                break;
            }
            default:
                throw new Error('Unsupported TransactionMetadatum kind');
        }
        return cbor;
    }
    static fromCbor(cbor) {
        const data = new TransactionMetadatum();
        const reader = new CborReader(cbor);
        const peekTokenType = reader.peekState();
        switch (peekTokenType) {
            case CborReaderState.Tag: {
                const tag = reader.peekTag();
                switch (tag) {
                    case CborTag.UnsignedBigNum: {
                        reader.readTag();
                        const bytes = reader.readByteString();
                        __classPrivateFieldSet(data, _TransactionMetadatum_integer, TransactionMetadatum.bufferToBigint(bytes), "f");
                        __classPrivateFieldSet(data, _TransactionMetadatum_kind, TransactionMetadatumKind.Integer, "f");
                        break;
                    }
                    case CborTag.NegativeBigNum: {
                        reader.readTag();
                        const bytes = reader.readByteString();
                        __classPrivateFieldSet(data, _TransactionMetadatum_integer, TransactionMetadatum.bufferToBigint(bytes) * -1n, "f");
                        __classPrivateFieldSet(data, _TransactionMetadatum_kind, TransactionMetadatumKind.Integer, "f");
                        break;
                    }
                }
                break;
            }
            case CborReaderState.NegativeInteger:
            case CborReaderState.UnsignedInteger: {
                __classPrivateFieldSet(data, _TransactionMetadatum_integer, reader.readInt(), "f");
                __classPrivateFieldSet(data, _TransactionMetadatum_kind, TransactionMetadatumKind.Integer, "f");
                break;
            }
            case CborReaderState.StartIndefiniteLengthByteString:
            case CborReaderState.ByteString: {
                __classPrivateFieldSet(data, _TransactionMetadatum_bytes, reader.readByteString(), "f");
                __classPrivateFieldSet(data, _TransactionMetadatum_kind, TransactionMetadatumKind.Bytes, "f");
                break;
            }
            case CborReaderState.StartIndefiniteLengthTextString:
            case CborReaderState.TextString: {
                __classPrivateFieldSet(data, _TransactionMetadatum_text, reader.readTextString(), "f");
                __classPrivateFieldSet(data, _TransactionMetadatum_kind, TransactionMetadatumKind.Text, "f");
                break;
            }
            case CborReaderState.StartArray: {
                __classPrivateFieldSet(data, _TransactionMetadatum_list, MetadatumList.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                __classPrivateFieldSet(data, _TransactionMetadatum_kind, TransactionMetadatumKind.List, "f");
                break;
            }
            case CborReaderState.StartMap: {
                __classPrivateFieldSet(data, _TransactionMetadatum_map, MetadatumMap.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                __classPrivateFieldSet(data, _TransactionMetadatum_kind, TransactionMetadatumKind.Map, "f");
                break;
            }
            default: {
                throw new Error('Invalid Plutus Data');
            }
        }
        __classPrivateFieldSet(data, _TransactionMetadatum_originalBytes, cbor, "f");
        return data;
    }
    toCore() {
        switch (__classPrivateFieldGet(this, _TransactionMetadatum_kind, "f")) {
            case TransactionMetadatumKind.Bytes:
                return new Uint8Array(__classPrivateFieldGet(this, _TransactionMetadatum_bytes, "f"));
            case TransactionMetadatumKind.Text:
                return __classPrivateFieldGet(this, _TransactionMetadatum_text, "f");
            case TransactionMetadatumKind.Integer:
                return __classPrivateFieldGet(this, _TransactionMetadatum_integer, "f");
            case TransactionMetadatumKind.List:
                return TransactionMetadatum.mapToCoreMetadatumList(__classPrivateFieldGet(this, _TransactionMetadatum_list, "f"));
            case TransactionMetadatumKind.Map: {
                const metadatumMap = __classPrivateFieldGet(this, _TransactionMetadatum_map, "f");
                const coreMap = new Map();
                const keys = metadatumMap.getKeys();
                for (let i = 0; i < keys.getLength(); i++) {
                    const key = keys.get(i);
                    coreMap.set(key.toCore(), metadatumMap.get(key).toCore());
                }
                return coreMap;
            }
            default:
                throw new NotImplementedError(`TransactionMetadatum mapping for kind ${__classPrivateFieldGet(this, _TransactionMetadatum_kind, "f")}`);
        }
    }
    static fromCore(metadatum) {
        if (metadatum === null)
            throw new SerializationError(SerializationFailure.InvalidType);
        switch (typeof metadatum) {
            case 'number':
            case 'boolean':
            case 'undefined':
                throw new SerializationError(SerializationFailure.InvalidType);
            case 'bigint': {
                return TransactionMetadatum.newInteger(metadatum);
            }
            case 'string':
                check64Length(metadatum);
                return TransactionMetadatum.newText(metadatum);
            default: {
                if (Array.isArray(metadatum)) {
                    const metadatumList = new MetadatumList();
                    for (const metadataItem of metadatum) {
                        metadatumList.add(TransactionMetadatum.fromCore(metadataItem));
                    }
                    return TransactionMetadatum.newList(metadatumList);
                }
                else if (ArrayBuffer.isView(metadatum)) {
                    check64Length(metadatum);
                    return TransactionMetadatum.newBytes(metadatum);
                }
                const metadataMap = new MetadatumMap();
                for (const [key, data] of metadatum.entries()) {
                    metadataMap.insert(TransactionMetadatum.fromCore(key), TransactionMetadatum.fromCore(data));
                }
                return TransactionMetadatum.newMap(metadataMap);
            }
        }
    }
    static newMap(map) {
        const data = new TransactionMetadatum();
        __classPrivateFieldSet(data, _TransactionMetadatum_map, map, "f");
        __classPrivateFieldSet(data, _TransactionMetadatum_kind, TransactionMetadatumKind.Map, "f");
        return data;
    }
    static newList(list) {
        const data = new TransactionMetadatum();
        __classPrivateFieldSet(data, _TransactionMetadatum_list, list, "f");
        __classPrivateFieldSet(data, _TransactionMetadatum_kind, TransactionMetadatumKind.List, "f");
        return data;
    }
    static newInteger(integer) {
        const data = new TransactionMetadatum();
        __classPrivateFieldSet(data, _TransactionMetadatum_integer, integer, "f");
        __classPrivateFieldSet(data, _TransactionMetadatum_kind, TransactionMetadatumKind.Integer, "f");
        return data;
    }
    static newBytes(bytes) {
        const data = new TransactionMetadatum();
        __classPrivateFieldSet(data, _TransactionMetadatum_bytes, bytes, "f");
        __classPrivateFieldSet(data, _TransactionMetadatum_kind, TransactionMetadatumKind.Bytes, "f");
        return data;
    }
    static newText(text) {
        const data = new TransactionMetadatum();
        __classPrivateFieldSet(data, _TransactionMetadatum_text, text, "f");
        __classPrivateFieldSet(data, _TransactionMetadatum_kind, TransactionMetadatumKind.Text, "f");
        return data;
    }
    getKind() {
        return __classPrivateFieldGet(this, _TransactionMetadatum_kind, "f");
    }
    asMap() {
        return __classPrivateFieldGet(this, _TransactionMetadatum_map, "f");
    }
    asList() {
        return __classPrivateFieldGet(this, _TransactionMetadatum_list, "f");
    }
    asInteger() {
        return __classPrivateFieldGet(this, _TransactionMetadatum_integer, "f");
    }
    asBytes() {
        return __classPrivateFieldGet(this, _TransactionMetadatum_bytes, "f");
    }
    asText() {
        return __classPrivateFieldGet(this, _TransactionMetadatum_text, "f");
    }
    equals(other) {
        let result = false;
        switch (__classPrivateFieldGet(this, _TransactionMetadatum_kind, "f")) {
            case TransactionMetadatumKind.Bytes:
                if (__classPrivateFieldGet(this, _TransactionMetadatum_bytes, "f") && __classPrivateFieldGet(other, _TransactionMetadatum_bytes, "f")) {
                    return (__classPrivateFieldGet(this, _TransactionMetadatum_bytes, "f").length === __classPrivateFieldGet(other, _TransactionMetadatum_bytes, "f").length &&
                        __classPrivateFieldGet(this, _TransactionMetadatum_bytes, "f").every((value, index) => value === __classPrivateFieldGet(other, _TransactionMetadatum_bytes, "f")[index]));
                }
                return false;
            case TransactionMetadatumKind.Integer:
                return __classPrivateFieldGet(this, _TransactionMetadatum_integer, "f") === __classPrivateFieldGet(other, _TransactionMetadatum_integer, "f");
            case TransactionMetadatumKind.Text:
                return __classPrivateFieldGet(this, _TransactionMetadatum_text, "f") === __classPrivateFieldGet(other, _TransactionMetadatum_text, "f");
            case TransactionMetadatumKind.List:
                if (__classPrivateFieldGet(this, _TransactionMetadatum_list, "f") && __classPrivateFieldGet(other, _TransactionMetadatum_list, "f")) {
                    return __classPrivateFieldGet(this, _TransactionMetadatum_list, "f").equals(__classPrivateFieldGet(other, _TransactionMetadatum_list, "f"));
                }
                return false;
            case TransactionMetadatumKind.Map:
                if (__classPrivateFieldGet(this, _TransactionMetadatum_map, "f") && __classPrivateFieldGet(other, _TransactionMetadatum_map, "f")) {
                    return __classPrivateFieldGet(this, _TransactionMetadatum_map, "f").equals(__classPrivateFieldGet(other, _TransactionMetadatum_map, "f"));
                }
                return false;
            default:
                result = false;
        }
        return result;
    }
    static mapToCoreMetadatumList(list) {
        const items = [];
        for (let i = 0; i < list.getLength(); i++) {
            const element = list.get(i);
            items.push(element.toCore());
        }
        return items;
    }
    static bufferToBigint(buffer) {
        let ret = 0n;
        for (const i of buffer.values()) {
            const bi = BigInt(i);
            ret = (ret << 8n) + bi;
        }
        return ret;
    }
}
_TransactionMetadatum_map = new WeakMap(), _TransactionMetadatum_list = new WeakMap(), _TransactionMetadatum_integer = new WeakMap(), _TransactionMetadatum_bytes = new WeakMap(), _TransactionMetadatum_text = new WeakMap(), _TransactionMetadatum_kind = new WeakMap(), _TransactionMetadatum_originalBytes = new WeakMap();
