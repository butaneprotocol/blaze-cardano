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
var _InfoAction_originalBytes;
import { CborReader, CborWriter } from '../../CBOR/index.js';
import { GovernanceActionKind } from './GovernanceActionKind.js';
import { GovernanceActionType } from '../../../Cardano/types/Governance.js';
import { InvalidArgumentError } from "../../../../deps/util.js";
const EMBEDDED_GROUP_SIZE = 1;
export class InfoAction {
    constructor() {
        _InfoAction_originalBytes.set(this, undefined);
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _InfoAction_originalBytes, "f"))
            return __classPrivateFieldGet(this, _InfoAction_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(GovernanceActionKind.Info);
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readUInt());
        if (kind !== GovernanceActionKind.Info)
            throw new InvalidArgumentError('cbor', `Expected action kind, expected ${GovernanceActionKind.Info} but got ${kind}`);
        const action = new InfoAction();
        __classPrivateFieldSet(action, _InfoAction_originalBytes, cbor, "f");
        return action;
    }
    toCore() {
        return {
            __typename: GovernanceActionType.info_action
        };
    }
    static fromCore(_) {
        return new InfoAction();
    }
}
_InfoAction_originalBytes = new WeakMap();
