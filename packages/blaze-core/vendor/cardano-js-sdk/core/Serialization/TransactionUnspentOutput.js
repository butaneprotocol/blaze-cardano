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
var _TransactionUnspentOutput_input, _TransactionUnspentOutput_output, _TransactionUnspentOutput_originalBytes;
import { CborReader, CborWriter } from './CBOR/index.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { TransactionInput, TransactionOutput } from './TransactionBody/index.js';
import { hexToBytes } from '../util/misc/index.js';
const TRANSACTION_UNSPENT_OUTPUT_ARRAY_SIZE = 2;
export class TransactionUnspentOutput {
    constructor(input, output) {
        _TransactionUnspentOutput_input.set(this, void 0);
        _TransactionUnspentOutput_output.set(this, void 0);
        _TransactionUnspentOutput_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _TransactionUnspentOutput_input, input, "f");
        __classPrivateFieldSet(this, _TransactionUnspentOutput_output, output, "f");
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _TransactionUnspentOutput_originalBytes, "f"))
            return __classPrivateFieldGet(this, _TransactionUnspentOutput_originalBytes, "f");
        const writer = new CborWriter();
        writer.writeStartArray(TRANSACTION_UNSPENT_OUTPUT_ARRAY_SIZE);
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _TransactionUnspentOutput_input, "f").toCbor()));
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _TransactionUnspentOutput_output, "f").toCbor()));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== TRANSACTION_UNSPENT_OUTPUT_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${TRANSACTION_UNSPENT_OUTPUT_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const input = TransactionInput.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const output = TransactionOutput.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const result = new TransactionUnspentOutput(input, output);
        __classPrivateFieldSet(result, _TransactionUnspentOutput_originalBytes, cbor, "f");
        return result;
    }
    toCore() {
        return [__classPrivateFieldGet(this, _TransactionUnspentOutput_input, "f").toCore(), __classPrivateFieldGet(this, _TransactionUnspentOutput_output, "f").toCore()];
    }
    static fromCore(core) {
        return new TransactionUnspentOutput(TransactionInput.fromCore(core[0]), TransactionOutput.fromCore(core[1]));
    }
    input() {
        return __classPrivateFieldGet(this, _TransactionUnspentOutput_input, "f");
    }
    setInput(input) {
        __classPrivateFieldSet(this, _TransactionUnspentOutput_input, input, "f");
        __classPrivateFieldSet(this, _TransactionUnspentOutput_originalBytes, undefined, "f");
    }
    output() {
        return __classPrivateFieldGet(this, _TransactionUnspentOutput_output, "f");
    }
    setOutput(output) {
        __classPrivateFieldSet(this, _TransactionUnspentOutput_output, output, "f");
        __classPrivateFieldSet(this, _TransactionUnspentOutput_originalBytes, undefined, "f");
    }
}
_TransactionUnspentOutput_input = new WeakMap(), _TransactionUnspentOutput_output = new WeakMap(), _TransactionUnspentOutput_originalBytes = new WeakMap();
