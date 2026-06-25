import {
  Address,
  Hash28ByteBase16,
  Hash32ByteBase16,
  HexBlob,
  TransactionUnspentOutput,
} from "@blaze-cardano/core";
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
  utxoCbor: record.utxo?.toCbor(),
  status: record.status,
  manifestHash: record.manifestHash,
  supersededBy: record.supersededBy,
});

const parseUtxoCbor = (
  value: string | undefined,
): TransactionUnspentOutput | undefined => {
  if (value === undefined) return undefined;
  try {
    return TransactionUnspentOutput.fromCbor(HexBlob(value));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ScriptDeploymentCacheError(
      `Invalid deployment cache UTxO CBOR: ${message}`,
    );
  }
};

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
  const scriptHash = Hash28ByteBase16(record.scriptHash);
  const manifestHash =
    record.manifestHash === undefined
      ? undefined
      : Hash32ByteBase16(record.manifestHash);
  const supersededBy =
    record.supersededBy === undefined
      ? undefined
      : Hash28ByteBase16(record.supersededBy);
  if (!statuses.has(record.status)) {
    throw new ScriptDeploymentCacheError(
      `Invalid deployment cache status "${record.status}".`,
    );
  }
  return {
    name: record.name,
    version: record.version,
    scriptHash,
    address: Address.fromBech32(record.address),
    utxo: parseUtxoCbor(record.utxoCbor),
    status: record.status,
    manifestHash,
    supersededBy,
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
  if (snapshot.manifestHash !== undefined) {
    Hash32ByteBase16(snapshot.manifestHash);
  }
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
