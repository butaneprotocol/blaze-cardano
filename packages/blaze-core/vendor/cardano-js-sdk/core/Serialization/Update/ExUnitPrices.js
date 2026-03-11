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
var _ExUnitPrices_memPrice, _ExUnitPrices_stepsPrice, _ExUnitPrices_originalBytes;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
import { UnitInterval } from '../Common/index.js';
import Fraction from 'fraction.js';
const EX_UNITS_PRICES_ARRAY_SIZE = 2;
export class ExUnitPrices {
    constructor(memPrices, stepsPrices) {
        _ExUnitPrices_memPrice.set(this, void 0);
        _ExUnitPrices_stepsPrice.set(this, void 0);
        _ExUnitPrices_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _ExUnitPrices_memPrice, memPrices, "f");
        __classPrivateFieldSet(this, _ExUnitPrices_stepsPrice, stepsPrices, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _ExUnitPrices_originalBytes, "f"))
            return __classPrivateFieldGet(this, _ExUnitPrices_originalBytes, "f");
        writer.writeStartArray(EX_UNITS_PRICES_ARRAY_SIZE);
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ExUnitPrices_memPrice, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ExUnitPrices_stepsPrice, "f").toCbor(), 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EX_UNITS_PRICES_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EX_UNITS_PRICES_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const memPrices = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const stepPrices = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        reader.readEndArray();
        const exUnit = new ExUnitPrices(memPrices, stepPrices);
        __classPrivateFieldSet(exUnit, _ExUnitPrices_originalBytes, cbor, "f");
        return exUnit;
    }
    toCore() {
        return {
            memory: Number(__classPrivateFieldGet(this, _ExUnitPrices_memPrice, "f").numerator()) / Number(__classPrivateFieldGet(this, _ExUnitPrices_memPrice, "f").denominator()),
            steps: Number(__classPrivateFieldGet(this, _ExUnitPrices_stepsPrice, "f").numerator()) / Number(__classPrivateFieldGet(this, _ExUnitPrices_stepsPrice, "f").denominator())
        };
    }
    static fromCore(prices) {
        const mem = new Fraction(prices.memory);
        const steps = new Fraction(prices.steps);
        return new ExUnitPrices(new UnitInterval(BigInt(mem.n), BigInt(mem.d)), new UnitInterval(BigInt(steps.n), BigInt(steps.d)));
    }
    memPrice() {
        return __classPrivateFieldGet(this, _ExUnitPrices_memPrice, "f");
    }
    setMemPrice(memPrice) {
        __classPrivateFieldSet(this, _ExUnitPrices_memPrice, memPrice, "f");
        __classPrivateFieldSet(this, _ExUnitPrices_originalBytes, undefined, "f");
    }
    stepsPrice() {
        return __classPrivateFieldGet(this, _ExUnitPrices_stepsPrice, "f");
    }
    setStepsPrice(stepsPrice) {
        __classPrivateFieldSet(this, _ExUnitPrices_stepsPrice, stepsPrice, "f");
        __classPrivateFieldSet(this, _ExUnitPrices_originalBytes, undefined, "f");
    }
}
_ExUnitPrices_memPrice = new WeakMap(), _ExUnitPrices_stepsPrice = new WeakMap(), _ExUnitPrices_originalBytes = new WeakMap();
