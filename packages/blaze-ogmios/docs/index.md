---
title: "@blaze-cardano/ogmios"
---

`@blaze-cardano/ogmios` contains lower-level Ogmios helpers used by Blaze query providers.

Most applications should use `@blaze-cardano/query` or `@blaze-cardano/sdk` directly. Use this package when integrating with Ogmios primitives or when building provider infrastructure around an Ogmios connection.

## Main APIs

- Ogmios client helpers used by provider implementations.
- Types and utilities for chain-query and evaluation calls that depend on Ogmios.
- Shared infrastructure for `Kupmios` and websocket-based chain-sync flows.

Start with the [introduction](./guides/introduction.md) and the query [provider internals guide](/query/guides/provider-internals).
