# DCG builders

DCG records a fixed model computation on Fogo testnet. An executor commits to a result before anyone can challenge it. The chain stores hashes that let a watcher check the result. Other programs can then consume a final value.

This guide describes the **DCG unified document format v1, specification revision 6**. It is written before the re-key program is deployed. The program address and SDK entry points are still placeholders.

## The four roles

### Requester

The requester chooses the prompt, output count, seed, and dispute terms. The requester starts a Tier C request. DCG treats the request ID as an opaque value.

### Executor

The executor runs the approved model plan. It creates one DCG document. It lands one position root per model position. It publishes the family roots at finalization.

The executor can also answer a challenge. It must keep the proofs needed to answer until each challenge closes.

### Watcher or challenger

A watcher recomputes the result off chain and compares it with the commitments. Anyone may open a challenge. A challenger escrows the bond chosen for that run.

A challenger must answer its own turns. An executor must answer its turns. Missing a deadline can decide the result against the silent party.

### Consumer

A consumer reads the durable result account. It may use outputs only when the result status is `FINAL` or `SETTLED`. It must also check that the request ID and consumer digest match its request.

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
- closing a document after the allowed deadline.

Some actions still require the party named by the document. For example, only the executor can land roots or finalize. Those checks bind the action to the party whose claim is at risk.

## Result statuses

| Status | Meaning for a consumer |
|---|---|
| `PENDING` | Not ready. Do not use it. |
| `FINAL` | The challenge window passed and every output was proven. |
| `REFUTED` | At least one challenger won. Do not use it. |
| `SETTLED` | A final document was closed. Its outputs remain readable. |

A closed result account is durable. Closing a document returns the document account rent to the executor. It does not delete the result record.

## What to expect

- **Estimated:** a 10,000-token document takes the executor about an hour today; a Metal path may bring it to 30–60 minutes.
- Results become final only after the dispute window. Builders should design for minutes to hours per request, not seconds.
- **Dispute window: 1 day during the alpha.** This is deliberately extra long for the alpha phase, so that a restart
  or an outage on our side can never cost an honest result its dispute. Expect a much shorter window after the alpha,
  and treat the window as a per-run value rather than a constant.
- **Uptime and latency: nothing guaranteed.** During the alpha we fulfil requests with a single executor and relayer
  that we run ourselves. Requests may wait, sometimes for a long time; they are not lost, and verification never
  depends on us.

## Stability

- **Program addresses can change during the alpha.** We may upgrade programs in place (for example, to spec
  revision 7) or redeploy them to fresh addresses, and testnet itself can be reset.
- **Don't hard-code addresses.** Read program IDs, the approved model and template, and RPC endpoints from the
  published address page, and re-read them when you start.
- **Wire formats are versioned.** A change that alters bytes comes with a new spec revision and matching SDK releases;
  pin the SDK version you test against.
- We'll announce breaking changes ahead of time where we can, but during the alpha we can't promise notice for every
  reset.

## Known limits

- This is a **testnet alpha**. No assets are at stake in the builder trial.
- The current lifecycle is reproducible on **macOS only**. Other platforms are not qualified yet.
- Bond and window values are **placeholders**. The requester and executor must choose them for each run.
- The re-key format is designed for this model shape. **Revision 7 adds a pluggable settlement program and per-run result retention.**
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
