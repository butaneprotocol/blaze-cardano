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
var _CborReader_instances, _a, _CborReader_data, _CborReader_offset, _CborReader_nestedItems, _CborReader_isTagContext, _CborReader_currentFrame, _CborReader_cachedState, _CborReader_peekInitialByte, _CborReader_peekNextInitialByte, _CborReader_validateNextByteIsBreakByte, _CborReader_pushDataItem, _CborReader_popDataItem, _CborReader_restoreStackFrame, _CborReader_getRemainingBytes, _CborReader_advanceDataItemCounters, _CborReader_advanceBuffer, _CborReader_ensureReadCapacity, _CborReader_peekStateCore, _CborReader_peekDefiniteLength, _CborReader_peekUnsignedInteger, _CborReader_peekSignedInteger, _CborReader_readIndefiniteLengthByteStringConcatenated, _CborReader_peekTagCore, _CborReader_decodeUnsignedInteger, _CborReader_skipNextNode;
import { CborAdditionalInfo } from './CborAdditionalInfo.js';
import { CborContentException, CborInvalidOperationException } from './errors.js';
import { CborInitialByte } from './CborInitialByte.js';
import { CborMajorType } from './CborMajorType.js';
import { CborReaderState } from './CborReaderState.js';
import { decodeHalf } from './Half.js';
const UNEXPECTED_END_OF_BUFFER_MSG = 'Unexpected end of buffer';
export class CborReader {
    constructor(data) {
        _CborReader_instances.add(this);
        _CborReader_data.set(this, void 0);
        _CborReader_offset.set(this, 0);
        _CborReader_nestedItems.set(this, new Array());
        _CborReader_isTagContext.set(this, false);
        _CborReader_currentFrame.set(this, void 0);
        _CborReader_cachedState.set(this, CborReaderState.Undefined);
        __classPrivateFieldSet(this, _CborReader_data, new Uint8Array(Buffer.from(data, 'hex')), "f");
        __classPrivateFieldSet(this, _CborReader_currentFrame, {
            currentKeyOffset: null,
            frameOffset: 0,
            itemsRead: 0,
            type: null
        }, "f");
    }
    peekState() {
        if (__classPrivateFieldGet(this, _CborReader_cachedState, "f") === CborReaderState.Undefined)
            __classPrivateFieldSet(this, _CborReader_cachedState, __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekStateCore).call(this), "f");
        return __classPrivateFieldGet(this, _CborReader_cachedState, "f");
    }
    getBytesRemaining() {
        return __classPrivateFieldGet(this, _CborReader_data, "f").length - __classPrivateFieldGet(this, _CborReader_offset, "f");
    }
    skipValue() {
        this.readEncodedValue();
    }
    readEncodedValue() {
        const initialOffset = __classPrivateFieldGet(this, _CborReader_offset, "f");
        let depth = 0;
        do {
            depth = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_skipNextNode).call(this, depth);
        } while (depth > 0);
        return __classPrivateFieldGet(this, _CborReader_data, "f").slice(initialOffset, __classPrivateFieldGet(this, _CborReader_offset, "f"));
    }
    readStartArray() {
        const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.Array);
        if (header.getAdditionalInfo() === CborAdditionalInfo.IndefiniteLength) {
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 1);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_pushDataItem).call(this, CborMajorType.Array);
            return null;
        }
        const buffer = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_getRemainingBytes).call(this);
        const { length, bytesRead } = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_peekDefiniteLength).call(CborReader, header, buffer);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, bytesRead);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_pushDataItem).call(this, CborMajorType.Array, length);
        return length;
    }
    readEndArray() {
        if (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength === undefined) {
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_validateNextByteIsBreakByte).call(this);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_popDataItem).call(this, CborMajorType.Array);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 1);
        }
        else {
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_popDataItem).call(this, CborMajorType.Array);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
        }
    }
    readInt() {
        const value = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekSignedInteger).call(this);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, value.bytesRead);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
        return value.signedInt;
    }
    readUInt() {
        const value = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekUnsignedInteger).call(this);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, value.bytesRead);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
        return value.unsignedInt;
    }
    readDouble() {
        const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.Simple);
        let result;
        const remainingBytes = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_getRemainingBytes).call(this);
        switch (header.getAdditionalInfo()) {
            case CborAdditionalInfo.Additional16BitData: {
                __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_ensureReadCapacity).call(this, 3);
                result = decodeHalf(remainingBytes.slice(1));
                __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 3);
                __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
                return result;
            }
            case CborAdditionalInfo.Additional32BitData: {
                __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_ensureReadCapacity).call(this, 5);
                result = Buffer.from(remainingBytes).readFloatBE(1);
                __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 5);
                __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
                return result;
            }
            case CborAdditionalInfo.Additional64BitData: {
                __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_ensureReadCapacity).call(this, 9);
                result = Buffer.from(remainingBytes).readDoubleBE(1);
                __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 9);
                __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
                return result;
            }
            default:
                throw new CborInvalidOperationException('Not a float encoding');
        }
    }
    readSimpleValue() {
        const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.Simple);
        if ((header.getInitialByte() & CborInitialByte.AdditionalInformationMask) < CborAdditionalInfo.Additional8BitData) {
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 1);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
            return header.getAdditionalInfo().valueOf();
        }
        if (header.getAdditionalInfo() === CborAdditionalInfo.Additional8BitData) {
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_ensureReadCapacity).call(this, 2);
            const value = __classPrivateFieldGet(this, _CborReader_data, "f")[__classPrivateFieldGet(this, _CborReader_offset, "f") + 1];
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 2);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
            return value;
        }
        throw new CborInvalidOperationException('Not a simple value encoding');
    }
    readCborNegativeIntegerRepresentation() {
        const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.NegativeInteger);
        const value = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_decodeUnsignedInteger).call(CborReader, header, __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_getRemainingBytes).call(this));
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, value.bytesRead);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
        return value.unsignedInt;
    }
    readStartMap() {
        let length = null;
        const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.Map);
        if (header.getAdditionalInfo() === CborAdditionalInfo.IndefiniteLength) {
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 1);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_pushDataItem).call(this, CborMajorType.Map);
            length = null;
        }
        else {
            const buffer = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_getRemainingBytes).call(this);
            const result = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_peekDefiniteLength).call(CborReader, header, buffer);
            if (2 * result.length > buffer.length - result.bytesRead)
                throw new CborContentException('Definite length exceeds buffer size');
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, result.bytesRead);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_pushDataItem).call(this, CborMajorType.Map, 2 * result.length);
            length = result.length;
        }
        __classPrivateFieldGet(this, _CborReader_currentFrame, "f").currentKeyOffset = __classPrivateFieldGet(this, _CborReader_offset, "f");
        return length;
    }
    readEndMap() {
        if (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength === undefined) {
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_validateNextByteIsBreakByte).call(this);
            if (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").itemsRead % 2 !== 0)
                throw new CborContentException('Key missing value');
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_popDataItem).call(this, CborMajorType.Map);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 1);
        }
        else {
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_popDataItem).call(this, CborMajorType.Map);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
        }
    }
    readBoolean() {
        const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.Simple);
        const val = header.getAdditionalInfo();
        if (val !== CborAdditionalInfo.AdditionalTrue && val !== CborAdditionalInfo.AdditionalFalse)
            throw new CborContentException('Not a boolean encoding');
        const result = val === CborAdditionalInfo.AdditionalTrue;
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 1);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
        return result;
    }
    readNull() {
        const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.Simple);
        const val = header.getAdditionalInfo();
        if (val !== CborAdditionalInfo.AdditionalNull)
            throw new CborContentException('Not a null encoding');
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 1);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
    }
    readStartIndefiniteLengthByteString() {
        const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.ByteString);
        if (header.getAdditionalInfo() !== CborAdditionalInfo.IndefiniteLength)
            throw new CborInvalidOperationException('Not indefinite length string');
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 1);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_pushDataItem).call(this, CborMajorType.ByteString);
    }
    readEndIndefiniteLengthByteString() {
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_validateNextByteIsBreakByte).call(this);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_popDataItem).call(this, CborMajorType.ByteString);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 1);
    }
    readByteString() {
        const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.ByteString);
        if (header.getAdditionalInfo() === CborAdditionalInfo.IndefiniteLength) {
            const { val, encodingLength } = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_readIndefiniteLengthByteStringConcatenated).call(this, CborMajorType.ByteString);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, encodingLength);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
            return val;
        }
        const buffer = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_getRemainingBytes).call(this);
        const { length, bytesRead } = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_peekDefiniteLength).call(CborReader, header, buffer);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_ensureReadCapacity).call(this, bytesRead + length);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, bytesRead + length);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
        return buffer.slice(bytesRead, bytesRead + length);
    }
    readDefiniteLengthByteString() {
        const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.ByteString);
        if (header.getAdditionalInfo() === CborAdditionalInfo.IndefiniteLength) {
            throw new CborInvalidOperationException('Expected definite length array and got indefinite length');
        }
        const buffer = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_getRemainingBytes).call(this);
        const { length, bytesRead } = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_peekDefiniteLength).call(CborReader, header, buffer);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_ensureReadCapacity).call(this, bytesRead + length);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, bytesRead + length);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
        return buffer.slice(bytesRead, bytesRead + length);
    }
    readStartIndefiniteLengthTextString() {
        const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.Utf8String);
        if (header.getAdditionalInfo() !== CborAdditionalInfo.IndefiniteLength)
            throw new CborInvalidOperationException('Not indefinite length string');
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 1);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_pushDataItem).call(this, CborMajorType.Utf8String);
    }
    readEndIndefiniteLengthTextString() {
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_validateNextByteIsBreakByte).call(this);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_popDataItem).call(this, CborMajorType.Utf8String);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, 1);
    }
    readTextString() {
        const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.Utf8String);
        if (header.getAdditionalInfo() === CborAdditionalInfo.IndefiniteLength) {
            const { val, encodingLength } = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_readIndefiniteLengthByteStringConcatenated).call(this, CborMajorType.Utf8String);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, encodingLength);
            __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
            return Buffer.from(val).toString('utf8');
        }
        const buffer = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_getRemainingBytes).call(this);
        const { length, bytesRead } = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_peekDefiniteLength).call(CborReader, header, buffer);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_ensureReadCapacity).call(this, bytesRead + length);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, bytesRead + length);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
        return Buffer.from(buffer.slice(bytesRead, bytesRead + length)).toString('utf8');
    }
    readDefiniteLengthTextString() {
        const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.Utf8String);
        if (header.getAdditionalInfo() === CborAdditionalInfo.IndefiniteLength) {
            throw new CborInvalidOperationException('Expected definite length string and got indefinite length');
        }
        const buffer = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_getRemainingBytes).call(this);
        const { length, bytesRead } = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_peekDefiniteLength).call(CborReader, header, buffer);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_ensureReadCapacity).call(this, bytesRead + length);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, bytesRead + length);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceDataItemCounters).call(this);
        return Buffer.from(buffer.slice(bytesRead, bytesRead + length)).toString('utf8');
    }
    readTag() {
        const { tag, bytesRead } = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekTagCore).call(this);
        __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_advanceBuffer).call(this, bytesRead);
        __classPrivateFieldSet(this, _CborReader_isTagContext, true, "f");
        return tag;
    }
    peekTag() {
        const { tag } = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekTagCore).call(this);
        return tag;
    }
    static ensureReadCapacityInArray(data, bytesToRead) {
        if (data.length < bytesToRead) {
            throw new CborContentException(UNEXPECTED_END_OF_BUFFER_MSG);
        }
    }
    static mapSimpleValueDataToReaderState(value) {
        switch (value) {
            case CborAdditionalInfo.AdditionalNull:
                return CborReaderState.Null;
            case CborAdditionalInfo.AdditionalFalse:
            case CborAdditionalInfo.AdditionalTrue:
                return CborReaderState.Boolean;
            case CborAdditionalInfo.Additional16BitData:
                return CborReaderState.HalfPrecisionFloat;
            case CborAdditionalInfo.Additional32BitData:
                return CborReaderState.SinglePrecisionFloat;
            case CborAdditionalInfo.Additional64BitData:
                return CborReaderState.DoublePrecisionFloat;
            default:
                return CborReaderState.SimpleValue;
        }
    }
}
_a = CborReader, _CborReader_data = new WeakMap(), _CborReader_offset = new WeakMap(), _CborReader_nestedItems = new WeakMap(), _CborReader_isTagContext = new WeakMap(), _CborReader_currentFrame = new WeakMap(), _CborReader_cachedState = new WeakMap(), _CborReader_instances = new WeakSet(), _CborReader_peekInitialByte = function _CborReader_peekInitialByte(expectedType) {
    if (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength !== undefined &&
        __classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength - __classPrivateFieldGet(this, _CborReader_currentFrame, "f").itemsRead === 0)
        throw new CborInvalidOperationException('No more data items to read');
    if (__classPrivateFieldGet(this, _CborReader_offset, "f") === __classPrivateFieldGet(this, _CborReader_data, "f").length) {
        if (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").type === null && __classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength === undefined && __classPrivateFieldGet(this, _CborReader_offset, "f") > 0)
            throw new CborInvalidOperationException('End of root-level. No more data items to read');
        throw new CborContentException(UNEXPECTED_END_OF_BUFFER_MSG);
    }
    const nextByte = CborInitialByte.from(__classPrivateFieldGet(this, _CborReader_data, "f")[__classPrivateFieldGet(this, _CborReader_offset, "f")]);
    switch (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").type) {
        case CborMajorType.ByteString:
        case CborMajorType.Utf8String:
            if (nextByte.getInitialByte() === CborInitialByte.IndefiniteLengthBreakByte ||
                (nextByte.getMajorType() === __classPrivateFieldGet(this, _CborReader_currentFrame, "f").type &&
                    nextByte.getAdditionalInfo() !== CborAdditionalInfo.IndefiniteLength)) {
                break;
            }
            throw new CborContentException(`Indefinite length string contains invalid data item, ${nextByte.getMajorType()}`);
    }
    if (expectedType && expectedType !== nextByte.getMajorType())
        throw new CborInvalidOperationException(`Major type mismatch, expected type ${expectedType} but got ${nextByte.getMajorType()}`);
    return nextByte;
}, _CborReader_peekNextInitialByte = function _CborReader_peekNextInitialByte(buffer, expectedType) {
    CborReader.ensureReadCapacityInArray(buffer, 1);
    const header = CborInitialByte.from(buffer[0]);
    if (header.getInitialByte() !== CborInitialByte.IndefiniteLengthBreakByte && header.getMajorType() !== expectedType)
        throw new CborContentException('Indefinite length string contains invalid data item');
    return header;
}, _CborReader_validateNextByteIsBreakByte = function _CborReader_validateNextByteIsBreakByte() {
    const result = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this);
    if (result.getInitialByte() !== CborInitialByte.IndefiniteLengthBreakByte)
        throw new CborInvalidOperationException('Not at end of indefinite length data item');
}, _CborReader_pushDataItem = function _CborReader_pushDataItem(majorType, definiteLength) {
    const frame = {
        currentKeyOffset: __classPrivateFieldGet(this, _CborReader_currentFrame, "f").currentKeyOffset,
        definiteLength: __classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength,
        frameOffset: __classPrivateFieldGet(this, _CborReader_currentFrame, "f").frameOffset,
        itemsRead: __classPrivateFieldGet(this, _CborReader_currentFrame, "f").itemsRead,
        type: __classPrivateFieldGet(this, _CborReader_currentFrame, "f").type
    };
    __classPrivateFieldGet(this, _CborReader_nestedItems, "f").push(frame);
    __classPrivateFieldGet(this, _CborReader_currentFrame, "f").type = majorType;
    __classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength = definiteLength;
    __classPrivateFieldGet(this, _CborReader_currentFrame, "f").itemsRead = 0;
    __classPrivateFieldGet(this, _CborReader_currentFrame, "f").frameOffset = __classPrivateFieldGet(this, _CborReader_offset, "f");
    __classPrivateFieldSet(this, _CborReader_isTagContext, false, "f");
    __classPrivateFieldGet(this, _CborReader_currentFrame, "f").currentKeyOffset = null;
}, _CborReader_popDataItem = function _CborReader_popDataItem(expectedType) {
    if (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").type === null || __classPrivateFieldGet(this, _CborReader_nestedItems, "f").length <= 0)
        throw new CborInvalidOperationException('Is at root context');
    if (expectedType !== __classPrivateFieldGet(this, _CborReader_currentFrame, "f").type)
        throw new CborInvalidOperationException(`Pop major type mismatch, expected ${expectedType} but got ${__classPrivateFieldGet(this, _CborReader_currentFrame, "f").type}`);
    if (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength !== undefined &&
        __classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength - __classPrivateFieldGet(this, _CborReader_currentFrame, "f").itemsRead > 0)
        throw new CborInvalidOperationException('Not at end of definite length data item');
    if (__classPrivateFieldGet(this, _CborReader_isTagContext, "f"))
        throw new CborContentException('Tag not followed by value');
    const frame = __classPrivateFieldGet(this, _CborReader_nestedItems, "f").pop();
    __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_restoreStackFrame).call(this, frame);
}, _CborReader_restoreStackFrame = function _CborReader_restoreStackFrame(frame) {
    __classPrivateFieldGet(this, _CborReader_currentFrame, "f").type = frame.type;
    __classPrivateFieldGet(this, _CborReader_currentFrame, "f").frameOffset = frame.frameOffset;
    __classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength = frame.definiteLength;
    __classPrivateFieldGet(this, _CborReader_currentFrame, "f").itemsRead = frame.itemsRead;
    __classPrivateFieldGet(this, _CborReader_currentFrame, "f").currentKeyOffset = frame.currentKeyOffset;
    __classPrivateFieldSet(this, _CborReader_cachedState, CborReaderState.Undefined, "f");
}, _CborReader_getRemainingBytes = function _CborReader_getRemainingBytes() {
    return __classPrivateFieldGet(this, _CborReader_data, "f").slice(__classPrivateFieldGet(this, _CborReader_offset, "f"));
}, _CborReader_advanceDataItemCounters = function _CborReader_advanceDataItemCounters() {
    ++__classPrivateFieldGet(this, _CborReader_currentFrame, "f").itemsRead;
    __classPrivateFieldSet(this, _CborReader_isTagContext, false, "f");
}, _CborReader_advanceBuffer = function _CborReader_advanceBuffer(length) {
    if (__classPrivateFieldGet(this, _CborReader_offset, "f") + length > __classPrivateFieldGet(this, _CborReader_data, "f").length)
        throw new CborContentException('Buffer offset out of bounds');
    __classPrivateFieldSet(this, _CborReader_offset, __classPrivateFieldGet(this, _CborReader_offset, "f") + length, "f");
    __classPrivateFieldSet(this, _CborReader_cachedState, CborReaderState.Undefined, "f");
}, _CborReader_ensureReadCapacity = function _CborReader_ensureReadCapacity(bytesToRead) {
    if (__classPrivateFieldGet(this, _CborReader_data, "f").length - __classPrivateFieldGet(this, _CborReader_offset, "f") < bytesToRead) {
        throw new CborContentException(UNEXPECTED_END_OF_BUFFER_MSG);
    }
}, _CborReader_peekStateCore = function _CborReader_peekStateCore() {
    if (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength !== undefined &&
        __classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength - __classPrivateFieldGet(this, _CborReader_currentFrame, "f").itemsRead === 0) {
        if (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").type === null)
            return CborReaderState.Finished;
        switch (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").type) {
            case CborMajorType.Array:
                return CborReaderState.EndArray;
            case CborMajorType.Map:
                return CborReaderState.EndMap;
            default:
                throw new CborInvalidOperationException('Invalid CBOR major type pushed to stack.');
        }
    }
    if (__classPrivateFieldGet(this, _CborReader_offset, "f") === __classPrivateFieldGet(this, _CborReader_data, "f").length) {
        if (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").type === null && __classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength === undefined) {
            return CborReaderState.Finished;
        }
        throw new CborInvalidOperationException(UNEXPECTED_END_OF_BUFFER_MSG);
    }
    const initialByte = CborInitialByte.from(__classPrivateFieldGet(this, _CborReader_data, "f")[__classPrivateFieldGet(this, _CborReader_offset, "f")]);
    if (initialByte.getInitialByte() === CborInitialByte.IndefiniteLengthBreakByte) {
        if (__classPrivateFieldGet(this, _CborReader_isTagContext, "f")) {
            throw new CborContentException('Tag not followed by value');
        }
        if (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength === undefined) {
            switch (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").type) {
                case null:
                    throw new CborContentException('Unexpected break byte');
                case CborMajorType.ByteString:
                    return CborReaderState.EndIndefiniteLengthByteString;
                case CborMajorType.Utf8String:
                    return CborReaderState.EndIndefiniteLengthTextString;
                case CborMajorType.Array:
                    return CborReaderState.EndArray;
                case CborMajorType.Map: {
                    if (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").itemsRead % 2 === 0)
                        return CborReaderState.EndMap;
                    throw new CborContentException('Key missing value');
                }
                default:
                    throw new CborInvalidOperationException('Invalid CBOR major type pushed to stack.');
            }
        }
        else {
            throw new CborContentException('Unexpected break byte');
        }
    }
    if (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").type !== null && __classPrivateFieldGet(this, _CborReader_currentFrame, "f").definiteLength !== null) {
        switch (__classPrivateFieldGet(this, _CborReader_currentFrame, "f").type) {
            case CborMajorType.ByteString:
            case CborMajorType.Utf8String:
                if (initialByte.getMajorType() !== __classPrivateFieldGet(this, _CborReader_currentFrame, "f").type) {
                    throw new CborContentException('Indefinite length string contains invalid data item');
                }
                break;
        }
    }
    switch (initialByte.getMajorType()) {
        case CborMajorType.UnsignedInteger:
            return CborReaderState.UnsignedInteger;
        case CborMajorType.NegativeInteger:
            return CborReaderState.NegativeInteger;
        case CborMajorType.ByteString:
            return initialByte.getAdditionalInfo() === CborAdditionalInfo.IndefiniteLength
                ? CborReaderState.StartIndefiniteLengthByteString
                : CborReaderState.ByteString;
        case CborMajorType.Utf8String:
            return initialByte.getAdditionalInfo() === CborAdditionalInfo.IndefiniteLength
                ? CborReaderState.StartIndefiniteLengthTextString
                : CborReaderState.TextString;
        case CborMajorType.Array:
            return CborReaderState.StartArray;
        case CborMajorType.Map:
            return CborReaderState.StartMap;
        case CborMajorType.Tag:
            return CborReaderState.Tag;
        case CborMajorType.Simple:
            return CborReader.mapSimpleValueDataToReaderState(initialByte.getAdditionalInfo());
        default:
            throw new CborContentException('Invalid CBOR major type.');
    }
}, _CborReader_peekDefiniteLength = function _CborReader_peekDefiniteLength(header, data) {
    const { unsignedInt: length, bytesRead } = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_decodeUnsignedInteger).call(CborReader, header, data);
    return { bytesRead, length: Number(length) };
}, _CborReader_peekUnsignedInteger = function _CborReader_peekUnsignedInteger() {
    const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this);
    switch (header.getMajorType()) {
        case CborMajorType.UnsignedInteger: {
            return __classPrivateFieldGet(CborReader, _a, "m", _CborReader_decodeUnsignedInteger).call(CborReader, header, __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_getRemainingBytes).call(this));
        }
        case CborMajorType.NegativeInteger: {
            throw new CborContentException('Integer overflow');
        }
        default:
            throw new CborInvalidOperationException(`Reader type mismatch, expected ${CborMajorType.UnsignedInteger} but got ${header.getMajorType()}`);
    }
}, _CborReader_peekSignedInteger = function _CborReader_peekSignedInteger() {
    const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this);
    switch (header.getMajorType()) {
        case CborMajorType.UnsignedInteger: {
            const { unsignedInt: signedInt, bytesRead } = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_decodeUnsignedInteger).call(CborReader, header, __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_getRemainingBytes).call(this));
            return { bytesRead, signedInt: BigInt(signedInt) };
        }
        case CborMajorType.NegativeInteger: {
            const { unsignedInt, bytesRead } = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_decodeUnsignedInteger).call(CborReader, header, __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_getRemainingBytes).call(this));
            return { bytesRead, signedInt: BigInt(-1) - unsignedInt };
        }
        default:
            throw new CborInvalidOperationException(`Reader type mismatch, expected ${CborMajorType.UnsignedInteger} or ${CborMajorType.NegativeInteger} but got ${header.getMajorType()}`);
    }
}, _CborReader_readIndefiniteLengthByteStringConcatenated = function _CborReader_readIndefiniteLengthByteStringConcatenated(type) {
    const data = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_getRemainingBytes).call(this);
    let concat = Buffer.from([]);
    let encodingLength = 0;
    let i = 1;
    let nextInitialByte = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_peekNextInitialByte).call(CborReader, data.slice(i), type);
    while (nextInitialByte.getInitialByte() !== CborInitialByte.IndefiniteLengthBreakByte) {
        const { length: chunkLength, bytesRead } = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_peekDefiniteLength).call(CborReader, nextInitialByte, data.slice(i));
        const payloadSize = bytesRead + Number(chunkLength);
        concat = Buffer.concat([concat, data.slice(i + (payloadSize - chunkLength), i + payloadSize)]);
        i += payloadSize;
        nextInitialByte = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_peekNextInitialByte).call(CborReader, data.slice(i), type);
    }
    encodingLength = i + 1;
    return { encodingLength, val: new Uint8Array(concat) };
}, _CborReader_peekTagCore = function _CborReader_peekTagCore() {
    const header = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekInitialByte).call(this, CborMajorType.Tag);
    const { unsignedInt: result, bytesRead } = __classPrivateFieldGet(CborReader, _a, "m", _CborReader_decodeUnsignedInteger).call(CborReader, header, __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_getRemainingBytes).call(this));
    return { bytesRead, tag: Number(result) };
}, _CborReader_decodeUnsignedInteger = function _CborReader_decodeUnsignedInteger(header, data) {
    if ((header.getInitialByte() & CborInitialByte.AdditionalInformationMask) < CborAdditionalInfo.Additional8BitData)
        return { bytesRead: 1, unsignedInt: BigInt(header.getAdditionalInfo()) };
    switch (header.getAdditionalInfo()) {
        case CborAdditionalInfo.Additional8BitData: {
            CborReader.ensureReadCapacityInArray(data, 2);
            return { bytesRead: 2, unsignedInt: BigInt(data[1]) };
        }
        case CborAdditionalInfo.Additional16BitData: {
            CborReader.ensureReadCapacityInArray(data, 3);
            const buffer = Buffer.from(data.slice(1));
            const val = buffer.readUInt16BE();
            return { bytesRead: 3, unsignedInt: BigInt(val) };
        }
        case CborAdditionalInfo.Additional32BitData: {
            CborReader.ensureReadCapacityInArray(data, 5);
            const buffer = Buffer.from(data.slice(1));
            const val = buffer.readUInt32BE();
            return { bytesRead: 5, unsignedInt: BigInt(val) };
        }
        case CborAdditionalInfo.Additional64BitData: {
            CborReader.ensureReadCapacityInArray(data, 9);
            const buffer = Buffer.from(data.slice(1, 9));
            let result = BigInt(0);
            for (const element of buffer) {
                result = (result << BigInt(8)) + BigInt(element);
            }
            return { bytesRead: 9, unsignedInt: result };
        }
        default:
            throw new CborContentException('Invalid integer encoding');
    }
}, _CborReader_skipNextNode = function _CborReader_skipNextNode(initialDepth) {
    let state;
    let depth = initialDepth;
    while ((state = __classPrivateFieldGet(this, _CborReader_instances, "m", _CborReader_peekStateCore).call(this)) === CborReaderState.Tag)
        this.readTag();
    switch (state) {
        case CborReaderState.UnsignedInteger:
            this.readUInt();
            break;
        case CborReaderState.NegativeInteger:
            this.readCborNegativeIntegerRepresentation();
            break;
        case CborReaderState.ByteString:
            this.readByteString();
            break;
        case CborReaderState.TextString:
            this.readTextString();
            break;
        case CborReaderState.StartIndefiniteLengthByteString:
            this.readStartIndefiniteLengthByteString();
            depth++;
            break;
        case CborReaderState.EndIndefiniteLengthByteString:
            this.readEndIndefiniteLengthByteString();
            depth--;
            break;
        case CborReaderState.StartIndefiniteLengthTextString:
            this.readStartIndefiniteLengthTextString();
            depth++;
            break;
        case CborReaderState.EndIndefiniteLengthTextString:
            if (depth === 0)
                throw new CborInvalidOperationException(`Skip invalid state: ${state}`);
            this.readEndIndefiniteLengthTextString();
            depth--;
            break;
        case CborReaderState.StartArray:
            this.readStartArray();
            depth++;
            break;
        case CborReaderState.EndArray:
            if (depth === 0)
                throw new CborInvalidOperationException(`Skip invalid state: ${state}`);
            this.readEndArray();
            depth--;
            break;
        case CborReaderState.StartMap:
            this.readStartMap();
            depth++;
            break;
        case CborReaderState.EndMap:
            if (depth === 0)
                throw new CborInvalidOperationException(`Skip invalid state: ${state}`);
            this.readEndMap();
            depth--;
            break;
        case CborReaderState.HalfPrecisionFloat:
        case CborReaderState.SinglePrecisionFloat:
        case CborReaderState.DoublePrecisionFloat:
            this.readDouble();
            break;
        case CborReaderState.Null:
        case CborReaderState.Boolean:
        case CborReaderState.SimpleValue:
            this.readSimpleValue();
            break;
        default:
            throw new CborInvalidOperationException(`Skip invalid state: ${state}`);
    }
    return depth;
};
