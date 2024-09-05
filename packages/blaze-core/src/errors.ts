import { TransactionUnspentOutput, Value } from "./types";

export type SelectionPhase = "wide" | "deep" | "final";

export class UTxOSelectionError extends Error {
    constructor(
        public phase: SelectionPhase, 
        public dearth: Value,
        public availableInputs?: TransactionUnspentOutput[],
        public selectedInputs?: TransactionUnspentOutput[],
        public bestStep?: [bigint, Value, number],
    ) {
        super("UTxO Balance Insufficient");
    }
}