/**
 * Snapshot (version) docs for packages that changed in the current release.
 * Requires: the per-package api:md already wrote Markdown into packages/[pkg]/docs/api
 *
 * Usage: pnpm docs:version
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PKG_ID = {
  "@blaze-cardano/blueprint": "blaze-blueprint",
  "@blaze-cardano/core": "blaze-core",
  "@blaze-cardano/data": "blaze-data",
  "@blaze-cardano/emulator": "blaze-emulator",
  "@blaze-cardano/ogmios": "blaze-ogmios",
  "@blaze-cardano/query": "blaze-query",
  "@blaze-cardano/sdk": "blaze-sdk",
  "@blaze-cardano/tx": "blaze-tx",
  "@blaze-cardano/uplc": "blaze-uplc",
  "@blaze-cardano/vm": "blaze-vm",
  "@blaze-cardano/wallet": "blaze-wallet",
};

function getReleases() {
  try {
    const out = execSync("pnpm changeset status --output=JSON", {
      stdio: ["ignore", "pipe", "pipe"],
    }).toString();
    const data = JSON.parse(out);
    return data.releases
      .filter((r) => PKG_ID[r.name] && r.type !== "none")
      .map((r) => ({ name: r.name, version: r.newVersion }));
  } catch {
    // Fallback: version everything found in PKG_ID using package.json
    return Object.keys(PKG_ID).map((name) => {
      const dir = `blaze-${name.split("/")[1]}`;
      const pkg = JSON.parse(
        readFileSync(join("packages", dir, "package.json"), "utf8")
      );
      return { name, version: pkg.version };
    });
  }
}

function versionsFileFor(id) {
  // default instance uses versions.json; non-default uses <id>_versions.json
  return id === "default"
    ? join("docs", "versions.json")
    : join("docs", `${id}_versions.json`);
}

function hasVersion(id, version) {
  const file = versionsFileFor(id);
  if (!existsSync(file)) return false; // no versions yet
  try {
    const list = JSON.parse(readFileSync(file, "utf8"));
    // Docusaurus stores a simple array of version names (newest first)
    return list.includes(version);
  } catch {
    return false;
  }
}

function main() {
  const releases = getReleases();
  if (!releases.length) {
    console.log("No package docs to version.");
    return;
  }
  for (const { name, version } of releases) {
    const id = PKG_ID[name];

    if (hasVersion(id, version)) {
      console.log(
        `↷ Skipping ${name}@${version} (id=${id}) — version already exists.`
      );
      continue;
    }

    console.log(`Versioning docs for ${name}@${version} (id=${id})`);
    // This copies the *entire* docs folder for that plugin (guides, examples, generated api)
    execSync(`cd docs && bun run docusaurus docs:version:${id} ${version}`, {
      stdio: "inherit",
    });
  }
}

main();
