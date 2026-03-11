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
var _TransactionInput_id, _TransactionInput_index, _TransactionInput_originalBytes;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
const TRANSACTION_INPUT_ARRAY_SIZE = 2;
export class TransactionInput {
    constructor(id, index) {
        _TransactionInput_id.set(this, void 0);
        _TransactionInput_index.set(this, void 0);
        _TransactionInput_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _TransactionInput_id, id, "f");
        __classPrivateFieldSet(this, _TransactionInput_index, index, "f");
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _TransactionInput_originalBytes, "f"))
            return __classPrivateFieldGet(this, _TransactionInput_originalBytes, "f");
        const writer = new CborWriter();
        writer.writeStartArray(TRANSACTION_INPUT_ARRAY_SIZE);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _TransactionInput_id, "f"), 'hex'));
        writer.writeInt(__classPrivateFieldGet(this, _TransactionInput_index, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== TRANSACTION_INPUT_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${TRANSACTION_INPUT_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const txId = reader.readByteString();
        const index = reader.readInt();
        const input = new TransactionInput(HexBlob.fromBytes(txId), index);
        __classPrivateFieldSet(input, _TransactionInput_originalBytes, cbor, "f");
        return input;
    }
    toCore() {
        return {
            index: Number(__classPrivateFieldGet(this, _TransactionInput_index, "f")),
            txId: __classPrivateFieldGet(this, _TransactionInput_id, "f")
        };
    }
    static fromCore(coreTransactionInput) {
        return new TransactionInput(coreTransactionInput.txId, BigInt(coreTransactionInput.index));
    }
    transactionId() {
        return __classPrivateFieldGet(this, _TransactionInput_id, "f");
    }
    setTransactionId(id) {
        __classPrivateFieldSet(this, _TransactionInput_id, id, "f");
        __classPrivateFieldSet(this, _TransactionInput_originalBytes, undefined, "f");
    }
    index() {
        return __classPrivateFieldGet(this, _TransactionInput_index, "f");
    }
    setIndex(index) {
        __classPrivateFieldSet(this, _TransactionInput_index, index, "f");
        __classPrivateFieldSet(this, _TransactionInput_originalBytes, undefined, "f");
    }
}
_TransactionInput_id = new WeakMap(), _TransactionInput_index = new WeakMap(), _TransactionInput_originalBytes = new WeakMap();
