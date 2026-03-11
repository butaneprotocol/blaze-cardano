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
var _HardForkInitiationAction_protocolVersion, _HardForkInitiationAction_govActionId, _HardForkInitiationAction_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { GovernanceActionId } from '../../Common/GovernanceActionId.js';
import { GovernanceActionKind } from './GovernanceActionKind.js';
import { GovernanceActionType } from '../../../Cardano/types/Governance.js';
import { HexBlob, InvalidArgumentError } from "../../../../deps/util.js";
import { ProtocolVersion } from '../../Common/index.js';
import { hexToBytes } from '../../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 3;
export class HardForkInitiationAction {
    constructor(protocolVersion, govActionId) {
        _HardForkInitiationAction_protocolVersion.set(this, void 0);
        _HardForkInitiationAction_govActionId.set(this, void 0);
        _HardForkInitiationAction_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _HardForkInitiationAction_protocolVersion, protocolVersion, "f");
        __classPrivateFieldSet(this, _HardForkInitiationAction_govActionId, govActionId, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _HardForkInitiationAction_originalBytes, "f"))
            return __classPrivateFieldGet(this, _HardForkInitiationAction_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(GovernanceActionKind.HardForkInitiation);
        __classPrivateFieldGet(this, _HardForkInitiationAction_govActionId, "f") ? writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _HardForkInitiationAction_govActionId, "f").toCbor())) : writer.writeNull();
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _HardForkInitiationAction_protocolVersion, "f").toCbor()));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readUInt());
        if (kind !== GovernanceActionKind.HardForkInitiation)
            throw new InvalidArgumentError('cbor', `Expected action kind, expected ${GovernanceActionKind.HardForkInitiation} but got ${kind}`);
        let govActionId;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
        }
        else {
            govActionId = GovernanceActionId.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        }
        const protocolVersion = ProtocolVersion.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const action = new HardForkInitiationAction(protocolVersion, govActionId);
        __classPrivateFieldSet(action, _HardForkInitiationAction_originalBytes, cbor, "f");
        return action;
    }
    toCore() {
        return {
            __typename: GovernanceActionType.hard_fork_initiation_action,
            governanceActionId: __classPrivateFieldGet(this, _HardForkInitiationAction_govActionId, "f") ? __classPrivateFieldGet(this, _HardForkInitiationAction_govActionId, "f").toCore() : null,
            protocolVersion: __classPrivateFieldGet(this, _HardForkInitiationAction_protocolVersion, "f").toCore()
        };
    }
    static fromCore(hardForkInitiationAction) {
        return new HardForkInitiationAction(ProtocolVersion.fromCore(hardForkInitiationAction.protocolVersion), hardForkInitiationAction.governanceActionId !== null
            ? GovernanceActionId.fromCore(hardForkInitiationAction.governanceActionId)
            : undefined);
    }
    govActionId() {
        return __classPrivateFieldGet(this, _HardForkInitiationAction_govActionId, "f");
    }
    protocolVersion() {
        return __classPrivateFieldGet(this, _HardForkInitiationAction_protocolVersion, "f");
    }
}
_HardForkInitiationAction_protocolVersion = new WeakMap(), _HardForkInitiationAction_govActionId = new WeakMap(), _HardForkInitiationAction_originalBytes = new WeakMap();
