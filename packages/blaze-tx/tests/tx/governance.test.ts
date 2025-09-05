import {
  Address,
  Credential,
  CredentialType,
  Hash28ByteBase16,
  NetworkId,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  hardCodedProtocolParams,
} from "@blaze-cardano/core";
import { TxBuilder } from "../../src/TxBuilder";
import * as Value from "../../src/value";

describe("TxBuilder governance certificates", () => {
  const testAddress = Address.fromBech32(
    "addr1q86ylp637q7hv7a9r387nz8d9zdhem2v06pjyg75fvcmen3rg8t4q3f80r56p93xqzhcup0w7e5heq7lnayjzqau3dfs7yrls5",
  );
  const baseUtxos = [
    new TransactionUnspentOutput(
      new TransactionInput(TransactionId("0".repeat(64)), 0n),
      new TransactionOutput(testAddress, Value.makeValue(50_000_000n)),
    ),
  ];
  const drepCredential = Credential.fromCore({
    hash: Hash28ByteBase16("".padStart(56, "1")),
    type: CredentialType.KeyHash,
  });

  it("adds a RegisterDelegateRepresentative certificate", async () => {
    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(baseUtxos)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .addRegisterDRep(drepCredential, 2_000_000n)
      .complete();

    const certs = tx.body().certs()?.values() ?? [];
    expect(certs.length).toBe(1);
    const cert = certs[0]!;
    expect(cert.kind()).toBe(16);
    expect(
      cert.asRegisterDelegateRepresentativeCert()!.credential().hash,
    ).toEqual(drepCredential.toCore().hash);
  });

  it("adds an UnregisterDelegateRepresentative certificate", async () => {
    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(baseUtxos)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .addUnregisterDRep(drepCredential, 2_000_000n)
      .complete();

    const certs = tx.body().certs()?.values() ?? [];
    expect(certs.length).toBe(1);
    const cert = certs[0]!;
    expect(cert.kind()).toBe(17);
    expect(
      cert.asUnregisterDelegateRepresentativeCert()!.credential().hash,
    ).toEqual(drepCredential.toCore().hash);
  });

  it("adds an UpdateDelegateRepresentative certificate", async () => {
    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(baseUtxos)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .addUpdateDRep(drepCredential)
      .complete();

    const certs = tx.body().certs()?.values() ?? [];
    expect(certs.length).toBe(1);
    const cert = certs[0]!;
    expect(cert.kind()).toBe(18);
    expect(
      cert.asUpdateDelegateRepresentativeCert()!.credential().hash,
    ).toEqual(drepCredential.toCore().hash);
  });

  it("adds a vote delegation to a dRep", async () => {
    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(baseUtxos)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .addVoteDelegation(
        Credential.fromCore({
          hash: testAddress.getProps().paymentPart!.hash,
          type: CredentialType.KeyHash,
        }),
        drepCredential,
      )
      .complete();

    const certs = tx.body().certs()?.values() ?? [];
    expect(certs.length).toBe(1);
    const cert = certs[0]!;
    expect(cert.asVoteDelegationCert()).toBeTruthy();
    const vd = cert.asVoteDelegationCert()!;
    expect(vd.stakeCredential().hash).toEqual(
      testAddress.getProps().paymentPart!.hash,
    );
    // dRep can be key/script hash or special values; compare to toCore output where applicable
    expect(vd.dRep().toCbor().length).toBeGreaterThan(0);
  });
});
