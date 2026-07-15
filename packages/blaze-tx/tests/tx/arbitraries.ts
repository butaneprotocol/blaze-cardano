import fc from "fast-check";
import {
  Address,
  AssetId,
  AssetName,
  Credential,
  CredentialType,
  NetworkId,
  PolicyId,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  addressFromCredentials,
  type Value,
} from "@blaze-cardano/core";
import { makeValue } from "../../src";

/** Fixed policies for generated token bundles. Constant so properties can
 * reason about them; two distinct values so cross-policy behavior is
 * exercisable. */
export const policyA = PolicyId("ab".repeat(28));
export const policyB = PolicyId("cd".repeat(28));

/** Change and recipient addresses, distinct on purpose so properties can
 * attribute outputs to one or the other. */
export const changeAddress = Address.fromBech32(
  "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
);
export const recipientAddress = addressFromCredentials(
  NetworkId.Testnet,
  Credential.fromCore({
    hash: "e1".repeat(28) as never,
    type: CredentialType.KeyHash,
  }),
);

const arbAssetName = fc
  .uint8Array({ minLength: 1, maxLength: 32 })
  .map((bytes) => AssetName(Buffer.from(bytes).toString("hex")));

const arbQuantity = fc.bigInt({ min: 1n, max: 1_000_000n });

/** Up to three unique asset-name/quantity pairs. */
export const arbAssetEntries = fc
  .array(fc.tuple(arbAssetName, arbQuantity), { maxLength: 3 })
  .map((entries) => new Map(entries));

/** Lovelace amounts sized so any generated scenario is comfortably solvent:
 * every UTxO covers the worst-case payment total plus fees and a min-ADA
 * change output. Constructive bounds instead of fc.pre() so no runs are
 * discarded. */
const arbUtxoLovelace = fc.bigInt({ min: 20_000_000n, max: 60_000_000n });
const arbPaymentLovelace = fc.bigInt({ min: 2_000_000n, max: 5_000_000n });

export type UtxoSpec = {
  lovelace: bigint;
  assets: Map<AssetName, bigint>;
};

export const arbUtxoSpecs = fc.array(
  fc.record({ lovelace: arbUtxoLovelace, assets: arbAssetEntries }),
  { minLength: 1, maxLength: 4 },
);

export const arbPayments = fc.array(arbPaymentLovelace, { maxLength: 3 });

/** Materialize UTxO specs into UTxOs with unique inputs, tokens on policyA. */
export const buildUtxos = (specs: UtxoSpec[]): TransactionUnspentOutput[] =>
  specs.map(
    (spec, index) =>
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(index.toString(16).padStart(64, "0")),
          BigInt(index),
        ),
        new TransactionOutput(changeAddress, specToValue(spec)),
      ),
  );

export const specToValue = (spec: UtxoSpec): Value =>
  makeValue(
    spec.lovelace,
    ...[...spec.assets].map(
      ([name, quantity]) =>
        [AssetId.fromParts(policyA, name), quantity] as [string, bigint],
    ),
  );
