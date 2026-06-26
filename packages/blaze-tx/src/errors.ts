/** Error thrown when a completed transaction builder is completed again.
 *
 * @public
 */
export class TxBuilderReuseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TxBuilderReuseError";
  }
}

/** Error thrown when a transaction safety helper rejects unsafe input.
 *
 * @public
 */
export class TransactionSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionSafetyError";
  }
}
