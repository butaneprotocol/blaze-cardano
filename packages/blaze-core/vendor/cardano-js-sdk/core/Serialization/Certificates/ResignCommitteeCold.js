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
var _ResignCommitteeCold_committeeColdCred, _ResignCommitteeCold_anchor, _ResignCommitteeCold_originalBytes;
import * as Crypto from "../../../deps/crypto.js";
import { Anchor } from '../Common/index.js';
import { CborReader, CborReaderState, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
import { hexToBytes } from '../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 2;
export class ResignCommitteeCold {
    constructor(committeeColdCred, anchor) {
        _ResignCommitteeCold_committeeColdCred.set(this, void 0);
        _ResignCommitteeCold_anchor.set(this, void 0);
        _ResignCommitteeCold_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _ResignCommitteeCold_committeeColdCred, committeeColdCred, "f");
        __classPrivateFieldSet(this, _ResignCommitteeCold_anchor, anchor, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _ResignCommitteeCold_originalBytes, "f"))
            return __classPrivateFieldGet(this, _ResignCommitteeCold_originalBytes, "f");
        writer.writeStartArray(3);
        writer.writeInt(CertificateKind.ResignCommitteeCold);
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _ResignCommitteeCold_committeeColdCred, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _ResignCommitteeCold_committeeColdCred, "f").hash, 'hex'));
        if (__classPrivateFieldGet(this, _ResignCommitteeCold_anchor, "f")) {
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _ResignCommitteeCold_anchor, "f").toCbor()));
        }
        else {
            writer.writeNull();
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== 3)
            throw new InvalidArgumentError('cbor', `Expected an array of 3 elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.ResignCommitteeCold)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.ResignCommitteeCold}, but got ${kind}`);
        const coldCredLength = reader.readStartArray();
        if (coldCredLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const coldType = Number(reader.readInt());
        const coldHash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        let anchor;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
        }
        else {
            anchor = Anchor.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        }
        reader.readEndArray();
        const cert = new ResignCommitteeCold({ hash: coldHash, type: coldType }, anchor);
        __classPrivateFieldSet(cert, _ResignCommitteeCold_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.ResignCommitteeCold,
            anchor: __classPrivateFieldGet(this, _ResignCommitteeCold_anchor, "f") ? __classPrivateFieldGet(this, _ResignCommitteeCold_anchor, "f").toCore() : null,
            coldCredential: __classPrivateFieldGet(this, _ResignCommitteeCold_committeeColdCred, "f")
        };
    }
    static fromCore(cert) {
        return new ResignCommitteeCold(cert.coldCredential, cert.anchor ? Anchor.fromCore(cert.anchor) : undefined);
    }
    coldCredential() {
        return __classPrivateFieldGet(this, _ResignCommitteeCold_committeeColdCred, "f");
    }
    anchor() {
        return __classPrivateFieldGet(this, _ResignCommitteeCold_anchor, "f");
    }
}
_ResignCommitteeCold_committeeColdCred = new WeakMap(), _ResignCommitteeCold_anchor = new WeakMap(), _ResignCommitteeCold_originalBytes = new WeakMap();
