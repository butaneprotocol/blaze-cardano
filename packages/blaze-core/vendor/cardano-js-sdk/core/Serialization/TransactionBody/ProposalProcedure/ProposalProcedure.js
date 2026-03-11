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
var _ProposalProcedure_parameterChangeAction, _ProposalProcedure_hardForkInitiationAction, _ProposalProcedure_treasuryWithdrawalsAction, _ProposalProcedure_noConfidence, _ProposalProcedure_updateCommittee, _ProposalProcedure_newConstitution, _ProposalProcedure_infoAction, _ProposalProcedure_kind, _ProposalProcedure_deposit, _ProposalProcedure_rewardAccount, _ProposalProcedure_anchor, _ProposalProcedure_originalBytes;
import { Address, RewardAddress } from '../../../Cardano/Address/index.js';
import { Anchor } from '../../Common/Anchor.js';
import { CborReader, CborWriter } from '../../CBOR/index.js';
import { GovernanceActionKind } from './GovernanceActionKind.js';
import { GovernanceActionType } from '../../../Cardano/types/Governance.js';
import { HardForkInitiationAction } from './HardForkInitiationAction.js';
import { HexBlob, InvalidStateError } from '@cardano-sdk/util';
import { InfoAction } from './InfoAction.js';
import { NewConstitution } from './NewConstitution.js';
import { NoConfidence } from './NoConfidence.js';
import { ParameterChangeAction } from './ParameterChangeAction.js';
import { SerializationError, SerializationFailure } from '../../../errors.js';
import { TreasuryWithdrawalsAction } from './TreasuryWithdrawalsAction.js';
import { UpdateCommittee } from './UpdateCommittee.js';
import { hexToBytes } from '../../../util/misc/index.js';
const PROCEDURE_ARRAY_SIZE = 4;
export class ProposalProcedure {
    constructor() {
        _ProposalProcedure_parameterChangeAction.set(this, undefined);
        _ProposalProcedure_hardForkInitiationAction.set(this, undefined);
        _ProposalProcedure_treasuryWithdrawalsAction.set(this, undefined);
        _ProposalProcedure_noConfidence.set(this, undefined);
        _ProposalProcedure_updateCommittee.set(this, undefined);
        _ProposalProcedure_newConstitution.set(this, undefined);
        _ProposalProcedure_infoAction.set(this, undefined);
        _ProposalProcedure_kind.set(this, void 0);
        _ProposalProcedure_deposit.set(this, void 0);
        _ProposalProcedure_rewardAccount.set(this, void 0);
        _ProposalProcedure_anchor.set(this, void 0);
        _ProposalProcedure_originalBytes.set(this, undefined);
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _ProposalProcedure_originalBytes, "f"))
            return __classPrivateFieldGet(this, _ProposalProcedure_originalBytes, "f");
        let actionCbor;
        switch (__classPrivateFieldGet(this, _ProposalProcedure_kind, "f")) {
            case GovernanceActionKind.ParameterChange:
                actionCbor = __classPrivateFieldGet(this, _ProposalProcedure_parameterChangeAction, "f").toCbor();
                break;
            case GovernanceActionKind.HardForkInitiation:
                actionCbor = __classPrivateFieldGet(this, _ProposalProcedure_hardForkInitiationAction, "f").toCbor();
                break;
            case GovernanceActionKind.TreasuryWithdrawals:
                actionCbor = __classPrivateFieldGet(this, _ProposalProcedure_treasuryWithdrawalsAction, "f").toCbor();
                break;
            case GovernanceActionKind.NoConfidence:
                actionCbor = __classPrivateFieldGet(this, _ProposalProcedure_noConfidence, "f").toCbor();
                break;
            case GovernanceActionKind.UpdateCommittee:
                actionCbor = __classPrivateFieldGet(this, _ProposalProcedure_updateCommittee, "f").toCbor();
                break;
            case GovernanceActionKind.NewConstitution:
                actionCbor = __classPrivateFieldGet(this, _ProposalProcedure_newConstitution, "f").toCbor();
                break;
            case GovernanceActionKind.Info:
                actionCbor = __classPrivateFieldGet(this, _ProposalProcedure_infoAction, "f").toCbor();
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${__classPrivateFieldGet(this, _ProposalProcedure_kind, "f")}`);
        }
        writer.writeStartArray(PROCEDURE_ARRAY_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _ProposalProcedure_deposit, "f"));
        const rewardAddress = RewardAddress.fromAddress(Address.fromBech32(__classPrivateFieldGet(this, _ProposalProcedure_rewardAccount, "f")));
        if (!rewardAddress) {
            throw new SerializationError(SerializationFailure.InvalidAddress, `Invalid withdrawal address: ${__classPrivateFieldGet(this, _ProposalProcedure_rewardAccount, "f")}`);
        }
        writer.writeByteString(Buffer.from(rewardAddress.toAddress().toBytes(), 'hex'));
        writer.writeEncodedValue(hexToBytes(actionCbor));
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _ProposalProcedure_anchor, "f").toCbor()));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        let proposalProcedure;
        const reader = new CborReader(cbor);
        reader.readStartArray();
        const deposit = reader.readInt();
        const rewardAccount = Address.fromBytes(HexBlob.fromBytes(reader.readByteString())).toBech32();
        const actionCbor = HexBlob.fromBytes(reader.readEncodedValue());
        const anchor = Anchor.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        reader.readEndArray();
        const actionReader = new CborReader(actionCbor);
        actionReader.readStartArray();
        let action;
        const kind = Number(actionReader.readInt());
        switch (kind) {
            case GovernanceActionKind.ParameterChange:
                action = ParameterChangeAction.fromCbor(actionCbor);
                proposalProcedure = ProposalProcedure.newParameterChangeAction(deposit, rewardAccount, anchor, action);
                break;
            case GovernanceActionKind.HardForkInitiation:
                action = HardForkInitiationAction.fromCbor(actionCbor);
                proposalProcedure = ProposalProcedure.newHardForkInitiationAction(deposit, rewardAccount, anchor, action);
                break;
            case GovernanceActionKind.TreasuryWithdrawals:
                action = TreasuryWithdrawalsAction.fromCbor(actionCbor);
                proposalProcedure = ProposalProcedure.newTreasuryWithdrawalsAction(deposit, rewardAccount, anchor, action);
                break;
            case GovernanceActionKind.NoConfidence:
                action = NoConfidence.fromCbor(actionCbor);
                proposalProcedure = ProposalProcedure.newNoConfidence(deposit, rewardAccount, anchor, action);
                break;
            case GovernanceActionKind.UpdateCommittee:
                action = UpdateCommittee.fromCbor(actionCbor);
                proposalProcedure = ProposalProcedure.newUpdateCommittee(deposit, rewardAccount, anchor, action);
                break;
            case GovernanceActionKind.NewConstitution:
                action = NewConstitution.fromCbor(actionCbor);
                proposalProcedure = ProposalProcedure.newNewConstitution(deposit, rewardAccount, anchor, action);
                break;
            case GovernanceActionKind.Info:
                action = InfoAction.fromCbor(actionCbor);
                proposalProcedure = ProposalProcedure.newInfoAction(deposit, rewardAccount, anchor, action);
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${kind}`);
        }
        __classPrivateFieldSet(proposalProcedure, _ProposalProcedure_originalBytes, cbor, "f");
        return proposalProcedure;
    }
    toCore() {
        let actionCore;
        switch (__classPrivateFieldGet(this, _ProposalProcedure_kind, "f")) {
            case GovernanceActionKind.ParameterChange:
                actionCore = __classPrivateFieldGet(this, _ProposalProcedure_parameterChangeAction, "f").toCore();
                break;
            case GovernanceActionKind.HardForkInitiation:
                actionCore = __classPrivateFieldGet(this, _ProposalProcedure_hardForkInitiationAction, "f").toCore();
                break;
            case GovernanceActionKind.TreasuryWithdrawals:
                actionCore = __classPrivateFieldGet(this, _ProposalProcedure_treasuryWithdrawalsAction, "f").toCore();
                break;
            case GovernanceActionKind.NoConfidence:
                actionCore = __classPrivateFieldGet(this, _ProposalProcedure_noConfidence, "f").toCore();
                break;
            case GovernanceActionKind.UpdateCommittee:
                actionCore = __classPrivateFieldGet(this, _ProposalProcedure_updateCommittee, "f").toCore();
                break;
            case GovernanceActionKind.NewConstitution:
                actionCore = __classPrivateFieldGet(this, _ProposalProcedure_newConstitution, "f").toCore();
                break;
            case GovernanceActionKind.Info:
                actionCore = __classPrivateFieldGet(this, _ProposalProcedure_infoAction, "f").toCore();
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${__classPrivateFieldGet(this, _ProposalProcedure_kind, "f")}`);
        }
        return {
            anchor: __classPrivateFieldGet(this, _ProposalProcedure_anchor, "f").toCore(),
            deposit: __classPrivateFieldGet(this, _ProposalProcedure_deposit, "f"),
            governanceAction: actionCore,
            rewardAccount: __classPrivateFieldGet(this, _ProposalProcedure_rewardAccount, "f")
        };
    }
    static fromCore(proposalProcedure) {
        let action;
        let procedure;
        const anchor = Anchor.fromCore(proposalProcedure.anchor);
        switch (proposalProcedure.governanceAction.__typename) {
            case GovernanceActionType.parameter_change_action:
                action = ParameterChangeAction.fromCore(proposalProcedure.governanceAction);
                procedure = ProposalProcedure.newParameterChangeAction(proposalProcedure.deposit, proposalProcedure.rewardAccount, anchor, action);
                break;
            case GovernanceActionType.hard_fork_initiation_action:
                action = HardForkInitiationAction.fromCore(proposalProcedure.governanceAction);
                procedure = ProposalProcedure.newHardForkInitiationAction(proposalProcedure.deposit, proposalProcedure.rewardAccount, anchor, action);
                break;
            case GovernanceActionType.treasury_withdrawals_action:
                action = TreasuryWithdrawalsAction.fromCore(proposalProcedure.governanceAction);
                procedure = ProposalProcedure.newTreasuryWithdrawalsAction(proposalProcedure.deposit, proposalProcedure.rewardAccount, anchor, action);
                break;
            case GovernanceActionType.no_confidence:
                action = NoConfidence.fromCore(proposalProcedure.governanceAction);
                procedure = ProposalProcedure.newNoConfidence(proposalProcedure.deposit, proposalProcedure.rewardAccount, anchor, action);
                break;
            case GovernanceActionType.update_committee:
                action = UpdateCommittee.fromCore(proposalProcedure.governanceAction);
                procedure = ProposalProcedure.newUpdateCommittee(proposalProcedure.deposit, proposalProcedure.rewardAccount, anchor, action);
                break;
            case GovernanceActionType.new_constitution:
                action = NewConstitution.fromCore(proposalProcedure.governanceAction);
                procedure = ProposalProcedure.newNewConstitution(proposalProcedure.deposit, proposalProcedure.rewardAccount, anchor, action);
                break;
            case GovernanceActionType.info_action:
                action = InfoAction.fromCore(proposalProcedure.governanceAction);
                procedure = ProposalProcedure.newInfoAction(proposalProcedure.deposit, proposalProcedure.rewardAccount, anchor, action);
                break;
            default:
                throw new InvalidStateError('Unexpected ProposalProcedure type');
        }
        return procedure;
    }
    static newParameterChangeAction(deposit, rewardAccount, anchor, parameterChangeAction) {
        const proposal = new ProposalProcedure();
        __classPrivateFieldSet(proposal, _ProposalProcedure_kind, GovernanceActionKind.ParameterChange, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_deposit, deposit, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_rewardAccount, rewardAccount, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_anchor, anchor, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_parameterChangeAction, parameterChangeAction, "f");
        return proposal;
    }
    static newHardForkInitiationAction(deposit, rewardAccount, anchor, hardForkInitiationAction) {
        const proposal = new ProposalProcedure();
        __classPrivateFieldSet(proposal, _ProposalProcedure_kind, GovernanceActionKind.HardForkInitiation, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_deposit, deposit, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_rewardAccount, rewardAccount, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_anchor, anchor, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_hardForkInitiationAction, hardForkInitiationAction, "f");
        return proposal;
    }
    static newTreasuryWithdrawalsAction(deposit, rewardAccount, anchor, treasuryWithdrawalsAction) {
        const proposal = new ProposalProcedure();
        __classPrivateFieldSet(proposal, _ProposalProcedure_kind, GovernanceActionKind.TreasuryWithdrawals, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_deposit, deposit, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_rewardAccount, rewardAccount, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_anchor, anchor, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_treasuryWithdrawalsAction, treasuryWithdrawalsAction, "f");
        return proposal;
    }
    static newNoConfidence(deposit, rewardAccount, anchor, noConfidence) {
        const proposal = new ProposalProcedure();
        __classPrivateFieldSet(proposal, _ProposalProcedure_kind, GovernanceActionKind.NoConfidence, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_deposit, deposit, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_rewardAccount, rewardAccount, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_anchor, anchor, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_noConfidence, noConfidence, "f");
        return proposal;
    }
    static newUpdateCommittee(deposit, rewardAccount, anchor, updateCommittee) {
        const proposal = new ProposalProcedure();
        __classPrivateFieldSet(proposal, _ProposalProcedure_kind, GovernanceActionKind.UpdateCommittee, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_deposit, deposit, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_rewardAccount, rewardAccount, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_anchor, anchor, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_updateCommittee, updateCommittee, "f");
        return proposal;
    }
    static newNewConstitution(deposit, rewardAccount, anchor, newConstitution) {
        const proposal = new ProposalProcedure();
        __classPrivateFieldSet(proposal, _ProposalProcedure_kind, GovernanceActionKind.NewConstitution, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_deposit, deposit, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_rewardAccount, rewardAccount, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_anchor, anchor, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_newConstitution, newConstitution, "f");
        return proposal;
    }
    static newInfoAction(deposit, rewardAccount, anchor, infoAction) {
        const proposal = new ProposalProcedure();
        __classPrivateFieldSet(proposal, _ProposalProcedure_kind, GovernanceActionKind.Info, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_deposit, deposit, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_rewardAccount, rewardAccount, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_anchor, anchor, "f");
        __classPrivateFieldSet(proposal, _ProposalProcedure_infoAction, infoAction, "f");
        return proposal;
    }
    kind() {
        return __classPrivateFieldGet(this, _ProposalProcedure_kind, "f");
    }
    deposit() {
        return __classPrivateFieldGet(this, _ProposalProcedure_deposit, "f");
    }
    rewardAccount() {
        return __classPrivateFieldGet(this, _ProposalProcedure_rewardAccount, "f");
    }
    anchor() {
        return __classPrivateFieldGet(this, _ProposalProcedure_anchor, "f");
    }
    getParameterChangeAction() {
        return __classPrivateFieldGet(this, _ProposalProcedure_parameterChangeAction, "f");
    }
    getHardForkInitiationAction() {
        return __classPrivateFieldGet(this, _ProposalProcedure_hardForkInitiationAction, "f");
    }
    getTreasuryWithdrawalsAction() {
        return __classPrivateFieldGet(this, _ProposalProcedure_treasuryWithdrawalsAction, "f");
    }
    getNoConfidence() {
        return __classPrivateFieldGet(this, _ProposalProcedure_noConfidence, "f");
    }
    getUpdateCommittee() {
        return __classPrivateFieldGet(this, _ProposalProcedure_updateCommittee, "f");
    }
    getNewConstitution() {
        return __classPrivateFieldGet(this, _ProposalProcedure_newConstitution, "f");
    }
    getInfoAction() {
        return __classPrivateFieldGet(this, _ProposalProcedure_infoAction, "f");
    }
}
_ProposalProcedure_parameterChangeAction = new WeakMap(), _ProposalProcedure_hardForkInitiationAction = new WeakMap(), _ProposalProcedure_treasuryWithdrawalsAction = new WeakMap(), _ProposalProcedure_noConfidence = new WeakMap(), _ProposalProcedure_updateCommittee = new WeakMap(), _ProposalProcedure_newConstitution = new WeakMap(), _ProposalProcedure_infoAction = new WeakMap(), _ProposalProcedure_kind = new WeakMap(), _ProposalProcedure_deposit = new WeakMap(), _ProposalProcedure_rewardAccount = new WeakMap(), _ProposalProcedure_anchor = new WeakMap(), _ProposalProcedure_originalBytes = new WeakMap();
