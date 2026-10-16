# Cardano JS SDK source provenance

`@blaze-cardano/core` contains an attributed source import of the Cardano,
serialization, cryptography, and utility code that it previously loaded at
runtime from `@cardano-sdk/core`, `@cardano-sdk/crypto`, and
`@cardano-sdk/util`.

## Source snapshot

- Repository: <https://github.com/input-output-hk/cardano-js-sdk>
- Commit: `48019e49c826ea77d81be0e2d2907f94406f5e04`
- `@cardano-sdk/core`: `0.47.1`
- `@cardano-sdk/crypto`: `0.4.7`
- `@cardano-sdk/util`: `0.17.2`
- License: Apache-2.0

The original license and notice are retained in
`third-party/cardano-js-sdk/` and are included in the published package.

## Blaze modifications

- Package-boundary imports were rewritten to relative imports within
  `src/internal/cardano-sdk`.
- The optional CML cryptography adapter was excluded. Blaze does not expose
  this adapter and uses the included libsodium implementation.
- Blaze's existing public exports now reference the internal implementation
  instead of the three external `@cardano-sdk` packages.
- Imported source files carry a short modification and provenance notice.

## Updating the snapshot

1. Review upstream changes from this commit to the proposed new commit.
2. Copy the three package `src` trees without changing their directory
   structure.
3. Rewrite imports between the three packages to relative imports.
4. Reapply the documented exclusions and provenance notices.
5. Run the Blaze core build, typecheck, API extraction, and the full workspace
   test suite.
6. Review the generated API report for compatibility before release.

Do not update the source snapshot from an unpinned branch or package range.
