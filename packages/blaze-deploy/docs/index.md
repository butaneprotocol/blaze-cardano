---
title: "@blaze-cardano/deploy"
---

`@blaze-cardano/deploy` contains utilities for deploying Cardano reference scripts with Blaze.

The package is built around three pieces:

- A manifest that describes the scripts that should exist on chain.
- A cache that records previously verified deployments.
- A planner that compares the manifest, cache, and live chain state before deciding whether to reuse, deploy, replace, or retire a script reference.

Start with the [script deployment guide](./guides/script-deployment.md).
