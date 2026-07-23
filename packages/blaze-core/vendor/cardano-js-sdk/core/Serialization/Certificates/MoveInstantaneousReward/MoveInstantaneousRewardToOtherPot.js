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
var _MoveInstantaneousRewardToOtherPot_pot, _MoveInstantaneousRewardToOtherPot_amount, _MoveInstantaneousRewardToOtherPot_originalBytes;
import { CborReader, CborWriter } from '../../CBOR/index.js';
import { CertificateType, MirCertificateKind, MirCertificatePot } from '../../../Cardano/types/Certificate.js';
import { InvalidArgumentError } from "../../../../deps/util.js";
const EMBEDDED_GROUP_SIZE = 2;
export class MoveInstantaneousRewardToOtherPot {
    constructor(pot, amount) {
        _MoveInstantaneousRewardToOtherPot_pot.set(this, void 0);
        _MoveInstantaneousRewardToOtherPot_amount.set(this, void 0);
        _MoveInstantaneousRewardToOtherPot_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _MoveInstantaneousRewardToOtherPot_pot, pot, "f");
        __classPrivateFieldSet(this, _MoveInstantaneousRewardToOtherPot_amount, amount, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _MoveInstantaneousRewardToOtherPot_originalBytes, "f"))
            return __classPrivateFieldGet(this, _MoveInstantaneousRewardToOtherPot_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _MoveInstantaneousRewardToOtherPot_pot, "f") === MirCertificatePot.Reserves ? 0 : 1);
        writer.writeInt(__classPrivateFieldGet(this, _MoveInstantaneousRewardToOtherPot_amount, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of two elements, but got an array of ${length} elements`);
        const pot = Number(reader.readInt());
        const amount = reader.readInt();
        if (pot < 0 || pot > 1)
            throw new InvalidArgumentError('cbor', `Expected a pot value between 0 and 1, but got ${pot}`);
        const cert = new MoveInstantaneousRewardToOtherPot(pot === 0 ? MirCertificatePot.Reserves : MirCertificatePot.Treasury, amount);
        __classPrivateFieldSet(cert, _MoveInstantaneousRewardToOtherPot_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.MIR,
            kind: MirCertificateKind.ToOtherPot,
            pot: __classPrivateFieldGet(this, _MoveInstantaneousRewardToOtherPot_pot, "f"),
            quantity: __classPrivateFieldGet(this, _MoveInstantaneousRewardToOtherPot_amount, "f")
        };
    }
    static fromCore(cert) {
        if (cert.kind !== MirCertificateKind.ToOtherPot)
            throw new InvalidArgumentError('cert', `Expected a MIR certificate kind 'ToOtherPot', but got ${cert.kind}`);
        if (cert.quantity === undefined)
            throw new InvalidArgumentError('cert', 'Amount field of the given MIR certificate is undefined');
        return new MoveInstantaneousRewardToOtherPot(cert.pot, cert.quantity);
    }
    pot() {
        return __classPrivateFieldGet(this, _MoveInstantaneousRewardToOtherPot_pot, "f");
    }
    setPot(pot) {
        __classPrivateFieldSet(this, _MoveInstantaneousRewardToOtherPot_pot, pot, "f");
        __classPrivateFieldSet(this, _MoveInstantaneousRewardToOtherPot_originalBytes, undefined, "f");
    }
    getAmount() {
        return __classPrivateFieldGet(this, _MoveInstantaneousRewardToOtherPot_amount, "f");
    }
    setAmount(amount) {
        __classPrivateFieldSet(this, _MoveInstantaneousRewardToOtherPot_amount, amount, "f");
        __classPrivateFieldSet(this, _MoveInstantaneousRewardToOtherPot_originalBytes, undefined, "f");
    }
}
_MoveInstantaneousRewardToOtherPot_pot = new WeakMap(), _MoveInstantaneousRewardToOtherPot_amount = new WeakMap(), _MoveInstantaneousRewardToOtherPot_originalBytes = new WeakMap();
