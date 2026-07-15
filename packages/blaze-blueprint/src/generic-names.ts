/**
 * Pure helpers for parsing Aiken's generic type-instantiation names from a
 * plutus.json blueprint into TypeScript-friendly identifiers.
 *
 * These are deliberately free of any `Generator`/`this` state so they can be
 * unit-tested in isolation (see tests/generic-names.test.ts). The stateful
 * orchestration (schema-driven fallbacks, recursion into nested type params)
 * lives in `Generator.normalizeTypeName`.
 */

/** Returns the last "/"-separated segment of a path-like name. */
export function lastPathSegment(name: string): string {
  const segments = name.split("/");
  return segments[segments.length - 1]!;
}

/**
 * Splits a string of comma-separated generic type parameters, respecting the
 * nesting depth of `<` / `>`. Used to parse Aiken's
 *   SignedRedeemer<Void,SignedPayload<CommitteeAction>>
 * style into [`Void`, `SignedPayload<CommitteeAction>`].
 */
export function splitTopLevelCommas(inner: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i]!;
    if (ch === "<") depth++;
    else if (ch === ">") depth--;
    else if (ch === "," && depth === 0) {
      out.push(inner.substring(start, i));
      start = i + 1;
    }
  }
  out.push(inner.substring(start));
  return out;
}

/**
 * Parses Aiken's double-angle tuple/generic syntax, e.g.
 *   "Tuple<<types/AssetClass,Int>>" -> "Tuple_AssetClass_Int".
 *
 * Each type param is reduced to its last "/"-segment. Returns the normalized
 * identifier, or `null` if the name is not in double-angle form.
 */
export function parseDoubleAngleGeneric(
  fullDefinitionName: string,
): string | null {
  const angleBracketMatch = fullDefinitionName.match(/^(\w+)<<(.+)>>$/);
  if (!angleBracketMatch) {
    return null;
  }
  const baseName = angleBracketMatch[1]!;
  const innerParams = angleBracketMatch[2]!;
  const typeParamNames = innerParams
    .split(",")
    .map((param) => lastPathSegment(param.trim()).replace(/~/g, "_"));
  return `${baseName}_${typeParamNames.join("_")}`;
}

/**
 * Structurally parses Aiken's single-angle generic syntax, e.g.
 *   "types/SignedRedeemer<Void,types/CommitteeAction>"
 *     -> { baseName: "SignedRedeemer", rawParams: ["Void", "types/CommitteeAction"] }
 *
 * The base name is the last "/"-segment before the first "<"; the raw params
 * are the top-level comma-separated values inside the outermost `<...>`, left
 * un-normalized so the caller can recurse into them. Returns `null` for names
 * that are not single-angle generics (including the double-angle "<<...>>"
 * form, which {@link parseDoubleAngleGeneric} handles).
 *
 * Implemented with index math rather than a regex like `/^(.+?)<(.+)>$/` to
 * avoid polynomial backtracking on adversarial input (e.g. "a<a<a<...").
 */
export function parseSingleAngleGeneric(
  fullDefinitionName: string,
): { baseName: string; rawParams: string[] } | null {
  if (!fullDefinitionName.includes("<") || fullDefinitionName.endsWith(">>")) {
    return null;
  }
  const openIdx = fullDefinitionName.indexOf("<");
  const closeIdx = fullDefinitionName.length - 1;
  // Require a non-empty base before the first "<", a closing ">" as the final
  // character, and a non-empty inner section.
  if (
    !(openIdx > 0 && fullDefinitionName.endsWith(">") && closeIdx - openIdx > 1)
  ) {
    return null;
  }
  const beforeAngle = fullDefinitionName.slice(0, openIdx);
  const innerParams = fullDefinitionName.slice(openIdx + 1, closeIdx);
  const baseName = lastPathSegment(beforeAngle);
  const rawParams = splitTopLevelCommas(innerParams).map((param) =>
    param.trim(),
  );
  return { baseName, rawParams };
}
