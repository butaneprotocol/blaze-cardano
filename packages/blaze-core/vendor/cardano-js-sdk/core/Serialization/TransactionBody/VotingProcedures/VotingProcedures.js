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
var _VotingProcedures_procedures, _VotingProcedures_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { GovernanceActionId } from '../../Common/GovernanceActionId.js';
import { HexBlob, InvalidArgumentError, InvalidStateError } from '@cardano-sdk/util';
import { Voter } from './Voter.js';
import { VotingProcedure } from './VotingProcedure.js';
import { hexToBytes } from '../../../util/misc/index.js';
export class VotingProcedures {
    constructor() {
        _VotingProcedures_procedures.set(this, []);
        _VotingProcedures_originalBytes.set(this, undefined);
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _VotingProcedures_originalBytes, "f"))
            return __classPrivateFieldGet(this, _VotingProcedures_originalBytes, "f");
        const writer = new CborWriter();
        const voters = this.getVoters();
        if (voters.length === 0)
            throw new InvalidStateError('Empty VotingProcedures. There must be at least one VotingProcedure in the map');
        writer.writeStartMap(voters.length);
        for (const voter of voters) {
            const governanceActionIds = this.getGovernanceActionIdsByVoter(voter);
            if (governanceActionIds.length === 0)
                throw new InvalidStateError('Each voter must at least be associated to a GovernanceActionId');
            writer.writeEncodedValue(hexToBytes(voter.toCbor()));
            writer.writeStartMap(governanceActionIds.length);
            for (const actionIds of governanceActionIds) {
                writer.writeEncodedValue(hexToBytes(actionIds.toCbor()));
                const vote = this.get(voter, actionIds);
                if (!vote)
                    throw new InvalidStateError('Each governanceActionIds must at least be associated to a vote');
                writer.writeEncodedValue(hexToBytes(vote.toCbor()));
            }
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const votingProcedures = new VotingProcedures();
        reader.readStartMap();
        while (reader.peekState() !== CborReaderState.EndMap) {
            const voter = Voter.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
            reader.readStartMap();
            while (reader.peekState() !== CborReaderState.EndMap) {
                const actionId = GovernanceActionId.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
                const vote = VotingProcedure.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
                votingProcedures.insert(voter, actionId, vote);
            }
            reader.readEndMap();
        }
        reader.readEndMap();
        __classPrivateFieldSet(votingProcedures, _VotingProcedures_originalBytes, cbor, "f");
        return votingProcedures;
    }
    toCore() {
        return __classPrivateFieldGet(this, _VotingProcedures_procedures, "f").map((value) => {
            const voter = value.voter.toCore();
            const votes = value.votes.map((vote) => ({
                actionId: vote.actionId.toCore(),
                votingProcedure: vote.votingProcedure.toCore()
            }));
            return { voter, votes };
        });
    }
    static fromCore(votingProcedures) {
        const procedures = new VotingProcedures();
        __classPrivateFieldSet(procedures, _VotingProcedures_procedures, votingProcedures.map((value) => {
            const voter = Voter.fromCore(value.voter);
            const votes = value.votes.map((vote) => ({
                actionId: GovernanceActionId.fromCore(vote.actionId),
                votingProcedure: VotingProcedure.fromCore(vote.votingProcedure)
            }));
            return { voter, votes };
        }), "f");
        return procedures;
    }
    insert(voter, actionId, votingProcedure) {
        const foundVoter = __classPrivateFieldGet(this, _VotingProcedures_procedures, "f").find((value) => value.voter.equals(voter));
        if (!foundVoter) {
            __classPrivateFieldGet(this, _VotingProcedures_procedures, "f").push({
                voter,
                votes: [{ actionId, votingProcedure }]
            });
            return;
        }
        const foundVote = foundVoter.votes.find((vote) => vote.actionId.equals(actionId));
        if (foundVote)
            throw new InvalidArgumentError('actionId', 'Voter already has a voting procedure for the given actionId');
        foundVoter.votes.push({ actionId, votingProcedure });
        __classPrivateFieldSet(this, _VotingProcedures_originalBytes, undefined, "f");
    }
    get(voter, governanceActionId) {
        const foundVoter = __classPrivateFieldGet(this, _VotingProcedures_procedures, "f").find((value) => value.voter.equals(voter));
        if (!foundVoter)
            return undefined;
        const foundVote = foundVoter.votes.find((vote) => vote.actionId.equals(governanceActionId));
        if (!foundVote)
            return undefined;
        return foundVote.votingProcedure;
    }
    getVoters() {
        return __classPrivateFieldGet(this, _VotingProcedures_procedures, "f").map((procedure) => procedure.voter);
    }
    getGovernanceActionIdsByVoter(voter) {
        const foundVoter = __classPrivateFieldGet(this, _VotingProcedures_procedures, "f").find((procedure) => procedure.voter.equals(voter));
        if (!foundVoter)
            return [];
        return foundVoter.votes.map((votes) => votes.actionId);
    }
}
_VotingProcedures_procedures = new WeakMap(), _VotingProcedures_originalBytes = new WeakMap();
