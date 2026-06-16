# Introduction

`@blaze-cardano/query` defines how Blaze reads from and writes to Cardano network backends.

The central abstraction is `Provider`. Transaction builders use providers for protocol parameters, UTxO lookup, datum lookup, script-reference lookup, transaction evaluation, submission, confirmation, and slot/time conversion.

Common provider choices:

- `Blockfrost` for hosted REST access.
- `Maestro` for Maestro-backed chain queries, evaluation, and submission.
- `Kupmios` for Kupo plus Ogmios environments.
- `RoutedProvider` when an application wants separate backends for reads, evaluation, submission, or specific query methods.

Continue with [provider routing](./provider-routing.md), [advanced querying](./advanced-querying.md), and [provider internals](./provider-internals.md).
