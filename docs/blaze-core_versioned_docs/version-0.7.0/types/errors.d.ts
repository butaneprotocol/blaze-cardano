import type { TransactionUnspentOutput, Value } from "./types";
export type SelectionPhase = "wide" | "deep" | "final";
export declare class UTxOSelectionError extends Error {
    phase: SelectionPhase;
    dearth: Value;
    availableInputs?: TransactionUnspentOutput[] | undefined;
    selectedInputs?: TransactionUnspentOutput[] | undefined;
    bestStep?: [bigint | number, Value, number] | undefined;
    constructor(phase: SelectionPhase, dearth: Value, availableInputs?: TransactionUnspentOutput[] | undefined, selectedInputs?: TransactionUnspentOutput[] | undefined, bestStep?: [bigint | number, Value, number] | undefined);
}
//# sourceMappingURL=errors.d.ts.map