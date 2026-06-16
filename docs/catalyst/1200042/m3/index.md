# Catalyst 1200042 milestone 3 evidence

Proposal: [Blaze: Tools for Handling and Managing Script Deployments](https://milestones.projectcatalyst.io/projects/1200042)

Current Statement of Milestones: `soms.id=9828`, Milestone 3, "Full System Integration and Production Release".

## What M3 claims

The current SoM requires:

- Final close-out report.
- Final close-out video.
- Fully integrated script deployment and management system.
- Comprehensive documentation and usage guides.
- Real-world application demonstrations.
- CI/CD pipeline for the Blaze SDK including the new features.
- End-to-end system behavior.
- Compatibility with major Cardano development tools.
- Release of the updated Blaze SDK on npm.
- Community feedback and initial adoption metrics.

## Success criteria coverage

| Success criterion                                                | Evidence                                                                                                                                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Final close-out report and video are public                      | Report is in repo; public report and video links are supplied in the PoA evidence set                                                                                   |
| System works end-to-end                                          | Deploy package execution test, emulator e2e test, basic emulator example, and gated live e2e test                                                                       |
| Docs cover script deployment and management                      | Deploy guides, generated API docs, and Docusaurus integration                                                                                                           |
| At least two real-world applications successfully use the system | Repo examples demonstrate integration patterns; strict PoA checking requires two distinct public application links or case studies showing the deployment system in use |
| CI/CD automates testing and release                              | Existing GitHub Actions, e2e evidence summary, and CI/CD deployment example                                                                                             |
| Compatible with major Cardano tools                              | Aiken example and provider compatibility guide for Blockfrost, Maestro, Kupmios, and emulator                                                                           |

## Implementation mapping

| Requirement                                 | Evidence                                                                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Close-out report                            | `docs/catalyst/1200042/closeout/index.md`                                                                                                                     |
| Close-out video                             | Public close-out video URL supplied in the PoA evidence set                                                                                                   |
| Integrated deployment and management system | `packages/blaze-deploy/src`                                                                                                                                   |
| SDK release integration                     | `packages/blaze-sdk/src/index.ts`, `packages/blaze-sdk/etc/sdk.api.md`                                                                                        |
| Usage docs                                  | `packages/blaze-deploy/docs/guides`                                                                                                                           |
| Example demos                               | `examples/script-deploy-basic`, `examples/script-deploy-aiken`, `examples/script-deploy-ci`                                                                   |
| Real-world adoption evidence                | At least two public real-world application links or case studies supplied in the PoA evidence set                                                             |
| End-to-end behavior                         | `packages/blaze-deploy/tests/deploy.test.ts`, `packages/e2e/tests/script-deployment-emulator.e2e.test.ts`, `packages/e2e/tests/script-deployment.e2e.test.ts` |
| CI/CD pipeline                              | `.github/workflows/check.yml`, `.github/workflows/e2e.yml`, `.github/workflows/docs.yml`, `packages/blaze-deploy/docs/guides/ci-cd.md`                        |
| Compatibility matrix                        | `packages/blaze-deploy/docs/guides/provider-compatibility.md`                                                                                                 |
| npm release evidence                        | `.changeset/silent-lamps-route.md`, generated API reports, green CI, and checked npm package links                                                            |
| Community feedback                          | Public issue, PR, and discussion links from review and adoption                                                                                               |

## Verification

```sh
bun --filter @blaze-cardano/deploy test       # 1 file, 22 tests passing
bun --filter @blaze-cardano/deploy coverage   # 91.1% statements, 85.6% branches
bun --filter @blaze-cardano/deploy typecheck  # passing
bun --filter @blaze-cardano/deploy lint       # passing
bun --filter @blaze-cardano/deploy build      # passing
bun run build                                 # passing
bun run docs:format:check                     # passing
bun run docs:prepare                          # passing
bun --filter @blaze-cardano/e2e typecheck     # passing
bun --filter @blaze-cardano/e2e test          # emulator deployment e2e passing; live tests skip without credentials
bun --filter script-deploy-basic typecheck    # passing
bun --filter script-deploy-basic start        # deploys and reconciles on emulator
bun --filter script-deploy-aiken typecheck    # passing
bun --filter script-deploy-aiken start        # compiles an Aiken validator and deploys on emulator
bun --filter script-deploy-ci typecheck       # passing
```

The public e2e workflow enables the live script deployment test with `BLAZE_SCRIPT_DEPLOYMENT_E2E=true`. It uses the existing `SEED_MNEMONIC` and `BLOCKFROST_KEY` repository secrets. For full provider evidence, run the workflow manually with `full-provider-evidence=true`; that mode fails before tests if the Kupmios or Maestro evidence inputs are missing and forces the live Kupmios and provider-parity tests to run. The manual full-provider run is titled `e2e full-provider-evidence` in GitHub Actions. Provider parity reads from the e2e wallet address by default; `E2E_QUERY_ADDRESS` or the manual `e2e-query-address` workflow input can override it. The workflow summary records which provider evidence inputs were configured, and the tests append public-safe evidence for submitted transaction IDs, deployment manifest hashes, target script hashes, reference inputs, record statuses, reconciliation actions, provider parity counts, and protocol-parameter values without printing secret values. The PoA evidence set also requires two public real-world application links or case studies, adoption metrics, npm release links, and a close-out video.
