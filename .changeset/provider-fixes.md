---
"@blaze-cardano/emulator": patch
"@blaze-cardano/query": patch
"@blaze-cardano/ogmios": patch
---

- Emulator: `awaitTransactionConfirmation` returns whether the transaction reached a block; `EmulatorProvider` reports it instead of always `true`.
- Kupmios: `awaitTransactionConfirmation` confirms only when Kupo has a match for the transaction; an empty match list no longer counts as confirmed.
- Kupmios: `evaluateTransaction` looks each additional UTxO up by reference and sends the ones Kupo does not have, so a transaction that spends an output of an unsubmitted transaction can be evaluated.
- Provider errors carry the HTTP `status`: every Blockfrost error (submission, evaluation, reads, confirmation lookups), Kupo reads and confirmation lookups, and Hydra reads and confirmation lookups. A caller can retry a 429 or 5xx and tell a 404 or a ledger rejection apart without matching message text.
- `awaitTransactionConfirmation` (Blockfrost, Kupmios, Hydra): `false` means the lookup succeeded and the transaction is not there yet (Kupo 200 with no match, Blockfrost 404). Within the timeout a 429 or 5xx counts as "not yet" and polling continues; once time is up, or with no timeout (a single lookup), it throws with its `status`. Any other failure (401, 403) throws at once.
- Ogmios: a JSON-RPC error rejects with its `code` and `data` on the error, a request in flight when the socket closes rejects instead of never settling, and `kill()` resolves once the socket closes, including when it is called more than once.
