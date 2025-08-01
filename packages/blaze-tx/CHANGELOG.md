# @blaze-cardano/tx

## 0.13.0

### Minor Changes

- f66af3b: neg time

### Patch Changes

- Updated dependencies [52c1956]
  - @blaze-cardano/core@0.7.0
  - @blaze-cardano/vm@0.1.11

## 0.12.3

### Patch Changes

- ed3daa5: Add a set metadata function to the transaction builder

## 0.12.2

### Patch Changes

- b2690c0: Adds serialization and parsing capabilities via a new @blaze-cardano/data package, and updates the @blaze-cardano/blueprint package with new code generation logic. In particular, generated code now supports recursively defined types! Note that this is a breaking change, and the library is still pre-1.0. Apologies for the necessity!
- Updated dependencies [b2690c0]
  - @blaze-cardano/core@0.6.4
  - @blaze-cardano/vm@0.1.10

## 0.12.1

### Patch Changes

- a1db33f: Adds decode/encode support for Constr and Case, and increases coverage case for preparing collateral in the TxBuilder.
- 4448568: Fixes an edge case where selected collateral UTxO is not large enough to cover native assets after required collateral is deducted.

## 0.12.0

### Minor Changes

- 12ae921: Completely rewrites a lot of the completion logic for building transactions, including fee calculation and collateral selection. It also adds a new coin selection algorithm as an optional export, based on the HVF algorithm.

## 0.11.1

### Patch Changes

- 4d7bfa6: Add support for deregistering stake credentials and fixes delegation for scripts
- Updated dependencies [4d7bfa6]
  - @blaze-cardano/core@0.6.3
  - @blaze-cardano/vm@0.1.9

## 0.11.0

### Minor Changes

- 745c11d: Adds a setDonation function for treasury donations

### Patch Changes

- Updated dependencies [dd4395a]
  - @blaze-cardano/core@0.6.2
  - @blaze-cardano/vm@0.1.8

## 0.10.6

### Patch Changes

- 2b4c1a6: Adds a new Coin Selection algorithm as an export (while keeping the default selection algo intact for now).

## 0.10.5

### Patch Changes

- 1d7ba70: Added the ability to opt-out of coin selection on complete.

## 0.10.4

### Patch Changes

- bd6c264: zero change outputs
- bd6c264: Zero change outputs

## 0.10.3

### Patch Changes

- Updated dependencies [18a36c1]
  - @blaze-cardano/core@0.6.1
  - @blaze-cardano/vm@0.1.7

## 0.10.2

### Patch Changes

- 96ab592: Error handling improvements for missing redeemers.

## 0.10.1

### Patch Changes

- 5986ca1: support zero fee transactions

## 0.10.0

### Minor Changes

- e65d4c9: Fixes a bug where encoded datums in the scriptData were being added even if the datum was empty.

## 0.9.0

### Minor Changes

- 42c01d5: Updates script data function to be more thorough (for future debugging), and also set the TxBuilder to use Conway era serialization across the board.

### Patch Changes

- 42c01d5: Encode redeemers as a map when generating a script data hash.
- Updated dependencies [42c01d5]
  - @blaze-cardano/core@0.6.0
  - @blaze-cardano/vm@0.1.6

## 0.8.4

### Patch Changes

- 96ceb2a: fix: fee to small - missing required signer in fake witness set

## 0.8.3

### Patch Changes

- Updated dependencies [bcf11d8]
  - @blaze-cardano/core@0.5.2
  - @blaze-cardano/vm@0.1.5

## 0.8.2

### Patch Changes

- 4a4eeae: Fix fee too small issue
- Updated dependencies [4a4eeae]
  - @blaze-cardano/core@0.5.1
  - @blaze-cardano/vm@0.1.4

## 0.8.1

### Patch Changes

- 97ca0f6: correctly consider min utxo requirements when preparing collateral

## 0.8.0

### Minor Changes

- f4ae116: feat: Script deployment methods for tx and script-ref resolving provider query

### Patch Changes

- Updated dependencies [f4ae116]
  - @blaze-cardano/core@0.5.0

