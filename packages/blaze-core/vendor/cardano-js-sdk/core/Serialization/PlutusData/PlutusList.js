var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PlutusList_array;
import { CborReader, CborReaderState, CborWriter } from '../CBOR/index.js';
import { HexBlob } from '@cardano-sdk/util';
import { PlutusData } from './PlutusData.js';
import { bytesToHex, hexToBytes } from '../../util/misc/index.js';
export class PlutusList {
    constructor() {
        _PlutusList_array.set(this, new Array());
    }
    toCbor() {
        const writer = new CborWriter();
        const shouldUseIndefinite = __classPrivateFieldGet(this, _PlutusList_array, "f").length > 0;
        if (shouldUseIndefinite) {
            writer.writeStartArray();
        }
        else {
            writer.writeStartArray(__classPrivateFieldGet(this, _PlutusList_array, "f").length);
        }
        for (const elem of __classPrivateFieldGet(this, _PlutusList_array, "f")) {
            writer.writeEncodedValue(hexToBytes(elem.toCbor()));
        }
        if (shouldUseIndefinite)
            writer.writeEndArray();
        return HexBlob.fromBytes(writer.encode());
    }
    static fromCbor(cbor) {
        const list = new PlutusList();
        const reader = new CborReader(cbor);
        reader.readStartArray();
        while (reader.peekState() !== CborReaderState.EndArray) {
            list.add(PlutusData.fromCbor(bytesToHex(reader.readEncodedValue())));
        }
        reader.readEndArray();
        return list;
    }
    getLength() {
        return __classPrivateFieldGet(this, _PlutusList_array, "f").length;
    }
    get(index) {
        return __classPrivateFieldGet(this, _PlutusList_array, "f")[index];
    }
    add(elem) {
        __classPrivateFieldGet(this, _PlutusList_array, "f").push(elem);
    }
    equals(other) {
        if (__classPrivateFieldGet(this, _PlutusList_array, "f").length !== __classPrivateFieldGet(other, _PlutusList_array, "f").length)
            return false;
        for (let i = 0; i < __classPrivateFieldGet(this, _PlutusList_array, "f").length; ++i) {
            if (!__classPrivateFieldGet(this, _PlutusList_array, "f")[i].equals(__classPrivateFieldGet(other, _PlutusList_array, "f")[i]))
                return false;
        }
        return true;
    }
}
_PlutusList_array = new WeakMap();
