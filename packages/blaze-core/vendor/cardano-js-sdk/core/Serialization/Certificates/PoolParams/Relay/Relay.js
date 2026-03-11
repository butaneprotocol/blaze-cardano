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
var _Relay_singleHostAddr, _Relay_singleHostName, _Relay_multiHostName, _Relay_kind, _Relay_originalBytes;
import { CborReader } from '../../../CBOR/index.js';
import { InvalidStateError } from "../../../../../deps/util.js";
import { MultiHostName } from './MultiHostName.js';
import { SingleHostAddr } from './SingleHostAddr.js';
import { SingleHostName } from './SingleHostName.js';
export var RelayKind;
(function (RelayKind) {
    RelayKind[RelayKind["SingleHostAddress"] = 0] = "SingleHostAddress";
    RelayKind[RelayKind["SingleHostDnsName"] = 1] = "SingleHostDnsName";
    RelayKind[RelayKind["MultiHostDnsName"] = 2] = "MultiHostDnsName";
})(RelayKind || (RelayKind = {}));
export class Relay {
    constructor() {
        _Relay_singleHostAddr.set(this, void 0);
        _Relay_singleHostName.set(this, void 0);
        _Relay_multiHostName.set(this, void 0);
        _Relay_kind.set(this, void 0);
        _Relay_originalBytes.set(this, undefined);
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _Relay_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Relay_originalBytes, "f");
        let cbor;
        switch (__classPrivateFieldGet(this, _Relay_kind, "f")) {
            case RelayKind.SingleHostAddress:
                cbor = __classPrivateFieldGet(this, _Relay_singleHostAddr, "f").toCbor();
                break;
            case RelayKind.SingleHostDnsName:
                cbor = __classPrivateFieldGet(this, _Relay_singleHostName, "f").toCbor();
                break;
            case RelayKind.MultiHostDnsName:
                cbor = __classPrivateFieldGet(this, _Relay_multiHostName, "f").toCbor();
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${__classPrivateFieldGet(this, _Relay_kind, "f")}`);
        }
        return cbor;
    }
    static fromCbor(cbor) {
        let relay;
        const reader = new CborReader(cbor);
        reader.readStartArray();
        const kind = Number(reader.readInt());
        switch (kind) {
            case RelayKind.SingleHostAddress:
                relay = Relay.newSingleHostAddr(SingleHostAddr.fromCbor(cbor));
                break;
            case RelayKind.SingleHostDnsName:
                relay = Relay.newSingleHostName(SingleHostName.fromCbor(cbor));
                break;
            case RelayKind.MultiHostDnsName:
                relay = Relay.newMultiHostName(MultiHostName.fromCbor(cbor));
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${kind}`);
        }
        __classPrivateFieldSet(relay, _Relay_originalBytes, cbor, "f");
        return relay;
    }
    toCore() {
        let core;
        switch (__classPrivateFieldGet(this, _Relay_kind, "f")) {
            case RelayKind.SingleHostAddress:
                core = __classPrivateFieldGet(this, _Relay_singleHostAddr, "f").toCore();
                break;
            case RelayKind.SingleHostDnsName:
                core = __classPrivateFieldGet(this, _Relay_singleHostName, "f").toCore();
                break;
            case RelayKind.MultiHostDnsName:
                core = __classPrivateFieldGet(this, _Relay_multiHostName, "f").toCore();
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${__classPrivateFieldGet(this, _Relay_kind, "f")}`);
        }
        return core;
    }
    static fromCore(coreRelay) {
        let relay;
        switch (coreRelay.__typename) {
            case 'RelayByAddress':
                relay = Relay.newSingleHostAddr(SingleHostAddr.fromCore(coreRelay));
                break;
            case 'RelayByName':
                relay = Relay.newSingleHostName(SingleHostName.fromCore(coreRelay));
                break;
            case 'RelayByNameMultihost':
                relay = Relay.newMultiHostName(MultiHostName.fromCore(coreRelay));
                break;
            default:
                throw new InvalidStateError('Unexpected kind value');
        }
        return relay;
    }
    static newSingleHostAddr(singleHostaddr) {
        const relay = new Relay();
        __classPrivateFieldSet(relay, _Relay_singleHostAddr, singleHostaddr, "f");
        __classPrivateFieldSet(relay, _Relay_kind, RelayKind.SingleHostAddress, "f");
        return relay;
    }
    static newSingleHostName(singleHostName) {
        const relay = new Relay();
        __classPrivateFieldSet(relay, _Relay_singleHostName, singleHostName, "f");
        __classPrivateFieldSet(relay, _Relay_kind, RelayKind.SingleHostDnsName, "f");
        return relay;
    }
    static newMultiHostName(multiHostName) {
        const relay = new Relay();
        __classPrivateFieldSet(relay, _Relay_multiHostName, multiHostName, "f");
        __classPrivateFieldSet(relay, _Relay_kind, RelayKind.MultiHostDnsName, "f");
        return relay;
    }
    kind() {
        return __classPrivateFieldGet(this, _Relay_kind, "f");
    }
    asSingleHostAddr() {
        return __classPrivateFieldGet(this, _Relay_singleHostAddr, "f");
    }
    asSingleHostName() {
        return __classPrivateFieldGet(this, _Relay_singleHostName, "f");
    }
    asMultiHostName() {
        return __classPrivateFieldGet(this, _Relay_multiHostName, "f");
    }
}
_Relay_singleHostAddr = new WeakMap(), _Relay_singleHostName = new WeakMap(), _Relay_multiHostName = new WeakMap(), _Relay_kind = new WeakMap(), _Relay_originalBytes = new WeakMap();
