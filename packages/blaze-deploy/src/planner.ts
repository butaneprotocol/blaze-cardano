import type { Provider } from "@blaze-cardano/query";
import {
  scriptDeploymentManifestHash,
  validateScriptDeploymentManifest,
} from "./manifest";
import type {
  ScriptDeploymentAction,
  ScriptDeploymentCache,
  ScriptDeploymentManifest,
  ScriptDeploymentPlan,
  ScriptDeploymentRecord,
  ScriptDeploymentTarget,
} from "./types";
import { ScriptDeploymentManifestError } from "./errors";

const assertProviderNetwork = (
  provider: Provider,
  manifest: ScriptDeploymentManifest,
): void => {
  if (
    provider.networkName !== "unknown" &&
    provider.networkName !== manifest.network
  ) {
    throw new ScriptDeploymentManifestError(
      `Provider network "${provider.networkName}" does not match deployment manifest network "${manifest.network}".`,
    );
  }
};

const orderTargets = (
  targets: readonly ScriptDeploymentTarget[],
): readonly ScriptDeploymentTarget[] => {
  const byName = new Map(targets.map((target) => [target.name, target]));
  const ordered: ScriptDeploymentTarget[] = [];
  const visited = new Set<string>();

  const visit = (target: ScriptDeploymentTarget) => {
    if (visited.has(target.name)) return;
    for (const dependency of target.dependencies ?? []) {
      visit(byName.get(dependency)!);
    }
    visited.add(target.name);
    ordered.push(target);
  };

  for (const target of targets) {
    visit(target);
  }
  return ordered;
};

const liveRecord = async (
  provider: Provider,
  target: ScriptDeploymentTarget,
  manifestHash: ReturnType<typeof scriptDeploymentManifestHash>,
): Promise<ScriptDeploymentRecord | undefined> => {
  const live = await provider.resolveScriptRef(target.script, target.address);
  if (!live) return undefined;
  return {
    name: target.name,
    version: target.version,
    scriptHash: target.script.hash(),
    address: target.address,
    txInput: live.input(),
    status: "matched",
    manifestHash,
  };
};

/** Reconciles a deployment manifest against provider-visible chain state and an optional cache.
 *
 * @public
 */
export class DeploymentPlanner {
  /** Create a deployment planner for a provider and optional cache. */
  constructor(
    /** Provider used to inspect live reference-script UTxOs. */
    readonly provider: Provider,
    /** Optional cache used as a hint for replacements and retirements. */
    readonly cache?: ScriptDeploymentCache,
  ) {}

  /** Build a deployment plan for a manifest. */
  async reconcile(
    manifest: ScriptDeploymentManifest,
  ): Promise<ScriptDeploymentPlan> {
    validateScriptDeploymentManifest(manifest);
    assertProviderNetwork(this.provider, manifest);
    const manifestHash = scriptDeploymentManifestHash(manifest);
    const actions: ScriptDeploymentAction[] = [];
    const plannedNames = new Set<string>();

    for (const target of orderTargets(manifest.targets)) {
      plannedNames.add(target.name);
      const cached = this.cache?.findByName(target.name);
      const live = await liveRecord(this.provider, target, manifestHash);
      if (live) {
        actions.push({ type: "reuse", target, record: live });
        continue;
      }
      if (cached && cached.scriptHash !== target.script.hash()) {
        actions.push({ type: "replace", target, previous: cached });
        continue;
      }
      actions.push({ type: "deploy", target });
    }

    for (const record of this.cache?.records() ?? []) {
      if (!plannedNames.has(record.name) && record.status !== "superseded") {
        actions.push({ type: "retire", record });
      }
    }

    return { manifestHash, actions };
  }
}

/** Reconcile a deployment manifest without constructing a planner explicitly.
 *
 * @public
 */
export const reconcileScriptDeployment = (input: {
  manifest: ScriptDeploymentManifest;
  provider: Provider;
  cache?: ScriptDeploymentCache;
}): Promise<ScriptDeploymentPlan> =>
  new DeploymentPlanner(input.provider, input.cache).reconcile(input.manifest);
