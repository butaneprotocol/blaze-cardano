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
var _ScriptAny_nativeScripts, _ScriptAny_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { NativeScript } from './NativeScript.js';
import { NativeScriptKind, ScriptType } from '../../../Cardano/types/Script.js';
const EMBEDDED_GROUP_SIZE = 2;
export class ScriptAny {
    constructor(nativeScripts) {
        _ScriptAny_nativeScripts.set(this, void 0);
        _ScriptAny_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _ScriptAny_nativeScripts, nativeScripts, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _ScriptAny_originalBytes, "f"))
            return __classPrivateFieldGet(this, _ScriptAny_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(NativeScriptKind.RequireAnyOf);
        writer.writeStartArray(__classPrivateFieldGet(this, _ScriptAny_nativeScripts, "f").length);
        for (const nativeScript of __classPrivateFieldGet(this, _ScriptAny_nativeScripts, "f"))
            writer.writeEncodedValue(Buffer.from(nativeScript.toCbor(), 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of two elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== NativeScriptKind.RequireAnyOf)
            throw new InvalidArgumentError('cbor', `Expected kind ${NativeScriptKind.RequireAnyOf}, but got kind ${kind}`);
        const scripts = new Array();
        reader.readStartArray();
        while (reader.peekState() !== CborReaderState.EndArray)
            scripts.push(NativeScript.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
        reader.readEndArray();
        const script = new ScriptAny(scripts);
        __classPrivateFieldSet(script, _ScriptAny_originalBytes, cbor, "f");
        return script;
    }
    toCore() {
        return {
            __type: ScriptType.Native,
            kind: NativeScriptKind.RequireAnyOf,
            scripts: __classPrivateFieldGet(this, _ScriptAny_nativeScripts, "f").map((script) => script.toCore())
        };
    }
    static fromCore(script) {
        return new ScriptAny(script.scripts.map((nativeScript) => NativeScript.fromCore(nativeScript)));
    }
    nativeScripts() {
        return __classPrivateFieldGet(this, _ScriptAny_nativeScripts, "f");
    }
    setNativeScripts(nativeScripts) {
        __classPrivateFieldSet(this, _ScriptAny_nativeScripts, nativeScripts, "f");
        __classPrivateFieldSet(this, _ScriptAny_originalBytes, undefined, "f");
    }
}
_ScriptAny_nativeScripts = new WeakMap(), _ScriptAny_originalBytes = new WeakMap();
