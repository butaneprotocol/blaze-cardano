import { fileURLToPath } from "node:url";
import { createEmulatorNetworkConfig, Emulator } from "@blaze-cardano/emulator";
import { Core, makeValue } from "@blaze-cardano/sdk";
import {
  MemoryScriptDeploymentCache,
  defineScriptDeployment,
  deployScriptRefs,
} from "@blaze-cardano/deploy";
import { AlwaysTrueAlwaysTrueSpend } from "./plutus";

const manifest = (address: Core.Address, script: Core.Script) =>
  defineScriptDeployment({
    id: "aiken-reference-script-demo",
    network: "cardano-preview",
    targets: [
      {
        name: "always-true-aiken",
        version: "1.0.0",
        script,
        address,
        metadata: {
          compiler: "aiken",
          source: "validators/always_true.ak",
        },
      },
    ],
  });

export const runAikenScriptDeploymentDemo = async () => {
  const validator = new AlwaysTrueAlwaysTrueSpend();
  const emulator = new Emulator([], createEmulatorNetworkConfig("preview"));
  const deploymentAddress = await emulator.register(
    "deployer",
    makeValue(100_000_000n),
  );
  const cache = new MemoryScriptDeploymentCache();

  await emulator.as("deployer", async (blaze) => {
    const provider = blaze.provider;
    const result = await deployScriptRefs({
      manifest: manifest(deploymentAddress, validator.Script),
      provider,
      wallet: blaze.wallet,
      cache,
    });

    const referenceUtxo = result.records.find(
      (record) => record.status === "matched",
    )?.utxo;
    if (!referenceUtxo) {
      throw new Error("The deployed reference script could not be resolved.");
    }

    const scriptAddress = Core.addressFromCredential(
      provider.network,
      Core.Credential.fromCore({
        type: Core.CredentialType.ScriptHash,
        hash: validator.Script.hash(),
      }),
    );
    const data = Core.PlutusData.fromCbor(Core.HexBlob("00"));
    const datum = validator.datum(data);
    const redeemer = validator.redeemer(data);

    const lockTx = await blaze
      .newTransaction()
      .lockScriptAssets(validator, makeValue(3_000_000n), datum)
      .complete();
    const lockTxId = await blaze.submitTransaction(
      await blaze.signTransaction(lockTx),
      true,
    );
    emulator.awaitTransactionConfirmation(lockTxId);

    const scriptUtxos = await provider.getUnspentOutputs(scriptAddress);
    const scriptUtxo = scriptUtxos.find(
      (utxo) => utxo.input().transactionId() === lockTxId,
    );
    if (!scriptUtxo) {
      throw new Error("The script output was not returned by the provider.");
    }

    const spendTx = await blaze
      .newTransaction()
      .addReferenceInput(referenceUtxo)
      .addInput<typeof validator>(scriptUtxo, redeemer)
      .complete();
    const spendTxId = await blaze.submitTransaction(
      await blaze.signTransaction(spendTx),
      true,
    );
    emulator.awaitTransactionConfirmation(spendTxId);

    console.log(`Deployed reference script: ${result.transactions[0]}`);
    console.log(`Locked script output: ${lockTxId}`);
    console.log(`Provider query returned ${scriptUtxos.length} script UTxO.`);
    console.log(`Spent script output: ${spendTxId}`);
  });
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runAikenScriptDeploymentDemo();
}
