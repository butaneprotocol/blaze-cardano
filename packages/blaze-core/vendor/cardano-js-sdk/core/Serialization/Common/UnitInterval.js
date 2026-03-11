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
var _UnitInterval_numerator, _UnitInterval_denominator, _UnitInterval_originalBytes;
import { CborReader, CborTag, CborWriter } from '../CBOR/index.js';
import { InvalidArgumentError } from '@cardano-sdk/util';
import Fraction from 'fraction.js';
const UNIT_INTERVAL_ARRAY_SIZE = 2;
export class UnitInterval {
    constructor(numerator, denominator) {
        _UnitInterval_numerator.set(this, void 0);
        _UnitInterval_denominator.set(this, void 0);
        _UnitInterval_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _UnitInterval_numerator, numerator, "f");
        __classPrivateFieldSet(this, _UnitInterval_denominator, denominator, "f");
    }
    static fromFloat(number) {
        if (number === undefined)
            return undefined;
        const fraction = new Fraction(number);
        return new UnitInterval(BigInt(fraction.n), BigInt(fraction.d));
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _UnitInterval_originalBytes, "f"))
            return __classPrivateFieldGet(this, _UnitInterval_originalBytes, "f");
        writer.writeTag(CborTag.RationalNumber);
        writer.writeStartArray(UNIT_INTERVAL_ARRAY_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _UnitInterval_numerator, "f"));
        writer.writeInt(__classPrivateFieldGet(this, _UnitInterval_denominator, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        if (reader.readTag() !== CborTag.RationalNumber)
            throw new InvalidArgumentError('cbor', `Expected tag ${CborTag.RationalNumber}, but got ${reader.peekTag()}`);
        const length = reader.readStartArray();
        if (length !== UNIT_INTERVAL_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${UNIT_INTERVAL_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const numerator = reader.readInt();
        const denominator = reader.readInt();
        reader.readEndArray();
        const unitInterval = new UnitInterval(numerator, denominator);
        __classPrivateFieldSet(unitInterval, _UnitInterval_originalBytes, cbor, "f");
        return unitInterval;
    }
    toCore() {
        return {
            denominator: Number(__classPrivateFieldGet(this, _UnitInterval_denominator, "f")),
            numerator: Number(__classPrivateFieldGet(this, _UnitInterval_numerator, "f"))
        };
    }
    static fromCore(fraction) {
        return new UnitInterval(BigInt(fraction.numerator), BigInt(fraction.denominator));
    }
    numerator() {
        return __classPrivateFieldGet(this, _UnitInterval_numerator, "f");
    }
    setNumerator(numerator) {
        __classPrivateFieldSet(this, _UnitInterval_numerator, numerator, "f");
        __classPrivateFieldSet(this, _UnitInterval_originalBytes, undefined, "f");
    }
    denominator() {
        return __classPrivateFieldGet(this, _UnitInterval_denominator, "f");
    }
    setDenominator(denominator) {
        __classPrivateFieldSet(this, _UnitInterval_denominator, denominator, "f");
        __classPrivateFieldSet(this, _UnitInterval_originalBytes, undefined, "f");
    }
    toFloat() {
        return Number(__classPrivateFieldGet(this, _UnitInterval_numerator, "f")) / Number(__classPrivateFieldGet(this, _UnitInterval_denominator, "f"));
    }
}
_UnitInterval_numerator = new WeakMap(), _UnitInterval_denominator = new WeakMap(), _UnitInterval_originalBytes = new WeakMap();
