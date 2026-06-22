import {
  TransactionId,
  TransactionInput,
  type Hash28ByteBase16,
} from "@blaze-cardano/core";
import { ScriptDeploymentCacheError } from "./errors";

/** Format a transaction input as `<tx-id>#<index>`.
 *
 * @public
 */
export const formatTxInput = (input: TransactionInput): string =>
  `${input.transactionId()}#${input.index()}`;

/** Parse a transaction input encoded as `<tx-id>#<index>`.
 *
 * @public
 */
export const parseTxInput = (value: string): TransactionInput => {
  const [txId, index, extra] = value.split("#");
  if (!txId || !index || extra !== undefined) {
    throw new ScriptDeploymentCacheError(
      `Invalid transaction input reference "${value}". Expected "<tx-id>#<index>".`,
    );
  }
  if (!/^[0-9a-fA-F]{64}$/.test(txId)) {
    throw new ScriptDeploymentCacheError(
      `Invalid transaction input reference "${value}". Transaction id must be 64 hex characters.`,
    );
  }
  if (!/^\d+$/.test(index)) {
    throw new ScriptDeploymentCacheError(
      `Invalid transaction input reference "${value}". Index must be a non-negative decimal integer.`,
    );
  }
  return new TransactionInput(TransactionId(txId), BigInt(index));
};

/** Format a script hash for logs, JSON, and deployment evidence.
 *
 * @public
 */
export const formatScriptHash = (hash: Hash28ByteBase16): string =>
  String(hash);
