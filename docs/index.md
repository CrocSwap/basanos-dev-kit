# Baranos

Baranos is a protocol for open, verifiable and trust-minimized LLM inference running on the Fogo blockchain.

It allows any onchain actor, including autonomous smart contracts, to submit arbitrary prompts, pay for LLM inference with crypto assets, and receive cryptoeconomically secured completions. It also allows providers to participate permissionlessly in an open market for inference. Whereas with traditional AI providers, the end user is dependent on the good will and reputation of the provider for accurate responses, inference served in Baranos is trustlessly validated on an open blockchain.

## Protocol Flow

Baranos works through optimistic dispute proofs. Every run starts when a *requester* initiates a call to the Baranos smart contract. The requester chooses a prompt, model and bounty. The prompt is accepted by an *executor*, who posts a bond, and is then responsible for proposing a completion to the prompt. The executor also supplies the Merkle root of an *execution trace* for every token in the completion. Once proposed, this initiates a challenge period.

Unlike most typical LLMs, all models in Baranos are deterministic. Therefore any external *watcher* can check the accuracy of the completion, and should obtain bitwise identical results. If a watcher sees the completion is dishonest, they can initiate a challenge. The challenge is a multi-round bisection game, where the challenger descends through the executor's Merkle tree until arriving at a dishonest *kernel entry*. Whichever party loses forfeits its bond. The economic incentive is therefore for executors to provide bitwise honest inference, as even a single honest watcher can catch them.

After the challenge period, a successful completion is returned back to the smart contract that originated the prompt. This allows for onchain protocols to directly call LLM inference on arbitrary prompts, and consume verified results without having to rely on trusted off-chain actors, committees or TEEs. 

The exact terms of dispute, payment, and bonding for any run are left as open parameters to the protocol. It's up to requesters to decide their own requirements for things like dispute window, bond size, etc. based on their own specific needs for economic security and censorship resistance. 

## Durable Compute Graph

The framework for Baranos execution is the *Durable Compute Graph (DCG)*. DCG is a generalized framework for defining massively multi-transactional workflows in SVM blockchain environments. 

DCG works by decomposing any workflow into an execution graph of kernels. Each kernel defines a deterministic compute operation over fixed-size inputs and outputs. All kernels fit into a single Solana transaction and can be executed fully onchain. Therefore any graph of kernels can be executed on the SVM given enough time and execution fees.

In addition to this type of pure replay, DCG also includes an optimistic commitment mode. Any graph or subgraph in a workflow can be committed as an execution trace using a pre-defined and deterministic protocol to reduce a sequence of kernel entries to a Merkle root. 

Baranos works by reducing LLM transformers to onchain compatible DCG kernels. The kernel becomes the basic "atom" of execution, which is what allows Baranos to support massive LLM models and long trajectories while only ever having to resolve a single disputed kernel transaction onchain. 

For builders integrating Baranos, the protocol currently runs on **DCG unified document format v1, specification revision 7**. The rest of these docs describe that standard.

## Model selection

Baranos currently supports an integer-quantized version of `qwen3.5-4b`. Larger models are expected to be checkpointed on the protocol in the near future.

## Compute bridge

Baranos is currently only available on the Fogo blockchain. In the near future, *compute bridges* to other major chains are expected to be supported through the Wormhole network. Compute bridges should support the same request and response smart contract interface described above, with no additional trust assumptions beyond the Wormhole bridge. Both EVM and SVM interfaces are planned.

## The four roles

### Requester

The requester chooses the prompt, output count, seed, and DDT2 run terms. The terms include the dispute windows and bonds, the optional settlement program and its window, and the result-retention window. The requester starts a Tier C request. DCG treats the request ID as an opaque value.

### Executor

The executor runs the approved model plan. It creates one DCG document. It lands one position root per model position. It publishes the family roots at finalization.

The executor can also answer a challenge. It must keep the proofs needed to answer until each challenge closes.

### Watcher or challenger

A watcher recomputes the result off chain and compares it with the commitments. Anyone may open a challenge. A challenger escrows the bond chosen for that run.

A challenger must answer its own turns. An executor must answer its turns. Missing a deadline can decide the result against the silent party.

### Consumer

A consumer reads a retained DCR2 v5 result. It may use outputs only when the result status is `FINAL` or `SETTLED`. It must also check that the request ID and consumer digest match its request. A consumer rejects a DCRZ tombstone as a result.

## What is trusted

Only two actions are trusted:

1. The registry authority admits model forms to the model registry.
2. The template-seal authority approves an exact sealed plan for use.

Both roles are stored in the program configuration account. The configuration admin can rotate them.

