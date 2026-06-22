/** Base error for script deployment failures.
 *
 * @public
 */
export class ScriptDeploymentError extends Error {
  /** Create a script deployment error. */
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ScriptDeploymentError";
  }
}

/** Error thrown when a deployment manifest is invalid.
 *
 * @public
 */
export class ScriptDeploymentManifestError extends ScriptDeploymentError {
  /** Create a deployment manifest error. */
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ScriptDeploymentManifestError";
  }
}

/** Error thrown when deployment cache data is invalid.
 *
 * @public
 */
export class ScriptDeploymentCacheError extends ScriptDeploymentError {
  /** Create a deployment cache error. */
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ScriptDeploymentCacheError";
  }
}

/** Error thrown while building a deployment plan.
 *
 * @public
 */
export class ScriptDeploymentPlanError extends ScriptDeploymentError {
  /** Create a deployment plan error. */
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ScriptDeploymentPlanError";
  }
}
