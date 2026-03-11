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
var _TreasuryWithdrawalsAction_withdrawals, _TreasuryWithdrawalsAction_policyHash, _TreasuryWithdrawalsAction_originalBytes;
import { Address, RewardAddress } from '../../../Cardano/Address/index.js';
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { GovernanceActionKind } from './GovernanceActionKind.js';
import { GovernanceActionType } from '../../../Cardano/types/Governance.js';
import { HexBlob, InvalidArgumentError } from "../../../../deps/util.js";
import { SerializationError, SerializationFailure } from '../../../errors.js';
import { hexToBytes } from '../../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 3;
export class TreasuryWithdrawalsAction {
    constructor(withdrawals, policyHash) {
        _TreasuryWithdrawalsAction_withdrawals.set(this, void 0);
        _TreasuryWithdrawalsAction_policyHash.set(this, void 0);
        _TreasuryWithdrawalsAction_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _TreasuryWithdrawalsAction_withdrawals, withdrawals, "f");
        __classPrivateFieldSet(this, _TreasuryWithdrawalsAction_policyHash, policyHash, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _TreasuryWithdrawalsAction_originalBytes, "f"))
            return __classPrivateFieldGet(this, _TreasuryWithdrawalsAction_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(GovernanceActionKind.TreasuryWithdrawals);
        const sortedCanonically = new Map([...__classPrivateFieldGet(this, _TreasuryWithdrawalsAction_withdrawals, "f")].sort((a, b) => (a > b ? 1 : -1)));
        writer.writeStartMap(sortedCanonically.size);
        for (const [key, value] of sortedCanonically) {
            const rewardAddress = RewardAddress.fromAddress(Address.fromBech32(key));
            if (!rewardAddress) {
                throw new SerializationError(SerializationFailure.InvalidAddress, `Invalid withdrawal address: ${key}`);
            }
            writer.writeByteString(Buffer.from(rewardAddress.toAddress().toBytes(), 'hex'));
            writer.writeInt(value);
        }
        __classPrivateFieldGet(this, _TreasuryWithdrawalsAction_policyHash, "f") ? writer.writeByteString(hexToBytes(__classPrivateFieldGet(this, _TreasuryWithdrawalsAction_policyHash, "f"))) : writer.writeNull();
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readUInt());
        if (kind !== GovernanceActionKind.TreasuryWithdrawals)
            throw new InvalidArgumentError('cbor', `Expected action kind, expected ${GovernanceActionKind.TreasuryWithdrawals} but got ${kind}`);
        reader.readStartMap();
        const amounts = new Map();
        while (reader.peekState() !== CborReaderState.EndMap) {
            const account = Address.fromBytes(HexBlob.fromBytes(reader.readByteString())).toBech32();
            const amount = reader.readInt();
            amounts.set(account, amount);
        }
        reader.readEndMap();
        let policyHash;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
        }
        else {
            policyHash = HexBlob.fromBytes(reader.readByteString());
        }
        reader.readEndArray();
        const action = new TreasuryWithdrawalsAction(amounts, policyHash);
        __classPrivateFieldSet(action, _TreasuryWithdrawalsAction_originalBytes, cbor, "f");
        return action;
    }
    toCore() {
        const withdrawals = new Set([...__classPrivateFieldGet(this, _TreasuryWithdrawalsAction_withdrawals, "f").entries()].map((value) => ({
            coin: value[1],
            rewardAccount: value[0]
        })));
        return {
            __typename: GovernanceActionType.treasury_withdrawals_action,
            policyHash: __classPrivateFieldGet(this, _TreasuryWithdrawalsAction_policyHash, "f") ? __classPrivateFieldGet(this, _TreasuryWithdrawalsAction_policyHash, "f") : null,
            withdrawals
        };
    }
    static fromCore(treasuryWithdrawalsAction) {
        return new TreasuryWithdrawalsAction(new Map([...treasuryWithdrawalsAction.withdrawals].map((value) => [value.rewardAccount, value.coin])), treasuryWithdrawalsAction.policyHash !== null ? treasuryWithdrawalsAction.policyHash : undefined);
    }
    withdrawals() {
        return __classPrivateFieldGet(this, _TreasuryWithdrawalsAction_withdrawals, "f");
    }
    policyHash() {
        return __classPrivateFieldGet(this, _TreasuryWithdrawalsAction_policyHash, "f");
    }
}
_TreasuryWithdrawalsAction_withdrawals = new WeakMap(), _TreasuryWithdrawalsAction_policyHash = new WeakMap(), _TreasuryWithdrawalsAction_originalBytes = new WeakMap();
