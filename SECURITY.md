# Security policy

Blaze handles transaction construction, chain-provider calls, wallet signing boundaries, and script deployment helpers. Treat changes in these areas as security-sensitive even when they do not touch cryptographic primitives directly.

## Reporting

Report suspected vulnerabilities privately through GitHub Security Advisories or by contacting the maintainers listed in the repository. Do not open a public issue for exploitable transaction-building, wallet-signing, deployment-cache, provider-routing, or key-handling problems.

Include:

- affected package and version or commit
- minimal reproduction steps
- expected impact
- whether funds, keys, signatures, provider credentials, or script references are exposed

## Review expectations

Security-sensitive changes should include tests for the failure mode they address. Provider routing changes should make it clear which backend receives each request. Transaction-builder changes should preserve value movement explicitly. Script deployment changes should avoid logging wallet secrets, provider credentials, signing payloads, or private deployment cache paths.

## Supported branches

Security fixes target the active development branch and the latest published package line. If a fix needs a backport, maintainers will publish a patch release and call it out in the changelog.
