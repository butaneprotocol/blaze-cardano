# Introduction

`@blaze-cardano/uplc` contains utilities for working with Untyped Plutus Core.

Use it when a tool needs to decode compiled script CBOR, encode UPLC terms, inspect scripts, or apply parameters to validators before they are used in transactions.

Common flows:

1. Convert compiled CBOR into a Blaze script value with `cborToScript`.
2. Apply script parameters before deployment or spending.
3. Pass the resulting script to transaction-building or deployment utilities.

For deployment examples, see the deploy [script deployment guide](/deploy/guides/script-deployment).
