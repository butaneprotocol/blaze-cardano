import { TxBuilder } from '@blaze-cardano/tx';
import { hardCodedProtocolParams } from '@blaze-cardano/core';

describe('e2e wiring', () => {
  it('constructs a TxBuilder with protocol params', () => {
    const txb = new TxBuilder(hardCodedProtocolParams);
    expect(txb).toBeTruthy();
  });
});


