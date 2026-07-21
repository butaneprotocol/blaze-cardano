# @blaze-cardano/vm

## 0.3.1

### Patch Changes

- fe17dab: Fix internal dependency ranges so published packages install correctly.
- Updated dependencies [fe17dab]
  - @blaze-cardano/uplc@0.5.1

## 0.3.0

### Minor Changes

- 30d93af: Aiken v1.1.21 blueprint compatibility (angle-bracket generics parsed
  without polynomial-backtracking regex, primitive type aliases), serialize
  `undefined`/`null` as `Constr 0 []` (Aiken Void),
  Conway-era Registration certs with script-credential redeemers, and
  `useScriptSubstitutions()` for evaluating transactions with substitute
  (e.g. trace-enabled) scripts. The emulator now accepts the Conway
  Registration cert (type 7), which — like the legacy Shelley form — does not
  require the stake credential's witness.

### Patch Changes

- Updated dependencies [30d93af]
- Updated dependencies [3b1520e]
- Updated dependencies [ed30731]
  - @blaze-cardano/core@0.9.0
  - @blaze-cardano/uplc@0.5.0

## 0.2.3

### Patch Changes

- Updated dependencies [acb75c3]
  - @blaze-cardano/core@0.8.0
  - @blaze-cardano/uplc@0.4.3

## 0.2.2

### Patch Changes

- Updated dependencies [b15acba]
  - @blaze-cardano/core@0.7.1
  - @blaze-cardano/uplc@0.4.2

## 0.2.1

### Patch Changes

- ab30a97: Updates the wasm pack script to remove default .gitignore file from packages. This was preventing them from being included in published files.
- Updated dependencies [ab30a97]
  - @blaze-cardano/uplc@0.4.1

## 0.2.0

### Minor Changes

- eecb7fc: Updates UPLC to export the latest wasm bindings for UPLC, and updates @blaze-cardano/vm to use these instead of a GitHub repo.

### Patch Changes

- Updated dependencies [eecb7fc]
  - @blaze-cardano/uplc@0.4.0

## 0.1.12

### Patch Changes

- e835407: Update uplc vm

## 0.1.11

### Patch Changes

- Updated dependencies [52c1956]
  - @blaze-cardano/core@0.7.0

## 0.1.10

### Patch Changes

- b2690c0: Adds serialization and parsing capabilities via a new @blaze-cardano/data package, and updates the @blaze-cardano/blueprint package with new code generation logic. In particular, generated code now supports recursively defined types! Note that this is a breaking change, and the library is still pre-1.0. Apologies for the necessity!
- Updated dependencies [b2690c0]
  - @blaze-cardano/core@0.6.4

## 0.1.9

### Patch Changes

- Updated dependencies [4d7bfa6]
  - @blaze-cardano/core@0.6.3

## 0.1.8

### Patch Changes

- Updated dependencies [dd4395a]
  - @blaze-cardano/core@0.6.2

## 0.1.7

### Patch Changes

- Updated dependencies [18a36c1]
  - @blaze-cardano/core@0.6.1

## 0.1.6

### Patch Changes

- Updated dependencies [42c01d5]
  - @blaze-cardano/core@0.6.0

## 0.1.5

### Patch Changes

- Updated dependencies [bcf11d8]
  - @blaze-cardano/core@0.5.2

## 0.1.4

### Patch Changes

- 4a4eeae: Fix fee too small issue
- Updated dependencies [4a4eeae]
  - @blaze-cardano/core@0.5.1

## 0.1.3

### Patch Changes

- Updated dependencies [f4ae116]
  - @blaze-cardano/core@0.5.0

## 0.1.2

### Patch Changes

- 9ab9b2a: patch: vm regression (mem leaks)

## 0.1.1

### Patch Changes

- Updated dependencies [7d03538]
  - @blaze-cardano/core@0.4.6

## 0.1.0

### Minor Changes

- 802b6ac: dependency change: use @lucid-evolution/uplc

## 0.0.38

### Patch Changes

- Updated dependencies [3d0f4b7]
  - @blaze-cardano/core@0.4.5

## 0.0.37

### Patch Changes

- Updated dependencies [476d4af]
  - @blaze-cardano/core@0.4.4

## 0.0.36

### Patch Changes

- 690d580: use package.json exports consistently
- Updated dependencies [690d580]
  - @blaze-cardano/core@0.4.3

## 0.0.35

### Patch Changes

- Updated dependencies [ce33e70]
  - @blaze-cardano/core@0.4.2

## 0.0.34

### Patch Changes

- Updated dependencies [b9ea33c]
  - @blaze-cardano/core@0.4.1

## 0.0.33

### Patch Changes

- Updated dependencies [b57177b]
  - @blaze-cardano/core@0.4.0

## 0.0.32

### Patch Changes

- Updated dependencies [ee5932c]
  - @blaze-cardano/core@0.3.1

## 0.0.31

### Patch Changes

- Updated dependencies [ae2d1f2]
  - @blaze-cardano/core@0.3.0

## 0.0.30

### Patch Changes

- Updated dependencies [54dd469]
  - @blaze-cardano/core@0.2.8
