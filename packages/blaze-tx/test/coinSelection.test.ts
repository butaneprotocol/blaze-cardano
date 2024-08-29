import { fifoSelection } from "../src/coinSelection";
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

describe("FIFO Coin Selection", () => {
    test("Should select inputs in FIFO order", () => {
        // Create test inputs here
        const inputs: TransactionUnspentOutput[] = [
            createMockUTxO("1111111111111111111111111111111111111111111111111111111111111111", 0, 500000n),
            createMockUTxO("2222222222222222222222222222222222222222222222222222222222222222", 1, 700000n),
            createMockUTxO("3333333333333333333333333333333333333333333333333333333333333333", 0, 1000000n),
            createMockUTxO("4444444444444444444444444444444444444444444444444444444444444444", 0, 300000n),
        ];

        const dearth = makeValue(1000000n); // Example target value

        const result = fifoSelection(inputs, dearth);

        // Add your assertions here
        expect(result).toBeDefined();
        expect(result.selectedInputs.length).toBeGreaterThan(0);
        // Add more specific assertions based on expected behavior
    });
});