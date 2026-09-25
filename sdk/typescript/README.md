# basanos TypeScript SDK

The standalone TypeScript SDK targets revision 7 of `dcg-unified-v1` and mirrors DDT2, descriptor `/4`, DCM2 v6, DCR2 v5/DCRZ, DLE1 v2, challenge openings without a response length, and both settlement routes. It targets Node 20 or newer, uses native ESM, and has strict TypeScript declarations.

`@solana/web3.js` v1 is used for `PublicKey`, PDA derivation, keypairs, transactions, and the transaction instruction type. The SDK uses Node's built-in test runner and no test framework.

## Install

```sh
npm install @basanos/sdk
```

From this checkout:

```sh
cd sdk/typescript
npm install
npm test
```

## Requester

```ts
import {
  RequestBlock,
  Requester,
  RunTerms,
} from "@basanos/sdk";

const requester = new Requester(dcgProgramId);
const request = RequestBlock.create(requestProgramId, requesterPublicKey, {
  nonce: 7,
  promptTokenCount: 30,
  maxNewTokens: 51,
  promptCommitment,
  promptTokens: promptTokenIds,
  tokenizerSha256: tokenizerHash,
  machineId: machineHash,
  terms: new RunTerms({
    challengeWindowSlots: 90_000,
    responseWindowSlots: 45_000,
    challengerBondLamports: 1_000_000,
    executorBondLamports: 5_000_000,
    executorRewardBps: 5_000,
    resultRetentionSlots: 2_592_000,
  }),
});

const binding = request.runBinding(executorPublicKey, {
  outputBaseEntry: 28_037,
});
console.log(request.consumerDigest().toString("hex"));
console.log(binding.encode().toString("hex"));
```

`Requester.documentPlan(...)` returns `UnifiedInit`, gapless `LandPositionRoots` batches, and `FinalizeDocumentV5` instructions. The SDK never retains a private key.

## Watcher and settlement

`Watcher.openPosition` and `Watcher.openLeaf` take a nonce but no response length. The executor declares the response length in DRU1. `settle` builds seven accounts for a zero settlement program; `settleCustom` builds the eleven-account route with the settlement program, escrow, DCR2, and system program. `settlementEscrowAddress` derives the escrow PDA under the DCG program.

## Consumer

```ts
import {
  Consumer,
  RpcClient,
} from "@basanos/sdk";

const rpc = new RpcClient(rpcUrl);
const consumer = new Consumer(rpc, dcgProgramId);
const result = await consumer.readResult(descriptor);

if (result.usable) {
  const tokens = consumer.tokens(result, { vocab: 32_000 });
  console.log(tokens);
}
```

Use `Consumer.verifyOutput(...)` to check an `AttestOutputV5` payload against its landed position root. The consumer rejects `PENDING` and `REFUTED` results and rejects a DCRZ tombstone as a result. All RPC and codec operations are offline-testable with injected fakes; network calls are explicit.
