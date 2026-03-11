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
var _GovernanceActionId_id, _GovernanceActionId_index, _GovernanceActionId_originalBytes;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
const EMBEDDED_GROUP_SIZE = 2;
export class GovernanceActionId {
    constructor(id, index) {
        _GovernanceActionId_id.set(this, void 0);
        _GovernanceActionId_index.set(this, void 0);
        _GovernanceActionId_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _GovernanceActionId_id, id, "f");
        __classPrivateFieldSet(this, _GovernanceActionId_index, index, "f");
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _GovernanceActionId_originalBytes, "f"))
            return __classPrivateFieldGet(this, _GovernanceActionId_originalBytes, "f");
        const writer = new CborWriter();
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _GovernanceActionId_id, "f"), 'hex'));
        writer.writeInt(__classPrivateFieldGet(this, _GovernanceActionId_index, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const txId = reader.readByteString();
        const index = reader.readInt();
        const input = new GovernanceActionId(HexBlob.fromBytes(txId), index);
        __classPrivateFieldSet(input, _GovernanceActionId_originalBytes, cbor, "f");
        return input;
    }
    toCore() {
        return {
            actionIndex: Number(__classPrivateFieldGet(this, _GovernanceActionId_index, "f")),
            id: __classPrivateFieldGet(this, _GovernanceActionId_id, "f")
        };
    }
    static fromCore(coreGovernanceActionId) {
        return new GovernanceActionId(coreGovernanceActionId.id, BigInt(coreGovernanceActionId.actionIndex));
    }
    transactionId() {
        return __classPrivateFieldGet(this, _GovernanceActionId_id, "f");
    }
    setTransactionId(id) {
        __classPrivateFieldSet(this, _GovernanceActionId_id, id, "f");
        __classPrivateFieldSet(this, _GovernanceActionId_originalBytes, undefined, "f");
    }
    index() {
        return __classPrivateFieldGet(this, _GovernanceActionId_index, "f");
    }
    setIndex(index) {
        __classPrivateFieldSet(this, _GovernanceActionId_index, index, "f");
        __classPrivateFieldSet(this, _GovernanceActionId_originalBytes, undefined, "f");
    }
    equals(other) {
        return __classPrivateFieldGet(this, _GovernanceActionId_index, "f") === __classPrivateFieldGet(other, _GovernanceActionId_index, "f") && __classPrivateFieldGet(this, _GovernanceActionId_id, "f") === __classPrivateFieldGet(other, _GovernanceActionId_id, "f");
    }
}
_GovernanceActionId_id = new WeakMap(), _GovernanceActionId_index = new WeakMap(), _GovernanceActionId_originalBytes = new WeakMap();