## 0.7.2

### Patch Changes

- 7601789: Fix issue with collateral return below min ada utxo

## 0.7.1

### Patch Changes

- 7d03538: bump cardano-js-sdk
- Updated dependencies [7d03538]
  - @blaze-cardano/core@0.4.6

## 0.7.0

### Minor Changes

- 0a667b8: This fixes incorrect calculation for collateral values from a recent fix.

### Patch Changes

- 1188757: patch: @AngelCastilloB Tx Builder wont select any inputs if withdrawal amount is enough to balance the transaction

## 0.6.1

### Patch Changes

- 88ee831: Small fee calculation fix

## 0.6.0

### Minor Changes

- 471d47d: Submit built transactions through the wallet by default, while allowing a provider option.

### Patch Changes

- c924f95: Fix fee calculation before evaluation
- c951eec: avoid preCompleteHook overriding user selections

## 0.5.17

### Patch Changes

- bdf17aa: Fix utxo comparison from object comparison to comparing the output reference manually
- 73e34a6: Add balanceMultiAssetChange to avoid exceeding the max value size for an output

## 0.5.16

### Patch Changes

- ff8fd0a: search collateralUtxos when balancing collateral change

## 0.5.15

### Patch Changes

- 4cddb94: patch: scriptDataHash recursive calc

## 0.5.14

### Patch Changes

- Updated dependencies [3d0f4b7]
  - @blaze-cardano/core@0.4.5

## 0.5.13

### Patch Changes

- e12d65e: patch: eval update redeemers in tw

## 0.5.12

### Patch Changes

- bb5da39: patch: remove u5c until fix, patched eval

## 0.5.11

### Patch Changes

- 5e2b970: patch: fromCbor -> fromCore for no deserialisation bugs

## 0.5.10

### Patch Changes

- 5369627: patch: evaluate recursively

## 0.5.9

### Patch Changes

- dcb0d76: patch: fix balancer

## 0.5.8

### Patch Changes

- 476d4af: Add a custom UTXO selection error
- 3946a63: Add toCbor() function to print partial transaction
- Updated dependencies [476d4af]
  - @blaze-cardano/core@0.4.4

## 0.5.7

### Patch Changes

- 690d580: use package.json exports consistently
- Updated dependencies [690d580]
  - @blaze-cardano/core@0.4.3

## 0.5.6

### Patch Changes

- d80a09b: Add a fee padding option, to supplement the minFee option

## 0.5.5

### Patch Changes

- 83192cc: fee leaner, maestro patched

## 0.5.4

### Patch Changes

- c7164ae: patch: fix fee calculation by ensuring fake witnesses are unique

## 0.5.3

### Patch Changes

- 97ca100: patch: use multiple collateral inputs

## 0.5.2

### Patch Changes

- 42257b8: patch: reduce collateral search amount to 5 ada

## 0.5.1

### Patch Changes

- Updated dependencies [ce33e70]
  - @blaze-cardano/core@0.4.2

## 0.5.0

### Minor Changes

- fbe047a: This checks the protocol version to determine if the new script data hash requirements are current yet or not.

## 0.4.0

### Minor Changes

- 578cfb8: Fix conditional when checking changeOutputIndex, where index 0 would result in a false false.

## 0.3.6

### Patch Changes

- 1bfbe92: feat: Transaction cbor logging on eval error (@cjkoepke)
  fix: Value merge was mutating the multiasset state of a value (thanks @cjkoepke, @Quantumplation)

## 0.3.5

### Patch Changes

- 710b5d7: optional datums

## 0.3.4

### Patch Changes

- b9ea33c: feat: add min fee calculation for Conway reference script params
- e0b5c36: Blockfrost submission was including an incorrect header, preventing finality. Script data hash generation was using outdated models for Conway.
- Updated dependencies [b9ea33c]
  - @blaze-cardano/core@0.4.1

## 0.3.3

### Patch Changes

- 1100236: patch: fix2 min fee

## 0.3.2

### Patch Changes

