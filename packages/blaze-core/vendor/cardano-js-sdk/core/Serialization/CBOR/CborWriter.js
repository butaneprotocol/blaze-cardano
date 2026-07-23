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
var _CborWriter_instances, _CborWriter_buffer, _CborWriter_writeTypeValue, _CborWriter_pushUInt8, _CborWriter_pushUInt16, _CborWriter_pushUInt32;
import { CborInitialByte } from './CborInitialByte.js';
import { CborMajorType } from './CborMajorType.js';
import { CborTag } from './CborTag.js';
import { encodeHalf } from './Half.js';
const MINUS_ONE = BigInt(-1);
const SHIFT32 = BigInt('0x100000000');
const ONE = 24;
const TWO = 25;
const FOUR = 26;
const EIGHT = 27;
const FALSE = 0xf4;
const TRUE = 0xf5;
const NULL = 0xf6;
const UNDEFINED = 0xf7;
const INDEFINITE_LENGTH_ARRAY = 0x9f;
const INDEFINITE_LENGTH_MAP = 0xbf;
const HALF = (7 << 5) | 25;
const FLOAT = (7 << 5) | 26;
const DOUBLE = (7 << 5) | 27;
const BUF_NAN = Buffer.from('ffc00000', 'hex');
const BUF_INF_NEG = Buffer.from('fff0000000000000', 'hex');
const BUF_INF_POS = Buffer.from('7ff0000000000000', 'hex');
export class CborWriter {
    constructor() {
        _CborWriter_instances.add(this);
        _CborWriter_buffer.set(this, Buffer.from([]));
    }
    writeBigInteger(value) {
        let tag = CborTag.UnsignedBigNum;
        if (value < 0) {
            value = -value + MINUS_ONE;
            tag = CborTag.NegativeBigNum;
        }
        let str = value.toString(16);
        if (str.length % 2) {
            str = `0${str}`;
        }
        const buffer = Buffer.from(str, 'hex');
        this.writeTag(tag);
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_writeTypeValue).call(this, CborMajorType.ByteString, buffer.length);
        __classPrivateFieldSet(this, _CborWriter_buffer, Buffer.concat([__classPrivateFieldGet(this, _CborWriter_buffer, "f"), buffer]), "f");
        return this;
    }
    writeBoolean(value) {
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, value ? TRUE : FALSE);
        return this;
    }
    writeByteString(value) {
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_writeTypeValue).call(this, CborMajorType.ByteString, value.length);
        __classPrivateFieldSet(this, _CborWriter_buffer, Buffer.concat([__classPrivateFieldGet(this, _CborWriter_buffer, "f"), value]), "f");
        return this;
    }
    writeTextString(value) {
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_writeTypeValue).call(this, CborMajorType.Utf8String, Buffer.from(value, 'utf8').length);
        __classPrivateFieldSet(this, _CborWriter_buffer, Buffer.concat([__classPrivateFieldGet(this, _CborWriter_buffer, "f"), Buffer.from(value, 'utf8')]), "f");
        return this;
    }
    writeEncodedValue(value) {
        __classPrivateFieldSet(this, _CborWriter_buffer, Buffer.concat([__classPrivateFieldGet(this, _CborWriter_buffer, "f"), value]), "f");
        return this;
    }
    writeStartArray(length) {
        if (length !== undefined) {
            __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_writeTypeValue).call(this, CborMajorType.Array, length);
        }
        else {
            __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, INDEFINITE_LENGTH_ARRAY);
        }
        return this;
    }
    writeEndArray() {
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, CborInitialByte.IndefiniteLengthBreakByte);
        return this;
    }
    writeStartMap(length) {
        if (length !== undefined) {
            __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_writeTypeValue).call(this, CborMajorType.Map, length);
        }
        else {
            __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, INDEFINITE_LENGTH_MAP);
        }
        return this;
    }
    writeEndMap() {
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, CborInitialByte.IndefiniteLengthBreakByte);
        return this;
    }
    writeInt(value) {
        if (value < 0) {
            __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_writeTypeValue).call(this, CborMajorType.NegativeInteger, -(BigInt(value) + 1n));
        }
        else {
            __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_writeTypeValue).call(this, CborMajorType.UnsignedInteger, value);
        }
        return this;
    }
    writeFloat(value) {
        let val;
        if (value === Number.NEGATIVE_INFINITY) {
            __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, DOUBLE);
            this.writeEncodedValue(BUF_INF_NEG);
            return this;
        }
        if (value === Number.POSITIVE_INFINITY) {
            __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, DOUBLE);
            this.writeEncodedValue(BUF_INF_POS);
            return this;
        }
        if (Number.isNaN(value)) {
            __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, FLOAT);
            this.writeEncodedValue(BUF_NAN);
            return this;
        }
        try {
            val = encodeHalf(value);
            __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, HALF);
            this.writeEncodedValue(val);
        }
        catch {
            const b4 = Buffer.allocUnsafe(4);
            b4.writeFloatBE(value, 0);
            if (b4.readFloatBE(0) === value) {
                __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, FLOAT);
                this.writeEncodedValue(b4.valueOf());
            }
            else {
                const b8 = Buffer.allocUnsafe(8);
                b8.writeFloatBE(value, 0);
                __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, DOUBLE);
                this.writeEncodedValue(b8.valueOf());
            }
        }
        return this;
    }
    writeNull() {
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, NULL);
        return this;
    }
    writeUndefined() {
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, UNDEFINED);
        return this;
    }
    writeTag(tag) {
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_writeTypeValue).call(this, CborMajorType.Tag, tag);
        return this;
    }
    encodeAsHex() {
        return __classPrivateFieldGet(this, _CborWriter_buffer, "f").toString('hex');
    }
    encode() {
        return new Uint8Array(__classPrivateFieldGet(this, _CborWriter_buffer, "f"));
    }
    reset() {
        __classPrivateFieldSet(this, _CborWriter_buffer, Buffer.from([]), "f");
    }
}
_CborWriter_buffer = new WeakMap(), _CborWriter_instances = new WeakSet(), _CborWriter_writeTypeValue = function _CborWriter_writeTypeValue(majorType, value) {
    const m = majorType << 5;
    if (value < 24) {
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, m | Number(value));
    }
    else if (value < 256) {
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, m | ONE);
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, Number(value));
    }
    else if (value < 65536) {
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, m | TWO);
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt16).call(this, Number(value));
    }
    else if (value < 4294967296) {
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, m | FOUR);
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt32).call(this, Number(value));
    }
    else {
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt8).call(this, m | EIGHT);
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt32).call(this, Number(BigInt(value) / SHIFT32));
        __classPrivateFieldGet(this, _CborWriter_instances, "m", _CborWriter_pushUInt32).call(this, Number(BigInt(value) % SHIFT32));
    }
}, _CborWriter_pushUInt8 = function _CborWriter_pushUInt8(value) {
    const b = Buffer.allocUnsafe(1);
    b.writeUInt8(value, 0);
    __classPrivateFieldSet(this, _CborWriter_buffer, Buffer.concat([__classPrivateFieldGet(this, _CborWriter_buffer, "f"), b]), "f");
}, _CborWriter_pushUInt16 = function _CborWriter_pushUInt16(value) {
    const b = Buffer.allocUnsafe(2);
    b.writeUInt16BE(value, 0);
    __classPrivateFieldSet(this, _CborWriter_buffer, Buffer.concat([__classPrivateFieldGet(this, _CborWriter_buffer, "f"), b]), "f");
}, _CborWriter_pushUInt32 = function _CborWriter_pushUInt32(value) {
    const b = Buffer.allocUnsafe(4);
    b.writeUInt32BE(value, 0);
    __classPrivateFieldSet(this, _CborWriter_buffer, Buffer.concat([__classPrivateFieldGet(this, _CborWriter_buffer, "f"), b]), "f");
};
