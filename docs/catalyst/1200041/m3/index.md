# Catalyst 1200041 milestone 3 evidence

Proposal: [Blaze: Maintenance, Security Improvements, Testing & Assurances for the Blaze SDK](https://milestones.projectcatalyst.io/projects/1200041)

Current Statement of Milestones: `soms.id=10011`, Milestone 3, "Implement Transaction Construction Safety Mechanisms".

## What M3 claims

The current SoM requires:

- A comprehensive transaction-construction test suite, including unit tests, e2e tests for full example transactions, and property-based tests via `fast-check`.
- Improved error messaging.
- Safety features to minimise transaction-building errors.
- Datum and redeemer types assigned to specific scripts, with type errors when mismatched values are passed.
- Checks for accidentally reused transactions.
- Reduced risk of accidental value loss by making explicit burns and explicit transfers part of the transaction-builder API.
- Documentation for safety checks and error scenarios.
- A coverage report showing comprehensive test coverage.

## Success criteria coverage

| Success criterion                                                             | Evidence                                                                                                                                  |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Checks prevent common transaction-construction pitfalls                       | Typed scripts, explicit burn/transfer helpers, builder reuse checks, and safety tests                                                     |
| Test suite covers edge cases and potential vulnerabilities                    | Unit, property-based, type-level, and e2e-shaped tests listed below                                                                       |
| Error messages are clear and actionable                                       | `TransactionSafetyError`, `TxBuilderReuseError`, and safety guide error examples                                                          |
| Safety work has no known open transaction-construction finding in this branch | Local safety tests pass, typed misuse is covered by compile-time tests, and public review/CI links are checked by the PoA evidence script |

## Implementation mapping

| Requirement                               | Evidence                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Typed datum and redeemer safety           | `packages/blaze-tx/src/typed-script.ts`, `packages/blaze-tx/tests/tx/safety.test.ts`              |
| Compile-time typed script mismatch checks | `packages/blaze-tx/tests/tx/typed-script-types.test.ts`                                           |
| Typed transaction-builder methods         | `packages/blaze-tx/src/TxBuilder.ts`                                                              |
| Reused transaction protection             | `packages/blaze-tx/src/TxBuilder.ts`, `packages/blaze-tx/tests/tx/safety.test.ts`                 |
| Explicit asset burn API                   | `packages/blaze-tx/src/TxBuilder.ts`, `packages/blaze-tx/tests/tx/safety.test.ts`                 |
| Improved typed errors                     | `packages/blaze-tx/src/errors.ts`                                                                 |
| Transaction safety tests                  | `packages/blaze-tx/tests/tx/safety.test.ts`                                                       |
| Property-based tests                      | `packages/blaze-tx/tests/tx/property.test.ts`                                                     |
| E2E transaction construction path         | `packages/e2e/tests/txs.e2e.test.ts`, `packages/e2e/tests/script-deployment.e2e.test.ts`          |
| Documentation                             | `packages/blaze-tx/docs/guides/safety.md`, `packages/blaze-tx/docs/guides/script-transactions.md` |

## Verification

```sh
bun --filter @blaze-cardano/tx test       # 9 files, 55 tests passing
bun --filter @blaze-cardano/tx typecheck  # passing
bun --filter @blaze-cardano/tx lint       # passing
bun --filter @blaze-cardano/tx test:coverage # passing package-level coverage report
(cd packages/blaze-tx && bunx vitest run tests/tx/safety.test.ts tests/tx/property.test.ts tests/tx/typed-script-types.test.ts --coverage --coverage.include=src/safety.ts --coverage.include=src/typed-script.ts --coverage.include=src/errors.ts --coverage.reporter=text-summary) # focused new safety coverage
bun --filter @blaze-cardano/e2e typecheck # passing
```

Focused new safety-feature coverage:

| Scope                                                   | Statements | Branches | Functions | Lines |
| ------------------------------------------------------- | ---------: | -------: | --------: | ----: |
| `src/safety.ts`, `src/typed-script.ts`, `src/errors.ts` |       100% |     100% |      100% |  100% |

Package-level coverage from `bun --filter @blaze-cardano/tx test:coverage`:

| Scope                 | Statements | Branches | Functions |  Lines |
| --------------------- | ---------: | -------: | --------: | -----: |
| All files             |     73.55% |   59.69% |    81.75% | 73.44% |
| `src/TxBuilder.ts`    |     67.23% |   52.29% |    72.34% | 67.28% |
| `src/safety.ts`       |       100% |     100% |      100% |   100% |
| `src/typed-script.ts` |       100% |     100% |      100% |   100% |

The proposal criterion is coverage of new features. The focused run covers the new safety modules directly; the package-level report is included to show the wider legacy transaction-builder context.
