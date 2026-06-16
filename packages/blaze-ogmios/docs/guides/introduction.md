# Introduction

`@blaze-cardano/ogmios` contains Ogmios-facing helpers used by Blaze provider infrastructure.

Most applications should start with `@blaze-cardano/query` instead. Use this package directly when building lower-level tooling around Ogmios, or when contributing provider behavior that needs direct access to Ogmios query/evaluation primitives.

In Blaze, Ogmios is commonly used for:

1. Transaction evaluation.
2. Chain sync and event streams.
3. Provider implementations that pair Ogmios with another indexer.

For provider-level usage, see the query [provider internals guide](/query/guides/provider-internals).
