# Security

Blaze builds and signs Cardano transactions, so security reports should be handled privately until a fix is available.

## Supported versions

Security fixes are made against the current repository and the latest published version of each package. Older package versions may not receive fixes.

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/butaneprotocol/blaze-cardano/security/advisories/new). Do not open a public issue for a suspected vulnerability.

Include the affected package and version, the impact, and the smallest reproduction you can provide. For transaction or provider issues, include the network, transaction shape, and provider involved. Remove API keys, seed phrases, signing keys, and other secrets from the report.

We will confirm the report, investigate it, and coordinate disclosure with the reporter. A vulnerability should remain private until a fixed package has been published or the maintainers agree that disclosure is safe.

## Dependency policy

The repository commits its Bun lockfile and CI installs it with `--frozen-lockfile`. Maintainers run `bun audit --audit-level=high` when reviewing dependency changes and before publishing releases that change the resolved dependency graph. Critical and high-severity advisories must be addressed before those releases are published.

Dependency updates must pass the same build, typecheck, unit, integration, coverage, and documentation checks as source changes. Releases are published through the repository's Changesets workflow and npm trusted publishing. Contributors must not add registry tokens or package credentials to the repository.
