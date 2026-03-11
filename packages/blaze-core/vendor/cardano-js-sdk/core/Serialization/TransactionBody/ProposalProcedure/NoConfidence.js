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
var _NoConfidence_govActionId, _NoConfidence_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { GovernanceActionId } from '../../Common/GovernanceActionId.js';
import { GovernanceActionKind } from './GovernanceActionKind.js';
import { GovernanceActionType } from '../../../Cardano/types/Governance.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { hexToBytes } from '../../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 2;
export class NoConfidence {
    constructor(govActionId) {
        _NoConfidence_govActionId.set(this, void 0);
        _NoConfidence_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _NoConfidence_govActionId, govActionId, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _NoConfidence_originalBytes, "f"))
            return __classPrivateFieldGet(this, _NoConfidence_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(GovernanceActionKind.NoConfidence);
        __classPrivateFieldGet(this, _NoConfidence_govActionId, "f") ? writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _NoConfidence_govActionId, "f").toCbor())) : writer.writeNull();
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readUInt());
        if (kind !== GovernanceActionKind.NoConfidence)
            throw new InvalidArgumentError('cbor', `Expected action kind, expected ${GovernanceActionKind.NoConfidence}  but got ${kind}`);
        let govActionId;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
        }
        else {
            govActionId = GovernanceActionId.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        }
        const action = new NoConfidence(govActionId);
        __classPrivateFieldSet(action, _NoConfidence_originalBytes, cbor, "f");
        return action;
    }
    toCore() {
        return {
            __typename: GovernanceActionType.no_confidence,
            governanceActionId: __classPrivateFieldGet(this, _NoConfidence_govActionId, "f") ? __classPrivateFieldGet(this, _NoConfidence_govActionId, "f").toCore() : null
        };
    }
    static fromCore(noConfidence) {
        return new NoConfidence(noConfidence.governanceActionId !== null
            ? GovernanceActionId.fromCore(noConfidence.governanceActionId)
            : undefined);
    }
    govActionId() {
        return __classPrivateFieldGet(this, _NoConfidence_govActionId, "f");
    }
}
_NoConfidence_govActionId = new WeakMap(), _NoConfidence_originalBytes = new WeakMap();
