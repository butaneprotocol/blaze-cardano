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
var _ScriptAll_nativeScripts, _ScriptAll_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from "../../../../deps/util.js";
import { NativeScript } from './NativeScript.js';
import { NativeScriptKind, ScriptType } from '../../../Cardano/types/Script.js';
const EMBEDDED_GROUP_SIZE = 2;
export class ScriptAll {
    constructor(nativeScripts) {
        _ScriptAll_nativeScripts.set(this, void 0);
        _ScriptAll_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _ScriptAll_nativeScripts, nativeScripts, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _ScriptAll_originalBytes, "f"))
            return __classPrivateFieldGet(this, _ScriptAll_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(NativeScriptKind.RequireAllOf);
        writer.writeStartArray(__classPrivateFieldGet(this, _ScriptAll_nativeScripts, "f").length);
        for (const nativeScript of __classPrivateFieldGet(this, _ScriptAll_nativeScripts, "f"))
            writer.writeEncodedValue(Buffer.from(nativeScript.toCbor(), 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of two elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== NativeScriptKind.RequireAllOf)
            throw new InvalidArgumentError('cbor', `Expected kind ${NativeScriptKind.RequireAllOf}, but got kind ${kind}`);
        const scripts = new Array();
        reader.readStartArray();
        while (reader.peekState() !== CborReaderState.EndArray)
            scripts.push(NativeScript.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
        reader.readEndArray();
        const script = new ScriptAll(scripts);
        __classPrivateFieldSet(script, _ScriptAll_originalBytes, cbor, "f");
        return script;
    }
    toCore() {
        return {
            __type: ScriptType.Native,
            kind: NativeScriptKind.RequireAllOf,
            scripts: __classPrivateFieldGet(this, _ScriptAll_nativeScripts, "f").map((script) => script.toCore())
        };
    }
    static fromCore(script) {
        return new ScriptAll(script.scripts.map((nativeScript) => NativeScript.fromCore(nativeScript)));
    }
    nativeScripts() {
        return __classPrivateFieldGet(this, _ScriptAll_nativeScripts, "f");
    }
    setNativeScripts(nativeScripts) {
        __classPrivateFieldSet(this, _ScriptAll_nativeScripts, nativeScripts, "f");
        __classPrivateFieldSet(this, _ScriptAll_originalBytes, undefined, "f");
    }
}
_ScriptAll_nativeScripts = new WeakMap(), _ScriptAll_originalBytes = new WeakMap();
