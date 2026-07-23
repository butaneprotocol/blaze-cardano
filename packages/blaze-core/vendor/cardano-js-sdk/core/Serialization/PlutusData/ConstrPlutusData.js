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
var _ConstrPlutusData_alternative, _ConstrPlutusData_data;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { HexBlob } from "../../../deps/util.js";
import { PlutusList } from './PlutusList.js';
import { hexToBytes } from '../../util/misc/index.js';
const GENERAL_FORM_TAG = 102n;
const ALTERNATIVE_TAG_OFFSET = 7n;
export class ConstrPlutusData {
    constructor(alternative, data) {
        _ConstrPlutusData_alternative.set(this, 0n);
        _ConstrPlutusData_data.set(this, new PlutusList());
        __classPrivateFieldSet(this, _ConstrPlutusData_alternative, alternative, "f");
        __classPrivateFieldSet(this, _ConstrPlutusData_data, data, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        const compactTag = ConstrPlutusData.alternativeToCompactCborTag(__classPrivateFieldGet(this, _ConstrPlutusData_alternative, "f"));
        writer.writeTag(Number(compactTag));
        if (compactTag !== GENERAL_FORM_TAG) {
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _ConstrPlutusData_data, "f").toCbor()));
        }
        else {
            writer.writeStartArray(2);
            writer.writeInt(__classPrivateFieldGet(this, _ConstrPlutusData_alternative, "f"));
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _ConstrPlutusData_data, "f").toCbor()));
        }
        return HexBlob.fromBytes(writer.encode());
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const tag = reader.readTag();
        if (tag === Number(GENERAL_FORM_TAG)) {
            reader.readStartArray();
            const alternative = reader.readInt();
            const data = reader.readEncodedValue();
            const plutusList = PlutusList.fromCbor(HexBlob.fromBytes(data));
            reader.readEndArray();
            return new ConstrPlutusData(alternative, plutusList);
        }
        const alternative = ConstrPlutusData.compactCborTagToAlternative(BigInt(tag));
        const data = reader.readEncodedValue();
        const plutusList = PlutusList.fromCbor(HexBlob.fromBytes(data));
        return new ConstrPlutusData(alternative, plutusList);
    }
    getAlternative() {
        return __classPrivateFieldGet(this, _ConstrPlutusData_alternative, "f");
    }
    getData() {
        return __classPrivateFieldGet(this, _ConstrPlutusData_data, "f");
    }
    equals(other) {
        if (__classPrivateFieldGet(this, _ConstrPlutusData_alternative, "f") !== __classPrivateFieldGet(other, _ConstrPlutusData_alternative, "f"))
            return false;
        return __classPrivateFieldGet(this, _ConstrPlutusData_data, "f").equals(__classPrivateFieldGet(other, _ConstrPlutusData_data, "f"));
    }
    static compactCborTagToAlternative(tag) {
        if (tag >= 121n && tag <= 127)
            return tag - 121n;
        if (tag >= 1280n && tag <= 1400)
            return tag - 1280n + ALTERNATIVE_TAG_OFFSET;
        return GENERAL_FORM_TAG;
    }
    static alternativeToCompactCborTag(alternative) {
        if (alternative <= 6n)
            return 121n + alternative;
        if (alternative >= 7n && alternative <= 127n)
            return 1280n - ALTERNATIVE_TAG_OFFSET + alternative;
        return GENERAL_FORM_TAG;
    }
}
_ConstrPlutusData_alternative = new WeakMap(), _ConstrPlutusData_data = new WeakMap();
