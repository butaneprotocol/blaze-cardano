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
var _DRep_credential, _DRep_kind, _DRep_originalBytes;
import * as Crypto from '@cardano-sdk/crypto';
import { CborReader, CborWriter } from '../../CBOR/index.js';
import { CredentialType } from '../../../Cardano/Address/Address.js';
import { DRepKind } from './DRepKind.js';
import { HexBlob } from '@cardano-sdk/util';
import { isDRepAlwaysAbstain, isDRepAlwaysNoConfidence } from '../../../Cardano/types/Governance.js';
export class DRep {
    constructor(kind, credential) {
        _DRep_credential.set(this, void 0);
        _DRep_kind.set(this, void 0);
        _DRep_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _DRep_credential, credential, "f");
        __classPrivateFieldSet(this, _DRep_kind, kind, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _DRep_originalBytes, "f"))
            return __classPrivateFieldGet(this, _DRep_originalBytes, "f");
        if (__classPrivateFieldGet(this, _DRep_kind, "f") === DRepKind.KeyHash || __classPrivateFieldGet(this, _DRep_kind, "f") === DRepKind.ScriptHash) {
            writer.writeStartArray(2);
            writer.writeInt(__classPrivateFieldGet(this, _DRep_credential, "f").type);
            writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _DRep_credential, "f").hash, 'hex'));
            return writer.encodeAsHex();
        }
        writer.writeStartArray(1);
        writer.writeInt(__classPrivateFieldGet(this, _DRep_kind, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        reader.readStartArray();
        const kind = Number(reader.readInt());
        if (kind === DRepKind.KeyHash || kind === DRepKind.ScriptHash) {
            const hash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
            if (kind === DRepKind.KeyHash) {
                return DRep.newKeyHash(hash);
            }
            return DRep.newScriptHash(hash);
        }
        reader.readEndArray();
        if (kind === DRepKind.Abstain)
            return DRep.newAlwaysAbstain();
        return DRep.newAlwaysNoConfidence();
    }
    toCore() {
        if (__classPrivateFieldGet(this, _DRep_kind, "f") === DRepKind.KeyHash || __classPrivateFieldGet(this, _DRep_kind, "f") === DRepKind.ScriptHash)
            return __classPrivateFieldGet(this, _DRep_credential, "f");
        if (__classPrivateFieldGet(this, _DRep_kind, "f") === DRepKind.Abstain)
            return {
                __typename: 'AlwaysAbstain'
            };
        return {
            __typename: 'AlwaysNoConfidence'
        };
    }
    static fromCore(deleg) {
        if (isDRepAlwaysAbstain(deleg))
            return DRep.newAlwaysAbstain();
        if (isDRepAlwaysNoConfidence(deleg))
            return DRep.newAlwaysNoConfidence();
        if (deleg.type === CredentialType.KeyHash)
            return DRep.newKeyHash(deleg.hash);
        return DRep.newScriptHash(deleg.hash);
    }
    static newKeyHash(keyHash) {
        return new DRep(DRepKind.KeyHash, {
            hash: keyHash,
            type: CredentialType.KeyHash
        });
    }
    static newScriptHash(scriptHash) {
        return new DRep(DRepKind.ScriptHash, {
            hash: scriptHash,
            type: CredentialType.ScriptHash
        });
    }
    static newAlwaysAbstain() {
        return new DRep(DRepKind.Abstain, undefined);
    }
    static newAlwaysNoConfidence() {
        return new DRep(DRepKind.NoConfidence, undefined);
    }
    kind() {
        return __classPrivateFieldGet(this, _DRep_kind, "f");
    }
    toKeyHash() {
        if (__classPrivateFieldGet(this, _DRep_kind, "f") !== DRepKind.KeyHash)
            return undefined;
        return __classPrivateFieldGet(this, _DRep_credential, "f")?.hash;
    }
    toScriptHash() {
        if (__classPrivateFieldGet(this, _DRep_kind, "f") !== DRepKind.ScriptHash)
            return undefined;
        return __classPrivateFieldGet(this, _DRep_credential, "f")?.hash;
    }
}
_DRep_credential = new WeakMap(), _DRep_kind = new WeakMap(), _DRep_originalBytes = new WeakMap();
