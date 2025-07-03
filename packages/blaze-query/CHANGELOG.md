# @blaze-cardano/query

## 0.5.0

### Minor Changes

- 6c4d07c: Fixed an issue where a string would cause Blockfrost.resolveScriptRef to throw a fatal error.

## 0.4.5

### Patch Changes

- 30f23cd: Optimize blockfrost script ref resolution.

## 0.4.4

### Patch Changes

- 1136f1e: Adds simple unix to slot conversion functions. The interface here might change in the future, and not all providers are supported yet, so use at your own risk!

## 0.4.3

### Patch Changes

- b2690c0: Adds serialization and parsing capabilities via a new @blaze-cardano/data package, and updates the @blaze-cardano/blueprint package with new code generation logic. In particular, generated code now supports recursively defined types! Note that this is a breaking change, and the library is still pre-1.0. Apologies for the necessity!
- Updated dependencies [b2690c0]
  - @blaze-cardano/core@0.6.4
  - @blaze-cardano/ogmios@0.0.7

## 0.4.2

### Patch Changes

- 509dbba: Support resolving plutus v3 reference scripts in blockfrost provider

## 0.4.1

### Patch Changes

- Updated dependencies [4d7bfa6]
  - @blaze-cardano/core@0.6.3

## 0.4.0

### Minor Changes

- b00a663: created hydra provider

## 0.3.6

### Patch Changes

- Updated dependencies [dd4395a]
  - @blaze-cardano/core@0.6.2

## 0.3.5

### Patch Changes

- Updated dependencies [18a36c1]
  - @blaze-cardano/core@0.6.1

## 0.3.4

### Patch Changes

- 57d4c3c: fix cost model encoding for plutusv3

## 0.3.3

### Patch Changes

- Updated dependencies [42c01d5]
  - @blaze-cardano/core@0.6.0

## 0.3.2

### Patch Changes

- Updated dependencies [bcf11d8]
  - @blaze-cardano/core@0.5.2
  - @blaze-cardano/ogmios@0.0.7

## 0.3.1

### Patch Changes

- Updated dependencies [4a4eeae]
  - @blaze-cardano/core@0.5.1

## 0.3.0

### Minor Changes

- f4ae116: feat: Script deployment methods for tx and script-ref resolving provider query

### Patch Changes

- Updated dependencies [f4ae116]
  - @blaze-cardano/core@0.5.0
  - @blaze-cardano/ogmios@0.0.7

## 0.2.19

### Patch Changes

- Updated dependencies [7d03538]
  - @blaze-cardano/core@0.4.6

## 0.2.18

### Patch Changes

- 719b768: Adjust Maestro::getUnspentOutputByNFT flow to prevent race condition.

## 0.2.17

### Patch Changes

- Updated dependencies [3653396]
  - @blaze-cardano/ogmios@0.0.6

## 0.2.16

### Patch Changes

- Updated dependencies [3d0f4b7]
  - @blaze-cardano/core@0.4.5

## 0.2.15

### Patch Changes

- bb5da39: patch: remove u5c until fix, patched eval

## 0.2.14

### Patch Changes

- a4e6808: Bump utxorpc provider dependencies (@scarmuega), bump typedoc
- Updated dependencies [476d4af]
  - @blaze-cardano/core@0.4.4

## 0.2.13

### Patch Changes

- 690d580: use package.json exports consistently
- Updated dependencies [690d580]
  - @blaze-cardano/ogmios@0.0.5
  - @blaze-cardano/core@0.4.3

## 0.2.12

### Patch Changes

- 83192cc: fee leaner, maestro patched

## 0.2.11

### Patch Changes

- Updated dependencies [ce33e70]
  - @blaze-cardano/core@0.4.2

## 0.2.10

### Patch Changes

- d0e6dc1: Fix await transaction confirmation to actually wait for tx using kupmios

## 0.2.9

### Patch Changes

- da1e549: Filter out additional utxos that can be resolved by the ledger on evaluate

## 0.2.8

### Patch Changes

- a4bc1b1: patch: maestro /protocol-params deprecated @mandriuska

