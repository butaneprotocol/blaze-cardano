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
var _UpdateCommittee_govActionId, _UpdateCommittee_membersToBeRemoved, _UpdateCommittee_membersToBeAdded, _UpdateCommittee_newQuorum, _UpdateCommittee_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { CborSet, Credential, UnitInterval } from '../../Common/index.js';
import { GovernanceActionType } from '../../../Cardano/types/Governance.js';
import { EpochNo } from '../../../Cardano/types/Block.js';
import { GovernanceActionId } from '../../Common/GovernanceActionId.js';
import { GovernanceActionKind } from './GovernanceActionKind.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { hexToBytes } from '../../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 5;
const CREDENTIAL_ARRAY_SIZE = 2;
const CREDENTIAL_INDEX = 0;
const EPOCH_INDEX = 1;
export class UpdateCommittee {
    constructor(membersToBeRemoved, membersToBeAdded, newQuorum, govActionId) {
        _UpdateCommittee_govActionId.set(this, void 0);
        _UpdateCommittee_membersToBeRemoved.set(this, void 0);
        _UpdateCommittee_membersToBeAdded.set(this, void 0);
        _UpdateCommittee_newQuorum.set(this, void 0);
        _UpdateCommittee_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _UpdateCommittee_membersToBeRemoved, membersToBeRemoved, "f");
        __classPrivateFieldSet(this, _UpdateCommittee_membersToBeAdded, membersToBeAdded, "f");
        __classPrivateFieldSet(this, _UpdateCommittee_newQuorum, newQuorum, "f");
        __classPrivateFieldSet(this, _UpdateCommittee_govActionId, govActionId, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _UpdateCommittee_originalBytes, "f"))
            return __classPrivateFieldGet(this, _UpdateCommittee_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(GovernanceActionKind.UpdateCommittee);
        __classPrivateFieldGet(this, _UpdateCommittee_govActionId, "f") ? writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _UpdateCommittee_govActionId, "f").toCbor())) : writer.writeNull();
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _UpdateCommittee_membersToBeRemoved, "f").toCbor()));
        writer.writeStartMap(__classPrivateFieldGet(this, _UpdateCommittee_membersToBeAdded, "f").length);
        for (const entry of __classPrivateFieldGet(this, _UpdateCommittee_membersToBeAdded, "f")) {
            writer.writeStartArray(CREDENTIAL_ARRAY_SIZE);
            writer.writeInt(entry[CREDENTIAL_INDEX].type);
            writer.writeByteString(hexToBytes(entry[CREDENTIAL_INDEX].hash));
            writer.writeInt(entry[EPOCH_INDEX]);
        }
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _UpdateCommittee_newQuorum, "f").toCbor()));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readUInt());
        if (kind !== GovernanceActionKind.UpdateCommittee)
            throw new InvalidArgumentError('cbor', `Expected action kind, expected ${GovernanceActionKind.UpdateCommittee} but got ${kind}`);
        let govActionId;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
        }
        else {
            govActionId = GovernanceActionId.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        }
        const membersToRemove = CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), Credential.fromCbor);
        reader.readStartMap();
        const membersToAdd = [];
        while (reader.peekState() !== CborReaderState.EndMap) {
            if (reader.readStartArray() !== CREDENTIAL_ARRAY_SIZE)
                throw new InvalidArgumentError('cbor', `Expected an array of ${CREDENTIAL_ARRAY_SIZE} elements, but got an array of ${length} elements`);
            const type = Number(reader.readUInt());
            const hash = HexBlob.fromBytes(reader.readByteString());
            reader.readEndArray();
            const epoch = Number(reader.readUInt());
            membersToAdd.push([{ hash, type }, epoch]);
        }
        reader.readEndMap();
        const quorumThreshold = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const action = new UpdateCommittee(membersToRemove, membersToAdd, quorumThreshold, govActionId);
        __classPrivateFieldSet(action, _UpdateCommittee_originalBytes, cbor, "f");
        return action;
    }
    toCore() {
        return {
            __typename: GovernanceActionType.update_committee,
            governanceActionId: __classPrivateFieldGet(this, _UpdateCommittee_govActionId, "f") ? __classPrivateFieldGet(this, _UpdateCommittee_govActionId, "f").toCore() : null,
            membersToBeAdded: new Set(__classPrivateFieldGet(this, _UpdateCommittee_membersToBeAdded, "f").map((entry) => ({
                coldCredential: entry[CREDENTIAL_INDEX],
                epoch: EpochNo(entry[EPOCH_INDEX])
            }))),
            membersToBeRemoved: new Set(__classPrivateFieldGet(this, _UpdateCommittee_membersToBeRemoved, "f").toCore()),
            newQuorumThreshold: __classPrivateFieldGet(this, _UpdateCommittee_newQuorum, "f").toCore()
        };
    }
    static fromCore(updateCommittee) {
        return new UpdateCommittee(CborSet.fromCore([...updateCommittee.membersToBeRemoved], Credential.fromCore), [...updateCommittee.membersToBeAdded].map((entry) => [entry.coldCredential, entry.epoch]), UnitInterval.fromCore(updateCommittee.newQuorumThreshold), updateCommittee.governanceActionId !== null
            ? GovernanceActionId.fromCore(updateCommittee.governanceActionId)
            : undefined);
    }
    govActionId() {
        return __classPrivateFieldGet(this, _UpdateCommittee_govActionId, "f");
    }
    membersToBeRemoved() {
        return __classPrivateFieldGet(this, _UpdateCommittee_membersToBeRemoved, "f").toCore();
    }
    membersToBeAdded() {
        return __classPrivateFieldGet(this, _UpdateCommittee_membersToBeAdded, "f");
    }
    newQuorum() {
        return __classPrivateFieldGet(this, _UpdateCommittee_newQuorum, "f");
    }
}
_UpdateCommittee_govActionId = new WeakMap(), _UpdateCommittee_membersToBeRemoved = new WeakMap(), _UpdateCommittee_membersToBeAdded = new WeakMap(), _UpdateCommittee_newQuorum = new WeakMap(), _UpdateCommittee_originalBytes = new WeakMap();
