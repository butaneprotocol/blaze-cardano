import { describe, expect, it } from "vitest";
import {
  Address,
  Credential,
  CredentialType,
  Ed25519KeyHashHex,
  HexBlob,
  NetworkId,
  PlutusData,
  PlutusV3Script,
  PoolId,
  RedeemerTag,
  RewardAccount,
  Script,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  hardCodedProtocolParams,
  type Evaluator,
} from "@blaze-cardano/core";
import { TxBuilder } from "../../src/TxBuilder";
import * as value from "../../src/value";

// The ledger points a certificate redeemer at its certificate's position in
// the body, whatever its kind, and a reward redeemer at its withdrawal.

const address = Address.fromBech32(
  "addr1q86ylp637q7hv7a9r387nz8d9zdhem2v06pjyg75fvcmen3rg8t4q3f80r56p93xqzhcup0w7e5heq7lnayjzqau3dfs7yrls5",
);

const scriptCredential = (bytes: string) => {
  const script = Script.newPlutusV3Script(new PlutusV3Script(HexBlob(bytes)));
  return {
    script,
    credential: Credential.fromCore({
      hash: script.hash(),
      type: CredentialType.ScriptHash,
    }),
  };
};

// Leaves the redeemers as built, so the test reads the builder's pointers.
const asBuilt: Evaluator = async (tx) => tx.witnessSet().redeemers()!;

const builder = () =>
  new TxBuilder(hardCodedProtocolParams)
    .useEvaluator(asBuilt)
    .setNetworkId(NetworkId.Testnet)
    .setChangeAddress(address)
    .addUnspentOutputs([
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("0".repeat(64)), 0n),
        new TransactionOutput(address, value.makeValue(500_000_000n)),
      ),
    ]);

const pool = PoolId.fromKeyHash(Ed25519KeyHashHex("1".repeat(56)));

describe("certificate redeemers", () => {
  it("point at their certificate's position across certificate kinds", async () => {
    // Hashes chosen so a per-kind sorted index would give each redeemer index 0.
    const registered = scriptCredential("4101");
    const deregistered = scriptCredential("4102");
    const delegated = scriptCredential("4103");

    const tx = await builder()
      .provideScript(registered.script)
      .provideScript(deregistered.script)
      .provideScript(delegated.script)
      .addRegisterStake(registered.credential, PlutusData.newInteger(0n))
      .addDeregisterStake(deregistered.credential, PlutusData.newInteger(1n))
      .addDelegation(delegated.credential, pool, PlutusData.newInteger(2n))
      .complete();

    const certs = tx.body().certs()!.values();
    const certRedeemers = tx
      .witnessSet()
      .redeemers()!
      .values()
      .filter((r) => r.tag() === RedeemerTag.Cert)
      .map((r) => [Number(r.index()), r.data().asInteger()]);

    expect(certs).toHaveLength(3);
    expect(certRedeemers.sort(([a], [b]) => Number(a) - Number(b))).toEqual([
      [0, 0n],
      [1, 1n],
      [2, 2n],
    ]);
  });

  it("leave a withdrawal's reward redeemer where it is", async () => {
    const withdrawn = scriptCredential("4104");
    const delegated = scriptCredential("4105");
    const deregistered = scriptCredential("4106");

    const tx = await builder()
      .provideScript(withdrawn.script)
      .provideScript(delegated.script)
      .provideScript(deregistered.script)
      .addWithdrawal(
        RewardAccount.fromCredential(
          withdrawn.credential.toCore(),
          NetworkId.Testnet,
        ),
        0n,
        PlutusData.newInteger(9n),
      )
      .addDelegation(delegated.credential, pool, PlutusData.newInteger(0n))
      .addDeregisterStake(deregistered.credential, PlutusData.newInteger(1n))
      .complete();

    const rewardRedeemers = tx
      .witnessSet()
      .redeemers()!
      .values()
      .filter((r) => r.tag() === RedeemerTag.Reward)
      .map((r) => [Number(r.index()), r.data().asInteger()]);

    expect(rewardRedeemers).toEqual([[0, 9n]]);
  });
});
