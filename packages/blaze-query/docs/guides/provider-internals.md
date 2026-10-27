---
title: Provider internals
---

# Provider internals

Every Blaze provider implements the same `Provider` surface for protocol parameters, UTxO lookups, datum resolution, transaction evaluation, transaction submission, and script-reference resolution.

## Routing

`RoutedProvider` forwards each operation to the configured provider. Chain reads normally go to `queryProvider`, script evaluation goes to `evaluationProvider`, and submission or confirmation calls go to `submissionProvider`. `perOperation` overrides take priority when one backend has a stronger implementation for a specific call.

Debug logging is emitted around routed calls only when a `debugLogger` is configured. The logger receives the operation name, provider object, original parameters, status, elapsed time, and thrown error where relevant. Applications should redact parameters before writing logs if they include addresses, transaction bodies, API keys, or user-specific data.

## Provider behavior

Blockfrost and Kupmios differ in how they resolve data. Blockfrost is an HTTP-first provider. Kupmios combines Kupo for indexed UTxO queries with Ogmios for ledger-state, evaluation, submission, and websocket chain sync.

`Provider.resolveScriptRef` is abstract. Providers with a native script-reference index should use it. Providers that only expose address UTxOs can call `findScriptRefInAddressUtxos`, but that scan has to be an explicit provider decision.

## Backend requests

Blockfrost requests protocol parameters with `GET epochs/latest/parameters`. Address reads page through `GET /addresses/{address}/utxos?count=100&page={page}`. Asset reads use `GET /addresses/{address}/utxos/{policyId}{assetName}?count=100&page={page}`. NFT lookup first calls `GET /assets/{policyId}{assetName}/addresses`, then resolves the address UTxO set. Input resolution calls `GET /txs/{txId}/utxos`, datum lookup calls `GET /scripts/datum/{datumHash}/cbor`, confirmation checks `GET /txs/{txId}/metadata/cbor`, transaction submission calls `POST /tx/submit`, and evaluation calls `POST /utils/txs/evaluate/utxos`. Script-reference hydration calls `GET /scripts/{scriptHash}` and `GET /scripts/{scriptHash}/cbor`; `Blockfrost.resolveScriptRef` calls `GET /scripts/{scriptHash}/utxos` and filters by address only when the caller supplies one.

Kupmios uses Kupo for indexed reads and Ogmios for ledger operations. Address reads call Kupo `GET /matches/{address}?unspent`. Asset reads call Kupo with `policy_id={policyId}&asset_name={assetName}` when an address is supplied, or `GET /matches/{policyId}.{assetName}?unspent` for asset-only lookup. Input resolution calls Kupo `GET /matches/{index}@{txId}?unspent`. Datum and script hydration call `GET /datums/{datumHash}` and `GET /scripts/{scriptHash}`. Protocol parameters, submission, and evaluation go through Ogmios ledger-state, submit-transaction, and evaluate-transaction calls. Websocket events use Ogmios local-chain-sync by sending `findIntersection` before requesting blocks with `nextBlock`.

## Caching boundaries

The query cache lives above providers. It does not change provider behavior, mutate results, or cache transaction evaluation and submission. Prefer short TTLs for wallet-facing UI reads and longer TTLs for reference data such as script-reference lookups.
