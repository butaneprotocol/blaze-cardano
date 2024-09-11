# @blaze-cardano/tx

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
