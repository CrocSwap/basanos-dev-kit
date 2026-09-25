# DCG builder quickstart

This is the shortest testnet path from a request to a readable result. It follows **DCG unified document format v1, specification revision 6**.

The program is not deployed yet. Every value in angle brackets is a placeholder. Replace it only after deployment.

## Before you start

You need:

- a Fogo **testnet** RPC endpoint;
- a funded testnet fee payer;
- separate requester, executor, and challenger keys as needed;
- an approved sealed plan (`PT2S`);
- a frozen model registry (`DRP2`);
- a complete class-admission record (`DEA2`);
- a model, prompt, and output policy for one supported workload.

Never use a mainnet endpoint. This alpha has no assets at stake.

**Estimated:** a 10,000-token document takes the executor about an hour today (a Metal path may bring it to 30–60 minutes); results become final only after the dispute window, so plan for minutes to hours per request rather than seconds.

Set the deployment values:

```sh
export DCG_RPC_URL="<FOGO_TESTNET_RPC_URL>"
export DCG_PROGRAM_ID="<RE_KEY_DCG_PROGRAM_ID>"
export DCG_KEYPAIR_PATHS="<KEYPAIR_PATHS>"
```

The deploy process must also provide these SDK entries:

| Placeholder | Purpose |
|---|---|
| `<CREATE_TIER_C_REQUEST>` | Create the request and return its request ID and consumer digest. |
| `<BUILD_UNIFIED_INIT>` | Build the revision-6 `DDT1`, `DRB1`, descriptor, and instruction data. |
| `<LAND_POSITION_ROOTS>` | Encode batches of position roots. |
| `<ATTEST_OUTPUTS>` | Build proof-carrying `AttestOutputV5` data. |
| `<FINALIZE_DOCUMENT>` | Build `FinalizeDocumentV5` with the family roots. |
| `<WATCH_DOCUMENT>` | Read DLE1 events and the v5 accounts. |
| `<READ_RESULT>` | Decode a DCR2 v4 result. |
| `<RESOLVE_RESULT>` | Build `ResolveResultV5`. |
| `<CLOSE_DOCUMENT>` | Build `CloseDocumentV5`. |

The exact package names and arguments will be filled in at deploy. Do not guess them from the old DCG examples.

## 1. Request a completion

The requester creates a Tier C request. It chooses:

- prompt token IDs and their commitment;
- maximum new tokens, which must equal the DCG output count;
- sampler settings and the seed;
- the challenge window;
- the response window;
- the challenger bond;
- the executor bond and challenger reward share;
- the request deadline.

Zero is allowed for either bond. A zero executor bond is normal for this testnet trial. Window values remain placeholders until the requester and executor agree.

The request output must include:

- the request account address, used as `request_id`;
- `consumer_digest = SHA256("basanos/tierc-request/1" || TRQ1)`;
- the exact DDT1 bytes;
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

Give the request ID, consumer digest, prompt commitment, output count, seed, and dispute terms to the executor. Do not send a private key.

## 2. Start the document

The executor uses the approved plan and frozen registry. It first checks that the shared `DEA2` is complete.

It builds a `DRB1` run binding with:

- its own public key as `executor`;
- the request ID and consumer digest, or both zero for a direct DCG run;
- the agreed seed;
- the output locator: the base entry, write row, first position, count, and width.

Then it sends tag **161, `UnifiedInit`**. The program creates the document, position, family-table, and result accounts. The descriptor is the hash committed by that instruction.

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

Use account state as the source of truth. DLE1 events are an index. A log can be missing after a failed transaction or the chain log cap.

A challenger may open only before the opening deadline. A round already open may continue after it. Each phase change gets a new deadline of `now + response_window_slots`.

If the result is still `PENDING` after the conditions hold, anyone may send tag **178, `ResolveResultV5`**. It returns `RESULT_STATE` while an output is missing, a challenge is open, or the deadline has not passed.

## 6. Read the result

Decode the DCR2 v4 account with `<READ_RESULT>`.

Check all of these fields before use:

| Field | Required value |
|---|---|
| `closed` | `1` is allowed. The record remains durable. |
| `status` | `FINAL` or `SETTLED` |
| `request_id` | Your request account |
| `consumer_digest` | Your request digest |
| `executor` | The expected executor |
| `document_root` | Nonzero |
| `outputs_attested` | `output_count` |
| `outputs` | Read exactly `output_count × output_width` bytes |

For a Tier C result, decode each 16-byte output as two little-endian signed 64-bit values: `(token_id, logit)`. Check that the token ID is below the tokenizer vocabulary.

Do not use a `PENDING` or `REFUTED` record.

## 7. Close and reclaim document rent

After the result is usable, anyone may send tag **172, `CloseDocumentV5`**. The executor receives the document account rent and any held executor bond. The result account stays.

A refuted document may also close. An unfinalized document may close only when the executor abandons it.

## Troubleshooting

- **No finalization:** check `positions_complete == P`, the family-root count, and tag 165 errors.
- **No challenge appears:** compare the current slot with `dispute_deadline` and check the challenge window, not the response window.
- **A round stops:** read the DCR1 phase and deadline. The named party must act before that deadline.
- **A response grows the account:** retry a grow-only response instruction, then retry the proof step.
- **A result remains pending:** check output attestation, open challenges, and the deadline before resolving.
- **Addresses differ:** rebuild them from the exact descriptor, not from a display name or transaction index.

Read the [requester](requester.md), [executor](executor.md), [watcher/challenger](watcher-challenger.md), and [consumer](consumer.md) pages for the full role steps. See the generated [reference](reference.md) for tags, accounts, addresses, events, and errors.
