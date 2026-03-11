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
var _Redeemers_values, _Redeemers_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { ExUnits } from '../../Common/index.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { PlutusData } from '../../PlutusData/index.js';
import { Redeemer } from './Redeemer.js';
import { hexToBytes } from '../../../util/misc/index.js';
import { inConwayEra } from '../../../util/conwayEra.js';
const MAP_INDEX_EMBEDDED_GROUP_SIZE = 2;
const MAP_VALUE_EMBEDDED_GROUP_SIZE = 2;
export class Redeemers {
    constructor(redeemers) {
        _Redeemers_values.set(this, void 0);
        _Redeemers_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _Redeemers_values, [...redeemers], "f");
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _Redeemers_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Redeemers_originalBytes, "f");
        const writer = new CborWriter();
        if (inConwayEra) {
            const redeemersMap = new Map(__classPrivateFieldGet(this, _Redeemers_values, "f").map((redeemer) => [`${redeemer.tag()}:${redeemer.index()}`, redeemer]));
            writer.writeStartMap(redeemersMap.size);
            for (const redeemer of redeemersMap.values()) {
                writer.writeStartArray(2);
                writer.writeInt(redeemer.tag());
                writer.writeInt(redeemer.index());
                writer.writeStartArray(2);
                writer.writeEncodedValue(hexToBytes(redeemer.data().toCbor()));
                writer.writeEncodedValue(hexToBytes(redeemer.exUnits().toCbor()));
            }
        }
        else {
            writer.writeStartArray(__classPrivateFieldGet(this, _Redeemers_values, "f").length);
            for (const data of __classPrivateFieldGet(this, _Redeemers_values, "f")) {
                writer.writeEncodedValue(Buffer.from(data.toCbor(), 'hex'));
            }
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const redeemers = [];
        const reader = new CborReader(cbor);
        if (reader.peekState() === CborReaderState.StartMap) {
            reader.readStartMap();
            while (reader.peekState() !== CborReaderState.EndMap) {
                const indexLength = reader.readStartArray();
                if (indexLength !== MAP_INDEX_EMBEDDED_GROUP_SIZE)
                    throw new InvalidArgumentError('cbor', `Redeemers map index should be an array of ${MAP_INDEX_EMBEDDED_GROUP_SIZE} elements, but got an array of ${indexLength} elements`);
                const tag = Number(reader.readUInt());
                const index = reader.readUInt();
                reader.readEndArray();
                const valueLength = reader.readStartArray();
                if (valueLength !== MAP_VALUE_EMBEDDED_GROUP_SIZE)
                    throw new InvalidArgumentError('cbor', `Redeemers map value should be an array of ${MAP_VALUE_EMBEDDED_GROUP_SIZE} elements, but got an array of ${valueLength} elements`);
                const data = PlutusData.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
                const exUnits = ExUnits.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
                reader.readEndArray();
                redeemers.push(new Redeemer(tag, index, data, exUnits));
            }
            reader.readEndMap();
        }
        else {
            reader.readStartArray();
            while (reader.peekState() !== CborReaderState.EndArray) {
                redeemers.push(Redeemer.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
            }
            reader.readEndArray();
        }
        const result = new Redeemers(redeemers);
        __classPrivateFieldSet(result, _Redeemers_originalBytes, cbor, "f");
        return result;
    }
    toCore() {
        return __classPrivateFieldGet(this, _Redeemers_values, "f").map((redeemer) => redeemer.toCore());
    }
    static fromCore(redeemers) {
        return new Redeemers(redeemers.map((redeemer) => Redeemer.fromCore(redeemer)));
    }
    values() {
        return __classPrivateFieldGet(this, _Redeemers_values, "f");
    }
    setValues(redeemers) {
        __classPrivateFieldSet(this, _Redeemers_values, [...redeemers], "f");
        __classPrivateFieldSet(this, _Redeemers_originalBytes, undefined, "f");
    }
    size() {
        return __classPrivateFieldGet(this, _Redeemers_values, "f").length;
    }
}
_Redeemers_values = new WeakMap(), _Redeemers_originalBytes = new WeakMap();
