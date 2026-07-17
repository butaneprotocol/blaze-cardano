import { NetworkId, type TransactionId } from "@blaze-cardano/core";
import { Blaze } from "@blaze-cardano/sdk";
import type { Wallet } from "@blaze-cardano/wallet";
import { MemoryScriptDeploymentCache } from "./cache";
import { ScriptDeploymentManifestError } from "./errors";
import { supersedeRecord } from "./manage";
import { reconcileScriptDeployment } from "./planner";
import type {
  DeployScriptRefsInput,
  ScriptDeploymentManifest,
  ScriptDeploymentRecord,
  ScriptDeploymentResult,
} from "./types";

const manifestNetworkId = (manifest: ScriptDeploymentManifest): NetworkId => {
  switch (manifest.network) {
    case "cardano-mainnet":
      return NetworkId.Mainnet;
    case "cardano-preprod":
    case "cardano-preview":
    case "cardano-sanchonet":
      return NetworkId.Testnet;
    default:
      throw new ScriptDeploymentManifestError(
        `Unsupported deployment network "${manifest.network}".`,
      );
  }
};

const assertWalletNetwork = async (
  manifest: ScriptDeploymentManifest,
  wallet: Wallet,
): Promise<void> => {
  const expected = manifestNetworkId(manifest);
  const actual = await wallet.getNetworkId();
  if (actual !== expected) {
    throw new ScriptDeploymentManifestError(
      `Wallet network does not match deployment manifest network "${manifest.network}".`,
    );
  }
};

/** Reconcile and execute script reference deployment actions for a manifest.
 *
 * @public
 */
export const deployScriptRefs = async (
  input: DeployScriptRefsInput,
): Promise<ScriptDeploymentResult> => {
  const {
    manifest,
    provider,
    wallet,
    cache = new MemoryScriptDeploymentCache(),
  } = input;
  const plan = await reconcileScriptDeployment({ manifest, provider, cache });
  await assertWalletNetwork(manifest, wallet);
  const blaze = await Blaze.from(provider, wallet);
  const transactions: TransactionId[] = [];
  const records: ScriptDeploymentRecord[] = [];

  for (const action of plan.actions) {
    if (action.type === "reuse") {
      records.push(action.record);
      cache.put(action.record);
      continue;
    }
    if (action.type === "retire") {
      cache.remove(action.record.name);
      continue;
    }

    const target = action.target;
    const tx = await blaze
      .newTransaction()
      .deployScript(target.script, target.address)
      .complete();
    const signed = await blaze.signTransaction(tx);
    const txId = await blaze.submitTransaction(signed, true);
    transactions.push(txId);
    const confirmed = await provider.awaitTransactionConfirmation(txId);
    if (!confirmed) {
      throw new Error(
        `Script deployment transaction for "${target.name}" was not confirmed.`,
      );
    }
    const live = await provider.resolveScriptRef(target.script, target.address);
    if (!live) {
      throw new Error(
        `Script deployment for "${target.name}" was submitted but could not be resolved.`,
      );
    }
    const record: ScriptDeploymentRecord = {
      name: target.name,
      version: target.version,
      scriptHash: target.script.hash(),
      address: target.address,
      utxo: live,
      status: "matched",
      manifestHash: plan.manifestHash,
    };
    if (action.type === "replace") {
      const superseded = supersedeRecord(action.previous, record);
      records.push(superseded);
      cache.put(superseded);
    }
    records.push(record);
    cache.put(record);
  }

  return {
    manifestHash: plan.manifestHash,
    transactions,
    records,
  };
};
