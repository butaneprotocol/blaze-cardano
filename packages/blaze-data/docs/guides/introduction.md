# Introduction

`@blaze-cardano/data` helps keep contract-facing data explicit.

Use it when application values need to become `PlutusData` for datums, redeemers, or script parameters. Keeping this conversion in one place makes transaction code easier to review and reduces the chance of passing a value with the right shape but the wrong on-chain representation.

Typical usage:

1. Define the TypeScript shape expected by the validator.
2. Convert application values into Plutus data at the transaction boundary.
3. Pass the converted value to the transaction builder as an inline datum, datum witness, or redeemer.

For transaction examples, see the tx [script transaction guide](/tx/guides/script-transactions).
