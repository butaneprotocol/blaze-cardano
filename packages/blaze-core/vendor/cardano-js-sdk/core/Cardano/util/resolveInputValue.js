export const resolveInputValue = (input, transactions) => {
    const tx = transactions.find((transaction) => transaction.id === input.txId);
    return tx?.body.outputs[input.index]?.value;
};