## 0.2.7

### Patch Changes

- b9ea33c: feat: add min fee calculation for Conway reference script params
- e0b5c36: Blockfrost submission was including an incorrect header, preventing finality. Script data hash generation was using outdated models for Conway.
- Updated dependencies [b9ea33c]
  - @blaze-cardano/core@0.4.1

## 0.2.6

### Patch Changes

- Updated dependencies [40c1fd7]
  - @blaze-cardano/ogmios@0.0.4

## 0.2.5

### Patch Changes

- a421f6f: patch: @microproofs bug x2 (ogmios bigints, data.to lists), @calvin bug (lockAssets)
- Updated dependencies [a421f6f]
  - @blaze-cardano/ogmios@0.0.3

## 0.2.4

### Patch Changes

- Updated dependencies [b57177b]
  - @blaze-cardano/core@0.4.0

## 0.2.3

### Patch Changes

- ab8ab7c: patch: isomorphic-ws for browsers
- Updated dependencies [ab8ab7c]
  - @blaze-cardano/ogmios@0.0.2

## 0.2.2

### Patch Changes

- 7c94d17: patch: blaze-query kupmios provider uses ogmios library

## 0.2.1

### Patch Changes

- Updated dependencies [ee5932c]
  - @blaze-cardano/core@0.3.1

## 0.2.0

### Minor Changes

- ae2d1f2: packaging changes

### Patch Changes

- Updated dependencies [ae2d1f2]
  - @blaze-cardano/core@0.3.0

## 0.1.10

### Patch Changes

- 6e9352d: patch: blockfrost use purposeToTag mapping

## 0.1.9

### Patch Changes

- Updated dependencies [54dd469]
  - @blaze-cardano/core@0.2.8

## 0.1.8

### Patch Changes

- 686d3a5: Fix resolveScript on Kumpios provider

## 0.1.7

### Patch Changes

- Updated dependencies [69586a9]
  - @blaze-cardano/core@0.2.7

## 0.1.6

### Patch Changes

- f0854dc: feat: Blockfrost provider returns UTxOs with datums and script refs

## 0.1.5

### Patch Changes

- Updated dependencies [b1dcf6a]
  - @blaze-cardano/core@0.2.6

## 0.1.4

### Patch Changes

- ce03f8e: patch: maestro+blockfrost eval, params

## 0.1.3

### Patch Changes

- ac597b1: Release @joacohoyos @ilap PRs

## 0.1.2

### Patch Changes

- df3c0f5: Fix BlockfrostUTxO type mismatch

## 0.1.1

### Patch Changes

- 3e2ac80: Complete Kupmios Provider
- Updated dependencies [3e2ac80]
  - @blaze-cardano/core@0.2.5

## 0.1.0

### Minor Changes

- e0f00d3: Complete Blockfrost provider

## 0.0.10

### Patch Changes

- Updated dependencies [b25fc8a]
  - @blaze-cardano/core@0.2.4

## 0.0.9

### Patch Changes

- Updated dependencies [ebc2eb5]
  - @blaze-cardano/core@0.2.3

## 0.0.8

### Patch Changes

- Updated dependencies [a9f45f6]
  - @blaze-cardano/core@0.2.2

## 0.0.7

### Patch Changes

- Updated dependencies [15cb94d]
  - @blaze-cardano/core@0.2.1

## 0.0.6

### Patch Changes

- Updated dependencies [4d55e7a]
  - @blaze-cardano/core@0.2.0

## 0.0.5

### Patch Changes

- Updated dependencies [fcc6773]
  - @blaze-cardano/core@0.1.2

## 0.0.4

### Patch Changes

- a4af5f6: blockfrost fetch parameters

## 0.0.3

### Patch Changes

- Updated dependencies [c4302ee]
  - @blaze-cardano/core@0.1.1

## 0.0.2

### Patch Changes

- Updated dependencies [7159636]
  - @blaze-cardano/core@0.1.0

## 0.0.1

### Patch Changes

- e97ee5b: blaze it up
- Updated dependencies [e97ee5b]
  - @blaze-cardano/core@0.0.1
