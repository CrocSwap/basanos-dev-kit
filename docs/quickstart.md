# DCG builder quickstart

This is the shortest mainnet path from a request to a readable result. It follows **DCG unified document format v1, specification revision 7**.

The SDKs are in the developer kit on GitHub: [CrocSwap/basanos-dev-kit](https://github.com/CrocSwap/basanos-dev-kit) (Python in `sdk/python`, TypeScript in `sdk/typescript`).

The programs are deployed on Fogo mainnet (addresses below). Values in angle brackets are yours to fill in.

## Before you start

You need:

- a Fogo **mainnet** RPC endpoint;
- a fee payer funded with FOGO;
- separate requester, executor, and challenger keys as needed;
- an approved sealed plan (`PT2S`);
- a frozen model registry (`DRP2`);
- a complete class-admission record (`DEA2`);
- a model, prompt, and output policy for one supported workload.

This is a mainnet alpha: transactions spend real FOGO. Amounts are small, but check every bond and window before you send.

**Estimated:** a 1,000-token document takes the executor a couple of minutes today. Results become final only after the dispute window, so plan for minutes to hours per request rather than seconds.

Set the deployment values:

```sh
export DCG_RPC_URL="<FOGO_MAINNET_RPC_URL>"
export DCG_PROGRAM_ID="3cJfY4YM2TZooT9P9WchAYzofm2WoAnMfyK176Fjp9vo"
export DCG_KEYPAIR_PATHS="<KEYPAIR_PATHS>"
```

Mainnet alpha addresses:

| Account | Address |
|---|---|
| DCG program | `3cJfY4YM2TZooT9P9WchAYzofm2WoAnMfyK176Fjp9vo` |
| Tier C request program | `HdZX3FLaKhzXpoyhiwrHU6FKVtY1ySPRJcGR3GAxAfz2` |
| Request program config | `CznmpMe31KrwDcomVoPCTDQhZJynr3h9cjtyxy3hTHjd` |
| Model registry (`DRP2`, id 1, frozen) | `FPgbQ4hJWRWtsb3f9ob7LatMV6MQsvSVb1wVyEs87HKr` |

The steps below use these SDK entries:

| SDK entry | Purpose |
|---|---|
| Python `basanos_sdk.RequestProgramClient.create_request`<br>TypeScript `RequestProgramClient.createRequest` | Create the request and return its request ID and consumer digest. |
| Python `Requester.document_plan(...).init`<br>TypeScript `Requester.documentPlan(...).init` | Build the revision-7 `DDT2`, `DRB1`, descriptor, and instruction data. |
| Python `Requester.document_plan(...).landing`<br>TypeScript `Requester.documentPlan(...).landing` | Encode batches of position roots. |
| Python `consensus.encode_attestation(...)` + `Requester.attest_output(...)`<br>TypeScript `consensus.encodeAttestation(...)` + `Requester.attestOutput(...)` | Build proof-carrying `AttestOutputV5` data. |
| Python `Requester.document_plan(...).finalize`<br>TypeScript `Requester.documentPlan(...).finalize` | Build `FinalizeDocumentV5` with the family roots. |
| Python `Watcher.read_document(...)`, `Watcher.events(...)`, `Requester.read_result(...)`<br>TypeScript `Watcher.readDocument(...)`, `Watcher.events(...)`, `Requester.readResult(...)` | Read DLE1 version 2 events and the v6 document and v5 result accounts. |
| Python `Requester.read_result(descriptor)`<br>TypeScript `Requester.readResult(descriptor)` | Decode a DCR2 v5 result and reject DCRZ. |
| Python `Requester.resolve(...)`<br>TypeScript `Requester.resolve(...)` | Build `ResolveResultV5`. |
| Python `instructions.close_document(...)`<br>TypeScript `instructions.closeDocument(...)` | Build `CloseDocumentV5`. |
| Python `instructions.close_result(...)`<br>TypeScript `instructions.closeResult(...)` | Build `CloseResultV6` for use at or after the retention deadline. |

The exact package names and arguments will be filled in at deploy. Do not guess them from the old DCG examples.

## 1. Request a completion

The requester creates a Tier C request. It chooses:

- prompt token IDs and their commitment;
- maximum new tokens, which must equal the DCG output count;
- sampler settings and the seed;
- the challenge window;
- the response window;
- the challenger bond;
- the executor bond and built-in challenger reward share;
- `settlement_program`, which is zero for the built-in route;
- `custom_settle_window_slots`, which is zero exactly when `settlement_program` is zero;
- `result_retention_slots`;
- the request deadline.

Zero is allowed for either bond. A zero executor bond is normal for this alpha. A zero `settlement_program` requires a zero custom-settlement window. A nonzero program requires a custom window from 1 through `2^62` slots. Retention is also from 1 through `2^62` slots. These are negotiated run terms, so the requester and executor must agree on them.

The mainnet alpha tooling uses a 45,000-slot challenge window (30 minutes at 40 ms slots), a 15,000-slot response window, a 1,000,000-lamport challenger bond, no executor bond, a 10,000-basis-point built-in winner share, the built-in settlement route and 64,800,000 slots (30 days) of result retention. The tool must set `result_retention_slots` explicitly from the requested duration. Mainnet configuration has no defaults and must name every term.

The request output must include:

- the request account address, used as `request_id`;
- `consumer_digest = SHA256("basanos/tierc-request/2" || TRQ1)`;
- the exact 376-byte TRQ1 and its DDT2 bytes;
- the prompt commitment.

Conceptually:

```sh
PYTHONPATH=.:src python -m "<CREATE_TIER_C_REQUEST_MODULE>" \
  --rpc "$DCG_RPC_URL" \
  --program "$DCG_PROGRAM_ID" \
  --requester-key "<REQUESTER_KEYPAIR_PATH>" \
  --fee-payer-key "<FEE_PAYER_KEYPAIR_PATH>" \
  --out "<REQUEST_RECEIPT>"
```

Give the request ID, consumer digest, prompt commitment, output count, seed, and DDT2 run terms to the executor. Do not send a private key.

## 2. Start the document

The executor uses the approved plan and frozen registry. It first checks that the shared `DEA2` is complete.

It builds a `DRB1` run binding with:

- its own public key as `executor`;
- the request ID and consumer digest, or both zero for a direct DCG run;
- the agreed seed;
- the output locator: the base entry, write row, first position, count, and width.

Then it sends tag **161, `UnifiedInit`**. The program creates the document, position, family-table, and DCR2 v5 result accounts. The descriptor is the hash of the revision-7 `/4` preimage committed by that instruction.

The executor reads the emitted `INIT` event or the resulting accounts. The requester and watcher can now derive the same document addresses from the descriptor.

Common init failures are:

- no current template approval for the exact sealed plan;
- an incomplete or mismatched `DEA2`;
- invalid dispute terms or run binding;
- a document account with existing data or a non-system owner;
- an output locator that does not match the plan.

## 3. Land the execution

For each position, the executor computes the revision-3 position root. A root commits to that position's segment roots and their entry leaves.

The executor sends tag **162, `LandPositionRoots`** in gapless order. The practical legacy-packet batch is at most 28 roots. The protocol count is a `u8`, so a transaction transport may impose the smaller limit.

The executor must not skip or replay a position range. A wrong batch, wrong signer, or zero root fails without changing state.

It can prove outputs while landing. Tag **177, `AttestOutputV5`** is permissionless. Anyone may submit a valid proof. The program writes the value and its bitmap bit once.

## 4. Finalize

After all positions are landed, the executor sends tag **165, `FinalizeDocumentV5`**.

The instruction data contains every family root in DFS2 order. The program stores only the digest of that root list. Finalization:

- sets the document root;
- sets the finalization slot;
- sets `dispute_deadline = finalize_slot + challenge_window_slots`;
- opens the challenge window.

The executor cannot land more roots after finalization.

## 5. Watch the challenge window

The requester, executor, and watcher should run `<WATCH_DOCUMENT>` until all of these are true:

- `DCR2` is `FINAL`, `SETTLED`, or `REFUTED`;
- `now > dispute_deadline`;
- `DCM2.open_challenges == 0`;
- if the document is not refuted, every output is attested.

Use account state as the source of truth. DLE1 version 2 events are an index. A log can be missing after a failed transaction or the chain log cap.

A challenger may open only before the opening deadline. A round already open may continue after it. Each phase change gets a new deadline of `now + response_window_slots`.

If the result is still `PENDING` after the conditions hold, anyone may send tag **178, `ResolveResultV5`**. It returns `RESULT_STATE` while an output is missing, a challenge is open, or the deadline has not passed.

After a challenge is ruled, tag **131, `Settle`** pays its record bond to the ruling winner. With a zero `settlement_program`, the built-in route uses seven accounts. On the first settled challenger win, it pays the configured share of the executor-bond pot to the winner and the exact remainder to the incinerator; the loser receives none. A nonzero program selects the eleven-account custom route and an exact BSS1 CPI before its deadline. The program must pay the entire escrow. At or after the deadline, DCG uses the built-in payout as a fallback with the eleven-account list. A route or escrow mismatch returns 798.

## 6. Read the result

Decode the DCR2 v5 account with `<READ_RESULT>`. Reject a DCRZ tombstone instead of treating it as a result.

Check all of these fields before use:

| Field | Required value |
|---|---|
| `document_closed` | `0` or `1`; either is readable while the account remains DCR2 v5. |
| `status` | `FINAL` or `SETTLED` |
| `request_id` | Your request account |
| `consumer_digest` | Your request digest |
| `executor` | The expected executor |
| `document_root` | Nonzero |
| `outputs_attested` | `output_count` |
| `retention_start_slot` | Zero before document close, then the close slot. |
| `retention_deadline` | `retention_start_slot + retention_slots` after document close. |
| `outputs` | Read exactly `output_count × output_width` bytes |

For a Tier C result, decode each 16-byte output as two little-endian signed 64-bit values: `(token_id, logit)`. Check that the token ID is below the tokenizer vocabulary.

Do not use a `PENDING` or `REFUTED` record.

## 7. Close the document and start result retention

After the result is usable, anyone may send tag **172, `CloseDocumentV5`**. The executor receives the working-account rent and any held executor bond. The call sets `retention_start_slot` to the current slot and `retention_deadline` to `retention_start_slot + retention_slots`. The DCR2 v5 result stays at its existing address.

A refuted document may also close. An unfinalized document may close only when the executor abandons it.

Nothing closes the retained result automatically. At or after `retention_deadline`, anyone may send tag **185, `CloseResultV6`**. It replaces DCR2 v5 with a 96-byte DCRZ tombstone, destroys the outputs and bitmap, and sends every lamport above the tombstone's rent-exempt minimum to the executor. Before the deadline it refuses. A consumer must reject DCRZ.

## Troubleshooting

- **No finalization:** check `positions_complete == P`, the family-root count, and tag 165 errors.
- **No challenge appears:** compare the current slot with `dispute_deadline` and check the challenge window, not the response window.
- **A round stops:** read the DCR1 phase and deadline. The named party must act before that deadline.
- **A response grows the account:** retry a grow-only response instruction, then retry the proof step.
- **A result remains pending:** check output attestation, open challenges, and the deadline before resolving.
- **Addresses differ:** rebuild them from the exact descriptor, not from a display name or transaction index.

Read the [requester](requester.md), [executor](executor.md), [watcher/challenger](watcher-challenger.md), and [consumer](consumer.md) pages for the full role steps. See the generated [reference](reference.md) for tags, accounts, addresses, events, and errors.
