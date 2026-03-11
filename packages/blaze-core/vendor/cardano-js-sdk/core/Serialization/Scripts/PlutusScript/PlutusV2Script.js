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
var _PlutusV2Script_compiledByteCode, _PlutusV2Script_originalBytes;
import * as Crypto from '@cardano-sdk/crypto';
import { CborReader, CborWriter } from '../../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { PlutusLanguageVersion, ScriptType } from '../../../Cardano/types/Script.js';
const HASH_LENGTH_IN_BYTES = 28;
export class PlutusV2Script {
    constructor(compiledByteCode) {
        _PlutusV2Script_compiledByteCode.set(this, void 0);
        _PlutusV2Script_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _PlutusV2Script_compiledByteCode, compiledByteCode, "f");
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _PlutusV2Script_originalBytes, "f"))
            return __classPrivateFieldGet(this, _PlutusV2Script_originalBytes, "f");
        const writer = new CborWriter();
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _PlutusV2Script_compiledByteCode, "f"), 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const bytes = reader.readByteString();
        const script = new PlutusV2Script(HexBlob.fromBytes(bytes));
        __classPrivateFieldSet(script, _PlutusV2Script_originalBytes, cbor, "f");
        return script;
    }
    toCore() {
        return {
            __type: ScriptType.Plutus,
            bytes: this.rawBytes(),
            version: PlutusLanguageVersion.V2
        };
    }
    static fromCore(plutusScript) {
        if (plutusScript.version !== PlutusLanguageVersion.V2)
            throw new InvalidArgumentError('script', 'Wrong plutus language version.');
        return new PlutusV2Script(plutusScript.bytes);
    }
    hash() {
        const bytes = `02${this.rawBytes()}`;
        return Crypto.blake2b.hash(bytes, HASH_LENGTH_IN_BYTES);
    }
    rawBytes() {
        return __classPrivateFieldGet(this, _PlutusV2Script_compiledByteCode, "f");
    }
    setRawBytes(bytes) {
        __classPrivateFieldSet(this, _PlutusV2Script_compiledByteCode, bytes, "f");
        __classPrivateFieldSet(this, _PlutusV2Script_originalBytes, undefined, "f");
    }
}
_PlutusV2Script_compiledByteCode = new WeakMap(), _PlutusV2Script_originalBytes = new WeakMap();
