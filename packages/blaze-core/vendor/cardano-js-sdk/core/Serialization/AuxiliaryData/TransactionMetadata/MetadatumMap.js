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
var _MetadatumMap_map, _MetadatumMap_useIndefiniteEncoding;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { HexBlob } from "../../../../deps/util.js";
import { MetadatumList } from './MetadatumList.js';
import { TransactionMetadatum } from './TransactionMetadatum.js';
import { bytesToHex, hexToBytes } from '../../../util/misc/index.js';
export class MetadatumMap {
    constructor() {
        _MetadatumMap_map.set(this, new Map());
        _MetadatumMap_useIndefiniteEncoding.set(this, false);
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _MetadatumMap_useIndefiniteEncoding, "f")) {
            writer.writeStartMap();
        }
        else {
            writer.writeStartMap(__classPrivateFieldGet(this, _MetadatumMap_map, "f").size);
        }
        for (const [key, value] of __classPrivateFieldGet(this, _MetadatumMap_map, "f").entries()) {
            writer.writeEncodedValue(hexToBytes(key.toCbor()));
            writer.writeEncodedValue(hexToBytes(value.toCbor()));
        }
        if (__classPrivateFieldGet(this, _MetadatumMap_useIndefiniteEncoding, "f"))
            writer.writeEndMap();
        return HexBlob.fromBytes(writer.encode());
    }
    static fromCbor(cbor) {
        const map = new MetadatumMap();
        const reader = new CborReader(cbor);
        const size = reader.readStartMap();
        if (size === null)
            __classPrivateFieldSet(map, _MetadatumMap_useIndefiniteEncoding, true, "f");
        while (reader.peekState() !== CborReaderState.EndMap) {
            const key = TransactionMetadatum.fromCbor(bytesToHex(reader.readEncodedValue()));
            const value = TransactionMetadatum.fromCbor(bytesToHex(reader.readEncodedValue()));
            map.insert(key, value);
        }
        reader.readEndMap();
        return map;
    }
    getLength() {
        return __classPrivateFieldGet(this, _MetadatumMap_map, "f").size;
    }
    insert(key, value) {
        __classPrivateFieldGet(this, _MetadatumMap_map, "f").set(key, value);
    }
    get(key) {
        if (!__classPrivateFieldGet(this, _MetadatumMap_map, "f"))
            return undefined;
        const element = [...__classPrivateFieldGet(this, _MetadatumMap_map, "f").entries()].find((entry) => entry[0].equals(key));
        if (!element)
            return undefined;
        return element[1];
    }
    getKeys() {
        const list = new MetadatumList();
        for (const elem of __classPrivateFieldGet(this, _MetadatumMap_map, "f").keys()) {
            list.add(elem);
        }
        return list;
    }
    equals(other) {
        if (__classPrivateFieldGet(this, _MetadatumMap_useIndefiniteEncoding, "f") !== __classPrivateFieldGet(other, _MetadatumMap_useIndefiniteEncoding, "f"))
            return false;
        if (__classPrivateFieldGet(this, _MetadatumMap_map, "f").size !== __classPrivateFieldGet(other, _MetadatumMap_map, "f").size)
            return false;
        const thisEntries = [...__classPrivateFieldGet(this, _MetadatumMap_map, "f").entries()];
        const otherEntries = [...__classPrivateFieldGet(other, _MetadatumMap_map, "f").entries()];
        for (let i = 0; i < __classPrivateFieldGet(this, _MetadatumMap_map, "f").size; ++i) {
            if (!thisEntries[i][0].equals(otherEntries[i][0]))
                return false;
            if (!thisEntries[i][1].equals(otherEntries[i][1]))
                return false;
        }
        return true;
    }
}
_MetadatumMap_map = new WeakMap(), _MetadatumMap_useIndefiniteEncoding = new WeakMap();
