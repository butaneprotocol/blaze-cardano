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
var _Voter_kind, _Voter_credential, _Voter_originalBytes;
import { CborReader, CborWriter } from '../../CBOR/index.js';
import { CredentialType } from '../../../Cardano/Address/index.js';
import { HexBlob, InvalidArgumentError, InvalidStateError } from '@cardano-sdk/util';
import { VoterKind } from './VoterKind.js';
import { VoterType } from '../../../Cardano/types/Governance.js';
const EMBEDDED_GROUP_SIZE = 2;
export class Voter {
    constructor(kind, credential) {
        _Voter_kind.set(this, void 0);
        _Voter_credential.set(this, void 0);
        _Voter_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _Voter_kind, kind, "f");
        __classPrivateFieldSet(this, _Voter_credential, credential, "f");
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _Voter_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Voter_originalBytes, "f");
        const writer = new CborWriter();
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _Voter_kind, "f"));
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _Voter_credential, "f").hash, 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        let credential;
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        const hash = HexBlob.fromBytes(reader.readByteString());
        switch (kind) {
            case VoterKind.ConstitutionalCommitteeKeyHash:
            case VoterKind.DrepKeyHash:
            case VoterKind.StakePoolKeyHash:
                credential = { hash, type: CredentialType.KeyHash };
                break;
            case VoterKind.ConstitutionalCommitteeScriptHash:
            case VoterKind.DRepScriptHash:
                credential = { hash, type: CredentialType.ScriptHash };
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${kind}`);
        }
        const voter = new Voter(kind, credential);
        __classPrivateFieldSet(voter, _Voter_originalBytes, cbor, "f");
        return voter;
    }
    toCore() {
        switch (__classPrivateFieldGet(this, _Voter_kind, "f")) {
            case VoterKind.ConstitutionalCommitteeKeyHash:
                return {
                    __typename: VoterType.ccHotKeyHash,
                    credential: {
                        hash: __classPrivateFieldGet(this, _Voter_credential, "f").hash,
                        type: CredentialType.KeyHash
                    }
                };
            case VoterKind.ConstitutionalCommitteeScriptHash:
                return {
                    __typename: VoterType.ccHotScriptHash,
                    credential: {
                        hash: __classPrivateFieldGet(this, _Voter_credential, "f").hash,
                        type: CredentialType.ScriptHash
                    }
                };
            case VoterKind.DrepKeyHash:
                return {
                    __typename: VoterType.dRepKeyHash,
                    credential: {
                        hash: __classPrivateFieldGet(this, _Voter_credential, "f").hash,
                        type: CredentialType.KeyHash
                    }
                };
            case VoterKind.DRepScriptHash:
                return {
                    __typename: VoterType.dRepScriptHash,
                    credential: {
                        hash: __classPrivateFieldGet(this, _Voter_credential, "f").hash,
                        type: CredentialType.ScriptHash
                    }
                };
            case VoterKind.StakePoolKeyHash:
                return {
                    __typename: VoterType.stakePoolKeyHash,
                    credential: {
                        hash: __classPrivateFieldGet(this, _Voter_credential, "f").hash,
                        type: CredentialType.KeyHash
                    }
                };
            default:
                throw new InvalidStateError(`Unexpected kind value: ${__classPrivateFieldGet(this, _Voter_kind, "f")}`);
        }
    }
    static fromCore(coreVoter) {
        let voter;
        switch (coreVoter.__typename) {
            case VoterType.ccHotKeyHash:
            case VoterType.ccHotScriptHash:
                voter = Voter.newConstitutionalCommitteeHotKey(coreVoter.credential);
                break;
            case VoterType.dRepKeyHash:
            case VoterType.dRepScriptHash:
                voter = Voter.newDrep(coreVoter.credential);
                break;
            case VoterType.stakePoolKeyHash:
                voter = Voter.newStakingPool(coreVoter.credential.hash);
                break;
            default:
                throw new InvalidStateError('Unexpected Voter type');
        }
        return voter;
    }
    static newConstitutionalCommitteeHotKey(credential) {
        const kind = credential.type === CredentialType.KeyHash
            ? VoterKind.ConstitutionalCommitteeKeyHash
            : VoterKind.ConstitutionalCommitteeScriptHash;
        return new Voter(kind, credential);
    }
    static newDrep(credential) {
        const kind = credential.type === CredentialType.KeyHash ? VoterKind.DrepKeyHash : VoterKind.DRepScriptHash;
        return new Voter(kind, credential);
    }
    static newStakingPool(keyHash) {
        return new Voter(VoterKind.StakePoolKeyHash, {
            hash: keyHash,
            type: CredentialType.KeyHash
        });
    }
    kind() {
        return __classPrivateFieldGet(this, _Voter_kind, "f");
    }
    toConstitutionalCommitteeHotCred() {
        if (__classPrivateFieldGet(this, _Voter_kind, "f") === VoterKind.ConstitutionalCommitteeKeyHash ||
            __classPrivateFieldGet(this, _Voter_kind, "f") === VoterKind.ConstitutionalCommitteeScriptHash)
            return __classPrivateFieldGet(this, _Voter_credential, "f");
        return undefined;
    }
    toDrepCred() {
        if (__classPrivateFieldGet(this, _Voter_kind, "f") === VoterKind.DrepKeyHash || __classPrivateFieldGet(this, _Voter_kind, "f") === VoterKind.DRepScriptHash)
            return __classPrivateFieldGet(this, _Voter_credential, "f");
        return undefined;
    }
    toStakingPoolKeyHash() {
        if (__classPrivateFieldGet(this, _Voter_kind, "f") === VoterKind.StakePoolKeyHash)
            return __classPrivateFieldGet(this, _Voter_credential, "f").hash;
        return undefined;
    }
    equals(other) {
        return (__classPrivateFieldGet(this, _Voter_kind, "f") === __classPrivateFieldGet(other, _Voter_kind, "f") &&
            __classPrivateFieldGet(this, _Voter_credential, "f").type === __classPrivateFieldGet(other, _Voter_credential, "f").type &&
            __classPrivateFieldGet(this, _Voter_credential, "f").hash === __classPrivateFieldGet(other, _Voter_credential, "f").hash);
    }
}
_Voter_kind = new WeakMap(), _Voter_credential = new WeakMap(), _Voter_originalBytes = new WeakMap();
