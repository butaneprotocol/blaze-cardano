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
var _VotingProcedure_vote, _VotingProcedure_anchor, _VotingProcedure_originalBytes;
import { Anchor } from '../../Common/Anchor.js';
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { HexBlob } from "../../../../deps/util.js";
import { hexToBytes } from '../../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 2;
export class VotingProcedure {
    constructor(vote, anchor) {
        _VotingProcedure_vote.set(this, void 0);
        _VotingProcedure_anchor.set(this, void 0);
        _VotingProcedure_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _VotingProcedure_vote, vote, "f");
        __classPrivateFieldSet(this, _VotingProcedure_anchor, anchor, "f");
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _VotingProcedure_originalBytes, "f"))
            return __classPrivateFieldGet(this, _VotingProcedure_originalBytes, "f");
        const writer = new CborWriter();
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _VotingProcedure_vote, "f"));
        __classPrivateFieldGet(this, _VotingProcedure_anchor, "f") ? writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _VotingProcedure_anchor, "f").toCbor())) : writer.writeNull();
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        reader.readStartArray();
        const vote = Number(reader.readInt());
        let anchor;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
            anchor = undefined;
        }
        else {
            anchor = Anchor.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        }
        const votingProcedure = new VotingProcedure(vote, anchor);
        __classPrivateFieldSet(votingProcedure, _VotingProcedure_originalBytes, cbor, "f");
        return votingProcedure;
    }
    toCore() {
        return {
            anchor: __classPrivateFieldGet(this, _VotingProcedure_anchor, "f") ? __classPrivateFieldGet(this, _VotingProcedure_anchor, "f").toCore() : null,
            vote: __classPrivateFieldGet(this, _VotingProcedure_vote, "f")
        };
    }
    static fromCore(votingProcedure) {
        return new VotingProcedure(votingProcedure.vote, votingProcedure.anchor ? Anchor.fromCore(votingProcedure.anchor) : undefined);
    }
    vote() {
        return __classPrivateFieldGet(this, _VotingProcedure_vote, "f");
    }
    setVote(vote) {
        __classPrivateFieldSet(this, _VotingProcedure_vote, vote, "f");
        __classPrivateFieldSet(this, _VotingProcedure_originalBytes, undefined, "f");
    }
    anchor() {
        return __classPrivateFieldGet(this, _VotingProcedure_anchor, "f");
    }
    setAnchor(anchor) {
        __classPrivateFieldSet(this, _VotingProcedure_anchor, anchor, "f");
        __classPrivateFieldSet(this, _VotingProcedure_originalBytes, undefined, "f");
    }
}
_VotingProcedure_vote = new WeakMap(), _VotingProcedure_anchor = new WeakMap(), _VotingProcedure_originalBytes = new WeakMap();
