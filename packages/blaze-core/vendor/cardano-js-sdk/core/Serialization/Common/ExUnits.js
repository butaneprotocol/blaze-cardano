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
var _ExUnits_mem, _ExUnits_steps, _ExUnits_originalBytes;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { InvalidArgumentError } from "../../../deps/util.js";
const EX_UNITS_ARRAY_SIZE = 2;
export class ExUnits {
    constructor(mem, steps) {
        _ExUnits_mem.set(this, void 0);
        _ExUnits_steps.set(this, void 0);
        _ExUnits_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _ExUnits_mem, mem, "f");
        __classPrivateFieldSet(this, _ExUnits_steps, steps, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _ExUnits_originalBytes, "f"))
            return __classPrivateFieldGet(this, _ExUnits_originalBytes, "f");
        writer.writeStartArray(EX_UNITS_ARRAY_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _ExUnits_mem, "f"));
        writer.writeInt(__classPrivateFieldGet(this, _ExUnits_steps, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EX_UNITS_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EX_UNITS_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const mem = reader.readUInt();
        const steps = reader.readUInt();
        reader.readEndArray();
        const exUnit = new ExUnits(mem, steps);
        __classPrivateFieldSet(exUnit, _ExUnits_originalBytes, cbor, "f");
        return exUnit;
    }
    toCore() {
        return {
            memory: Number(__classPrivateFieldGet(this, _ExUnits_mem, "f")),
            steps: Number(__classPrivateFieldGet(this, _ExUnits_steps, "f"))
        };
    }
    static fromCore(exUnits) {
        return new ExUnits(BigInt(exUnits.memory), BigInt(exUnits.steps));
    }
    mem() {
        return __classPrivateFieldGet(this, _ExUnits_mem, "f");
    }
    setMem(mem) {
        __classPrivateFieldSet(this, _ExUnits_mem, mem, "f");
        __classPrivateFieldSet(this, _ExUnits_originalBytes, undefined, "f");
    }
    steps() {
        return __classPrivateFieldGet(this, _ExUnits_steps, "f");
    }
    setSteps(steps) {
        __classPrivateFieldSet(this, _ExUnits_steps, steps, "f");
        __classPrivateFieldSet(this, _ExUnits_originalBytes, undefined, "f");
    }
    add(other) {
        const mem = __classPrivateFieldGet(this, _ExUnits_mem, "f") + __classPrivateFieldGet(other, _ExUnits_mem, "f");
        const steps = __classPrivateFieldGet(this, _ExUnits_steps, "f") + __classPrivateFieldGet(other, _ExUnits_steps, "f");
        return new ExUnits(mem, steps);
    }
}
_ExUnits_mem = new WeakMap(), _ExUnits_steps = new WeakMap(), _ExUnits_originalBytes = new WeakMap();
