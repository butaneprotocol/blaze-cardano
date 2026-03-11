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
var _MoveInstantaneousRewardToStakeCreds_pot, _MoveInstantaneousRewardToStakeCreds_credentials, _MoveInstantaneousRewardToStakeCreds_originalBytes;
import * as Crypto from "../../../../deps/crypto.js";
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { CertificateType, MirCertificateKind, MirCertificatePot } from '../../../Cardano/types/Certificate.js';
import { HexBlob, InvalidArgumentError, InvalidStateError } from "../../../../deps/util.js";
const EMBEDDED_GROUP_SIZE = 2;
export class MoveInstantaneousRewardToStakeCreds {
    constructor(pot, credentials) {
        _MoveInstantaneousRewardToStakeCreds_pot.set(this, void 0);
        _MoveInstantaneousRewardToStakeCreds_credentials.set(this, void 0);
        _MoveInstantaneousRewardToStakeCreds_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _MoveInstantaneousRewardToStakeCreds_pot, pot, "f");
        __classPrivateFieldSet(this, _MoveInstantaneousRewardToStakeCreds_credentials, credentials, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _MoveInstantaneousRewardToStakeCreds_originalBytes, "f"))
            return __classPrivateFieldGet(this, _MoveInstantaneousRewardToStakeCreds_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _MoveInstantaneousRewardToStakeCreds_pot, "f") === MirCertificatePot.Reserves ? 0 : 1);
        const sortedCanonically = new Map([...__classPrivateFieldGet(this, _MoveInstantaneousRewardToStakeCreds_credentials, "f")].sort((a, b) => (a > b ? 1 : -1)));
        writer.writeStartMap(sortedCanonically.size);
        for (const [key, value] of sortedCanonically) {
            writer.writeStartArray(EMBEDDED_GROUP_SIZE);
            writer.writeInt(key.type);
            writer.writeByteString(Buffer.from(key.hash, 'hex'));
            writer.writeInt(value);
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of two elements, but got an array of ${length} elements`);
        const pot = Number(reader.readInt());
        if (pot < 0 || pot > 1)
            throw new InvalidArgumentError('cbor', `Expected a pot value between 0 and 1, but got an array of ${pot} elements`);
        reader.readStartMap();
        const amounts = new Map();
        while (reader.peekState() !== CborReaderState.EndMap) {
            reader.readStartArray();
            const credentialType = Number(reader.readInt());
            if (credentialType < 0 || credentialType > 1)
                throw new InvalidArgumentError('cbor', `Expected a credential type value between 0 and 1, but got ${credentialType}`);
            const credHash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
            reader.readEndArray();
            const amount = reader.readInt();
            amounts.set({ hash: credHash, type: credentialType }, amount);
        }
        reader.readEndMap();
        const cert = new MoveInstantaneousRewardToStakeCreds(pot === 0 ? MirCertificatePot.Reserves : MirCertificatePot.Treasury, amounts);
        __classPrivateFieldSet(cert, _MoveInstantaneousRewardToStakeCreds_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        if (__classPrivateFieldGet(this, _MoveInstantaneousRewardToStakeCreds_credentials, "f").size === 0)
            throw new InvalidStateError('The credential map is empty.');
        const [[stakeCredential, quantity]] = __classPrivateFieldGet(this, _MoveInstantaneousRewardToStakeCreds_credentials, "f");
        return {
            __typename: CertificateType.MIR,
            kind: MirCertificateKind.ToStakeCreds,
            pot: __classPrivateFieldGet(this, _MoveInstantaneousRewardToStakeCreds_pot, "f"),
            quantity,
            stakeCredential
        };
    }
    static fromCore(cert) {
        if (cert.kind !== MirCertificateKind.ToStakeCreds)
            throw new InvalidArgumentError('cert', `Expected a MIR certificate kind 'ToStakeCreds', but got ${cert.kind}`);
        if (cert.stakeCredential === undefined)
            throw new InvalidArgumentError('cert', 'stakeCredential field of the given MIR certificate is undefined');
        return new MoveInstantaneousRewardToStakeCreds(cert.pot, new Map([[cert.stakeCredential, cert.quantity]]));
    }
    pot() {
        return __classPrivateFieldGet(this, _MoveInstantaneousRewardToStakeCreds_pot, "f");
    }
    setPot(pot) {
        __classPrivateFieldSet(this, _MoveInstantaneousRewardToStakeCreds_pot, pot, "f");
        __classPrivateFieldSet(this, _MoveInstantaneousRewardToStakeCreds_originalBytes, undefined, "f");
    }
    getStakeCreds() {
        return __classPrivateFieldGet(this, _MoveInstantaneousRewardToStakeCreds_credentials, "f");
    }
    setStakeCreds(credentials) {
        __classPrivateFieldSet(this, _MoveInstantaneousRewardToStakeCreds_credentials, credentials, "f");
        __classPrivateFieldSet(this, _MoveInstantaneousRewardToStakeCreds_originalBytes, undefined, "f");
    }
}
_MoveInstantaneousRewardToStakeCreds_pot = new WeakMap(), _MoveInstantaneousRewardToStakeCreds_credentials = new WeakMap(), _MoveInstantaneousRewardToStakeCreds_originalBytes = new WeakMap();
