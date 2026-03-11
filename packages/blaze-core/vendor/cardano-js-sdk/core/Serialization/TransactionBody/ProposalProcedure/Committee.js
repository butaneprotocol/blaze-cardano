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
var _Committee_quorumThreshold, _Committee_committeeColdCredentials, _Committee_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { HexBlob, InvalidArgumentError, InvalidStateError } from "../../../../deps/util.js";
import { UnitInterval } from '../../Common/index.js';
import { hexToBytes } from '../../../util/misc/index.js';
const COMMITTEE_ARRAY_SIZE = 2;
const CREDENTIAL_ARRAY_SIZE = 2;
const CREDENTIAL_INDEX = 0;
const EPOCH_INDEX = 1;
export class Committee {
    constructor(quorumThreshold) {
        _Committee_quorumThreshold.set(this, void 0);
        _Committee_committeeColdCredentials.set(this, []);
        _Committee_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _Committee_quorumThreshold, quorumThreshold, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _Committee_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Committee_originalBytes, "f");
        if (__classPrivateFieldGet(this, _Committee_committeeColdCredentials, "f").length === 0)
            throw new InvalidStateError('There must be at least one Committee member');
        writer.writeStartArray(COMMITTEE_ARRAY_SIZE);
        writer.writeStartMap(__classPrivateFieldGet(this, _Committee_committeeColdCredentials, "f").length);
        for (const entry of __classPrivateFieldGet(this, _Committee_committeeColdCredentials, "f")) {
            writer.writeStartArray(CREDENTIAL_ARRAY_SIZE);
            writer.writeInt(entry[CREDENTIAL_INDEX].type);
            writer.writeByteString(hexToBytes(entry[CREDENTIAL_INDEX].hash));
            writer.writeInt(entry[EPOCH_INDEX]);
        }
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _Committee_quorumThreshold, "f").toCbor()));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== COMMITTEE_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${COMMITTEE_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        reader.readStartMap();
        const members = [];
        while (reader.peekState() !== CborReaderState.EndMap) {
            if (reader.readStartArray() !== CREDENTIAL_ARRAY_SIZE)
                throw new InvalidArgumentError('cbor', `Expected an array of ${CREDENTIAL_ARRAY_SIZE} elements, but got an array of ${length} elements`);
            const type = Number(reader.readUInt());
            const hash = HexBlob.fromBytes(reader.readByteString());
            reader.readEndArray();
            const epoch = Number(reader.readUInt());
            members.push([{ hash, type }, epoch]);
        }
        reader.readEndMap();
        const quorumThreshold = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const committee = new Committee(quorumThreshold);
        for (const member of members)
            committee.addMember(member[CREDENTIAL_INDEX], member[EPOCH_INDEX]);
        __classPrivateFieldSet(committee, _Committee_originalBytes, cbor, "f");
        return committee;
    }
    toCore() {
        if (__classPrivateFieldGet(this, _Committee_committeeColdCredentials, "f").length === 0)
            throw new InvalidStateError('There must be at least one Committee member');
        const members = __classPrivateFieldGet(this, _Committee_committeeColdCredentials, "f").map((entry) => ({
            coldCredential: entry[CREDENTIAL_INDEX],
            epoch: entry[EPOCH_INDEX]
        }));
        return {
            members: members,
            quorumThreshold: __classPrivateFieldGet(this, _Committee_quorumThreshold, "f").toCore()
        };
    }
    static fromCore(coreCommittee) {
        const committee = new Committee(UnitInterval.fromCore(coreCommittee.quorumThreshold));
        for (const member of coreCommittee.members)
            committee.addMember(member.coldCredential, member.epoch);
        return committee;
    }
    membersKeys() {
        return __classPrivateFieldGet(this, _Committee_committeeColdCredentials, "f").map((entry) => entry[0]);
    }
    quorumThreshold() {
        return __classPrivateFieldGet(this, _Committee_quorumThreshold, "f");
    }
    addMember(committeeColdCredential, epoch) {
        const member = __classPrivateFieldGet(this, _Committee_committeeColdCredentials, "f").find((entry) => entry[CREDENTIAL_INDEX].type === committeeColdCredential.type &&
            entry[CREDENTIAL_INDEX].hash === committeeColdCredential.hash);
        if (member)
            throw new InvalidArgumentError('committeeColdCredential', 'The given credential is already present');
        __classPrivateFieldGet(this, _Committee_committeeColdCredentials, "f").push([committeeColdCredential, epoch]);
    }
    getMemberEpoch(committeeColdCredential) {
        const member = __classPrivateFieldGet(this, _Committee_committeeColdCredentials, "f").find((entry) => entry[CREDENTIAL_INDEX].type === committeeColdCredential.type &&
            entry[CREDENTIAL_INDEX].hash === committeeColdCredential.hash);
        if (member)
            return member[EPOCH_INDEX];
        return undefined;
    }
}
_Committee_quorumThreshold = new WeakMap(), _Committee_committeeColdCredentials = new WeakMap(), _Committee_originalBytes = new WeakMap();
