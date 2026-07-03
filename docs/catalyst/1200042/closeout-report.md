# Close-out report: Blaze — Tools for Handling and Managing Script Deployments

## Project details

- Project name: Blaze: Tools for Handling and Managing Script Deployments
- Project URL: https://projectcatalyst.io/funds/12/f12-cardano-open-developers/blaze-tools-for-handling-and-managing-script-deployments
- Milestone module: https://milestones.projectcatalyst.io/projects/1200042
- Project number: 1200042
- Challenge: F12 — Cardano Open: Developers
- Project manager: [NAME — fill in before submission]
- Date started: 2024-08-12
- Date completed: [COMPLETION DATE — fill in before submission]
- Requested budget: 60,000 ADA across three milestones (15,000 / 15,000 / 30,000)

## Challenge KPIs and how the project addressed them

The Cardano Open: Developers challenge funds open-source tooling that other Cardano developers can pick up and build on. This project addressed that in three ways:

- Everything shipped as open source in the public Blaze monorepo under the existing package license, with no separate or proprietary component.
- The deployment tooling is published to npm as `@blaze-cardano/deploy`, so any TypeScript project can install it without cloning or vendoring code.
- The work slots into an SDK that Cardano teams already use in production, rather than standing up a new isolated tool that developers would have to adopt from scratch.

## Project KPIs and how the project addressed them

The project KPIs were the success criteria set out in the three Statements of Milestones.

- Declarative, type-safe script deployment (M1). Delivered as the `deployScript` transaction-builder method and the `Provider.resolveScriptRef` lookup, with reconciliation against on-chain state.
- Script management standards, versioning, referencing, and dependency management (M2). Delivered as the `@blaze-cardano/deploy` package: a declarative manifest, deterministic manifest hashing, a reconciliation planner (reuse, deploy, replace, retire), and a cache with superseded history.
- Full system integration and production release (M3). The package builds, tests, and typechecks in CI; a worked Aiken example compiles a validator and deploys it on the emulator; provider compatibility is documented for the emulator, Blockfrost, Maestro, and Kupmios.

## Overall summary

The project set out to make reference-script deployment on Cardano repeatable and safe rather than a manual, one-off task. It ended with a dedicated package that treats an application's on-chain scripts as a declared, versioned dependency set. An operator writes a manifest naming each script, its version, and where it should live. The tooling checks what is already on chain, then plans the smallest set of actions needed to make reality match the manifest. Records of what was deployed, including replaced versions, are kept as an auditable cache snapshot that fits naturally into a CI pipeline.

The three milestones built on each other. M1 added the core deployment and lookup primitives to the SDK. M2 turned those primitives into a managed system with versioning and reconciliation. M3 integrated the pieces, added a real Aiken example, documented provider behavior, and released the package.

## Key achievements

- A standalone `@blaze-cardano/deploy` package rather than a loose collection of helper functions, so the deployment workflow has one clear entry point.
- Deterministic manifest hashing, which lets a CI job tell whether the desired deployment state has changed without inspecting the chain.
- A reconciliation planner that keeps first-time deploys, reuse of existing scripts, replacement of changed scripts, and retirement of removed scripts in one model.
- An end-to-end example that compiles a real Aiken validator and deploys it against the emulator, so the path from source contract to on-chain reference script is demonstrated rather than described.
- Documentation covering the management standard, dependency management, CI usage, and per-provider behavior.

## Key learnings

- Provider behavior for reference-script lookup is not uniform. Blockfrost has a native script-reference index; other providers have to scan an address. The final design makes each provider implement lookup explicitly rather than sharing one address-scan default, which is both faster where a native index exists and clearer about what each provider actually does.
- Blockfrost returns a 404 for a script hash it has never seen. Treating that as "not deployed yet" rather than an error was necessary for first-time deploys to work, and it was worth a dedicated regression test.
- Keeping superseded records instead of deleting them turned out to matter for audits. An operator reviewing a release wants to see what a script replaced, not just what is current.

## Next steps

- Grow real-world adoption beyond the initial Butane usage and gather download and usage figures now that the package is on npm.
- Extend provider compatibility notes as the tooling is exercised against more live-network setups.
- Fold operator feedback from CI usage back into the manifest format, for example explicit dependency ordering between scripts if projects ask for it.

## Links

- Source repository: https://github.com/butaneprotocol/blaze-cardano
- Deployment package source: https://github.com/butaneprotocol/blaze-cardano/tree/main/packages/blaze-deploy
- Milestone evidence: https://github.com/butaneprotocol/blaze-cardano/tree/main/docs/catalyst/1200042
- Documentation: https://blaze.butane.dev/deploy/guides/script-management, https://blaze.butane.dev/deploy/guides/ci-cd, https://blaze.butane.dev/deploy/guides/provider-compatibility
- CI/CD example: https://github.com/butaneprotocol/blaze-cardano/tree/main/examples/script-deploy-ci
- Aiken application example: https://github.com/butaneprotocol/blaze-cardano/tree/main/examples/script-deploy-aiken
- npm package: https://www.npmjs.com/package/@blaze-cardano/deploy
- Close-out video: [VIDEO URL — fill in before submission]
