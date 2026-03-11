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
var _PlutusData_map, _PlutusData_list, _PlutusData_integer, _PlutusData_bytes, _PlutusData_constr, _PlutusData_kind, _PlutusData_originalBytes;
import * as CardanoUtil from '../../Cardano/util/plutusDataUtils.js';
import * as Crypto from '@cardano-sdk/crypto';
import { CborReader, CborReaderState, CborTag, CborWriter } from '../CBOR/index.js';
import { ConstrPlutusData } from './ConstrPlutusData.js';
import { HexBlob } from '@cardano-sdk/util';
import { NotImplementedError } from '../../errors.js';
import { PlutusDataKind } from './PlutusDataKind.js';
import { PlutusList } from './PlutusList.js';
import { PlutusMap } from './PlutusMap.js';
import { bytesToHex } from '../../util/misc/index.js';
const MAX_WORD64 = 18446744073709551615n;
const INDEFINITE_BYTE_STRING = new Uint8Array([95]);
const MAX_BYTE_STRING_CHUNK_SIZE = 64;
const HASH_LENGTH_IN_BYTES = 32;
const MINUS_ONE = BigInt(-1);
export class PlutusData {
    constructor() {
        _PlutusData_map.set(this, undefined);
        _PlutusData_list.set(this, undefined);
        _PlutusData_integer.set(this, undefined);
        _PlutusData_bytes.set(this, undefined);
        _PlutusData_constr.set(this, undefined);
        _PlutusData_kind.set(this, PlutusDataKind.ConstrPlutusData);
        _PlutusData_originalBytes.set(this, undefined);
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _PlutusData_originalBytes, "f"))
            return __classPrivateFieldGet(this, _PlutusData_originalBytes, "f");
        let cbor;
        switch (__classPrivateFieldGet(this, _PlutusData_kind, "f")) {
            case PlutusDataKind.ConstrPlutusData: {
                cbor = __classPrivateFieldGet(this, _PlutusData_constr, "f").toCbor();
                break;
            }
            case PlutusDataKind.Map: {
                cbor = __classPrivateFieldGet(this, _PlutusData_map, "f").toCbor();
                break;
            }
            case PlutusDataKind.List: {
                cbor = __classPrivateFieldGet(this, _PlutusData_list, "f").toCbor();
                break;
            }
            case PlutusDataKind.Bytes: {
                const writer = new CborWriter();
                if (__classPrivateFieldGet(this, _PlutusData_bytes, "f").length <= MAX_BYTE_STRING_CHUNK_SIZE) {
                    writer.writeByteString(__classPrivateFieldGet(this, _PlutusData_bytes, "f"));
                }
                else {
                    writer.writeEncodedValue(INDEFINITE_BYTE_STRING);
                    for (let i = 0; i < __classPrivateFieldGet(this, _PlutusData_bytes, "f").length; i += MAX_BYTE_STRING_CHUNK_SIZE) {
                        const chunk = __classPrivateFieldGet(this, _PlutusData_bytes, "f").slice(i, i + MAX_BYTE_STRING_CHUNK_SIZE);
                        writer.writeByteString(chunk);
                    }
                    writer.writeEndArray();
                }
                cbor = bytesToHex(writer.encode());
                break;
            }
            case PlutusDataKind.Integer: {
                const writer = new CborWriter();
                if ((__classPrivateFieldGet(this, _PlutusData_integer, "f") >= 0 && __classPrivateFieldGet(this, _PlutusData_integer, "f") <= MAX_WORD64) ||
                    (__classPrivateFieldGet(this, _PlutusData_integer, "f") < 0 && __classPrivateFieldGet(this, _PlutusData_integer, "f") >= -1n - MAX_WORD64)) {
                    writer.writeInt(__classPrivateFieldGet(this, _PlutusData_integer, "f"));
                }
                else {
                    const serializedBigint = PlutusData.bigintToBuffer(__classPrivateFieldGet(this, _PlutusData_integer, "f"));
                    writer.writeTag(__classPrivateFieldGet(this, _PlutusData_integer, "f") < 0 ? CborTag.NegativeBigNum : CborTag.UnsignedBigNum);
                    if (serializedBigint.length <= MAX_BYTE_STRING_CHUNK_SIZE) {
                        writer.writeByteString(serializedBigint);
                    }
                    else {
                        writer.writeEncodedValue(INDEFINITE_BYTE_STRING);
                        for (let i = 0; i < serializedBigint.length; i += MAX_BYTE_STRING_CHUNK_SIZE) {
                            const chunk = serializedBigint.slice(i, i + MAX_BYTE_STRING_CHUNK_SIZE);
                            writer.writeByteString(chunk);
                        }
                        writer.writeEndArray();
                    }
                }
                cbor = bytesToHex(writer.encode());
                break;
            }
            default:
                throw new Error('Unsupported PlutusData kind');
        }
        return cbor;
    }
    static fromCbor(cbor) {
        const data = new PlutusData();
        const reader = new CborReader(cbor);
        const peekTokenType = reader.peekState();
        switch (peekTokenType) {
            case CborReaderState.Tag: {
                const tag = reader.peekTag();
                switch (tag) {
                    case CborTag.UnsignedBigNum: {
                        reader.readTag();
                        const bytes = reader.readByteString();
                        __classPrivateFieldSet(data, _PlutusData_integer, PlutusData.bufferToBigint(bytes), "f");
                        __classPrivateFieldSet(data, _PlutusData_kind, PlutusDataKind.Integer, "f");
                        break;
                    }
                    case CborTag.NegativeBigNum: {
                        reader.readTag();
                        const bytes = reader.readByteString();
                        __classPrivateFieldSet(data, _PlutusData_integer, PlutusData.bufferToBigint(bytes) * -1n, "f");
                        __classPrivateFieldSet(data, _PlutusData_kind, PlutusDataKind.Integer, "f");
                        break;
                    }
                    default: {
                        __classPrivateFieldSet(data, _PlutusData_constr, ConstrPlutusData.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                        __classPrivateFieldSet(data, _PlutusData_kind, PlutusDataKind.ConstrPlutusData, "f");
                    }
                }
                break;
            }
            case CborReaderState.NegativeInteger:
            case CborReaderState.UnsignedInteger: {
                __classPrivateFieldSet(data, _PlutusData_integer, reader.readInt(), "f");
                __classPrivateFieldSet(data, _PlutusData_kind, PlutusDataKind.Integer, "f");
                break;
            }
            case CborReaderState.StartIndefiniteLengthByteString:
            case CborReaderState.ByteString: {
                __classPrivateFieldSet(data, _PlutusData_bytes, reader.readByteString(), "f");
                __classPrivateFieldSet(data, _PlutusData_kind, PlutusDataKind.Bytes, "f");
                break;
            }
            case CborReaderState.StartArray: {
                __classPrivateFieldSet(data, _PlutusData_list, PlutusList.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                __classPrivateFieldSet(data, _PlutusData_kind, PlutusDataKind.List, "f");
                break;
            }
            case CborReaderState.StartMap: {
                __classPrivateFieldSet(data, _PlutusData_map, PlutusMap.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                __classPrivateFieldSet(data, _PlutusData_kind, PlutusDataKind.Map, "f");
                break;
            }
            default: {
                throw new Error('Invalid Plutus Data');
            }
        }
        __classPrivateFieldSet(data, _PlutusData_originalBytes, cbor, "f");
        return data;
    }
    toCore() {
        switch (__classPrivateFieldGet(this, _PlutusData_kind, "f")) {
            case PlutusDataKind.Bytes:
                return __classPrivateFieldGet(this, _PlutusData_bytes, "f");
            case PlutusDataKind.ConstrPlutusData: {
                const constrPlutusData = __classPrivateFieldGet(this, _PlutusData_constr, "f");
                return {
                    cbor: this.toCbor(),
                    constructor: constrPlutusData.getAlternative(),
                    fields: PlutusData.mapToCorePlutusList(constrPlutusData.getData())
                };
            }
            case PlutusDataKind.Integer:
                return __classPrivateFieldGet(this, _PlutusData_integer, "f");
            case PlutusDataKind.List:
                return PlutusData.mapToCorePlutusList(__classPrivateFieldGet(this, _PlutusData_list, "f"));
            case PlutusDataKind.Map: {
                const plutusMap = __classPrivateFieldGet(this, _PlutusData_map, "f");
                const coreMap = new Map();
                const keys = plutusMap.getKeys();
                for (let i = 0; i < keys.getLength(); i++) {
                    const key = keys.get(i);
                    coreMap.set(key.toCore(), plutusMap.get(key).toCore());
                }
                return { cbor: this.toCbor(), data: coreMap };
            }
            default:
                throw new NotImplementedError(`PlutusData mapping for kind ${__classPrivateFieldGet(this, _PlutusData_kind, "f")}`);
        }
    }
    hash() {
        return Crypto.blake2b.hash(this.toCbor(), HASH_LENGTH_IN_BYTES);
    }
    static fromCore(data) {
        if (CardanoUtil.isPlutusBoundedBytes(data)) {
            return PlutusData.newBytes(data);
        }
        else if (CardanoUtil.isPlutusBigInt(data)) {
            return PlutusData.newInteger(data);
        }
        if (data.cbor)
            return PlutusData.fromCbor(data.cbor);
        if (CardanoUtil.isPlutusList(data)) {
            return PlutusData.newList(PlutusData.mapToPlutusList(data.items));
        }
        else if (CardanoUtil.isPlutusMap(data)) {
            const plutusMap = new PlutusMap();
            for (const [key, val] of data.data) {
                plutusMap.insert(PlutusData.fromCore(key), PlutusData.fromCore(val));
            }
            return PlutusData.newMap(plutusMap);
        }
        else if (CardanoUtil.isConstrPlutusData(data)) {
            const alternative = data.constructor;
            const constrPlutusData = new ConstrPlutusData(alternative, PlutusData.mapToPlutusList(data.fields.items));
            return PlutusData.newConstrPlutusData(constrPlutusData);
        }
        throw new NotImplementedError('PlutusData type not implemented');
    }
    static newConstrPlutusData(constrPlutusData) {
        const data = new PlutusData();
        __classPrivateFieldSet(data, _PlutusData_constr, constrPlutusData, "f");
        __classPrivateFieldSet(data, _PlutusData_kind, PlutusDataKind.ConstrPlutusData, "f");
        return data;
    }
    static newMap(map) {
        const data = new PlutusData();
        __classPrivateFieldSet(data, _PlutusData_map, map, "f");
        __classPrivateFieldSet(data, _PlutusData_kind, PlutusDataKind.Map, "f");
        return data;
    }
    static newList(list) {
        const data = new PlutusData();
        __classPrivateFieldSet(data, _PlutusData_list, list, "f");
        __classPrivateFieldSet(data, _PlutusData_kind, PlutusDataKind.List, "f");
        return data;
    }
    static newInteger(integer) {
        const data = new PlutusData();
        __classPrivateFieldSet(data, _PlutusData_integer, integer, "f");
        __classPrivateFieldSet(data, _PlutusData_kind, PlutusDataKind.Integer, "f");
        return data;
    }
    static newBytes(bytes) {
        const data = new PlutusData();
        __classPrivateFieldSet(data, _PlutusData_bytes, bytes, "f");
        __classPrivateFieldSet(data, _PlutusData_kind, PlutusDataKind.Bytes, "f");
        return data;
    }
    getKind() {
        return __classPrivateFieldGet(this, _PlutusData_kind, "f");
    }
    asConstrPlutusData() {
        return __classPrivateFieldGet(this, _PlutusData_constr, "f");
    }
    asMap() {
        return __classPrivateFieldGet(this, _PlutusData_map, "f");
    }
    asList() {
        return __classPrivateFieldGet(this, _PlutusData_list, "f");
    }
    asInteger() {
        return __classPrivateFieldGet(this, _PlutusData_integer, "f");
    }
    asBoundedBytes() {
        return __classPrivateFieldGet(this, _PlutusData_bytes, "f");
    }
    equals(other) {
        switch (__classPrivateFieldGet(this, _PlutusData_kind, "f")) {
            case PlutusDataKind.Bytes:
                if (__classPrivateFieldGet(this, _PlutusData_bytes, "f") && __classPrivateFieldGet(other, _PlutusData_bytes, "f")) {
                    return (__classPrivateFieldGet(this, _PlutusData_bytes, "f").length === __classPrivateFieldGet(other, _PlutusData_bytes, "f").length &&
                        __classPrivateFieldGet(this, _PlutusData_bytes, "f").every((value, index) => value === __classPrivateFieldGet(other, _PlutusData_bytes, "f")[index]));
                }
                return false;
            case PlutusDataKind.Integer:
                return __classPrivateFieldGet(this, _PlutusData_integer, "f") === __classPrivateFieldGet(other, _PlutusData_integer, "f");
            case PlutusDataKind.ConstrPlutusData:
                if (__classPrivateFieldGet(this, _PlutusData_constr, "f") && __classPrivateFieldGet(other, _PlutusData_constr, "f")) {
                    return __classPrivateFieldGet(this, _PlutusData_constr, "f").equals(__classPrivateFieldGet(other, _PlutusData_constr, "f"));
                }
                return false;
            case PlutusDataKind.List:
                if (__classPrivateFieldGet(this, _PlutusData_list, "f") && __classPrivateFieldGet(other, _PlutusData_list, "f")) {
                    return __classPrivateFieldGet(this, _PlutusData_list, "f").equals(__classPrivateFieldGet(other, _PlutusData_list, "f"));
                }
                return false;
            case PlutusDataKind.Map:
                if (__classPrivateFieldGet(this, _PlutusData_map, "f") && __classPrivateFieldGet(other, _PlutusData_map, "f")) {
                    return __classPrivateFieldGet(this, _PlutusData_map, "f").equals(__classPrivateFieldGet(other, _PlutusData_map, "f"));
                }
                return false;
            default:
                return false;
        }
    }
    static mapToPlutusList(list) {
        const plutusList = new PlutusList();
        for (const listItem of list) {
            plutusList.add(PlutusData.fromCore(listItem));
        }
        return plutusList;
    }
    static mapToCorePlutusList(list) {
        const items = [];
        for (let i = 0; i < list.getLength(); i++) {
            const element = list.get(i);
            items.push(element.toCore());
        }
        return { cbor: list.toCbor(), items };
    }
    static bufferToBigint(buffer) {
        let ret = 0n;
        for (const i of buffer.values()) {
            const bi = BigInt(i);
            ret = (ret << 8n) + bi;
        }
        return ret;
    }
    static bigintToBuffer(value) {
        if (value < 0) {
            value = -value + MINUS_ONE;
        }
        let str = value.toString(16);
        if (str.length % 2) {
            str = `0${str}`;
        }
        return Buffer.from(str, 'hex');
    }
}
_PlutusData_map = new WeakMap(), _PlutusData_list = new WeakMap(), _PlutusData_integer = new WeakMap(), _PlutusData_bytes = new WeakMap(), _PlutusData_constr = new WeakMap(), _PlutusData_kind = new WeakMap(), _PlutusData_originalBytes = new WeakMap();
