import { describe, expect, test } from "vitest";
import {
  Credential,
  Hash32ByteBase16,
  ProposalProcedure,
  Vote,
  Voter,
  hardCodedProtocolParams,
  type Address,
} from "@blaze-cardano/core";
import { Blaze, makeValue, type Provider } from "@blaze-cardano/sdk";
import { HotWallet } from "@blaze-cardano/wallet";
import { Emulator } from "../src/emulator";
import {
  configureGovernanceScenario,
  registerKeyDRepForScenario,
  submitGovernanceScenarioProposal,
  voteAsDRepInScenario,
} from "../src/governance";

const ZERO_HASH32 = Hash32ByteBase16("".padStart(64, "0"));

describe("governance scenario helpers", () => {
  test("runs a reusable parameter-change scenario", async () => {
    const params = structuredClone(hardCodedProtocolParams);
    params.governanceActionDeposit = 0;
    params.delegateRepresentativeDeposit = 0;
    params.delegateRepresentativeVotingThresholds!.ppEconomicGroup = {
      numerator: 1,
      denominator: 1,
    };
    params.stakePoolVotingThresholds!.committeeNormal = {
      numerator: 0,
      denominator: 1,
    };

    const emulator = new Emulator([], { params });
    configureGovernanceScenario(emulator);

    let blaze!: Blaze<Provider, HotWallet>;
    let address!: Address;
    await emulator.register("scenario-wallet", makeValue(1_000_000_000n));
    await emulator.as("scenario-wallet", async (instance, actorAddress) => {
      blaze = instance as Blaze<Provider, HotWallet>;
      address = actorAddress;
    });

    const actor = { blaze, address };
    const drep = await registerKeyDRepForScenario(emulator, actor, {
      stake: 700_000_000n,
    });
    emulator.stepForwardToNextEpoch();

    const updatedMinFee = emulator.params.minFeeConstant + 123;
    const proposal = ProposalProcedure.fromCore({
      deposit: 0n,
      rewardAccount: drep.rewardAccount,
      governanceAction: {
        // @ts-expect-error GovernanceActionType is not exported
        __typename: "parameter_change_action",
        governanceActionId: null,
        protocolParamUpdate: { minFeeConstant: updatedMinFee },
        policyHash: emulator.constitution.scriptHash,
      },
      anchor: { url: "ipfs://scenario-helper", dataHash: ZERO_HASH32 },
    });

    const actionId = await submitGovernanceScenarioProposal(
      emulator,
      actor,
      proposal,
    );
    await voteAsDRepInScenario(
      emulator,
      actor,
      Voter.newDrep(Credential.fromCore(drep.stakeCredential).toCore()),
      [{ actionId, vote: Vote.yes }],
      drep.stakeCredential.hash,
    );

    emulator.stepForwardToNextEpoch();

    expect(emulator.params.minFeeConstant).toBe(updatedMinFee);
    expect(emulator.getGovernanceProposalStatus(actionId)).toBe("Enacted");
  });
});
