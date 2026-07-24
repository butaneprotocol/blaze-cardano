# Blaze roadmap

GitHub Issues is the public task system for Blaze. The [open issue list](https://github.com/butaneprotocol/blaze-cardano/issues) contains the current backlog, and the [issue form](https://github.com/butaneprotocol/blaze-cardano/issues/new/choose) is the place to report a bug, provider mismatch, documentation gap, or feature request.

## Current work

- Finish the dependency and release security work tracked in [#144](https://github.com/butaneprotocol/blaze-cardano/issues/144).
- Remove the remaining WASM dependency from data signing, tracked in [#212](https://github.com/butaneprotocol/blaze-cardano/issues/212).
- Normalize provider evaluation failures so callers receive useful script errors, tracked in [#71](https://github.com/butaneprotocol/blaze-cardano/issues/71).

## Next

- Simplify the internal UPLC representation, tracked in [#58](https://github.com/butaneprotocol/blaze-cardano/issues/58).
- Explore a small DSL for constructing UPLC terms, tracked in [#57](https://github.com/butaneprotocol/blaze-cardano/issues/57).

## Ongoing maintenance

- Track Cardano ledger, network, and protocol changes in the core, transaction, wallet, provider, and emulator packages.
- Keep Blockfrost, Maestro, Kupmios, Ogmios, and external provider integrations compatible with their upstream APIs.
- Expand transaction safety, emulator fidelity, test coverage, and developer documentation as public APIs change.
- Publish package updates through Changesets after CI and review pass.

Roadmap items can change as Cardano and its provider APIs change. Accepted work is linked to an issue or pull request so its scope and status remain public.
