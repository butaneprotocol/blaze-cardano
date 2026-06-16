# Catalyst 1200042 milestone 2 evidence

Proposal: [Blaze: Tools for Handling and Managing Script Deployments](https://milestones.projectcatalyst.io/projects/1200042)

Current Statement of Milestones: `soms.id=9827`, Milestone 2, "Develop Script Management System".

## What M2 claims

The current SoM requires:

- Standards for managing deployed scripts.
- Functions for script versioning and updating.
- Utilities for script referencing and dependency management.
- Examples of use in Continuous Deployment pipelines.
- Unit and integration tests for all new features.
- Test results showing successful script versioning and updating.
- Peer review and approval from Cardano smart contract experts.

## Success criteria coverage

| Success criterion                                           | Evidence                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Script management standards are well-defined and documented | Script management guide                                                               |
| Versioning allows smooth script updates                     | Version helpers, replace/supersede tests, and cache records                           |
| Referencing manages script dependencies efficiently         | Manifest dependency sorting and cycle rejection tests                                 |
| CD examples demonstrate automated deployment                | CI/CD guide and `examples/script-deploy-ci`                                           |
| New features are covered by unit and integration tests      | Deploy package tests, emulator e2e test, and gated live e2e test                      |
| Expert review evidence is public                            | Public review/comment or approval links are checked by the strict PoA evidence script |

## Implementation mapping

| Requirement                  | Evidence                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Script management standard   | [`/deploy/guides/script-management`](/deploy/guides/script-management)                                                                                                                                                                                                                                                                                           |
| Versioning and updating      | [`packages/blaze-deploy/src/manage.ts`](../../../../packages/blaze-deploy/src/manage.ts), [`packages/blaze-deploy/tests/deploy.test.ts`](../../../../packages/blaze-deploy/tests/deploy.test.ts)                                                                                                                                                                 |
| Script referencing utilities | [`packages/blaze-deploy/src/planner.ts`](../../../../packages/blaze-deploy/src/planner.ts), [`packages/blaze-deploy/src/compat.ts`](../../../../packages/blaze-deploy/src/compat.ts)                                                                                                                                                                             |
| Dependency management        | [`packages/blaze-deploy/src/manifest.ts`](../../../../packages/blaze-deploy/src/manifest.ts), [`packages/blaze-deploy/tests/deploy.test.ts`](../../../../packages/blaze-deploy/tests/deploy.test.ts)                                                                                                                                                             |
| CD example                   | [`/deploy/guides/ci-cd`](/deploy/guides/ci-cd), [`examples/script-deploy-ci`](https://github.com/butaneprotocol/blaze-cardano/tree/main/examples/script-deploy-ci), `bun --filter script-deploy-ci typecheck`                                                                                                                                                    |
| Unit and integration tests   | [`packages/blaze-deploy/tests/deploy.test.ts`](../../../../packages/blaze-deploy/tests/deploy.test.ts), [`packages/e2e/tests/script-deployment-emulator.e2e.test.ts`](../../../../packages/e2e/tests/script-deployment-emulator.e2e.test.ts), [`packages/e2e/tests/script-deployment.e2e.test.ts`](../../../../packages/e2e/tests/script-deployment.e2e.test.ts) |
| Peer review and approval     | Public GitHub review/comment or approval links supplied in the PoA evidence set                                                                                                                                                                                                                                                                                  |

## Verification

```sh
bun --filter @blaze-cardano/deploy test       # 1 file, 22 tests passing
bun --filter @blaze-cardano/deploy coverage   # 91.1% statements, 85.6% branches
bun --filter @blaze-cardano/deploy typecheck  # passing
bun --filter @blaze-cardano/deploy lint       # passing
bun --filter @blaze-cardano/e2e typecheck     # passing
bun --filter @blaze-cardano/e2e test          # emulator deployment e2e passing; live tests skip without credentials
bun --filter script-deploy-ci typecheck       # passing
```
