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
var _PoolParams_operator, _PoolParams_vrfKeyHash, _PoolParams_pledge, _PoolParams_cost, _PoolParams_margin, _PoolParams_rewardAccount, _PoolParams_poolOwners, _PoolParams_relays, _PoolParams_poolMetadata, _PoolParams_originalBytes;
import * as Crypto from '@cardano-sdk/crypto';
import { Address } from '../../../Cardano/Address/Address.js';
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { CborSet, Hash } from '../../Common/index.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { PoolId, VrfVkHex } from '../../../Cardano/types/StakePool/index.js';
import { PoolMetadata } from './PoolMetadata.js';
import { Relay } from './Relay/index.js';
import { UnitInterval } from '../../Common/UnitInterval.js';
import { createRewardAccount } from '../../../Cardano/Address/RewardAccount.js';
export class PoolParams {
    constructor(operator, vrfKeyHash, pledge, cost, margin, rewardAccount, poolOwners, relays, poolMetadata) {
        _PoolParams_operator.set(this, void 0);
        _PoolParams_vrfKeyHash.set(this, void 0);
        _PoolParams_pledge.set(this, void 0);
        _PoolParams_cost.set(this, void 0);
        _PoolParams_margin.set(this, void 0);
        _PoolParams_rewardAccount.set(this, void 0);
        _PoolParams_poolOwners.set(this, void 0);
        _PoolParams_relays.set(this, void 0);
        _PoolParams_poolMetadata.set(this, void 0);
        _PoolParams_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _PoolParams_operator, operator, "f");
        __classPrivateFieldSet(this, _PoolParams_vrfKeyHash, vrfKeyHash, "f");
        __classPrivateFieldSet(this, _PoolParams_pledge, pledge, "f");
        __classPrivateFieldSet(this, _PoolParams_cost, cost, "f");
        __classPrivateFieldSet(this, _PoolParams_margin, margin, "f");
        __classPrivateFieldSet(this, _PoolParams_rewardAccount, rewardAccount, "f");
        __classPrivateFieldSet(this, _PoolParams_poolOwners, poolOwners, "f");
        __classPrivateFieldSet(this, _PoolParams_relays, relays, "f");
        __classPrivateFieldSet(this, _PoolParams_poolMetadata, poolMetadata, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _PoolParams_originalBytes, "f"))
            return __classPrivateFieldGet(this, _PoolParams_originalBytes, "f");
        writer.writeStartArray(PoolParams.subgroupCount);
        return this.toFlattenedCbor(writer);
    }
    toFlattenedCbor(writer) {
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _PoolParams_operator, "f"), 'hex'));
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _PoolParams_vrfKeyHash, "f"), 'hex'));
        writer.writeInt(__classPrivateFieldGet(this, _PoolParams_pledge, "f"));
        writer.writeInt(__classPrivateFieldGet(this, _PoolParams_cost, "f"));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _PoolParams_margin, "f").toCbor(), 'hex'));
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _PoolParams_rewardAccount, "f").toAddress().toBytes(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _PoolParams_poolOwners, "f").toCbor(), 'hex'));
        writer.writeStartArray(__classPrivateFieldGet(this, _PoolParams_relays, "f").length);
        for (const relay of __classPrivateFieldGet(this, _PoolParams_relays, "f"))
            writer.writeEncodedValue(Buffer.from(relay.toCbor(), 'hex'));
        if (__classPrivateFieldGet(this, _PoolParams_poolMetadata, "f")) {
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _PoolParams_poolMetadata, "f").toCbor(), 'hex'));
        }
        else {
            writer.writeNull();
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== PoolParams.subgroupCount)
            throw new InvalidArgumentError('cbor', `Expected an array of ${PoolParams.subgroupCount} elements, but got an array of ${length} elements`);
        const params = PoolParams.fromFlattenedCbor(reader);
        __classPrivateFieldSet(params, _PoolParams_originalBytes, cbor, "f");
        return params;
    }
    static fromFlattenedCbor(reader) {
        const operator = Crypto.Ed25519KeyHashHex(HexBlob.fromBytes(reader.readByteString()));
        const vrfKeyHash = VrfVkHex(HexBlob.fromBytes(reader.readByteString()));
        const pledge = reader.readInt();
        const cost = reader.readInt();
        const margin = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const rewardAccount = Address.fromBytes(HexBlob.fromBytes(reader.readByteString())).asReward();
        const relays = new Array();
        let poolMetadata;
        const poolOwner = CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), Hash.fromCbor);
        reader.readStartArray();
        while (reader.peekState() !== CborReaderState.EndArray)
            relays.push(Relay.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
        reader.readEndArray();
        if (reader.peekState() !== CborReaderState.Null) {
            poolMetadata = PoolMetadata.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        }
        else {
            reader.readNull();
        }
        return new PoolParams(operator, vrfKeyHash, pledge, cost, margin, rewardAccount, poolOwner, relays, poolMetadata);
    }
    toCore() {
        const rewardAccountAddress = __classPrivateFieldGet(this, _PoolParams_rewardAccount, "f").toAddress();
        const poolParams = {
            cost: __classPrivateFieldGet(this, _PoolParams_cost, "f"),
            id: PoolId.fromKeyHash(__classPrivateFieldGet(this, _PoolParams_operator, "f")),
            margin: __classPrivateFieldGet(this, _PoolParams_margin, "f").toCore(),
            owners: __classPrivateFieldGet(this, _PoolParams_poolOwners, "f")
                .toCore()
                .map((keyHash) => createRewardAccount(keyHash, rewardAccountAddress.getNetworkId())),
            pledge: __classPrivateFieldGet(this, _PoolParams_pledge, "f"),
            relays: __classPrivateFieldGet(this, _PoolParams_relays, "f").map((relay) => relay.toCore()),
            rewardAccount: __classPrivateFieldGet(this, _PoolParams_rewardAccount, "f").toAddress().toBech32(),
            vrf: __classPrivateFieldGet(this, _PoolParams_vrfKeyHash, "f")
        };
        if (__classPrivateFieldGet(this, _PoolParams_poolMetadata, "f"))
            poolParams.metadataJson = __classPrivateFieldGet(this, _PoolParams_poolMetadata, "f").toCore();
        return poolParams;
    }
    static fromCore(params) {
        return new PoolParams(PoolId.toKeyHash(params.id), params.vrf, params.pledge, params.cost, UnitInterval.fromCore(params.margin), Address.fromBech32(params.rewardAccount).asReward(), CborSet.fromCore(params.owners.map((owner) => Crypto.Ed25519KeyHashHex(Address.fromBech32(owner).asReward().getPaymentCredential().hash)), Hash.fromCore), params.relays.map((relay) => Relay.fromCore(relay)), params.metadataJson ? PoolMetadata.fromCore(params.metadataJson) : undefined);
    }
    operator() {
        return __classPrivateFieldGet(this, _PoolParams_operator, "f");
    }
    setOperator(operator) {
        __classPrivateFieldSet(this, _PoolParams_operator, operator, "f");
        __classPrivateFieldSet(this, _PoolParams_originalBytes, undefined, "f");
    }
    vrfKeyHash() {
        return __classPrivateFieldGet(this, _PoolParams_vrfKeyHash, "f");
    }
    setVrfKeyHash(vrfKeyHash) {
        __classPrivateFieldSet(this, _PoolParams_vrfKeyHash, vrfKeyHash, "f");
        __classPrivateFieldSet(this, _PoolParams_originalBytes, undefined, "f");
    }
    pledge() {
        return __classPrivateFieldGet(this, _PoolParams_pledge, "f");
    }
    setPledge(pledge) {
        __classPrivateFieldSet(this, _PoolParams_pledge, pledge, "f");
        __classPrivateFieldSet(this, _PoolParams_originalBytes, undefined, "f");
    }
    cost() {
        return __classPrivateFieldGet(this, _PoolParams_cost, "f");
    }
    setCost(cost) {
        __classPrivateFieldSet(this, _PoolParams_cost, cost, "f");
        __classPrivateFieldSet(this, _PoolParams_originalBytes, undefined, "f");
    }
    margin() {
        return __classPrivateFieldGet(this, _PoolParams_margin, "f");
    }
    setMargin(margin) {
        __classPrivateFieldSet(this, _PoolParams_margin, margin, "f");
        __classPrivateFieldSet(this, _PoolParams_originalBytes, undefined, "f");
    }
    rewardAccount() {
        return __classPrivateFieldGet(this, _PoolParams_rewardAccount, "f");
    }
    setRewardAccount(rewardAccount) {
        __classPrivateFieldSet(this, _PoolParams_rewardAccount, rewardAccount, "f");
        __classPrivateFieldSet(this, _PoolParams_originalBytes, undefined, "f");
    }
    poolOwners() {
        return __classPrivateFieldGet(this, _PoolParams_poolOwners, "f");
    }
    setPoolOwners(poolOwners) {
        __classPrivateFieldSet(this, _PoolParams_poolOwners, poolOwners, "f");
        __classPrivateFieldSet(this, _PoolParams_originalBytes, undefined, "f");
    }
    relays() {
        return __classPrivateFieldGet(this, _PoolParams_relays, "f");
    }
    setRelays(relays) {
        __classPrivateFieldSet(this, _PoolParams_relays, [...relays], "f");
        __classPrivateFieldSet(this, _PoolParams_originalBytes, undefined, "f");
    }
    poolMetadata() {
        return __classPrivateFieldGet(this, _PoolParams_poolMetadata, "f");
    }
    setPoolMetadata(poolMetadata) {
        __classPrivateFieldSet(this, _PoolParams_poolMetadata, poolMetadata, "f");
        __classPrivateFieldSet(this, _PoolParams_originalBytes, undefined, "f");
    }
}
_PoolParams_operator = new WeakMap(), _PoolParams_vrfKeyHash = new WeakMap(), _PoolParams_pledge = new WeakMap(), _PoolParams_cost = new WeakMap(), _PoolParams_margin = new WeakMap(), _PoolParams_rewardAccount = new WeakMap(), _PoolParams_poolOwners = new WeakMap(), _PoolParams_relays = new WeakMap(), _PoolParams_poolMetadata = new WeakMap(), _PoolParams_originalBytes = new WeakMap();
PoolParams.subgroupCount = 9;
