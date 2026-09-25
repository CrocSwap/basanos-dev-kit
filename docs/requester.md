# Requester guide

The requester chooses the work and the rules for challenging it. This guide follows **DCG unified document format v1, specification revision 6**.

The requester does not need to run the model. The executor does that. The requester can still watch, prove outputs, resolve the result status, and close a finished document.

## 1. Choose an approved workload

The requester needs:

- one model form admitted in a frozen `DRP2` registry;
- one sealed plan, `PT2S`, with a current `DTA1` approval;
- a complete `DEA2` class-admission record for that registry and plan;
- a supported output writer in the plan.

Plan upload is permissionless. Admission for a unified document is not. Only the template-seal authority can approve the exact sealed plan.

A later authority rotation does not revoke an existing approval. An explicit revocation stops new documents. It does not change a document that was already initialized.

## 2. Choose the request values

The requester fixes these values before the executor builds the document:

| Value | Rule |
|---|---|
| Prompt token count | Must match the prompt used by the plan. |
| Prompt commitment | Must equal the DCG `prompt_commitment`. |
| Maximum new tokens | Must equal DCG `output_count`. |
| Seed | Must equal DRB1. Use zero for greedy sampling. |
| Dispute terms | Must equal DDT1 in the document. |
| Request ID | The Tier C request account address. |
| Consumer digest | `SHA256("basanos/tierc-request/1" || TRQ1)`. |

A DCG document either has both a request ID and a consumer digest, or has zero for both.

### Choose the challenge window

The challenge window is the number of slots after finalization during which a new challenge may open.

```text
dispute_deadline = finalize_slot + challenge_window_slots
```

The program only requires at least one slot and a maximum of `2^62`. The requester chooses the policy value. For this alpha, treat every value as a placeholder until the executor agrees.

### Choose the response window

Each open or phase change starts a new round deadline:

```text
round_deadline = current_slot + response_window_slots
```

A challenge that opened before the challenge deadline may continue after it. The response window applies to every later round.

### Choose bonds

The challenger bond is escrowed when a challenge opens. The executor bond is escrowed at `UnifiedInit`.

The first settled challenger win pays this share of the executor bond to that challenger:

```text
floor(executor_bond × executor_reward_bps / 10,000)
```

The rest is burned. Later challenger wins do not pay the executor bond again.

Both bonds may be zero. That is allowed by the program. It is a testnet policy choice, not a recommended mainnet economic policy.

## 3. Create the Tier C request

DCG does not own request accounts. Tier C does. The requester creates a request whose 328-byte `TRQ1` block contains the request, requester, nonce, prompt fields, tokenizer hash, sampler fields, seed, machine ID, and DDT1.

The requester must preserve the exact request receipt. It contains the values the executor and consumer need.

The requester does **not** send a DCG init instruction. The executor does that with tag 161.

## 4. Give the executor public inputs

Send the executor only public inputs:

- the approved `PT2S` address and plan identity;
- the frozen `DRP2` address and table root;
- the `DEA2` address;
- request ID;
- consumer digest;
- prompt commitment;
- output count and first output position;
- seed;
- all five DDT1 fields;
- the supported output writer identity.

The executor returns the descriptor and document addresses after tag 161. The requester should independently rebuild the descriptor and addresses from public inputs.

## 5. Watch the document

Read the durable DCR2 v4 result and the live DCM2 v5 document.

Watch for:

- every `LAND` event and `positions_complete`;
- `FINALIZE` and its `dispute_deadline`;
- `CHALLENGE_OPEN`, `RESPOND`, `RULING`, and `SETTLE` events;
- `open_challenges` and `challenger_wins`;
- `outputs_attested` and result status.

Use account state as the source of truth. A failed transaction's events do not count. A missing event does not undo an account change.

The requester deadline belongs to Tier C. It does not replace the DCG challenge deadline. A Tier C request may stop waiting before the DCG challenge window ends, but it cannot make a `PENDING` or `REFUTED` DCG result usable.

## 6. Help prove outputs

Tag **177, `AttestOutputV5`** is permissionless after the output's position root is landed. Any party may submit it.

It uses:

- signer (signer);
- `DCM2` and `DPR2`;
- `DCR2` (writable);
- the `PT2S` and its base route and geometry accounts.

The program derives the output coordinate. A caller cannot name another coordinate. A bad leaf, path, segment table, or position-root proof returns `OUTPUT_PROOF`.

## 7. Resolve and close

Anyone may send tag **178, `ResolveResultV5`**. It uses `DCM2` and writable `DCR2`.

The result becomes:

- `REFUTED` as soon as a challenger ruling has set the document's refuted flag;
- otherwise `FINAL` only after the challenge deadline, with no open challenge and every output attested.

Tag **172, `CloseDocumentV5`** uses:

- any signer;
- `DCM2`, `DPR2`, `DFS2`, and `DCR2` (all writable);
- the executor account (writable).

After the allowed deadline and no open challenge, anyone may close. An unfinalized document may be abandoned only by the executor.

## Deadlines at a glance

| Deadline | Formula | Effect |
|---|---|---|
| Tier C request deadline | Tier C policy | Controls the application request, not DCG validity. |
| DCG challenge deadline | `finalize_slot + challenge_window_slots` | Last slot to open a challenge. |
| DCG round deadline | `phase_change_slot + response_window_slots` | Last slot for the named party to act. |

A final result requires `now > dispute_deadline`, no open challenge, and all outputs attested.

## What can go wrong

- **The request binding does not match:** the request ID, consumer digest, prompt, output count, seed, or DDT1 differs. The result belongs to another run.
- **The template is not approved:** `UnifiedInit` returns `TEMPLATE_SEAL`.
- **The plan is not admitted:** the registry, plan, or `DEA2` does not match. Init returns `PLAN_BINDING`, `ADMISSION_STATE`, or a registry refusal.
- **The output locator is invalid:** init returns `RUN_BINDING`.
- **The result stays pending:** the challenge window is open, a challenge is open, or an output is not attested.
- **A challenge times out:** the silent party can lose. A challenger can also lose by failing its own turn.
- **The result is refuted:** do not use it. The document may still close and return document rent.
- **The result record remains after close:** this is designed. DCR2 is the durable application record.

See the [generated reference](reference.md) for exact tags, accounts, and refusal codes.
