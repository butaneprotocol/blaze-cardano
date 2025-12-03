import {
  type Script,
  type TransactionInput,
  type TransactionOutput,
  TransactionUnspentOutput,
} from "@blaze-cardano/core";
import { deserialiseInput, serialiseInput } from "./utils";
import { type SerialisedInput } from "./types";

// TODO: Have an abstracted ledger class the emulator interfaces with

export const addUtxoToLedger = (
  ledger: Record<SerialisedInput, TransactionOutput>,
  utxo: TransactionUnspentOutput,
): void => {
  ledger[serialiseInput(utxo.input())] = utxo.output();
};

export const removeUtxoFromLedger = (
  ledger: Record<SerialisedInput, TransactionOutput>,
  inp: TransactionInput,
): void => {
  delete ledger[serialiseInput(inp)];
};

export const getOutputFromLedger = (
  ledger: Record<SerialisedInput, TransactionOutput>,
  inp: TransactionInput,
): TransactionOutput | undefined => {
  return ledger[serialiseInput(inp)];
};

export const listUtxosFromLedger = (
  ledger: Record<SerialisedInput, TransactionOutput>,
): TransactionUnspentOutput[] => {
  return (Object.entries(ledger) as [SerialisedInput, TransactionOutput][]).map(
    ([key, value]) => {
      return new TransactionUnspentOutput(deserialiseInput(key), value);
    },
  );
};

export const lookupScriptInLedger = (
  ledger: Record<SerialisedInput, TransactionOutput>,
  script: Script,
): TransactionUnspentOutput => {
  for (const utxo of listUtxosFromLedger(ledger)) {
    if (utxo.output().scriptRef()?.hash() === script.hash()) {
      return utxo;
    }
  }
  throw new Error("Script not published");
};
