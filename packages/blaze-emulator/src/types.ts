import {
  type AnchorCore,
  type Committee,
  type CredentialCore,
  type DRep,
  type Evaluator,
  type PoolId,
  type ProtocolParameters,
  type ProposalProcedure,
  type SlotConfig,
  type Voter,
  type Vote,
} from "@blaze-cardano/core";
import { type HexBlob, type TransactionId } from "@blaze-cardano/core";

export enum ProposalStatus {
  Active = "Active",
  Ratified = "Ratified",
  Enacted = "Enacted",
  Rejected = "Rejected",
  Expired = "Expired",
}

export type SerialisedInput = `${TransactionId}:${bigint}`;
export type SerialisedGovId = `${TransactionId}:${bigint}`;

export interface RegisteredAccount {
  balance: bigint;
  poolId?: PoolId;
  drep?: DRep;
}

export interface EmulatorOptions {
  params?: ProtocolParameters;
  evaluator?: Evaluator;
  slotConfig?: SlotConfig;
  trace?: boolean;
  slotsPerEpoch?: number;
  treasury?: bigint;
  cc?: Committee;
  ccHotCredentials?: Record<string, CredentialCore | undefined>;
}

export interface VoteRecord {
  voter: Voter;
  vote: Vote;
  anchor?: AnchorCore;
  epoch: number;
}

export type ProposalVoteMap = Map<string, VoteRecord>;

export interface GovProposal {
  procedure: ProposalProcedure;
  submittedEpoch: number;
  expiryEpoch: number;
  status: ProposalStatus;
  deposit: bigint;
  votes: ProposalVoteMap;
}

export interface DRepState {
  credential: CredentialCore;
  deposit: bigint;
  anchor?: AnchorCore;
  expiryEpoch?: number;
  isRegistered: boolean;
}

export type SerializedDRep = HexBlob;

export interface StakeSnapshot {
  drepDelegation: Record<SerializedDRep, bigint>;
  spoDelegation: Record<PoolId, bigint>;
}

export interface Tally {
  yes: bigint;
  no: bigint;
}
export type Tallies = Record<"drep" | "spo" | "cc", Tally>;

export interface EnactQueueItem {
  actionId: SerialisedGovId;
  enactAtEpoch: number;
}
