# Catalyst 1200041 milestone 4 evidence

Proposal: [Blaze: Maintenance, Security Improvements, Testing & Assurances for the Blaze SDK](https://milestones.projectcatalyst.io/projects/1200041)

Current Statement of Milestones: `soms.id=10012`, Milestone 4, "Enhance Documentation and Developer Onboarding".

## What M4 claims

The current SoM requires:

- Comprehensive developer documentation and getting started guides for the Blaze SDK.
- Documentation for transaction building and chain querying.
- Coverage of base methods, functions, and relevant types.
- Descriptions of each provider implementation so developers understand the network requests being made.
- Interactive tutorials and code examples using Aiken contracts.
- Step-by-step examples for building transactions with Aiken smart contracts.
- Examples demonstrating different chain providers and their query APIs.
- Contribution guidelines and community resources.

## Success criteria coverage

| Success criterion                                                     | Evidence                                                                                            |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Docs cover using and contributing to Blaze                            | SDK, tx, query, deploy, contribution, and security docs                                             |
| New users can build transactions interacting with their own contracts | Aiken transaction guide, script transaction guide, and Aiken example                                |
| Tutorials cover key Cardano developer use cases                       | Aiken, advanced querying, transaction building, and script deployment examples                      |
| Community engagement tools are in place                               | Issue templates, PR template, `CONTRIBUTING.md`, `SECURITY.md`, and public GitHub issue/PR activity |

## Implementation mapping

| Requirement                      | Evidence                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------- |
| SDK onboarding guide             | `packages/blaze-sdk/docs/guides/getting-started.md`                              |
| Transaction-building guide       | `packages/blaze-tx/docs/guides/transaction-building.md`                          |
| Script transaction guide         | `packages/blaze-tx/docs/guides/script-transactions.md`                           |
| Advanced querying guide          | `packages/blaze-query/docs/guides/advanced-querying.md`                          |
| Provider implementation guide    | `packages/blaze-query/docs/guides/provider-internals.md`                         |
| Aiken tutorial                   | `packages/blaze-sdk/docs/guides/aiken-transaction.md`                            |
| Aiken code example               | `examples/script-deploy-aiken`                                                   |
| Provider query example           | `examples/advanced-querying`                                                     |
| Script deployment guide          | `packages/blaze-deploy/docs/guides/script-deployment.md`                         |
| Contribution guide               | `CONTRIBUTING.md`                                                                |
| Community issue and PR templates | `.github/ISSUE_TEMPLATE`, `.github/PULL_REQUEST_TEMPLATE.md`, `SECURITY.md`      |
| Community engagement metrics     | Public GitHub stars, forks, watchers, issue, pull request, and contributor links |

## Verification

```sh
bun run docs:prepare
bun --filter @blaze-cardano/e2e typecheck
bun --filter advanced-querying typecheck
bun --filter advanced-querying start
bun --filter script-deploy-aiken typecheck
bun --filter script-deploy-aiken start
cd docs && bun run build
```

Public documentation links and community engagement metrics come from the deployed docs site, GitHub, and relevant community channels. GitHub metric evidence should include public source links for [stars](https://github.com/butaneprotocol/blaze-cardano/stargazers), [forks](https://github.com/butaneprotocol/blaze-cardano/forks), [watchers](https://github.com/butaneprotocol/blaze-cardano/watchers), [issues](https://github.com/butaneprotocol/blaze-cardano/issues?q=is%3Aissue%20sort%3Aupdated-desc), [merged pull requests](https://github.com/butaneprotocol/blaze-cardano/pulls?q=is%3Apr%20is%3Amerged%20sort%3Aupdated-desc), and [contributors](https://github.com/butaneprotocol/blaze-cardano/graphs/contributors). Community chat activity can be added as extra external evidence if needed.
