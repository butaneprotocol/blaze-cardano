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
var _ScriptNOfK_nativeScripts, _ScriptNOfK_required, _ScriptNOfK_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from "../../../../deps/util.js";
import { NativeScript } from './NativeScript.js';
import { NativeScriptKind, ScriptType } from '../../../Cardano/types/Script.js';
const EMBEDDED_GROUP_SIZE = 3;
export class ScriptNOfK {
    constructor(nativeScripts, required) {
        _ScriptNOfK_nativeScripts.set(this, void 0);
        _ScriptNOfK_required.set(this, void 0);
        _ScriptNOfK_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _ScriptNOfK_nativeScripts, nativeScripts, "f");
        __classPrivateFieldSet(this, _ScriptNOfK_required, required, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _ScriptNOfK_originalBytes, "f"))
            return __classPrivateFieldGet(this, _ScriptNOfK_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(NativeScriptKind.RequireNOf);
        writer.writeInt(__classPrivateFieldGet(this, _ScriptNOfK_required, "f"));
        writer.writeStartArray(__classPrivateFieldGet(this, _ScriptNOfK_nativeScripts, "f").length);
        for (const nativeScript of __classPrivateFieldGet(this, _ScriptNOfK_nativeScripts, "f"))
            writer.writeEncodedValue(Buffer.from(nativeScript.toCbor(), 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of two elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== NativeScriptKind.RequireNOf)
            throw new InvalidArgumentError('cbor', `Expected kind ${NativeScriptKind.RequireNOf}, but got kind ${kind}`);
        const required = reader.readInt();
        const scripts = new Array();
        reader.readStartArray();
        while (reader.peekState() !== CborReaderState.EndArray)
            scripts.push(NativeScript.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
        reader.readEndArray();
        const script = new ScriptNOfK(scripts, Number(required));
        __classPrivateFieldSet(script, _ScriptNOfK_originalBytes, cbor, "f");
        return script;
    }
    toCore() {
        return {
            __type: ScriptType.Native,
            kind: NativeScriptKind.RequireNOf,
            required: __classPrivateFieldGet(this, _ScriptNOfK_required, "f"),
            scripts: __classPrivateFieldGet(this, _ScriptNOfK_nativeScripts, "f").map((script) => script.toCore())
        };
    }
    static fromCore(script) {
        return new ScriptNOfK(script.scripts.map((nativeScript) => NativeScript.fromCore(nativeScript)), script.required);
    }
    required() {
        return __classPrivateFieldGet(this, _ScriptNOfK_required, "f");
    }
    setRequired(required) {
        __classPrivateFieldSet(this, _ScriptNOfK_required, required, "f");
        __classPrivateFieldSet(this, _ScriptNOfK_originalBytes, undefined, "f");
    }
    nativeScripts() {
        return __classPrivateFieldGet(this, _ScriptNOfK_nativeScripts, "f");
    }
    setNativeScripts(nativeScripts) {
        __classPrivateFieldSet(this, _ScriptNOfK_nativeScripts, nativeScripts, "f");
        __classPrivateFieldSet(this, _ScriptNOfK_originalBytes, undefined, "f");
    }
}
_ScriptNOfK_nativeScripts = new WeakMap(), _ScriptNOfK_required = new WeakMap(), _ScriptNOfK_originalBytes = new WeakMap();