## What is permissionless

The following actions are permissionless:

- sealing a plan and walking its class admission;
- creating a document;
- proving and attesting an output;
- opening and progressing a challenge;
- timing out and settling a challenge;
- resolving a result status;
- closing a document after the allowed deadline;
- replacing a retained result with a DCRZ tombstone at or after its retention deadline.

Some actions still require the party named by the document. For example, only the executor can land roots or finalize. Those checks bind the action to the party whose claim is at risk.

DLE1 version 2 events are an index. Account state remains the source of truth.

## Result statuses

| Status | Meaning for a consumer |
|---|---|
| `PENDING` | Not ready. Do not use it. |
| `FINAL` | The challenge window passed and every output was proven. |
| `REFUTED` | At least one challenger won. Do not use it. |
| `SETTLED` | A final document was closed. Its outputs remain readable while its DCR2 v5 record is retained. |

`CloseDocumentV5` immediately returns the working-account rent and any held executor bond to the executor. It also starts the result-retention clock. The DCR2 v5 record remains until anyone calls tag **185, `CloseResultV6`** at or after the retention deadline. That call replaces it with a 96-byte DCRZ tombstone, destroys its outputs and bitmap, and returns every lamport above the tombstone's rent-exempt minimum to the executor. Nothing closes the result automatically. Consumers must reject DCRZ.

## Settlement

DDT2 selects one of two settlement routes. Both routes pay the record's challenger bond to the ruling winner. Only the first settled challenger win has an executor-bond pot to divide.

The built-in route uses seven accounts. It pays `floor(pot × executor_reward_bps / 10,000)` to the ruling winner, nothing to the loser, and the exact remainder to the incinerator. The custom route uses eleven accounts and makes the exact BSS1 CPI to the committed settlement program. The program must pay every lamport from escrow; its code chooses the allocation. At the custom-settlement deadline, DCG uses the built-in route instead. The eleven-account list is still required for this fallback. A custom, fallback, or escrow mismatch returns 798. Our example settlement program is untrusted and illustrative, not an economic endorsement.

## What to expect

- **Estimated:** a 10,000-token document takes the executor about an hour today; a Metal path may bring it to 30–60 minutes.
- Results become final only after the dispute window. Builders should design for minutes to hours per request, not seconds.
- **Dispute, settlement, and retention defaults are tooling choices, not protocol constants.** The mainnet alpha tooling uses a 45,000-slot challenge window (30 minutes), a 15,000-slot response window, a 1,000,000-lamport challenger bond, no executor bond, a 10,000-basis-point built-in winner share, and no custom settlement program or window. The tool must always convert the requested retention duration to `result_retention_slots`. Mainnet configuration has no defaults: it must name every term, print every slot window and bond, and warn about short windows, low bonds, an unmeasured custom callback, or omitted retention.
- **Uptime and latency: nothing guaranteed.** During the alpha we fulfil requests with a single executor and relayer
  that we run ourselves. Requests may wait, sometimes for a long time; they are not lost, and verification never
  depends on us.

## Stability

- **Program addresses can change during the alpha.** We may upgrade programs in place to a later specification revision or redeploy them to fresh addresses.
- **Don't hard-code addresses.** Read program IDs, the approved model and template, and RPC endpoints from the
  published address page, and re-read them when you start.
- **Wire formats are versioned.** A change that alters bytes comes with a new spec revision and matching SDK releases;
  pin the SDK version you test against.
- We'll announce breaking changes ahead of time where we can, but during the alpha we can't promise notice for every
  reset.

## Known limits

- This is a **mainnet alpha**: transactions spend real FOGO. In the alpha, request fees and request bonds must be zero, and only allowlisted executors can fulfil requests through the request program.
- The current lifecycle is reproducible on **macOS only**. Other platforms are not qualified yet.
- Bond and window values are **placeholders**. The requester and executor must choose them for each run.
- DDT2 selects a built-in or custom settlement route and a result-retention window for each run.
- The program is not deployed yet. Addresses and SDK calls in the quickstart must be filled in at deployment.
- The specification is draft. Read it before sending assets or treating a result as final.

## Next pages

- [Quickstart](quickstart.md): request, watch, and read one result.
- [Requester](requester.md): choose and bind a request.
- [Executor](executor.md): run, land, finalize, and answer challenges.
- [Watcher and challenger](watcher-challenger.md): recompute, monitor, and dispute.
- [Consumer](consumer.md): validate and use a final result.
- [Reference](reference.md): generated instruction, account, address, event, and error tables.

The normative specification (spec: to be published) defines the protocol. This guide does not repeat its security argument.
