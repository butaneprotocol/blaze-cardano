# Kupmios Example

To run this example, please follow the steps below from the workspace root:

```bash
$ pnpm build && pnpm test
$ cd examples/kupmios
# Add your test mnemonic, kupo and ogmios endpoints
$ vi index.js
...
  // Tested with Kupo v2.8.0
  const kupoUrl = "<YOUR KUPO ENDPOINT>";
  // Tested with Ogmios v6.3.0
  const ogmiosUrl = "<YOUR OGMIOS ENDPOINT>";
...
  const mnemonic = "<YOUR MNEMONIC THAT CONTAINS FUND TO SEND>";
...

$ npm i && npm run query
> kupmios@1.0.0 query
> node index.js

Transaction with ID 250e0e34fdb3d15014b0c4558b51f51c8e11f19ec33b64dc98b1b0b323e5dfe6 has been successfully submitted to the blockchain.
Transaction is confirmed and accepted on the blockchain.
```

> Note: These commands will set up the environment and execute the example query using Kupmios.
