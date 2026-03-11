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
var _ProposedProtocolParameterUpdates_proposedUpdates, _ProposedProtocolParameterUpdates_originalBytes;
import * as Crypto from '@cardano-sdk/crypto';
import { CborReader, CborReaderState, CborWriter } from '../CBOR/index.js';
import { HexBlob } from '@cardano-sdk/util';
import { ProtocolParamUpdate } from './ProtocolParamUpdate.js';
export class ProposedProtocolParameterUpdates {
    constructor(proposedUpdates) {
        _ProposedProtocolParameterUpdates_proposedUpdates.set(this, new Map());
        _ProposedProtocolParameterUpdates_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _ProposedProtocolParameterUpdates_proposedUpdates, proposedUpdates, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _ProposedProtocolParameterUpdates_originalBytes, "f"))
            return __classPrivateFieldGet(this, _ProposedProtocolParameterUpdates_originalBytes, "f");
        const sortedCanonically = new Map([...__classPrivateFieldGet(this, _ProposedProtocolParameterUpdates_proposedUpdates, "f")].sort((a, b) => (a > b ? 1 : -1)));
        writer.writeStartMap(sortedCanonically.size);
        for (const [key, value] of sortedCanonically) {
            writer.writeByteString(Buffer.from(key, 'hex'));
            writer.writeEncodedValue(Buffer.from(value.toCbor(), 'hex'));
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const proposedUpdates = new Map();
        reader.readStartMap();
        while (reader.peekState() !== CborReaderState.EndMap) {
            const genesisHash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
            const params = ProtocolParamUpdate.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
            proposedUpdates.set(genesisHash, params);
        }
        reader.readEndMap();
        const updates = new ProposedProtocolParameterUpdates(proposedUpdates);
        __classPrivateFieldSet(updates, _ProposedProtocolParameterUpdates_originalBytes, cbor, "f");
        return updates;
    }
    toCore() {
        return new Map([...__classPrivateFieldGet(this, _ProposedProtocolParameterUpdates_proposedUpdates, "f")].map(([key, value]) => [key, value.toCore()]));
    }
    static fromCore(updates) {
        return new ProposedProtocolParameterUpdates(new Map([...updates].map(([key, value]) => [key, ProtocolParamUpdate.fromCore(value)])));
    }
    size() {
        return __classPrivateFieldGet(this, _ProposedProtocolParameterUpdates_proposedUpdates, "f").size;
    }
    insert(key, value) {
        __classPrivateFieldGet(this, _ProposedProtocolParameterUpdates_proposedUpdates, "f").set(key, value);
    }
    get(key) {
        return __classPrivateFieldGet(this, _ProposedProtocolParameterUpdates_proposedUpdates, "f").get(key);
    }
    keys() {
        return [...__classPrivateFieldGet(this, _ProposedProtocolParameterUpdates_proposedUpdates, "f").keys()];
    }
}
_ProposedProtocolParameterUpdates_proposedUpdates = new WeakMap(), _ProposedProtocolParameterUpdates_originalBytes = new WeakMap();
