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
var _MetadatumList_array, _MetadatumList_useIndefiniteEncoding;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { HexBlob } from "../../../../deps/util.js";
import { TransactionMetadatum } from './TransactionMetadatum.js';
import { bytesToHex, hexToBytes } from '../../../util/misc/index.js';
export class MetadatumList {
    constructor() {
        _MetadatumList_array.set(this, new Array());
        _MetadatumList_useIndefiniteEncoding.set(this, false);
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _MetadatumList_useIndefiniteEncoding, "f")) {
            writer.writeStartArray();
        }
        else {
            writer.writeStartArray(__classPrivateFieldGet(this, _MetadatumList_array, "f").length);
        }
        for (const elem of __classPrivateFieldGet(this, _MetadatumList_array, "f")) {
            writer.writeEncodedValue(hexToBytes(elem.toCbor()));
        }
        if (__classPrivateFieldGet(this, _MetadatumList_useIndefiniteEncoding, "f"))
            writer.writeEndArray();
        return HexBlob.fromBytes(writer.encode());
    }
    static fromCbor(cbor) {
        const list = new MetadatumList();
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length === null)
            __classPrivateFieldSet(list, _MetadatumList_useIndefiniteEncoding, true, "f");
        while (reader.peekState() !== CborReaderState.EndArray) {
            list.add(TransactionMetadatum.fromCbor(bytesToHex(reader.readEncodedValue())));
        }
        reader.readEndArray();
        return list;
    }
    getLength() {
        return __classPrivateFieldGet(this, _MetadatumList_array, "f").length;
    }
    get(index) {
        return __classPrivateFieldGet(this, _MetadatumList_array, "f")[index];
    }
    add(elem) {
        __classPrivateFieldGet(this, _MetadatumList_array, "f").push(elem);
    }
    equals(other) {
        if (__classPrivateFieldGet(this, _MetadatumList_array, "f").length !== __classPrivateFieldGet(other, _MetadatumList_array, "f").length)
            return false;
        for (let i = 0; i < __classPrivateFieldGet(this, _MetadatumList_array, "f").length; ++i) {
            if (!__classPrivateFieldGet(this, _MetadatumList_array, "f")[i].equals(__classPrivateFieldGet(other, _MetadatumList_array, "f")[i]))
                return false;
        }
        return true;
    }
}
_MetadatumList_array = new WeakMap(), _MetadatumList_useIndefiniteEncoding = new WeakMap();
