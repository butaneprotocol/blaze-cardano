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
var _TransactionOutput_instances, _TransactionOutput_address, _TransactionOutput_amount, _TransactionOutput_datum, _TransactionOutput_scriptRef, _TransactionOutput_originalBytes, _TransactionOutput_getMapSize;
import { Address } from '../../Cardano/Address/index.js';
import { CborReader, CborReaderState, CborTag, CborWriter } from '../CBOR/index.js';
import { Datum, DatumKind } from '../Common/Datum.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { PlutusData } from '../PlutusData/index.js';
import { Script } from '../Scripts/index.js';
import { Value } from './Value.js';
export const REQUIRED_FIELDS_COUNT = 2;
export class TransactionOutput {
    constructor(address, amount) {
        _TransactionOutput_instances.add(this);
        _TransactionOutput_address.set(this, void 0);
        _TransactionOutput_amount.set(this, void 0);
        _TransactionOutput_datum.set(this, void 0);
        _TransactionOutput_scriptRef.set(this, void 0);
        _TransactionOutput_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _TransactionOutput_address, address, "f");
        __classPrivateFieldSet(this, _TransactionOutput_amount, amount, "f");
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _TransactionOutput_originalBytes, "f"))
            return __classPrivateFieldGet(this, _TransactionOutput_originalBytes, "f");
        const writer = new CborWriter();
        const elementsSize = __classPrivateFieldGet(this, _TransactionOutput_instances, "m", _TransactionOutput_getMapSize).call(this);
        if (elementsSize === REQUIRED_FIELDS_COUNT ||
            (elementsSize === 3 && __classPrivateFieldGet(this, _TransactionOutput_datum, "f") !== undefined && __classPrivateFieldGet(this, _TransactionOutput_datum, "f").kind() === DatumKind.DataHash)) {
            writer.writeStartArray(elementsSize);
            writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _TransactionOutput_address, "f").toBytes(), 'hex'));
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _TransactionOutput_amount, "f").toCbor(), 'hex'));
            if (__classPrivateFieldGet(this, _TransactionOutput_datum, "f") !== undefined) {
                writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _TransactionOutput_datum, "f").asDataHash(), 'hex'));
            }
        }
        else {
            writer.writeStartMap(elementsSize);
            writer.writeInt(0n);
            writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _TransactionOutput_address, "f").toBytes(), 'hex'));
            writer.writeInt(1n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _TransactionOutput_amount, "f").toCbor(), 'hex'));
            if (__classPrivateFieldGet(this, _TransactionOutput_datum, "f") !== undefined) {
                writer.writeInt(2n);
                writer.writeStartArray(2);
                writer.writeInt(__classPrivateFieldGet(this, _TransactionOutput_datum, "f").kind());
                switch (__classPrivateFieldGet(this, _TransactionOutput_datum, "f").kind()) {
                    case DatumKind.DataHash:
                        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _TransactionOutput_datum, "f").asDataHash(), 'hex'));
                        break;
                    case DatumKind.InlineData:
                        writer.writeTag(CborTag.EncodedCborDataItem);
                        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _TransactionOutput_datum, "f").asInlineData().toCbor(), 'hex'));
                        break;
                }
            }
            if (__classPrivateFieldGet(this, _TransactionOutput_scriptRef, "f") !== undefined) {
                writer.writeInt(3n);
                writer.writeTag(CborTag.EncodedCborDataItem);
                writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _TransactionOutput_scriptRef, "f").toCbor(), 'hex'));
            }
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        let address;
        let value;
        let datum;
        let scriptRef;
        if (reader.peekState() === CborReaderState.StartMap) {
            reader.readStartMap();
            while (reader.peekState() !== CborReaderState.EndMap) {
                const key = reader.readInt();
                switch (key) {
                    case 0n:
                        address = Address.fromBytes(HexBlob.fromBytes(reader.readByteString()));
                        break;
                    case 1n:
                        value = Value.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
                        break;
                    case 2n: {
                        const datumReader = new CborReader(HexBlob.fromBytes(reader.readEncodedValue()));
                        datumReader.readStartArray();
                        const datumKind = Number(datumReader.readInt());
                        if (datumKind === DatumKind.InlineData) {
                            const tag = datumReader.readTag();
                            if (tag !== CborTag.EncodedCborDataItem)
                                throw new InvalidArgumentError('cbor', `Expected tag ${CborTag.EncodedCborDataItem} but got ${tag}`);
                        }
                        const encodedDatum = datumReader.readByteString();
                        let dataHash;
                        let inlineDatum;
                        if (datumKind === DatumKind.DataHash)
                            dataHash = HexBlob.fromBytes(encodedDatum);
                        if (datumKind === DatumKind.InlineData)
                            inlineDatum = PlutusData.fromCbor(HexBlob.fromBytes(encodedDatum));
                        datum = new Datum(dataHash, inlineDatum);
                        break;
                    }
                    case 3n: {
                        const scriptReader = new CborReader(HexBlob.fromBytes(reader.readEncodedValue()));
                        const tag = scriptReader.readTag();
                        if (tag !== CborTag.EncodedCborDataItem)
                            throw new InvalidArgumentError('cbor', `Expected tag ${CborTag.EncodedCborDataItem} but got ${tag}`);
                        const encodedDatum = scriptReader.readByteString();
                        scriptRef = Script.fromCbor(HexBlob.fromBytes(encodedDatum));
                        break;
                    }
                }
            }
            reader.readEndMap();
        }
        else {
            const length = reader.readStartArray();
            address = Address.fromBytes(HexBlob.fromBytes(reader.readByteString()));
            value = Value.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
            if (length === 3) {
                const datumHash = reader.readByteString();
                datum = Datum.newDataHash(HexBlob.fromBytes(datumHash));
            }
        }
        if (!address)
            throw new InvalidArgumentError('cbor', 'Transaction output does not contain an address.');
        if (!value)
            throw new InvalidArgumentError('cbor', 'Transaction output does not contain a value.');
        const output = new TransactionOutput(address, value);
        if (datum)
            output.setDatum(datum);
        if (scriptRef)
            output.setScriptRef(scriptRef);
        __classPrivateFieldSet(output, _TransactionOutput_originalBytes, cbor, "f");
        return output;
    }
    toCore() {
        const value = __classPrivateFieldGet(this, _TransactionOutput_amount, "f").toCore();
        if (!value.assets)
            delete value.assets;
        const txOut = {
            address: __classPrivateFieldGet(this, _TransactionOutput_address, "f").asByron()
                ? __classPrivateFieldGet(this, _TransactionOutput_address, "f").toBase58()
                : __classPrivateFieldGet(this, _TransactionOutput_address, "f").toBech32(),
            value
        };
        if (__classPrivateFieldGet(this, _TransactionOutput_datum, "f") && __classPrivateFieldGet(this, _TransactionOutput_datum, "f").kind() === DatumKind.InlineData)
            txOut.datum = __classPrivateFieldGet(this, _TransactionOutput_datum, "f").asInlineData()?.toCore();
        if (__classPrivateFieldGet(this, _TransactionOutput_datum, "f") && __classPrivateFieldGet(this, _TransactionOutput_datum, "f").kind() === DatumKind.DataHash)
            txOut.datumHash = __classPrivateFieldGet(this, _TransactionOutput_datum, "f").asDataHash();
        if (__classPrivateFieldGet(this, _TransactionOutput_scriptRef, "f"))
            txOut.scriptReference = __classPrivateFieldGet(this, _TransactionOutput_scriptRef, "f").toCore();
        return txOut;
    }
    static fromCore(coreTransactionOutput) {
        const address = Address.fromString(coreTransactionOutput.address);
        if (!address)
            throw new InvalidArgumentError('coreTransactionOutput', `Invalid address ${address}`);
        const out = new TransactionOutput(address, Value.fromCore(coreTransactionOutput.value));
        if (coreTransactionOutput.datum)
            out.setDatum(Datum.fromCore(coreTransactionOutput.datum));
        if (coreTransactionOutput.datumHash)
            out.setDatum(Datum.fromCore(coreTransactionOutput.datumHash));
        if (coreTransactionOutput.scriptReference)
            out.setScriptRef(Script.fromCore(coreTransactionOutput.scriptReference));
        return out;
    }
    address() {
        return __classPrivateFieldGet(this, _TransactionOutput_address, "f");
    }
    amount() {
        return __classPrivateFieldGet(this, _TransactionOutput_amount, "f");
    }
    datum() {
        return __classPrivateFieldGet(this, _TransactionOutput_datum, "f");
    }
    setDatum(data) {
        __classPrivateFieldSet(this, _TransactionOutput_datum, data, "f");
    }
    scriptRef() {
        return __classPrivateFieldGet(this, _TransactionOutput_scriptRef, "f");
    }
    setScriptRef(script) {
        __classPrivateFieldSet(this, _TransactionOutput_scriptRef, script, "f");
    }
    isBabbageOutput() {
        const reader = new CborReader(this.toCbor());
        return reader.peekState() === CborReaderState.StartMap;
    }
}
_TransactionOutput_address = new WeakMap(), _TransactionOutput_amount = new WeakMap(), _TransactionOutput_datum = new WeakMap(), _TransactionOutput_scriptRef = new WeakMap(), _TransactionOutput_originalBytes = new WeakMap(), _TransactionOutput_instances = new WeakSet(), _TransactionOutput_getMapSize = function _TransactionOutput_getMapSize() {
    let mapSize = REQUIRED_FIELDS_COUNT;
    if (__classPrivateFieldGet(this, _TransactionOutput_datum, "f"))
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionOutput_scriptRef, "f"))
        ++mapSize;
    return mapSize;
};
