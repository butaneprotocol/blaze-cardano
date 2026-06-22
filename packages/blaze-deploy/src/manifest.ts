import {
  type Address,
  type Hash32ByteBase16,
  HexBlob,
  NetworkId,
  blake2b_256,
} from "@blaze-cardano/core";
import type {
  ScriptDeploymentManifest,
  ScriptDeploymentTarget,
  SerializableScriptDeploymentManifest,
} from "./types";
import { ScriptDeploymentManifestError } from "./errors";

const networkToId = (network: ScriptDeploymentManifest["network"]) => {
  switch (network) {
    case "cardano-mainnet":
      return NetworkId.Mainnet;
    case "cardano-preprod":
    case "cardano-preview":
    case "cardano-sanchonet":
      return NetworkId.Testnet;
    default:
      throw new ScriptDeploymentManifestError(
        `Unsupported deployment network "${network}".`,
      );
  }
};

const sortedObject = (
  value: Readonly<Record<string, string>> | undefined,
): Readonly<Record<string, string>> => {
  if (!value) return {};
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
  );
};

const assertNonEmpty = (label: string, value: string) => {
  if (value.trim().length === 0) {
    throw new ScriptDeploymentManifestError(`${label} must not be empty.`);
  }
};

const assertSemanticVersion = (target: ScriptDeploymentTarget) => {
  if (!/^\d+\.\d+\.\d+$/.test(target.version)) {
    throw new ScriptDeploymentManifestError(
      `Target "${target.name}" version must use x.y.z format.`,
    );
  }
};

const assertAddressNetwork = (
  manifest: ScriptDeploymentManifest,
  target: ScriptDeploymentTarget,
) => {
  const expected = networkToId(manifest.network);
  const actual = target.address.getNetworkId();
  if (actual !== expected) {
    throw new ScriptDeploymentManifestError(
      `Target "${target.name}" address network does not match manifest network "${manifest.network}".`,
    );
  }
};

const assertAcyclic = (targets: readonly ScriptDeploymentTarget[]) => {
  const byName = new Map(targets.map((target) => [target.name, target]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (name: string, path: readonly string[]) => {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      throw new ScriptDeploymentManifestError(
        `Deployment dependency cycle detected: ${[...path, name].join(" -> ")}.`,
      );
    }
    const target = byName.get(name);
    if (!target) {
      throw new ScriptDeploymentManifestError(
        `Deployment dependency "${name}" does not exist.`,
      );
    }
    visiting.add(name);
    for (const dependency of target.dependencies ?? []) {
      visit(dependency, [...path, name]);
    }
    visiting.delete(name);
    visited.add(name);
  };

  for (const target of targets) {
    visit(target.name, []);
  }
};

/** Validate a deployment manifest and return it unchanged.
 *
 * @public
 */
export const validateScriptDeploymentManifest = (
  manifest: ScriptDeploymentManifest,
): ScriptDeploymentManifest => {
  assertNonEmpty("Manifest id", manifest.id);
  const names = new Set<string>();
  for (const target of manifest.targets) {
    assertNonEmpty("Target name", target.name);
    assertNonEmpty(`Target "${target.name}" version`, target.version);
    if (names.has(target.name)) {
      throw new ScriptDeploymentManifestError(
        `Duplicate deployment target "${target.name}".`,
      );
    }
    names.add(target.name);
    assertSemanticVersion(target);
    assertAddressNetwork(manifest, target);
    for (const dependency of target.dependencies ?? []) {
      if (
        !names.has(dependency) &&
        !manifest.targets.some((t) => t.name === dependency)
      ) {
        throw new ScriptDeploymentManifestError(
          `Target "${target.name}" depends on unknown target "${dependency}".`,
        );
      }
    }
  }
  assertAcyclic(manifest.targets);
  return manifest;
};

/** Convert a manifest into the canonical serializable form used for hashing.
 *
 * @public
 */
export const serializeScriptDeploymentManifest = (
  manifest: ScriptDeploymentManifest,
): SerializableScriptDeploymentManifest => {
  validateScriptDeploymentManifest(manifest);
  return {
    id: manifest.id,
    network: manifest.network,
    targets: manifest.targets
      .map((target) => ({
        name: target.name,
        version: target.version,
        scriptHash: target.script.hash(),
        address: target.address.toBech32(),
        minAda: target.minAda?.toString(),
        dependencies: [...(target.dependencies ?? [])].sort(),
        metadata: sortedObject(target.metadata),
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
};

/** Stringify data with deterministic object-key ordering.
 *
 * @public
 */
export const canonicalJson = (value: unknown): string =>
  JSON.stringify(value, (_key, inner) => {
    if (typeof inner === "bigint") return inner.toString();
    if (
      inner &&
      typeof inner === "object" &&
      !Array.isArray(inner) &&
      Object.getPrototypeOf(inner) === Object.prototype
    ) {
      return Object.fromEntries(
        Object.entries(inner).sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      );
    }
    return inner;
  });

/** Compute the deterministic hash of a deployment manifest.
 *
 * @public
 */
export const scriptDeploymentManifestHash = (
  manifest: ScriptDeploymentManifest,
): Hash32ByteBase16 =>
  blake2b_256(
    HexBlob(
      Buffer.from(
        canonicalJson(serializeScriptDeploymentManifest(manifest)),
        "utf8",
      ).toString("hex"),
    ),
  );

/** Define and validate a deployment manifest.
 *
 * @public
 */
export const defineScriptDeployment = (
  manifest: ScriptDeploymentManifest,
): ScriptDeploymentManifest => validateScriptDeploymentManifest(manifest);

/** Identity helper for call sites that want an explicit deployment address marker.
 *
 * @public
 */
export const assertDeploymentAddress = (address: Address): Address => address;
