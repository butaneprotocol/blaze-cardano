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
var _CborSet_values, _CborSet_originalBytes;
import { CborReader, CborReaderState, CborTag, CborWriter } from '../CBOR/index.js';
import { HexBlob } from "../../../deps/util.js";
import { inConwayEra } from '../../util/conwayEra.js';
export class CborSet {
    constructor(values) {
        _CborSet_values.set(this, void 0);
        _CborSet_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _CborSet_values, [...values], "f");
    }
    static fromCbor(cbor, fromCbor) {
        const reader = new CborReader(cbor);
        const cborSet = new CborSet([]);
        if (reader.peekState() === CborReaderState.Tag && reader.peekTag() === CborTag.Set) {
            reader.readTag();
        }
        reader.readStartArray();
        while (reader.peekState() !== CborReaderState.EndArray) {
            __classPrivateFieldGet(cborSet, _CborSet_values, "f").push(fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
        }
        __classPrivateFieldSet(cborSet, _CborSet_originalBytes, cbor, "f");
        return cborSet;
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _CborSet_originalBytes, "f"))
            return __classPrivateFieldGet(this, _CborSet_originalBytes, "f");
        const writer = new CborWriter();
        if (inConwayEra)
            writer.writeTag(CborTag.Set);
        writer.writeStartArray(this.size());
        for (const input of this.values()) {
            writer.writeEncodedValue(Buffer.from(input.toCbor(), 'hex'));
        }
        return writer.encodeAsHex();
    }
    toCore() {
        return __classPrivateFieldGet(this, _CborSet_values, "f").map((v) => v.toCore());
    }
    static fromCore(coreValues, fromCore) {
        return new CborSet(coreValues.map((v) => fromCore(v)));
    }
    values() {
        return __classPrivateFieldGet(this, _CborSet_values, "f");
    }
    setValues(values) {
        __classPrivateFieldSet(this, _CborSet_values, [...values], "f");
        __classPrivateFieldSet(this, _CborSet_originalBytes, undefined, "f");
    }
    size() {
        return __classPrivateFieldGet(this, _CborSet_values, "f").length;
    }
}
_CborSet_values = new WeakMap(), _CborSet_originalBytes = new WeakMap();
