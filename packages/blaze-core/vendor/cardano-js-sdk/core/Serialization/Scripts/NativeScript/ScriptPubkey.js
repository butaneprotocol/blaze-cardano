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
var _ScriptPubkey_keyHash, _ScriptPubkey_originalBytes;
import * as Crypto from '@cardano-sdk/crypto';
import { CborReader, CborWriter } from '../../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { NativeScriptKind, ScriptType } from '../../../Cardano/types/Script.js';
const EMBEDDED_GROUP_SIZE = 2;
export class ScriptPubkey {
    constructor(keyHash) {
        _ScriptPubkey_keyHash.set(this, void 0);
        _ScriptPubkey_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _ScriptPubkey_keyHash, keyHash, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _ScriptPubkey_originalBytes, "f"))
            return __classPrivateFieldGet(this, _ScriptPubkey_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(NativeScriptKind.RequireSignature);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _ScriptPubkey_keyHash, "f"), 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of two elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== NativeScriptKind.RequireSignature)
            throw new InvalidArgumentError('cbor', `Expected kind ${NativeScriptKind.RequireSignature}, but got kind ${kind}`);
        const key = Crypto.Ed25519KeyHashHex(HexBlob.fromBytes(reader.readByteString()));
        const script = new ScriptPubkey(key);
        __classPrivateFieldSet(script, _ScriptPubkey_originalBytes, cbor, "f");
        return script;
    }
    toCore() {
        return {
            __type: ScriptType.Native,
            keyHash: __classPrivateFieldGet(this, _ScriptPubkey_keyHash, "f"),
            kind: NativeScriptKind.RequireSignature
        };
    }
    static fromCore(script) {
        return new ScriptPubkey(script.keyHash);
    }
    keyHash() {
        return __classPrivateFieldGet(this, _ScriptPubkey_keyHash, "f");
    }
    setKeyHash(keyHash) {
        __classPrivateFieldSet(this, _ScriptPubkey_keyHash, keyHash, "f");
        __classPrivateFieldSet(this, _ScriptPubkey_originalBytes, undefined, "f");
    }
}
_ScriptPubkey_keyHash = new WeakMap(), _ScriptPubkey_originalBytes = new WeakMap();