- e6f670f: patch: minimum fee affect on excess val

## 0.3.1

### Patch Changes

- a421f6f: patch: @microproofs bug x2 (ogmios bigints, data.to lists), @calvin bug (lockAssets)

## 0.3.0

### Minor Changes

- b57177b: compatibility with lucid-data, blueprint supports sdk

### Patch Changes

- Updated dependencies [b57177b]
  - @blaze-cardano/core@0.4.0

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

## 0.1.0

### Minor Changes

- 54dd469: allow custom coin selection, clean up pitch function, remove wasm from tx

### Patch Changes

- 54dd469: update packaging
- Updated dependencies [54dd469]
  - @blaze-cardano/core@0.2.8

## 0.0.29

### Patch Changes

- Updated dependencies [69586a9]
  - @blaze-cardano/core@0.2.7

## 0.0.28

### Patch Changes

- Updated dependencies [b1dcf6a]
  - @blaze-cardano/core@0.2.6

## 0.0.27

### Patch Changes

- a28ff6a: feat: Stake registration balancing

## 0.0.26

### Patch Changes

- 99ce4a5: feat: addRegisterStake

## 0.0.25

### Patch Changes

- ac597b1: Release @joacohoyos @ilap PRs

## 0.0.24

### Patch Changes

- 1623e94: feat: newTransaction improved via precomplete hooks

## 0.0.23

### Patch Changes

- a99e113: fix: minimum fee used in collateral calc

## 0.0.22

### Patch Changes

- c96ec08: fix: nativescript support

## 0.0.21

### Patch Changes

- 3e2ac80: Complete Kupmios Provider
- Updated dependencies [3e2ac80]
  - @blaze-cardano/core@0.2.5

## 0.0.20

### Patch Changes

- b25fc8a: uplc applyParams release @ezepze, hotwallet fixes @ilap
- Updated dependencies [b25fc8a]
  - @blaze-cardano/core@0.2.4

## 0.0.19

### Patch Changes

- Updated dependencies [ebc2eb5]
  - @blaze-cardano/core@0.2.3

## 0.0.18

### Patch Changes

- f56ac1d: duplicate mint/withdrawals caught

## 0.0.17

### Patch Changes

- b7cba8b: feat: tx.setMinimumFee

## 0.0.16

### Patch Changes

- 88ab934: Fixed spend redeemer ordering and data casting return type

## 0.0.15

### Patch Changes

- 2e49c71: Better type checking for plutus data serialisation and JSON Schema builders with Data. Uses Lucid's patterns for now

## 0.0.14

### Patch Changes

- dd2f05b: Started to bring in plutus data serialisation

## 0.0.13

### Patch Changes

- 5368bcb: fix: space for delegator witnesses
- a9f45f6: feat: auxiliary-data, fix: validity intervals returns
- Updated dependencies [a9f45f6]
  - @blaze-cardano/core@0.2.2

## 0.0.12

### Patch Changes

- Updated dependencies [15cb94d]
  - @blaze-cardano/core@0.2.1

## 0.0.11

### Patch Changes

- Updated dependencies [4d55e7a]
  - @blaze-cardano/core@0.2.0

## 0.0.10

### Patch Changes

- e73e3f4: Custom slot configs in emulator and VM evaluator

## 0.0.9

### Patch Changes

- 4b9211d: Fixed bug in script fee calc, added transaction signing util to SDK
- 4b9211d: Fixed collateral required signers bug

## 0.0.8

### Patch Changes

- Updated dependencies [fcc6773]
  - @blaze-cardano/core@0.1.2

## 0.0.7

### Patch Changes

- 4379725: Reference script handling patch

## 0.0.6

### Patch Changes

- e3d6daa: Transaction logic fixes

## 0.0.5

### Patch Changes

- 7a4c9fe: patch for transaction Network ID setting

## 0.0.4

### Patch Changes

- b3aefec: Values enforce no 0-quantity assets, redeemers have correct indexes, transaction network id is attached, various emulator patches

## 0.0.3

### Patch Changes

- c4302ee: chore: export types
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
