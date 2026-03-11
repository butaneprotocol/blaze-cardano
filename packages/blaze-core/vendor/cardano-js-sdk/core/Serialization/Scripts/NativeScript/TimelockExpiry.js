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
var _TimelockExpiry_slot, _TimelockExpiry_originalBytes;
import { CborReader, CborWriter } from '../../CBOR/index.js';
import { InvalidArgumentError } from "../../../../deps/util.js";
import { NativeScriptKind, ScriptType } from '../../../Cardano/types/Script.js';
import { Slot } from '../../../Cardano/types/Block.js';
const EMBEDDED_GROUP_SIZE = 2;
export class TimelockExpiry {
    constructor(slot) {
        _TimelockExpiry_slot.set(this, void 0);
        _TimelockExpiry_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _TimelockExpiry_slot, slot, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _TimelockExpiry_originalBytes, "f"))
            return __classPrivateFieldGet(this, _TimelockExpiry_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(NativeScriptKind.RequireTimeBefore);
        writer.writeInt(__classPrivateFieldGet(this, _TimelockExpiry_slot, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of two elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== NativeScriptKind.RequireTimeBefore)
            throw new InvalidArgumentError('cbor', `Expected kind ${NativeScriptKind.RequireTimeBefore}, but got kind ${kind}`);
        const slot = Slot(Number(reader.readInt()));
        const script = new TimelockExpiry(slot);
        __classPrivateFieldSet(script, _TimelockExpiry_originalBytes, cbor, "f");
        return script;
    }
    toCore() {
        return {
            __type: ScriptType.Native,
            kind: NativeScriptKind.RequireTimeBefore,
            slot: __classPrivateFieldGet(this, _TimelockExpiry_slot, "f")
        };
    }
    static fromCore(script) {
        return new TimelockExpiry(script.slot);
    }
    slot() {
        return __classPrivateFieldGet(this, _TimelockExpiry_slot, "f");
    }
    setSlot(slot) {
        __classPrivateFieldSet(this, _TimelockExpiry_slot, slot, "f");
        __classPrivateFieldSet(this, _TimelockExpiry_originalBytes, undefined, "f");
    }
}
_TimelockExpiry_slot = new WeakMap(), _TimelockExpiry_originalBytes = new WeakMap();
