# @blaze-cardano/data

## 0.6.7

### Patch Changes

- 30d93af: Aiken v1.1.21 blueprint compatibility (angle-bracket generics parsed
  without polynomial-backtracking regex, primitive type aliases), serialize
  `undefined`/`null` as `Constr 0 []` (Aiken Void),
  Conway-era Registration certs with script-credential redeemers, and
  `useScriptSubstitutions()` for evaluating transactions with substitute
  (e.g. trace-enabled) scripts. The emulator now accepts the Conway
  Registration cert (type 7), which — like the legacy Shelley form — does not
  require the stake credential's witness.
- Updated dependencies [30d93af]
- Updated dependencies [3b1520e]
- Updated dependencies [ed30731]
  - @blaze-cardano/core@0.9.0

## 0.6.6

### Patch Changes

- Updated dependencies [acb75c3]
  - @blaze-cardano/core@0.8.0

## 0.6.5

### Patch Changes

- Updated dependencies [b15acba]
  - @blaze-cardano/core@0.7.1

## 0.6.4

### Patch Changes

- 1efe3b1: fix: Optional type references parsed correctly

## 0.6.3

### Patch Changes

- Updated dependencies [52c1956]
  - @blaze-cardano/core@0.7.0

## 0.6.2

### Patch Changes

- 3396834: fix: export typebox types

## 0.6.1

### Patch Changes

- aeecdcc: fixed serialization of optional wrapped ref types

## 0.6.0

### Minor Changes

- b2690c0: Adds serialization and parsing capabilities via a new @blaze-cardano/data package, and updates the @blaze-cardano/blueprint package with new code generation logic. In particular, generated code now supports recursively defined types! Note that this is a breaking change, and the library is still pre-1.0. Apologies for the necessity!

### Patch Changes

- Updated dependencies [b2690c0]
  - @blaze-cardano/core@0.6.4
