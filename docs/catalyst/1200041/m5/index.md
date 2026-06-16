# Catalyst 1200041 milestone 5 evidence

Proposal: [Blaze: Maintenance, Security Improvements, Testing & Assurances for the Blaze SDK](https://milestones.projectcatalyst.io/projects/1200041)

Current Statement of Milestones: `soms.id=9847`, Milestone 5, "Establish Framework for Ongoing Development and Cardano Integration".

## What M5 claims

The current SoM requires:

- Final closeout report.
- Final closeout video.
- A well-organized GitHub monorepo for Blaze.
- Public roadmap, task board, and task management system.
- Process for integrating new Cardano features.
- CI/CD logs showing successful automated testing and deployment.
- Version `1.0.0` of Blaze packages ready for release.

## Success criteria coverage

| Success criterion                                                  | Evidence                                                                                                                                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Final closeout report is publicly available                        | Repo includes the report; public URL is supplied in the PoA evidence set                                                                                                                                     |
| Final closeout video is publicly available                         | Public closeout video URL supplied in the PoA evidence set                                                                                                                                                   |
| Repository is structured and easy to navigate                      | Root packages, examples, docs, Docusaurus sidebars, and contribution docs                                                                                                                                    |
| Roadmap communicates future development plans                      | [`/roadmap`](/roadmap)                                                                                                                                                                                       |
| New Cardano feature integration process is documented and testable | [`/cardano-integration-process`](/cardano-integration-process) plus package verification commands                                                                                                            |
| Version `1.0.0` packages are ready for release                     | Single major-version changeset for every discovered public runtime package, non-mutating `1.0.0` release-plan check, generated API reports, CI npm-pack dry run, green CI, and checked npm release artifacts |

## Implementation mapping

| Requirement                 | Evidence                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Closeout report             | `docs/catalyst/1200041/closeout/index.md`                                                                                                                                                                                                                                                                                                |
| Closeout video              | Public closeout video URL supplied in the PoA evidence set                                                                                                                                                                                                                                                                               |
| Monorepo structure          | Repository root, `packages/*`, `examples/*`, `docs/*`                                                                                                                                                                                                                                                                                    |
| Public roadmap              | [`/roadmap`](/roadmap)                                                                                                                                                                                                                                                                                                                   |
| Cardano integration process | [`/cardano-integration-process`](/cardano-integration-process)                                                                                                                                                                                                                                                                           |
| Task management             | Public GitHub task board evidence through issues, including [open roadmap work](https://github.com/butaneprotocol/blaze-cardano/issues?q=is%3Aissue%20state%3Aopen%20sort%3Aupdated-desc) and [closed implementation issues](https://github.com/butaneprotocol/blaze-cardano/issues?q=is%3Aissue%20state%3Aclosed%20sort%3Aupdated-desc) |
| Security process            | `SECURITY.md`                                                                                                                                                                                                                                                                                                                            |
| CI/CD evidence              | GitHub Actions `Check`, `e2e`, and docs deployment runs from the submitted branch; the `e2e` run summary records which provider evidence inputs were configured                                                                                                                                                                          |
| Release readiness           | `.changeset/silent-lamps-route.md`, generated API reports, green CI, and checked npm release links                                                                                                                                                                                                                                       |

The public task-management evidence is the repository issue tracker: [open issues](https://github.com/butaneprotocol/blaze-cardano/issues?q=is%3Aissue%20state%3Aopen%20sort%3Aupdated-desc) show ongoing work, [closed issues](https://github.com/butaneprotocol/blaze-cardano/issues?q=is%3Aissue%20state%3Aclosed%20sort%3Aupdated-desc) show completed maintenance and implementation work, and [merged pull requests](https://github.com/butaneprotocol/blaze-cardano/pulls?q=is%3Apr%20is%3Amerged%20sort%3Aupdated-desc) show reviewed repository activity.

## Repository verification

```sh
bun install --frozen-lockfile
bun syncpack lint
bun syncpack format --check
bun run prettier --check .
bun run docs:format:check
bun run lint
bun run build
bun run typecheck
bun run test
bun run docs:prepare
bun --filter @blaze-cardano/e2e typecheck
cd docs && bun run build
```

These are the repository checks used for the submitted branch. Public CI, deployed docs, package release evidence, and the closeout video are checked as external PoA links.

The `e2e` workflow runs the live script deployment test with the existing `SEED_MNEMONIC` and `BLOCKFROST_KEY` secrets. It also runs live Kupmios provider coverage when `KUPO_URL` and `OGMIOS_URL` are configured, and Maestro provider parity when `MAESTRO_KEY` is configured, using the e2e wallet address by default or `E2E_QUERY_ADDRESS` as an override. For the final provider PoA, run the workflow manually with `full-provider-evidence=true`; that mode fails before tests if the Kupmios or Maestro evidence inputs are missing and forces the live Kupmios and provider-parity tests to run. The manual full-provider run is titled `e2e full-provider-evidence` in GitHub Actions, and the strict PoA checker rejects provider evidence links that do not point to a successful `e2e` workflow run with that title marker. The workflow summary records configured/missing status for each provider evidence input and the tests append public-safe evidence for transaction IDs, provider parity UTxO counts, protocol-parameter values, deployment manifest hashes, script hashes, reference inputs, and reconciliation actions without printing secret values.
