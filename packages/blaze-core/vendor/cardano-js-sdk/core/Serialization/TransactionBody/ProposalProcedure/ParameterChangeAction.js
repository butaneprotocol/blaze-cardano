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
var _ParameterChangeAction_protocolParamUpdate, _ParameterChangeAction_govActionId, _ParameterChangeAction_policyHash, _ParameterChangeAction_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { GovernanceActionId } from '../../Common/GovernanceActionId.js';
import { GovernanceActionKind } from './GovernanceActionKind.js';
import { GovernanceActionType } from '../../../Cardano/types/Governance.js';
import { HexBlob, InvalidArgumentError } from "../../../../deps/util.js";
import { ProtocolParamUpdate } from '../../Update/index.js';
import { hexToBytes } from '../../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 4;
export class ParameterChangeAction {
    constructor(protocolParamUpdate, govActionId, policyHash) {
        _ParameterChangeAction_protocolParamUpdate.set(this, void 0);
        _ParameterChangeAction_govActionId.set(this, void 0);
        _ParameterChangeAction_policyHash.set(this, void 0);
        _ParameterChangeAction_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _ParameterChangeAction_protocolParamUpdate, protocolParamUpdate, "f");
        __classPrivateFieldSet(this, _ParameterChangeAction_govActionId, govActionId, "f");
        __classPrivateFieldSet(this, _ParameterChangeAction_policyHash, policyHash, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _ParameterChangeAction_originalBytes, "f"))
            return __classPrivateFieldGet(this, _ParameterChangeAction_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(GovernanceActionKind.ParameterChange);
        __classPrivateFieldGet(this, _ParameterChangeAction_govActionId, "f") ? writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _ParameterChangeAction_govActionId, "f").toCbor())) : writer.writeNull();
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _ParameterChangeAction_protocolParamUpdate, "f").toCbor()));
        __classPrivateFieldGet(this, _ParameterChangeAction_policyHash, "f") ? writer.writeByteString(hexToBytes(__classPrivateFieldGet(this, _ParameterChangeAction_policyHash, "f"))) : writer.writeNull();
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readUInt());
        if (kind !== GovernanceActionKind.ParameterChange)
            throw new InvalidArgumentError('cbor', `Expected action kind, expected ${GovernanceActionKind.ParameterChange} but got ${kind}`);
        let govActionId;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
        }
        else {
            govActionId = GovernanceActionId.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        }
        const parameterUpdate = ProtocolParamUpdate.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        let policyHash;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
        }
        else {
            policyHash = HexBlob.fromBytes(reader.readByteString());
        }
        reader.readEndArray();
        const action = new ParameterChangeAction(parameterUpdate, govActionId, policyHash);
        __classPrivateFieldSet(action, _ParameterChangeAction_originalBytes, cbor, "f");
        return action;
    }
    toCore() {
        return {
            __typename: GovernanceActionType.parameter_change_action,
            governanceActionId: __classPrivateFieldGet(this, _ParameterChangeAction_govActionId, "f") ? __classPrivateFieldGet(this, _ParameterChangeAction_govActionId, "f").toCore() : null,
            policyHash: __classPrivateFieldGet(this, _ParameterChangeAction_policyHash, "f") ? __classPrivateFieldGet(this, _ParameterChangeAction_policyHash, "f") : null,
            protocolParamUpdate: __classPrivateFieldGet(this, _ParameterChangeAction_protocolParamUpdate, "f").toCore()
        };
    }
    static fromCore(parameterChangeAction) {
        return new ParameterChangeAction(ProtocolParamUpdate.fromCore(parameterChangeAction.protocolParamUpdate), parameterChangeAction.governanceActionId !== null
            ? GovernanceActionId.fromCore(parameterChangeAction.governanceActionId)
            : undefined, parameterChangeAction.policyHash !== null ? parameterChangeAction.policyHash : undefined);
    }
    govActionId() {
        return __classPrivateFieldGet(this, _ParameterChangeAction_govActionId, "f");
    }
    protocolParamUpdate() {
        return __classPrivateFieldGet(this, _ParameterChangeAction_protocolParamUpdate, "f");
    }
    policyHash() {
        return __classPrivateFieldGet(this, _ParameterChangeAction_policyHash, "f");
    }
}
_ParameterChangeAction_protocolParamUpdate = new WeakMap(), _ParameterChangeAction_govActionId = new WeakMap(), _ParameterChangeAction_policyHash = new WeakMap(), _ParameterChangeAction_originalBytes = new WeakMap();
