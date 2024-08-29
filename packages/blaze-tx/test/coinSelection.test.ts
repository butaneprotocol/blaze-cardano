import { hvfSelection, lvfSelection, micahsSelector, greedySelection, randomDrawSelection } from "../src/coinSelection";
import { TransactionUnspentOutput, TransactionInput, TransactionOutput, TransactionId, Address } from "@blaze-cardano/core";
import { makeValue } from "@blaze-cardano/tx";

function createMockUTxO(txId: string, index: number, amount: bigint): TransactionUnspentOutput {
    const fullTxId = txId.padStart(64, '0'); // Pad the txId to 64 characters with leading zeros
    const input = new TransactionInput(TransactionId(fullTxId), BigInt(index));
    const output = new TransactionOutput(
        Address.fromBech32("addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp"),
        makeValue(amount)
    );
    return new TransactionUnspentOutput(input, output);
}

describe("Coin Selection Algorithms", () => {
    const inputs: TransactionUnspentOutput[] = [
        createMockUTxO("1", 0, 500000n),
        createMockUTxO("2", 1, 700000n),
        createMockUTxO("3", 0, 1000000n),
        createMockUTxO("4", 0, 300000n),
    ];

    const dearth = makeValue(1000000n); // Example target value

    const testCases = [
        { name: "Micah's Selector", selector: micahsSelector },
        { name: "Highest Value First (HVF) Selection", selector: hvfSelection },
        { name: "Lowest Value First (LVF) Selection", selector: lvfSelection },
        { name: "Greedy Selection", selector: greedySelection },
        { name: "Random Draw Selection", selector: randomDrawSelection },
    ];

    testCases.forEach(({ name, selector }) => {
        test(name, () => {
            const result = selector(inputs, dearth);

            expect(result).toBeDefined();
            expect(result.selectedInputs.length).toBeGreaterThan(0);
            expect(result.selectedValue.coin()).toBeGreaterThanOrEqual(1000000n);
        });
    });
});