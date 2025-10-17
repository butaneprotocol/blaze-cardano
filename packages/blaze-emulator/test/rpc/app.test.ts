import app from '../../src/rpc/app';

const jsonHeaders = {
  'content-type': 'application/json',
};

describe('emulator RPC app', () => {
  it('resets and advances the emulator', async () => {
    const resetResponse = await app.request('/emulator/reset', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({}),
    });

    expect(resetResponse.status).toBe(200);

    const advanceResponse = await app.request('/emulator/advance', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ blocks: 2 }),
    });

    expect(advanceResponse.status).toBe(200);
    const advancePayload = (await advanceResponse.json()) as { slot: number };
    const { slot } = advancePayload;
    expect(slot).toBeGreaterThanOrEqual(2);
  });

  it('registers a wallet and exposes its address', async () => {
    await app.request('/emulator/reset', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({}),
    });

    const registerResponse = await app.request('/emulator/register', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ label: 'alice', lovelace: '1000000' }),
    });
    expect(registerResponse.status).toBe(200);

    const addressResponse = await app.request('/emulator/address/alice');
    expect(addressResponse.status).toBe(200);
    const addressPayload = (await addressResponse.json()) as {
      address: string;
    };
    const { address } = addressPayload;
    expect(typeof address).toBe('string');
    expect(address.length).toBeGreaterThan(0);

    const utxoResponse = await app.request('/emulator/utxos');
    expect(utxoResponse.status).toBe(200);
    const utxos = (await utxoResponse.json()) as Array<{
      outputCbor: string;
    }>;
    expect(Array.isArray(utxos)).toBe(true);
    expect(utxos.length).toBeGreaterThan(0);
    expect(utxos[0]!.outputCbor).toEqual(expect.any(String));

    const walletsResponse = await app.request('/emulator/wallets');
    expect(walletsResponse.status).toBe(200);
    const wallets = (await walletsResponse.json()) as Array<{
      label: string;
    }>;
    expect(wallets.some((wallet) => wallet.label === 'alice')).toBe(true);

    const stateResponse = await app.request(
      '/emulator/state?include=utxos,wallets,governance',
    );
    expect(stateResponse.status).toBe(200);
    const state = (await stateResponse.json()) as Record<string, unknown>;
    expect(state['utxos']).toBeDefined();
    expect(state['wallets']).toBeDefined();
    expect(state['governance']).toBeDefined();
  });

  it('starts and stops the event loop', async () => {
    const startResponse = await app.request('/emulator/event-loop/start', {
      method: 'POST',
    });
    expect(startResponse.status).toBe(200);

    const stopResponse = await app.request('/emulator/event-loop/stop', {
      method: 'POST',
    });
    expect(stopResponse.status).toBe(200);
  });
});
