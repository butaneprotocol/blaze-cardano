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
var _NewConstitution_constitution, _NewConstitution_govActionId, _NewConstitution_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { Constitution } from './Constitution.js';
import { GovernanceActionId } from '../../Common/GovernanceActionId.js';
import { GovernanceActionKind } from './GovernanceActionKind.js';
import { GovernanceActionType } from '../../../Cardano/types/Governance.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { hexToBytes } from '../../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 3;
export class NewConstitution {
    constructor(constitution, govActionId) {
        _NewConstitution_constitution.set(this, void 0);
        _NewConstitution_govActionId.set(this, void 0);
        _NewConstitution_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _NewConstitution_constitution, constitution, "f");
        __classPrivateFieldSet(this, _NewConstitution_govActionId, govActionId, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _NewConstitution_originalBytes, "f"))
            return __classPrivateFieldGet(this, _NewConstitution_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(GovernanceActionKind.NewConstitution);
        __classPrivateFieldGet(this, _NewConstitution_govActionId, "f") ? writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _NewConstitution_govActionId, "f").toCbor())) : writer.writeNull();
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _NewConstitution_constitution, "f").toCbor()));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readUInt());
        if (kind !== GovernanceActionKind.NewConstitution)
            throw new InvalidArgumentError('cbor', `Expected action kind, expected ${GovernanceActionKind.NewConstitution} but got ${kind}`);
        let govActionId;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
        }
        else {
            govActionId = GovernanceActionId.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        }
        const constitution = Constitution.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const action = new NewConstitution(constitution, govActionId);
        __classPrivateFieldSet(action, _NewConstitution_originalBytes, cbor, "f");
        return action;
    }
    toCore() {
        return {
            __typename: GovernanceActionType.new_constitution,
            constitution: __classPrivateFieldGet(this, _NewConstitution_constitution, "f").toCore(),
            governanceActionId: __classPrivateFieldGet(this, _NewConstitution_govActionId, "f") ? __classPrivateFieldGet(this, _NewConstitution_govActionId, "f").toCore() : null
        };
    }
    static fromCore(newConstitution) {
        return new NewConstitution(Constitution.fromCore(newConstitution.constitution), newConstitution.governanceActionId !== null
            ? GovernanceActionId.fromCore(newConstitution.governanceActionId)
            : undefined);
    }
    govActionId() {
        return __classPrivateFieldGet(this, _NewConstitution_govActionId, "f");
    }
    constitution() {
        return __classPrivateFieldGet(this, _NewConstitution_constitution, "f");
    }
}
_NewConstitution_constitution = new WeakMap(), _NewConstitution_govActionId = new WeakMap(), _NewConstitution_originalBytes = new WeakMap();
