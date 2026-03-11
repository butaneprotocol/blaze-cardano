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
var _Update_epoch, _Update_updates, _Update_originalBytes;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { EpochNo } from '../../Cardano/types/Block.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { ProposedProtocolParameterUpdates } from './ProposedProtocolParameterUpdates.js';
const UPDATE_ARRAY_SIZE = 2;
export class Update {
    constructor(updates, epoch) {
        _Update_epoch.set(this, void 0);
        _Update_updates.set(this, void 0);
        _Update_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _Update_epoch, epoch, "f");
        __classPrivateFieldSet(this, _Update_updates, updates, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _Update_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Update_originalBytes, "f");
        writer.writeStartArray(UPDATE_ARRAY_SIZE);
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _Update_updates, "f").toCbor(), 'hex'));
        writer.writeInt(__classPrivateFieldGet(this, _Update_epoch, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== UPDATE_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${UPDATE_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const updates = ProposedProtocolParameterUpdates.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const epoch = reader.readInt();
        reader.readEndArray();
        const exUnit = new Update(updates, EpochNo(Number(epoch)));
        __classPrivateFieldSet(exUnit, _Update_originalBytes, cbor, "f");
        return exUnit;
    }
    toCore() {
        return {
            epoch: __classPrivateFieldGet(this, _Update_epoch, "f"),
            proposedProtocolParameterUpdates: __classPrivateFieldGet(this, _Update_updates, "f").toCore()
        };
    }
    static fromCore(update) {
        const epoch = update.epoch;
        const updates = ProposedProtocolParameterUpdates.fromCore(update.proposedProtocolParameterUpdates);
        return new Update(updates, epoch);
    }
    epoch() {
        return __classPrivateFieldGet(this, _Update_epoch, "f");
    }
    setEpoch(epoch) {
        __classPrivateFieldSet(this, _Update_epoch, epoch, "f");
        __classPrivateFieldSet(this, _Update_originalBytes, undefined, "f");
    }
    proposedProtocolParameterUpdates() {
        return __classPrivateFieldGet(this, _Update_updates, "f");
    }
    setProposedProtocolParameterUpdates(updates) {
        __classPrivateFieldSet(this, _Update_updates, updates, "f");
        __classPrivateFieldSet(this, _Update_originalBytes, undefined, "f");
    }
}
_Update_epoch = new WeakMap(), _Update_updates = new WeakMap(), _Update_originalBytes = new WeakMap();
