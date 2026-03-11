var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _MoveInstantaneousReward_toOtherPot, _MoveInstantaneousReward_toStakeCreds, _MoveInstantaneousReward_kind, _MoveInstantaneousReward_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { CertificateKind } from '../CertificateKind.js';
import { HexBlob, InvalidArgumentError, InvalidStateError } from "../../../../deps/util.js";
import { MirCertificateKind } from '../../../Cardano/types/Certificate.js';
import { MoveInstantaneousRewardToOtherPot } from './MoveInstantaneousRewardToOtherPot.js';
import { MoveInstantaneousRewardToStakeCreds } from './MoveInstantaneousRewardToStakeCreds.js';
const EMBEDDED_GROUP_SIZE = 2;
export class MoveInstantaneousReward {
    constructor() {
        _MoveInstantaneousReward_toOtherPot.set(this, void 0);
        _MoveInstantaneousReward_toStakeCreds.set(this, void 0);
        _MoveInstantaneousReward_kind.set(this, void 0);
        _MoveInstantaneousReward_originalBytes.set(this, undefined);
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _MoveInstantaneousReward_originalBytes, "f"))
            return __classPrivateFieldGet(this, _MoveInstantaneousReward_originalBytes, "f");
        let cbor;
        switch (__classPrivateFieldGet(this, _MoveInstantaneousReward_kind, "f")) {
            case MirCertificateKind.ToOtherPot:
                cbor = __classPrivateFieldGet(this, _MoveInstantaneousReward_toOtherPot, "f").toCbor();
                break;
            case MirCertificateKind.ToStakeCreds:
                cbor = __classPrivateFieldGet(this, _MoveInstantaneousReward_toStakeCreds, "f").toCbor();
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${__classPrivateFieldGet(this, _MoveInstantaneousReward_kind, "f")}`);
        }
        const writer = new CborWriter();
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(CertificateKind.MoveInstantaneousRewards);
        writer.writeEncodedValue(Buffer.from(cbor, 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        let elementsCount = reader.readStartArray();
        if (elementsCount !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected elements size ${EMBEDDED_GROUP_SIZE}, but got ${elementsCount}`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.MoveInstantaneousRewards)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.MoveInstantaneousRewards}, but got ${kind}`);
        const embeddedCbor = HexBlob.fromBytes(reader.readEncodedValue());
        const embeddedCborReader = new CborReader(embeddedCbor);
        elementsCount = embeddedCborReader.readStartArray();
        if (elementsCount !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected elements size ${EMBEDDED_GROUP_SIZE}, but got ${elementsCount}`);
        const cert = new MoveInstantaneousReward();
        embeddedCborReader.readInt();
        if (embeddedCborReader.peekState() === CborReaderState.UnsignedInteger) {
            __classPrivateFieldSet(cert, _MoveInstantaneousReward_toOtherPot, MoveInstantaneousRewardToOtherPot.fromCbor(embeddedCbor), "f");
            __classPrivateFieldSet(cert, _MoveInstantaneousReward_kind, MirCertificateKind.ToOtherPot, "f");
        }
        else if (embeddedCborReader.peekState() === CborReaderState.StartArray ||
            embeddedCborReader.peekState() === CborReaderState.StartMap) {
            __classPrivateFieldSet(cert, _MoveInstantaneousReward_toStakeCreds, MoveInstantaneousRewardToStakeCreds.fromCbor(embeddedCbor), "f");
            __classPrivateFieldSet(cert, _MoveInstantaneousReward_kind, MirCertificateKind.ToStakeCreds, "f");
        }
        else {
            throw new InvalidArgumentError('cbor', 'Invalid CBOR string');
        }
        __classPrivateFieldSet(cert, _MoveInstantaneousReward_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        let core;
        switch (__classPrivateFieldGet(this, _MoveInstantaneousReward_kind, "f")) {
            case MirCertificateKind.ToOtherPot:
                core = __classPrivateFieldGet(this, _MoveInstantaneousReward_toOtherPot, "f").toCore();
                break;
            case MirCertificateKind.ToStakeCreds:
                core = __classPrivateFieldGet(this, _MoveInstantaneousReward_toStakeCreds, "f").toCore();
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${__classPrivateFieldGet(this, _MoveInstantaneousReward_kind, "f")}`);
        }
        return core;
    }
    static fromCore(cert) {
        const mirCert = new MoveInstantaneousReward();
        switch (cert.kind) {
            case MirCertificateKind.ToOtherPot:
                __classPrivateFieldSet(mirCert, _MoveInstantaneousReward_toOtherPot, MoveInstantaneousRewardToOtherPot.fromCore(cert), "f");
                __classPrivateFieldSet(mirCert, _MoveInstantaneousReward_kind, MirCertificateKind.ToOtherPot, "f");
                break;
            case MirCertificateKind.ToStakeCreds:
                __classPrivateFieldSet(mirCert, _MoveInstantaneousReward_toStakeCreds, MoveInstantaneousRewardToStakeCreds.fromCore(cert), "f");
                __classPrivateFieldSet(mirCert, _MoveInstantaneousReward_kind, MirCertificateKind.ToStakeCreds, "f");
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${cert.kind}`);
        }
        return mirCert;
    }
    static newToOtherPot(mirCert) {
        const cert = new MoveInstantaneousReward();
        __classPrivateFieldSet(cert, _MoveInstantaneousReward_toOtherPot, mirCert, "f");
        __classPrivateFieldSet(cert, _MoveInstantaneousReward_kind, MirCertificateKind.ToOtherPot, "f");
        return cert;
    }
    static newToStakeCreds(mirCert) {
        const cert = new MoveInstantaneousReward();
        __classPrivateFieldSet(cert, _MoveInstantaneousReward_toStakeCreds, mirCert, "f");
        __classPrivateFieldSet(cert, _MoveInstantaneousReward_kind, MirCertificateKind.ToStakeCreds, "f");
        return cert;
    }
    kind() {
        return __classPrivateFieldGet(this, _MoveInstantaneousReward_kind, "f");
    }
    asToOtherPot() {
        return __classPrivateFieldGet(this, _MoveInstantaneousReward_toOtherPot, "f");
    }
    asToStakeCreds() {
        return __classPrivateFieldGet(this, _MoveInstantaneousReward_toStakeCreds, "f");
    }
}
_MoveInstantaneousReward_toOtherPot = new WeakMap(), _MoveInstantaneousReward_toStakeCreds = new WeakMap(), _MoveInstantaneousReward_kind = new WeakMap(), _MoveInstantaneousReward_originalBytes = new WeakMap();
