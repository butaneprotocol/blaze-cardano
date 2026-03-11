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
var _GeneralTransactionMetadata_metadata, _GeneralTransactionMetadata_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { HexBlob } from "../../../../deps/util.js";
import { TransactionMetadatum } from './TransactionMetadatum.js';
import { hexToBytes } from '../../../util/misc/index.js';
export class GeneralTransactionMetadata {
    constructor(metadata) {
        _GeneralTransactionMetadata_metadata.set(this, void 0);
        _GeneralTransactionMetadata_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _GeneralTransactionMetadata_metadata, metadata, "f");
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _GeneralTransactionMetadata_originalBytes, "f"))
            return __classPrivateFieldGet(this, _GeneralTransactionMetadata_originalBytes, "f");
        const writer = new CborWriter();
        writer.writeStartMap(__classPrivateFieldGet(this, _GeneralTransactionMetadata_metadata, "f").size);
        for (const [key, val] of __classPrivateFieldGet(this, _GeneralTransactionMetadata_metadata, "f").entries()) {
            writer.writeInt(key);
            writer.writeEncodedValue(hexToBytes(val.toCbor()));
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const generalTransactionMetadata = new Map();
        const reader = new CborReader(cbor);
        reader.readStartMap();
        while (reader.peekState() !== CborReaderState.EndMap) {
            const label = reader.readInt();
            const metadatum = TransactionMetadatum.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
            generalTransactionMetadata.set(label, metadatum);
        }
        reader.readEndMap();
        return new GeneralTransactionMetadata(generalTransactionMetadata);
    }
    toCore() {
        return new Map([...__classPrivateFieldGet(this, _GeneralTransactionMetadata_metadata, "f").entries()].map((metadata) => [metadata[0], metadata[1].toCore()]));
    }
    static fromCore(metadata) {
        return new GeneralTransactionMetadata(new Map([...metadata.entries()].map((entry) => [entry[0], TransactionMetadatum.fromCore(entry[1])])));
    }
    metadata() {
        return __classPrivateFieldGet(this, _GeneralTransactionMetadata_metadata, "f");
    }
    setMetadata(metadata) {
        __classPrivateFieldSet(this, _GeneralTransactionMetadata_metadata, metadata, "f");
        __classPrivateFieldSet(this, _GeneralTransactionMetadata_originalBytes, undefined, "f");
    }
    equals(other) {
        if (__classPrivateFieldGet(this, _GeneralTransactionMetadata_originalBytes, "f") === __classPrivateFieldGet(other, _GeneralTransactionMetadata_originalBytes, "f"))
            return true;
        if (__classPrivateFieldGet(this, _GeneralTransactionMetadata_metadata, "f").size !== __classPrivateFieldGet(other, _GeneralTransactionMetadata_metadata, "f").size)
            return false;
        const thisEntries = [...__classPrivateFieldGet(this, _GeneralTransactionMetadata_metadata, "f").entries()];
        const otherEntries = [...__classPrivateFieldGet(other, _GeneralTransactionMetadata_metadata, "f").entries()];
        for (let i = 0; i < __classPrivateFieldGet(this, _GeneralTransactionMetadata_metadata, "f").size; ++i) {
            if (thisEntries[i][0] !== otherEntries[i][0])
                return false;
            if (!thisEntries[i][1].equals(otherEntries[i][1]))
                return false;
        }
        return true;
    }
}
_GeneralTransactionMetadata_metadata = new WeakMap(), _GeneralTransactionMetadata_originalBytes = new WeakMap();
