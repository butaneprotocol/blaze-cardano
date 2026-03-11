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
var _Datum_datumKind, _Datum_dataHash, _Datum_inlineData, _Datum_originalBytes;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { HexBlob, InvalidArgumentError, InvalidStateError } from '@cardano-sdk/util';
import { PlutusData } from '../PlutusData/index.js';
const DATUM_ARRAY_SIZE = 2;
export const isDatumHash = (datum) => datum !== null && typeof datum === 'string';
export var DatumKind;
(function (DatumKind) {
    DatumKind[DatumKind["DataHash"] = 0] = "DataHash";
    DatumKind[DatumKind["InlineData"] = 1] = "InlineData";
})(DatumKind || (DatumKind = {}));
export class Datum {
    constructor(dataHash, inlineData) {
        _Datum_datumKind.set(this, void 0);
        _Datum_dataHash.set(this, void 0);
        _Datum_inlineData.set(this, void 0);
        _Datum_originalBytes.set(this, undefined);
        if (dataHash && inlineData)
            throw new InvalidStateError('Datum can only be DataHash or PlutusData but not both');
        if (!dataHash && !inlineData)
            throw new InvalidStateError('Datum must be either DataHash or PlutusData');
        if (dataHash)
            __classPrivateFieldSet(this, _Datum_datumKind, DatumKind.DataHash, "f");
        if (inlineData)
            __classPrivateFieldSet(this, _Datum_datumKind, DatumKind.InlineData, "f");
        __classPrivateFieldSet(this, _Datum_dataHash, dataHash, "f");
        __classPrivateFieldSet(this, _Datum_inlineData, inlineData, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _Datum_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Datum_originalBytes, "f");
        writer.writeStartArray(DATUM_ARRAY_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _Datum_datumKind, "f"));
        if (__classPrivateFieldGet(this, _Datum_datumKind, "f") === DatumKind.DataHash) {
            writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _Datum_dataHash, "f"), 'hex').valueOf());
        }
        else {
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _Datum_inlineData, "f").toCbor(), 'hex').valueOf());
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== DATUM_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${DATUM_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readUInt());
        let datumHash;
        let inlineDatum;
        switch (kind) {
            case DatumKind.DataHash:
                datumHash = HexBlob.fromBytes(reader.readByteString());
                break;
            case DatumKind.InlineData:
                inlineDatum = PlutusData.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
                break;
            default:
                throw new InvalidArgumentError('cbor', `Unexpected datum kind ${kind}`);
        }
        reader.readEndArray();
        const exUnit = new Datum(datumHash, inlineDatum);
        __classPrivateFieldSet(exUnit, _Datum_originalBytes, cbor, "f");
        return exUnit;
    }
    toCore() {
        let result;
        switch (__classPrivateFieldGet(this, _Datum_datumKind, "f")) {
            case DatumKind.DataHash:
                result = __classPrivateFieldGet(this, _Datum_dataHash, "f");
                break;
            case DatumKind.InlineData:
                result = __classPrivateFieldGet(this, _Datum_inlineData, "f").toCore();
                break;
            default:
                throw new InvalidStateError(`Unexpected datum kind ${__classPrivateFieldGet(this, _Datum_datumKind, "f")}`);
        }
        return result;
    }
    static fromCore(datum) {
        if (isDatumHash(datum))
            return new Datum(datum);
        return new Datum(undefined, PlutusData.fromCore(datum));
    }
    kind() {
        return __classPrivateFieldGet(this, _Datum_datumKind, "f");
    }
    asDataHash() {
        return __classPrivateFieldGet(this, _Datum_dataHash, "f");
    }
    asInlineData() {
        return __classPrivateFieldGet(this, _Datum_inlineData, "f");
    }
    static newDataHash(dataHash) {
        return new Datum(dataHash);
    }
    static newInlineData(inlineData) {
        return new Datum(undefined, inlineData);
    }
}
_Datum_datumKind = new WeakMap(), _Datum_dataHash = new WeakMap(), _Datum_inlineData = new WeakMap(), _Datum_originalBytes = new WeakMap();
