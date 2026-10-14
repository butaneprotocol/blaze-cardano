# @blaze-cardano/ogmios

## 0.0.8

### Patch Changes

- 1ddec1f: Fixing patch dependency issue
- a1cef73: - Emulator: `awaitTransactionConfirmation` returns whether the transaction reached a block; `EmulatorProvider` reports it instead of always `true`.
  - Kupmios: `awaitTransactionConfirmation` confirms only when Kupo has a match for the transaction; an empty match list no longer counts as confirmed.
  - Kupmios: `evaluateTransaction` looks each additional UTxO up by reference and sends the ones Kupo does not have, so a transaction that spends an output of an unsubmitted transaction can be evaluated.
  - Provider errors carry the HTTP `status`: every Blockfrost error (submission, evaluation, reads, confirmation lookups), Kupo reads and confirmation lookups, and Hydra reads and confirmation lookups. A caller can retry a 429 or 5xx and tell a 404 or a ledger rejection apart without matching message text.
  - `awaitTransactionConfirmation` (Blockfrost, Kupmios, Hydra): `false` means the lookup succeeded and the transaction is not there yet (Kupo 200 with no match, Blockfrost 404). Within the polling window a 429 or 5xx counts as "not yet" and polling continues; once the window ends it throws with its `status`. Any other failure (401, 403) throws at once. `timeout: 0` is a single lookup on every provider; with `timeout` omitted, Blockfrost and Hydra make a single lookup and Kupmios polls for its default 5 × `confirmationTimeout`.
  - Ogmios: a JSON-RPC error rejects with its `code` and `data` on the error, a request in flight when the socket closes rejects instead of never settling, and `kill()` resolves once the socket closes, including when it is called more than once.

## 0.0.7

### Patch Changes

- f4ae116: feat: Script deployment methods for tx and script-ref resolving provider query

## 0.0.6

### Patch Changes

- 3653396: @ilap requested release

## 0.0.5

### Patch Changes

- 690d580: use package.json exports consistently

## 0.0.4

### Patch Changes

- 40c1fd7: bug: fix bigint replacer for ogmios json stringify

## 0.0.3

### Patch Changes

- a421f6f: patch: @microproofs bug x2 (ogmios bigints, data.to lists), @calvin bug (lockAssets)

## 0.0.2

### Patch Changes

- ab8ab7c: patch: isomorphic-ws for browsers

## 0.0.1

### Patch Changes

- c809fcf: new package: @blaze-cardano/ogmios
