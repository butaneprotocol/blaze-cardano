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
var _Script_nativeScript, _Script_plutusV1, _Script_plutusV2, _Script_plutusV3, _Script_language, _Script_originalBytes;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { HexBlob, InvalidStateError } from "../../../deps/util.js";
import { NativeScript } from './NativeScript/index.js';
import { PlutusLanguageVersion, isNativeScript } from '../../Cardano/types/Script.js';
import { PlutusV1Script, PlutusV2Script, PlutusV3Script } from './PlutusScript/index.js';
import { ScriptLanguage } from './ScriptLanguage.js';
const SCRIPT_SUBGROUP = 2;
export class Script {
    constructor() {
        _Script_nativeScript.set(this, void 0);
        _Script_plutusV1.set(this, void 0);
        _Script_plutusV2.set(this, void 0);
        _Script_plutusV3.set(this, void 0);
        _Script_language.set(this, void 0);
        _Script_originalBytes.set(this, undefined);
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _Script_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Script_originalBytes, "f");
        const writer = new CborWriter();
        let cbor;
        switch (__classPrivateFieldGet(this, _Script_language, "f")) {
            case ScriptLanguage.Native:
                cbor = __classPrivateFieldGet(this, _Script_nativeScript, "f").toCbor();
                break;
            case ScriptLanguage.PlutusV1:
                cbor = __classPrivateFieldGet(this, _Script_plutusV1, "f").toCbor();
                break;
            case ScriptLanguage.PlutusV2:
                cbor = __classPrivateFieldGet(this, _Script_plutusV2, "f").toCbor();
                break;
            case ScriptLanguage.PlutusV3:
                cbor = __classPrivateFieldGet(this, _Script_plutusV3, "f").toCbor();
                break;
            default:
                throw new InvalidStateError(`Unexpected language value: ${__classPrivateFieldGet(this, _Script_language, "f")}`);
        }
        writer.writeStartArray(SCRIPT_SUBGROUP);
        writer.writeInt(__classPrivateFieldGet(this, _Script_language, "f"));
        writer.writeEncodedValue(Buffer.from(cbor, 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        let script;
        const reader = new CborReader(cbor);
        reader.readStartArray();
        const language = Number(reader.readInt());
        const innerScript = HexBlob.fromBytes(reader.readEncodedValue());
        switch (language) {
            case ScriptLanguage.Native:
                script = Script.newNativeScript(NativeScript.fromCbor(innerScript));
                break;
            case ScriptLanguage.PlutusV1:
                script = Script.newPlutusV1Script(PlutusV1Script.fromCbor(innerScript));
                break;
            case ScriptLanguage.PlutusV2:
                script = Script.newPlutusV2Script(PlutusV2Script.fromCbor(innerScript));
                break;
            case ScriptLanguage.PlutusV3:
                script = Script.newPlutusV3Script(PlutusV3Script.fromCbor(innerScript));
                break;
            default:
                throw new InvalidStateError(`Unexpected language value: ${language}`);
        }
        __classPrivateFieldSet(script, _Script_originalBytes, cbor, "f");
        return script;
    }
    toCore() {
        let core;
        switch (__classPrivateFieldGet(this, _Script_language, "f")) {
            case ScriptLanguage.Native:
                core = __classPrivateFieldGet(this, _Script_nativeScript, "f").toCore();
                break;
            case ScriptLanguage.PlutusV1:
                core = __classPrivateFieldGet(this, _Script_plutusV1, "f").toCore();
                break;
            case ScriptLanguage.PlutusV2:
                core = __classPrivateFieldGet(this, _Script_plutusV2, "f").toCore();
                break;
            case ScriptLanguage.PlutusV3:
                core = __classPrivateFieldGet(this, _Script_plutusV3, "f").toCore();
                break;
            default:
                throw new InvalidStateError(`Unexpected language: ${__classPrivateFieldGet(this, _Script_language, "f")}`);
        }
        return core;
    }
    static fromCore(coreScript) {
        let script;
        if (isNativeScript(coreScript)) {
            script = Script.newNativeScript(NativeScript.fromCore(coreScript));
        }
        else {
            switch (coreScript.version) {
                case PlutusLanguageVersion.V1:
                    script = Script.newPlutusV1Script(PlutusV1Script.fromCore(coreScript));
                    break;
                case PlutusLanguageVersion.V2:
                    script = Script.newPlutusV2Script(PlutusV2Script.fromCore(coreScript));
                    break;
                case PlutusLanguageVersion.V3:
                    script = Script.newPlutusV3Script(PlutusV3Script.fromCore(coreScript));
                    break;
                default:
                    throw new InvalidStateError('Unexpected Plutus language version');
            }
        }
        return script;
    }
    language() {
        return __classPrivateFieldGet(this, _Script_language, "f");
    }
    static newNativeScript(nativeScript) {
        const script = new Script();
        __classPrivateFieldSet(script, _Script_nativeScript, nativeScript, "f");
        __classPrivateFieldSet(script, _Script_language, ScriptLanguage.Native, "f");
        return script;
    }
    static newPlutusV1Script(plutusV1Script) {
        const script = new Script();
        __classPrivateFieldSet(script, _Script_plutusV1, plutusV1Script, "f");
        __classPrivateFieldSet(script, _Script_language, ScriptLanguage.PlutusV1, "f");
        return script;
    }
    static newPlutusV2Script(plutusV2Script) {
        const script = new Script();
        __classPrivateFieldSet(script, _Script_plutusV2, plutusV2Script, "f");
        __classPrivateFieldSet(script, _Script_language, ScriptLanguage.PlutusV2, "f");
        return script;
    }
    static newPlutusV3Script(plutusV3Script) {
        const script = new Script();
        __classPrivateFieldSet(script, _Script_plutusV3, plutusV3Script, "f");
        __classPrivateFieldSet(script, _Script_language, ScriptLanguage.PlutusV3, "f");
        return script;
    }
    asNative() {
        return __classPrivateFieldGet(this, _Script_nativeScript, "f");
    }
    asPlutusV1() {
        return __classPrivateFieldGet(this, _Script_plutusV1, "f");
    }
    asPlutusV2() {
        return __classPrivateFieldGet(this, _Script_plutusV2, "f");
    }
    asPlutusV3() {
        return __classPrivateFieldGet(this, _Script_plutusV3, "f");
    }
    hash() {
        let hash;
        switch (__classPrivateFieldGet(this, _Script_language, "f")) {
            case ScriptLanguage.Native:
                hash = __classPrivateFieldGet(this, _Script_nativeScript, "f").hash();
                break;
            case ScriptLanguage.PlutusV1:
                hash = __classPrivateFieldGet(this, _Script_plutusV1, "f").hash();
                break;
            case ScriptLanguage.PlutusV2:
                hash = __classPrivateFieldGet(this, _Script_plutusV2, "f").hash();
                break;
            case ScriptLanguage.PlutusV3:
                hash = __classPrivateFieldGet(this, _Script_plutusV3, "f").hash();
                break;
            default:
                throw new InvalidStateError(`Unexpected script language ${__classPrivateFieldGet(this, _Script_language, "f")}`);
        }
        return hash;
    }
}
_Script_nativeScript = new WeakMap(), _Script_plutusV1 = new WeakMap(), _Script_plutusV2 = new WeakMap(), _Script_plutusV3 = new WeakMap(), _Script_language = new WeakMap(), _Script_originalBytes = new WeakMap();
