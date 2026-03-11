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
var _NativeScript_scriptAll, _NativeScript_scriptAny, _NativeScript_scripNOfK, _NativeScript_scriptPubKey, _NativeScript_timelockExpiry, _NativeScript_timelockStart, _NativeScript_kind, _NativeScript_originalBytes;
import * as Crypto from '@cardano-sdk/crypto';
import { CborReader } from '../../CBOR/index.js';
import { InvalidStateError } from '@cardano-sdk/util';
import { NativeScriptKind } from '../../../Cardano/types/Script.js';
import { ScriptAll } from './ScriptAll.js';
import { ScriptAny } from './ScriptAny.js';
import { ScriptNOfK } from './ScriptNOfK.js';
import { ScriptPubkey } from './ScriptPubkey.js';
import { TimelockExpiry } from './TimelockExpiry.js';
import { TimelockStart } from './TimelockStart.js';
const HASH_LENGTH_IN_BYTES = 28;
export class NativeScript {
    constructor() {
        _NativeScript_scriptAll.set(this, void 0);
        _NativeScript_scriptAny.set(this, void 0);
        _NativeScript_scripNOfK.set(this, void 0);
        _NativeScript_scriptPubKey.set(this, void 0);
        _NativeScript_timelockExpiry.set(this, void 0);
        _NativeScript_timelockStart.set(this, void 0);
        _NativeScript_kind.set(this, void 0);
        _NativeScript_originalBytes.set(this, undefined);
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _NativeScript_originalBytes, "f"))
            return __classPrivateFieldGet(this, _NativeScript_originalBytes, "f");
        let cbor;
        switch (__classPrivateFieldGet(this, _NativeScript_kind, "f")) {
            case NativeScriptKind.RequireSignature:
                cbor = __classPrivateFieldGet(this, _NativeScript_scriptPubKey, "f").toCbor();
                break;
            case NativeScriptKind.RequireAllOf:
                cbor = __classPrivateFieldGet(this, _NativeScript_scriptAll, "f").toCbor();
                break;
            case NativeScriptKind.RequireAnyOf:
                cbor = __classPrivateFieldGet(this, _NativeScript_scriptAny, "f").toCbor();
                break;
            case NativeScriptKind.RequireNOf:
                cbor = __classPrivateFieldGet(this, _NativeScript_scripNOfK, "f").toCbor();
                break;
            case NativeScriptKind.RequireTimeAfter:
                cbor = __classPrivateFieldGet(this, _NativeScript_timelockStart, "f").toCbor();
                break;
            case NativeScriptKind.RequireTimeBefore:
                cbor = __classPrivateFieldGet(this, _NativeScript_timelockExpiry, "f").toCbor();
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${__classPrivateFieldGet(this, _NativeScript_kind, "f")}`);
        }
        return cbor;
    }
    static fromCbor(cbor) {
        let nativeScript;
        const reader = new CborReader(cbor);
        reader.readStartArray();
        const kind = Number(reader.readInt());
        switch (kind) {
            case NativeScriptKind.RequireSignature:
                nativeScript = NativeScript.newScriptPubkey(ScriptPubkey.fromCbor(cbor));
                break;
            case NativeScriptKind.RequireAllOf:
                nativeScript = NativeScript.newScriptAll(ScriptAll.fromCbor(cbor));
                break;
            case NativeScriptKind.RequireAnyOf:
                nativeScript = NativeScript.newScriptAny(ScriptAny.fromCbor(cbor));
                break;
            case NativeScriptKind.RequireNOf:
                nativeScript = NativeScript.newScriptNOfK(ScriptNOfK.fromCbor(cbor));
                break;
            case NativeScriptKind.RequireTimeAfter:
                nativeScript = NativeScript.newTimelockStart(TimelockStart.fromCbor(cbor));
                break;
            case NativeScriptKind.RequireTimeBefore:
                nativeScript = NativeScript.newTimelockExpiry(TimelockExpiry.fromCbor(cbor));
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${kind}`);
        }
        __classPrivateFieldSet(nativeScript, _NativeScript_originalBytes, cbor, "f");
        return nativeScript;
    }
    toCore() {
        let core;
        switch (__classPrivateFieldGet(this, _NativeScript_kind, "f")) {
            case NativeScriptKind.RequireSignature:
                core = __classPrivateFieldGet(this, _NativeScript_scriptPubKey, "f").toCore();
                break;
            case NativeScriptKind.RequireAllOf:
                core = __classPrivateFieldGet(this, _NativeScript_scriptAll, "f").toCore();
                break;
            case NativeScriptKind.RequireAnyOf:
                core = __classPrivateFieldGet(this, _NativeScript_scriptAny, "f").toCore();
                break;
            case NativeScriptKind.RequireNOf:
                core = __classPrivateFieldGet(this, _NativeScript_scripNOfK, "f").toCore();
                break;
            case NativeScriptKind.RequireTimeAfter:
                core = __classPrivateFieldGet(this, _NativeScript_timelockStart, "f").toCore();
                break;
            case NativeScriptKind.RequireTimeBefore:
                core = __classPrivateFieldGet(this, _NativeScript_timelockExpiry, "f").toCore();
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${__classPrivateFieldGet(this, _NativeScript_kind, "f")}`);
        }
        return core;
    }
    static fromCore(script) {
        let nativeScript;
        switch (script.kind) {
            case NativeScriptKind.RequireSignature:
                nativeScript = NativeScript.newScriptPubkey(ScriptPubkey.fromCore(script));
                break;
            case NativeScriptKind.RequireAllOf:
                nativeScript = NativeScript.newScriptAll(ScriptAll.fromCore(script));
                break;
            case NativeScriptKind.RequireAnyOf:
                nativeScript = NativeScript.newScriptAny(ScriptAny.fromCore(script));
                break;
            case NativeScriptKind.RequireNOf:
                nativeScript = NativeScript.newScriptNOfK(ScriptNOfK.fromCore(script));
                break;
            case NativeScriptKind.RequireTimeAfter:
                nativeScript = NativeScript.newTimelockStart(TimelockStart.fromCore(script));
                break;
            case NativeScriptKind.RequireTimeBefore:
                nativeScript = NativeScript.newTimelockExpiry(TimelockExpiry.fromCore(script));
                break;
            default:
                throw new InvalidStateError('Unexpected kind value');
        }
        return nativeScript;
    }
    hash() {
        const bytes = `00${this.toCbor()}`;
        return Crypto.blake2b.hash(bytes, HASH_LENGTH_IN_BYTES);
    }
    kind() {
        return __classPrivateFieldGet(this, _NativeScript_kind, "f");
    }
    static newScriptPubkey(scriptPubkey) {
        const script = new NativeScript();
        __classPrivateFieldSet(script, _NativeScript_scriptPubKey, scriptPubkey, "f");
        __classPrivateFieldSet(script, _NativeScript_kind, NativeScriptKind.RequireSignature, "f");
        return script;
    }
    static newScriptAll(scriptAll) {
        const script = new NativeScript();
        __classPrivateFieldSet(script, _NativeScript_scriptAll, scriptAll, "f");
        __classPrivateFieldSet(script, _NativeScript_kind, NativeScriptKind.RequireAllOf, "f");
        return script;
    }
    static newScriptAny(scriptAny) {
        const script = new NativeScript();
        __classPrivateFieldSet(script, _NativeScript_scriptAny, scriptAny, "f");
        __classPrivateFieldSet(script, _NativeScript_kind, NativeScriptKind.RequireAnyOf, "f");
        return script;
    }
    static newScriptNOfK(scriptNOfK) {
        const script = new NativeScript();
        __classPrivateFieldSet(script, _NativeScript_scripNOfK, scriptNOfK, "f");
        __classPrivateFieldSet(script, _NativeScript_kind, NativeScriptKind.RequireNOf, "f");
        return script;
    }
    static newTimelockStart(timelockStart) {
        const script = new NativeScript();
        __classPrivateFieldSet(script, _NativeScript_timelockStart, timelockStart, "f");
        __classPrivateFieldSet(script, _NativeScript_kind, NativeScriptKind.RequireTimeAfter, "f");
        return script;
    }
    static newTimelockExpiry(timelockExpiry) {
        const script = new NativeScript();
        __classPrivateFieldSet(script, _NativeScript_timelockExpiry, timelockExpiry, "f");
        __classPrivateFieldSet(script, _NativeScript_kind, NativeScriptKind.RequireTimeBefore, "f");
        return script;
    }
    asScriptPubkey() {
        return __classPrivateFieldGet(this, _NativeScript_scriptPubKey, "f");
    }
    asScriptAll() {
        return __classPrivateFieldGet(this, _NativeScript_scriptAll, "f");
    }
    asScriptAny() {
        return __classPrivateFieldGet(this, _NativeScript_scriptAny, "f");
    }
    asScriptNOfK() {
        return __classPrivateFieldGet(this, _NativeScript_scripNOfK, "f");
    }
    asTimelockStart() {
        return __classPrivateFieldGet(this, _NativeScript_timelockStart, "f");
    }
    asTimelockExpiry() {
        return __classPrivateFieldGet(this, _NativeScript_timelockExpiry, "f");
    }
}
_NativeScript_scriptAll = new WeakMap(), _NativeScript_scriptAny = new WeakMap(), _NativeScript_scripNOfK = new WeakMap(), _NativeScript_scriptPubKey = new WeakMap(), _NativeScript_timelockExpiry = new WeakMap(), _NativeScript_timelockStart = new WeakMap(), _NativeScript_kind = new WeakMap(), _NativeScript_originalBytes = new WeakMap();
