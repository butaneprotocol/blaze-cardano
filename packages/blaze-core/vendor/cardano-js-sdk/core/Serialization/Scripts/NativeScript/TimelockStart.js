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
var _TimelockStart_slot, _TimelockStart_originalBytes;
import { CborReader, CborWriter } from '../../CBOR/index.js';
import { InvalidArgumentError } from "../../../../deps/util.js";
import { NativeScriptKind, ScriptType } from '../../../Cardano/types/Script.js';
import { Slot } from '../../../Cardano/types/Block.js';
const EMBEDDED_GROUP_SIZE = 2;
export class TimelockStart {
    constructor(slot) {
        _TimelockStart_slot.set(this, void 0);
        _TimelockStart_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _TimelockStart_slot, slot, "f");
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _TimelockStart_originalBytes, "f"))
            return __classPrivateFieldGet(this, _TimelockStart_originalBytes, "f");
        const writer = new CborWriter();
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(NativeScriptKind.RequireTimeAfter);
        writer.writeInt(__classPrivateFieldGet(this, _TimelockStart_slot, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of two elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== NativeScriptKind.RequireTimeAfter)
            throw new InvalidArgumentError('cbor', `Expected kind ${NativeScriptKind.RequireTimeAfter}, but got kind ${kind}`);
        const slot = Slot(Number(reader.readInt()));
        const script = new TimelockStart(slot);
        __classPrivateFieldSet(script, _TimelockStart_originalBytes, cbor, "f");
        return script;
    }
    toCore() {
        return {
            __type: ScriptType.Native,
            kind: NativeScriptKind.RequireTimeAfter,
            slot: __classPrivateFieldGet(this, _TimelockStart_slot, "f")
        };
    }
    static fromCore(script) {
        return new TimelockStart(script.slot);
    }
    slot() {
        return __classPrivateFieldGet(this, _TimelockStart_slot, "f");
    }
    setSlot(slot) {
        __classPrivateFieldSet(this, _TimelockStart_slot, slot, "f");
        __classPrivateFieldSet(this, _TimelockStart_originalBytes, undefined, "f");
    }
}
_TimelockStart_slot = new WeakMap(), _TimelockStart_originalBytes = new WeakMap();
