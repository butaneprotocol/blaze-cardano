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
var _Redeemer_tag, _Redeemer_index, _Redeemer_data, _Redeemer_exUnits, _Redeemer_originalBytes;
import * as Crypto from '@cardano-sdk/crypto';
import { CborReader, CborWriter } from '../../CBOR/index.js';
import { ExUnits } from '../../Common/index.js';
import { HexBlob, InvalidArgumentError, InvalidStateError } from '@cardano-sdk/util';
import { PlutusData } from '../../PlutusData/index.js';
import { RedeemerPurpose } from '../../../Cardano/types/Transaction.js';
import { RedeemerTag } from './RedeemerTag.js';
import { hexToBytes } from '../../../util/misc/index.js';
const REDEEMER_ARRAY_SIZE = 4;
const HASH_LENGTH_IN_BYTES = 32;
export class Redeemer {
    constructor(tag, index, data, exUnits) {
        _Redeemer_tag.set(this, void 0);
        _Redeemer_index.set(this, void 0);
        _Redeemer_data.set(this, void 0);
        _Redeemer_exUnits.set(this, void 0);
        _Redeemer_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _Redeemer_tag, tag, "f");
        __classPrivateFieldSet(this, _Redeemer_index, index, "f");
        __classPrivateFieldSet(this, _Redeemer_data, data, "f");
        __classPrivateFieldSet(this, _Redeemer_exUnits, exUnits, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _Redeemer_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Redeemer_originalBytes, "f");
        writer.writeStartArray(REDEEMER_ARRAY_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _Redeemer_tag, "f"));
        writer.writeInt(__classPrivateFieldGet(this, _Redeemer_index, "f"));
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _Redeemer_data, "f").toCbor()));
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _Redeemer_exUnits, "f").toCbor()));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== REDEEMER_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${REDEEMER_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const tag = Number(reader.readUInt());
        const index = reader.readUInt();
        const data = PlutusData.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const exUnits = ExUnits.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        reader.readEndArray();
        const redeemer = new Redeemer(tag, index, data, exUnits);
        __classPrivateFieldSet(redeemer, _Redeemer_originalBytes, cbor, "f");
        return redeemer;
    }
    toCore() {
        let purpose;
        switch (__classPrivateFieldGet(this, _Redeemer_tag, "f")) {
            case RedeemerTag.Spend:
                purpose = RedeemerPurpose.spend;
                break;
            case RedeemerTag.Mint:
                purpose = RedeemerPurpose.mint;
                break;
            case RedeemerTag.Cert:
                purpose = RedeemerPurpose.certificate;
                break;
            case RedeemerTag.Reward:
                purpose = RedeemerPurpose.withdrawal;
                break;
            case RedeemerTag.Voting:
                purpose = RedeemerPurpose.vote;
                break;
            case RedeemerTag.Proposing:
                purpose = RedeemerPurpose.propose;
                break;
            default:
                throw new InvalidStateError(`Invalid redeemer type ${__classPrivateFieldGet(this, _Redeemer_tag, "f")}`);
        }
        return {
            data: __classPrivateFieldGet(this, _Redeemer_data, "f").toCore(),
            executionUnits: __classPrivateFieldGet(this, _Redeemer_exUnits, "f").toCore(),
            index: Number(__classPrivateFieldGet(this, _Redeemer_index, "f")),
            purpose
        };
    }
    static fromCore(redeemer) {
        let tag;
        switch (redeemer.purpose) {
            case RedeemerPurpose.spend:
                tag = RedeemerTag.Spend;
                break;
            case RedeemerPurpose.mint:
                tag = RedeemerTag.Mint;
                break;
            case RedeemerPurpose.certificate:
                tag = RedeemerTag.Cert;
                break;
            case RedeemerPurpose.withdrawal:
                tag = RedeemerTag.Reward;
                break;
            case RedeemerPurpose.vote:
                tag = RedeemerTag.Voting;
                break;
            case RedeemerPurpose.propose:
                tag = RedeemerTag.Proposing;
                break;
            default:
                throw new InvalidStateError(`Invalid redeemer type ${redeemer.purpose}`);
        }
        return new Redeemer(tag, BigInt(redeemer.index), PlutusData.fromCore(redeemer.data), ExUnits.fromCore(redeemer.executionUnits));
    }
    tag() {
        return __classPrivateFieldGet(this, _Redeemer_tag, "f");
    }
    setTag(tag) {
        __classPrivateFieldSet(this, _Redeemer_tag, tag, "f");
        __classPrivateFieldSet(this, _Redeemer_originalBytes, undefined, "f");
    }
    index() {
        return __classPrivateFieldGet(this, _Redeemer_index, "f");
    }
    setIndex(index) {
        __classPrivateFieldSet(this, _Redeemer_index, index, "f");
        __classPrivateFieldSet(this, _Redeemer_originalBytes, undefined, "f");
    }
    data() {
        return __classPrivateFieldGet(this, _Redeemer_data, "f");
    }
    setData(data) {
        __classPrivateFieldSet(this, _Redeemer_data, data, "f");
        __classPrivateFieldSet(this, _Redeemer_originalBytes, undefined, "f");
    }
    exUnits() {
        return __classPrivateFieldGet(this, _Redeemer_exUnits, "f");
    }
    setExUnits(exUnits) {
        __classPrivateFieldSet(this, _Redeemer_exUnits, exUnits, "f");
        __classPrivateFieldSet(this, _Redeemer_originalBytes, undefined, "f");
    }
    hash() {
        return Crypto.blake2b.hash(this.toCbor(), HASH_LENGTH_IN_BYTES);
    }
}
_Redeemer_tag = new WeakMap(), _Redeemer_index = new WeakMap(), _Redeemer_data = new WeakMap(), _Redeemer_exUnits = new WeakMap(), _Redeemer_originalBytes = new WeakMap();
