import { Address, type Hash28ByteBase16 } from "@blaze-cardano/core";
import { formatTxInput, parseTxInput } from "./compat";
import { compareDeploymentVersions } from "./manage";
import type {
  ScriptDeploymentCache,
  ScriptDeploymentCacheSnapshot,
  ScriptDeploymentRecord,
  SerializableScriptDeploymentRecord,
} from "./types";
import { ScriptDeploymentCacheError } from "./errors";

const recordKey = (
  record: Pick<ScriptDeploymentRecord, "name" | "version" | "scriptHash">,
) => `${record.name}:${record.version}:${record.scriptHash}`;

const statuses = new Set<ScriptDeploymentRecord["status"]>([
  "matched",
  "missing",
  "stale",
  "superseded",
]);

const assertHash28 = (label: string, value: string | undefined): void => {
  if (value !== undefined && !/^[0-9a-fA-F]{56}$/.test(value)) {
    throw new ScriptDeploymentCacheError(
      `${label} must be a 28-byte hex hash.`,
    );
  }
};

const assertHash32 = (label: string, value: string | undefined): void => {
  if (value !== undefined && !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new ScriptDeploymentCacheError(
      `${label} must be a 32-byte hex hash.`,
    );
  }
};

const assertVersion = (version: string): void => {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new ScriptDeploymentCacheError(
      `Invalid deployment cache version "${version}".`,
    );
  }
};

const serializeRecord = (
  record: ScriptDeploymentRecord,
): SerializableScriptDeploymentRecord => ({
  name: record.name,
  version: record.version,
  scriptHash: record.scriptHash,
  address: record.address.toBech32(),
  txInput: record.txInput ? formatTxInput(record.txInput) : undefined,
  status: record.status,
  manifestHash: record.manifestHash,
  supersededBy: record.supersededBy,
});

const deserializeRecord = (
  record: SerializableScriptDeploymentRecord,
): ScriptDeploymentRecord => {
  if (
    !record.name ||
    !record.version ||
    !record.scriptHash ||
    !record.address ||
    !record.status
  ) {
    throw new ScriptDeploymentCacheError("Invalid deployment cache record.");
  }
  assertVersion(record.version);
  assertHash28("Deployment cache script hash", record.scriptHash);
  assertHash32("Deployment cache manifest hash", record.manifestHash);
  assertHash28("Deployment cache supersededBy hash", record.supersededBy);
  if (!statuses.has(record.status)) {
    throw new ScriptDeploymentCacheError(
      `Invalid deployment cache status "${record.status}".`,
    );
  }
  return {
    name: record.name,
    version: record.version,
    scriptHash: record.scriptHash,
    address: Address.fromBech32(record.address),
    txInput: record.txInput ? parseTxInput(record.txInput) : undefined,
    status: record.status,
    manifestHash: record.manifestHash,
    supersededBy: record.supersededBy,
  };
};

/** In-memory deployment cache implementation for scripts and CI examples.
 *
 * @public
 */
export class MemoryScriptDeploymentCache implements ScriptDeploymentCache {
  readonly #records = new Map<string, ScriptDeploymentRecord>();

  /** Create a cache, optionally preloaded with records. */
  constructor(records: readonly ScriptDeploymentRecord[] = []) {
    for (const record of records) {
      this.put(record);
    }
  }

  /** Return all cached deployment records. */
  records(): readonly ScriptDeploymentRecord[] {
    return [...this.#records.values()];
  }

  /** Store a deployment record by name, version, and script hash. */
  put(record: ScriptDeploymentRecord): void {
    this.#records.set(recordKey(record), record);
  }

  /** Remove all records for a deployment target name. */
  remove(name: string): boolean {
    let removed = false;
    for (const [key, record] of this.#records) {
      if (record.name !== name) continue;
      removed = this.#records.delete(key) || removed;
    }
    return removed;
  }

  /** Find the active record for a target name, preferring the highest non-superseded version. */
  findByName(name: string): ScriptDeploymentRecord | undefined {
    const records = this.records().filter((record) => record.name === name);
    const active = records
      .filter((record) => record.status !== "superseded")
      .sort((left, right) =>
        compareDeploymentVersions(right.version, left.version),
      );
    return active[0] ?? records[0];
  }

  /** Find a cache record by script hash. */
  findByScriptHash(
    scriptHash: Hash28ByteBase16,
  ): ScriptDeploymentRecord | undefined {
    return this.records().find((record) => record.scriptHash === scriptHash);
  }

  /** Serialize the cache into a snapshot suitable for JSON artifacts. */
  snapshot(
    manifestHash?: ScriptDeploymentCacheSnapshot["manifestHash"],
  ): ScriptDeploymentCacheSnapshot {
    return {
      manifestHash,
      records: this.records().map(serializeRecord),
    };
  }
}

/** Parse a serializable deployment cache snapshot.
 *
 * @public
 */
export const parseScriptDeploymentCache = (
  snapshot: ScriptDeploymentCacheSnapshot,
): MemoryScriptDeploymentCache => {
  if (!Array.isArray(snapshot.records)) {
    throw new ScriptDeploymentCacheError(
      "Invalid deployment cache snapshot: records must be an array.",
    );
  }
  assertHash32("Deployment cache manifest hash", snapshot.manifestHash);
  return new MemoryScriptDeploymentCache(
    snapshot.records.map(deserializeRecord),
  );
};

/** Convert a deployment cache into formatted JSON.
 *
 * @public
 */
export const stringifyScriptDeploymentCache = (
  cache: ScriptDeploymentCache,
  manifestHash?: ScriptDeploymentCacheSnapshot["manifestHash"],
): string => JSON.stringify(cache.snapshot(manifestHash), null, 2);
