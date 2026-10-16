import { describe, expect, it } from "vitest";
import {
  CredentialType,
  Hash28ByteBase16,
  NetworkId,
  PlutusData,
  RedeemerTag,
  RewardAccount,
  hardCodedProtocolParams,
} from "@blaze-cardano/core";
import { TxBuilder } from "../../src/TxBuilder";
import type { RedeemerContext } from "../../src/types";

const account = (digit: string, type: CredentialType) =>
  RewardAccount.fromCredential(
    { hash: Hash28ByteBase16(digit.repeat(56)), type },
    NetworkId.Testnet,
  );
const scriptLow = account("1", CredentialType.ScriptHash);
const scriptHigh = account("f", CredentialType.ScriptHash);
const keyLow = account("0", CredentialType.KeyHash);
const keySameHash = account("f", CredentialType.KeyHash);
const rewardPointers = (builder: TxBuilder) =>
  builder["redeemers"]
    .values()
    .filter((r) => r.tag() === RedeemerTag.Reward)
    .map((r) => [Number(r.index()), r.data().asInteger()])
    .sort(([a], [b]) => Number(a) - Number(b));

function permutations<T>(items: T[]): T[][] {
  return items.length === 0
    ? [[]]
    : items.flatMap((item, i) =>
        permutations(items.filter((_, j) => i !== j)).map((rest) => [
          item,
          ...rest,
        ]),
      );
}

describe("withdrawal redeemers", () => {
  it("uses script-before-key ledger order for every insertion order", () => {
    for (const order of permutations([
      scriptLow,
      scriptHigh,
      keyLow,
      keySameHash,
    ])) {
      const builder = new TxBuilder(hardCodedProtocolParams);
      for (const address of order) {
        builder.addWithdrawal(
          address,
          1n,
          address === scriptLow
            ? PlutusData.newInteger(10n)
            : address === scriptHigh
              ? PlutusData.newInteger(20n)
              : undefined,
        );
      }
      expect(rewardPointers(builder)).toEqual([
        [0, 10n],
        [1, 20n],
      ]);
    }
  });

  it("shifts existing pointers when a native-script withdrawal is inserted", () => {
    const builder = new TxBuilder(hardCodedProtocolParams)
      .addWithdrawal(scriptHigh, 1n, PlutusData.newInteger(20n))
      .addWithdrawal(scriptLow, 1n);
    expect(rewardPointers(builder)).toEqual([[1, 20n]]);
  });

  it("resolves deferred redeemers in ledger order with distinct account identities", () => {
    let context: RedeemerContext | undefined;
    const builder = new TxBuilder(hardCodedProtocolParams)
      .addWithdrawal(scriptHigh, 2n, (ctx) => {
        context = ctx;
        return PlutusData.newInteger(BigInt(ctx.ownIndex));
      })
      .addWithdrawal(keySameHash, 4n)
      .addWithdrawal(keyLow, 3n)
      .addWithdrawal(scriptLow, 1n);
    builder["resolveDeferredRedeemers"]();
    expect(context?.ownIndex).toBe(1);
    expect(context?.sortedWithdrawals).toEqual([
      { rewardAccount: scriptLow, amount: 1n },
      { rewardAccount: scriptHigh, amount: 2n },
      { rewardAccount: keyLow, amount: 3n },
      { rewardAccount: keySameHash, amount: 4n },
    ]);
    expect(rewardPointers(builder)).toEqual([[1, 1n]]);
  });

  it("rejects duplicates without shifting existing pointers", () => {
    let context: RedeemerContext | undefined;
    const builder = new TxBuilder(hardCodedProtocolParams)
      .addWithdrawal(scriptLow, 1n)
      .addWithdrawal(scriptHigh, 2n, (ctx) => {
        context = ctx;
        return PlutusData.newInteger(20n);
      });
    expect(() => builder.addWithdrawal(scriptLow, 3n)).toThrow(
      "already exists",
    );
    builder["resolveDeferredRedeemers"]();
    expect(rewardPointers(builder)).toEqual([[1, 20n]]);
    expect(builder["body"].withdrawals()?.size).toBe(2);
    expect(context?.sortedWithdrawals).toHaveLength(2);
  });
});
