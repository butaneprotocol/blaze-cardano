# Introduction

`@blaze-cardano/tx` contains the Blaze transaction builder.

Use it to create payment outputs, lock assets at scripts, provide datums and redeemers, attach metadata, add reference scripts, prepare collateral, evaluate scripts, balance fees, and produce a transaction ready for signing.

The builder is intentionally explicit around operations that can move or destroy value:

- use payment and transfer helpers for normal value movement;
- use script-locking helpers when an output belongs to a validator;
- use explicit burn helpers when a minting policy burns assets;
- use typed script helpers when datum and redeemer types should be tied to a specific script;
- complete a builder once, then create a new builder for the next transaction.

Continue with [transaction building](./transaction-building.md), [script transactions](./script-transactions.md), and [safety](./safety.md).
