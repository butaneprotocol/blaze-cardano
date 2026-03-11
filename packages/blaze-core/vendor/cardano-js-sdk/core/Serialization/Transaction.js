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
var _Transaction_body, _Transaction_witnessSet, _Transaction_auxiliaryData, _Transaction_isValid, _Transaction_originalBytes;
import { AuxiliaryData } from './AuxiliaryData/index.js';
import { CborReader, CborReaderState, CborWriter } from './CBOR/index.js';
import { HexBlob } from '@cardano-sdk/util';
import { TransactionBody } from './TransactionBody/index.js';
import { TransactionWitnessSet } from './TransactionWitnessSet/index.js';
import { hexToBytes } from '../util/misc/index.js';
const ALONZO_ERA_TX_FRAME_SIZE = 4;
export class Transaction {
    constructor(body, witnessSet, auxiliaryData) {
        _Transaction_body.set(this, void 0);
        _Transaction_witnessSet.set(this, void 0);
        _Transaction_auxiliaryData.set(this, void 0);
        _Transaction_isValid.set(this, true);
        _Transaction_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _Transaction_body, body, "f");
        __classPrivateFieldSet(this, _Transaction_witnessSet, witnessSet, "f");
        __classPrivateFieldSet(this, _Transaction_auxiliaryData, auxiliaryData, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _Transaction_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Transaction_originalBytes, "f");
        writer.writeStartArray(ALONZO_ERA_TX_FRAME_SIZE);
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _Transaction_body, "f").toCbor()));
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _Transaction_witnessSet, "f").toCbor()));
        writer.writeBoolean(__classPrivateFieldGet(this, _Transaction_isValid, "f"));
        if (__classPrivateFieldGet(this, _Transaction_auxiliaryData, "f")) {
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _Transaction_auxiliaryData, "f").toCbor()));
        }
        else {
            writer.writeNull();
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        const bodyBytes = reader.readEncodedValue();
        const body = TransactionBody.fromCbor(HexBlob.fromBytes(bodyBytes));
        const witnessSet = TransactionWitnessSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        let isValid = true;
        if (length === ALONZO_ERA_TX_FRAME_SIZE) {
            isValid = reader.readBoolean();
        }
        let auxData;
        if (reader.peekState() !== CborReaderState.Null)
            auxData = AuxiliaryData.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const tx = new Transaction(body, witnessSet, auxData);
        __classPrivateFieldSet(tx, _Transaction_isValid, isValid, "f");
        __classPrivateFieldSet(tx, _Transaction_originalBytes, cbor, "f");
        return tx;
    }
    toCore() {
        const tx = {
            body: __classPrivateFieldGet(this, _Transaction_body, "f").toCore(),
            id: this.getId(),
            isValid: __classPrivateFieldGet(this, _Transaction_isValid, "f"),
            witness: __classPrivateFieldGet(this, _Transaction_witnessSet, "f").toCore()
        };
        if (__classPrivateFieldGet(this, _Transaction_auxiliaryData, "f")) {
            tx.auxiliaryData = __classPrivateFieldGet(this, _Transaction_auxiliaryData, "f").toCore();
        }
        return tx;
    }
    static fromCore(tx) {
        const transaction = new Transaction(TransactionBody.fromCore(tx.body), TransactionWitnessSet.fromCore(tx.witness), tx.auxiliaryData ? AuxiliaryData.fromCore(tx.auxiliaryData) : undefined);
        if (typeof tx.isValid !== 'undefined')
            transaction.setIsValid(tx.isValid);
        return transaction;
    }
    body() {
        return TransactionBody.fromCbor(__classPrivateFieldGet(this, _Transaction_body, "f").toCbor());
    }
    setBody(body) {
        __classPrivateFieldSet(this, _Transaction_body, body, "f");
        __classPrivateFieldSet(this, _Transaction_originalBytes, undefined, "f");
    }
    witnessSet() {
        return TransactionWitnessSet.fromCbor(__classPrivateFieldGet(this, _Transaction_witnessSet, "f").toCbor());
    }
    setWitnessSet(witnessSet) {
        __classPrivateFieldSet(this, _Transaction_witnessSet, witnessSet, "f");
        __classPrivateFieldSet(this, _Transaction_originalBytes, undefined, "f");
    }
    isValid() {
        return __classPrivateFieldGet(this, _Transaction_isValid, "f");
    }
    setIsValid(valid) {
        __classPrivateFieldSet(this, _Transaction_originalBytes, undefined, "f");
        __classPrivateFieldSet(this, _Transaction_isValid, valid, "f");
    }
    auxiliaryData() {
        if (__classPrivateFieldGet(this, _Transaction_auxiliaryData, "f")) {
            return AuxiliaryData.fromCbor(__classPrivateFieldGet(this, _Transaction_auxiliaryData, "f").toCbor());
        }
        return undefined;
    }
    setAuxiliaryData(auxiliaryData) {
        __classPrivateFieldSet(this, _Transaction_auxiliaryData, auxiliaryData, "f");
        __classPrivateFieldSet(this, _Transaction_originalBytes, undefined, "f");
    }
    getId() {
        return __classPrivateFieldGet(this, _Transaction_body, "f").hash();
    }
    clone() {
        const bytes = this.toCbor();
        return Transaction.fromCbor(bytes);
    }
}
_Transaction_body = new WeakMap(), _Transaction_witnessSet = new WeakMap(), _Transaction_auxiliaryData = new WeakMap(), _Transaction_isValid = new WeakMap(), _Transaction_originalBytes = new WeakMap();
export const TxCBOR = (tx) => HexBlob(tx);
TxCBOR.serialize = (tx) => Transaction.fromCore(tx).toCbor();
export const TxBodyCBOR = (tx) => HexBlob(tx);
TxBodyCBOR.fromTxCBOR = (txCbor) => Transaction.fromCbor(txCbor).body().toCbor();
export const deserializeTx = ((txBody) => {
    const hex = txBody instanceof Buffer
        ? txBody.toString('hex')
        : txBody instanceof Uint8Array
            ? Buffer.from(txBody).toString('hex')
            : txBody;
    const transaction = Transaction.fromCbor(TxCBOR(hex));
    return transaction.toCore();
});
TxCBOR.deserialize = (tx) => deserializeTx(tx);
