import type { ScriptDeploymentRecord } from "./types";
import { ScriptDeploymentManifestError } from "./errors";

const parseVersion = (version: string): [number, number, number] => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new ScriptDeploymentManifestError(
      `Deployment version "${version}" must use x.y.z format.`,
    );
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

/** Compare two `x.y.z` deployment versions.
 *
 * @public
 */
export const compareDeploymentVersions = (
  left: string,
  right: string,
): -1 | 0 | 1 => {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let i = 0; i < a.length; i += 1) {
    if (a[i]! < b[i]!) return -1;
    if (a[i]! > b[i]!) return 1;
  }
  return 0;
};

/** Increment the patch component of an `x.y.z` deployment version.
 *
 * @public
 */
export const nextPatchVersion = (version: string): string => {
  const [major, minor, patch] = parseVersion(version);
  return `${major}.${minor}.${patch + 1}`;
};

/** Mark a deployment record as superseded by a replacement record.
 *
 * @public
 */
export const supersedeRecord = (
  record: ScriptDeploymentRecord,
  replacement: ScriptDeploymentRecord,
): ScriptDeploymentRecord => ({
  ...record,
  status: "superseded",
  supersededBy: replacement.scriptHash,
});
