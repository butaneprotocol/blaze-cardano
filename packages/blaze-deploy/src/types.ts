import type {
  Address,
  Hash28ByteBase16,
  Hash32ByteBase16,
  Script,
  TransactionId,
  TransactionInput,
} from "@blaze-cardano/core";
import type { NetworkName, Provider } from "@blaze-cardano/query";
import type { Wallet } from "@blaze-cardano/wallet";

/** One script reference target that should exist on chain.
 *
 * @public
 */
export type ScriptDeploymentTarget = {
  name: string;
  version: string;
  script: Script;
  address: Address;
  minAda?: bigint;
  dependencies?: readonly string[];
  metadata?: Readonly<Record<string, string>>;
};

/** Declarative script deployment manifest for one network.
 *
 * @public
 */
export type ScriptDeploymentManifest = {
  id: string;
  network: NetworkName;
  targets: readonly ScriptDeploymentTarget[];
};

/** JSON-serializable target representation used for manifest hashing.
 *
 * @public
 */
export type SerializableScriptDeploymentTarget = {
  name: string;
  version: string;
  scriptHash: Hash28ByteBase16;
  address: string;
  minAda?: string;
  dependencies: readonly string[];
  metadata: Readonly<Record<string, string>>;
};

/** JSON-serializable manifest representation used for manifest hashing.
 *
 * @public
 */
export type SerializableScriptDeploymentManifest = {
  id: string;
  network: NetworkName;
  targets: readonly SerializableScriptDeploymentTarget[];
};

/** Deployment cache status for one target record.
 *
 * @public
 */
export type ScriptDeploymentStatus =
  | "matched"
  | "missing"
  | "stale"
  | "superseded";

/** Cache record for a deployed or superseded script target.
 *
 * @public
 */
export type ScriptDeploymentRecord = {
  name: string;
  version: string;
  scriptHash: Hash28ByteBase16;
  address: Address;
  txInput?: TransactionInput;
  status: ScriptDeploymentStatus;
  manifestHash?: Hash32ByteBase16;
  supersededBy?: Hash28ByteBase16;
};

/** JSON-serializable cache record.
 *
 * @public
 */
export type SerializableScriptDeploymentRecord = {
  name: string;
  version: string;
  scriptHash: Hash28ByteBase16;
  address: string;
  txInput?: string;
  status: ScriptDeploymentStatus;
  manifestHash?: Hash32ByteBase16;
  supersededBy?: Hash28ByteBase16;
};

/** Planner action required to reconcile a manifest with chain/cache state.
 *
 * @public
 */
export type ScriptDeploymentAction =
  | {
      type: "reuse";
      target: ScriptDeploymentTarget;
      record: ScriptDeploymentRecord;
    }
  | {
      type: "deploy";
      target: ScriptDeploymentTarget;
    }
  | {
      type: "replace";
      target: ScriptDeploymentTarget;
      previous: ScriptDeploymentRecord;
    }
  | {
      type: "retire";
      record: ScriptDeploymentRecord;
    };

/** Ordered deployment plan for a manifest.
 *
 * @public
 */
export type ScriptDeploymentPlan = {
  manifestHash: Hash32ByteBase16;
  actions: readonly ScriptDeploymentAction[];
};

/** Serializable deployment cache snapshot for CI artifacts.
 *
 * @public
 */
export type ScriptDeploymentCacheSnapshot = {
  manifestHash?: Hash32ByteBase16;
  records: readonly SerializableScriptDeploymentRecord[];
};

/** Result returned after executing a deployment plan.
 *
 * @public
 */
export type ScriptDeploymentResult = {
  manifestHash: Hash32ByteBase16;
  transactions: readonly TransactionId[];
  records: readonly ScriptDeploymentRecord[];
};

/** Input for deploying script references from a manifest.
 *
 * @public
 */
export type DeployScriptRefsInput = {
  manifest: ScriptDeploymentManifest;
  provider: Provider;
  wallet: Wallet;
  cache?: ScriptDeploymentCache;
};

/** Storage interface for script deployment cache records.
 *
 * @public
 */
export interface ScriptDeploymentCache {
  /** Return all cache records. */
  records(): readonly ScriptDeploymentRecord[];
  /** Store or replace one cache record. */
  put(record: ScriptDeploymentRecord): void;
  /** Remove all cache records with a target name. */
  remove(name: string): boolean;
  /** Find the active record for a target name. */
  findByName(name: string): ScriptDeploymentRecord | undefined;
  /** Find a record by script hash. */
  findByScriptHash(
    scriptHash: Hash28ByteBase16,
  ): ScriptDeploymentRecord | undefined;
  /** Serialize the cache for persistence. */
  snapshot(manifestHash?: Hash32ByteBase16): ScriptDeploymentCacheSnapshot;
}
