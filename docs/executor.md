# Executor guide

The executor runs the model and publishes the commitments needed to check it. This guide follows **DCG unified document format v1, specification revision 7**.

The executor is named in `DRB1` and becomes the DCM2 authority. That key must land the roots, finalize the document, and answer executor turns in a challenge.

This is a mainnet alpha. The program addresses are in the [quickstart](quickstart.md). In the alpha, the request program accepts results only from allowlisted executors.

## Account notation

- **signer**: signs the transaction.
- **writable**: the instruction may change the account.
- All other accounts are read-only.
- Account order matters. Use the generated [reference](reference.md), not a guessed list.

## 1. Preflight the inputs

Before creating a document, verify:

- the endpoint is Fogo mainnet;
- the re-key program is deployed at the expected address;
- the `PT2S` is sealed and has an approved `DTA1`;
- the `DRP2` is frozen at epoch 4;
- the `DEA2` is complete for that registry and plan;
- every required model and prompt anchor is nonzero;
- the request ID, consumer digest, prompt, output count, seed, and DDT2 match the request;
- the selected output write has the declared fixed width;
- the executor has enough FOGO for rent, the executor bond, and fees.

A predictable DCG account may already hold lamports. Revision 7 lets the creating instruction top it up to rent. A pre-funded address is not a failure.

## 2. Complete the class-admission walk if needed

`DEA2` depends on the registry and sealed plan. It can be shared by every document with the same registry, plan, and position count.

### Start the record

Tag **159, `AdmissionBeginV2`** uses:

- payer (signer, writable);
- `DEA2` (writable);
- `DRP2`, `PT2S`, base routes, and base geometry;
- system program.

Anyone may send it. It writes the header but admits no classes.

### Walk classes

Tag **160, `AdmissionStepV2`** uses:

- `DEA2` (writable);
- `DRP2`, `PT2S`, `PT1S`, base routes, and base geometry.

Send `1..256` classes per call. A refusal changes nothing. An empty class counts as admitted. A nonempty class passes only if the frozen registry row covers its full shape.

Do not start `UnifiedInit` until the `DEA2` complete bit is set and `admitted == base_classes + generated_classes`.

## 3. Build the run binding

The executor builds:

- `DDT2`: challenge and response windows; challenger and executor bonds; built-in winner share; `settlement_program`; `custom_settle_window_slots`; and `result_retention_slots`;
- `DRB1`: executor, optional request binding, seed, and output locator.

Both blocks are hashed into the descriptor. A later edit changes every document address. `settlement_program` is zero exactly when `custom_settle_window_slots` is zero. A nonzero program needs a custom window from 1 through `2^62` slots. `result_retention_slots` is also from 1 through `2^62`.

The mainnet alpha tooling uses a 45,000-slot challenge window (30 minutes), a 15,000-slot response window, a 1,000,000-lamport challenger bond, no executor bond, a 10,000-basis-point built-in winner share, and the built-in settlement route. The tool must set `result_retention_slots` explicitly. Mainnet configuration has no defaults and must name every term.

The output locator names one surviving base entry and one fixed-width write. DCG can prove that write once per output position. It cannot prove an arbitrary variable-width application value through this interface.

## 4. Create the document

Tag **161, `UnifiedInit`** uses:

- executor (signer, writable);
- `DCM2`, `DPR2`, `DFS2`, and `DCR2` (writable);
- system program;
- `PT2S`, base routes, base geometry, and base payloads;
- `DRP2` and `DEA2`;
- `DTA1`.

The instruction checks the plan, terms, request binding, output locator, template approval, registry, admission record, and summary classes.

On success it:

- computes the 679-byte revision-7 descriptor;
- creates the document accounts;
- escrows the executor bond when nonzero;
- creates a `PENDING` DCR2 v5 result;
- logs a DLE1 version 2 `INIT` event last.

Read back the descriptor and accounts. Do not continue from a local address calculation alone.

## 5. Land every position root

For each position `p`, run the executor and compute the revision-3 position root. The root commits to the position's segment roots and entry leaves.

Tag **162, `LandPositionRoots`** uses:

- executor (signer);
- `DCM2` (writable);
- `DPR2` (writable).

Rules:

- `first` must equal `positions_complete`;
- `first + count` must not exceed `P`;
- roots must be nonzero;
- the document must not be finalized;
- the signer must be the executor.

Send batches in order. The practical legacy-packet maximum is 28 roots. Use a v0 transaction or smaller batches when needed.

### Attest outputs

Tag **177, `AttestOutputV5`** uses:

- any signer;
- `DCM2` and `DPR2`;
- `DCR2` (writable);
- `PT2S`, base routes, and base geometry.

The executor may submit these proofs, but any party may do so. The output's position must already be landed. A repeated or invalid proof fails without changing the result.

## 6. Finalize the document

After `positions_complete == P`, send tag **165, `FinalizeDocumentV5`**. It uses:

- executor (signer);
- `DCM2` (writable);
- `DCR2` (writable).

Instruction data contains the family roots in DFS2 order. The program stores their digest, not the roots.

Finalization sets the document root and:

```text
dispute_deadline = finalize_slot + challenge_window_slots
```

No new challenge may open after that deadline. A challenge opened on time may continue into later response rounds.

## 7. Answer challenges

Keep the exact execution leaves, paths, position-root proofs, family roots, segment roots, and range proofs until all challenges settle.

The challenger chooses one of three main paths.

### Direct leaf challenge: tag 166

The challenger fixes a position, segment, local entry, leaf path, and segment-to-position proof. A direct challenge immediately reaches an admitted respond phase or a conviction.

Tags **166** and **167** do not carry a response length. The executor declares the full response size in tag **115**. That stored size alone governs the response.

The usual response sequence is:

| Tag | Instruction | Main accounts |
|---:|---|---|
| 115 | Begin DRU1 response | DRU1 (writable), executor (signer, writable), DCR1, system |
| 116 | Grow DRU1 if needed | DRU1 (writable), executor (signer), DCR1 |
| 125 | Write response chunks | DRU1 (writable), executor (signer), DCR1 |
| 118 | Seal response | DRU1 (writable), executor (signer), DCR1 |
| 120 | Verify the target | DCR1 (writable), DRU1, DCM2, `PT2S`, `PT1S`, base routes, geometry, payloads |
| 121 or 129 | Verify producer or range reads | DCR1 (writable), DRU1, DCM2, `DPR2`, base routes, geometry, `PT2S`, `DFS2` |
| 124 | Execute the replay | DCR1 (writable), DRU1, DCM2 (writable), base routes, geometry, `PT2S` |

A grow-only call does not verify the response. Retry the next proof step after growth.

Before a range read can use an RS1 family root, reveal and verify the family-root table with tag **173, `RevealFamilyTableV5`**. It uses DCR1 (writable), any signer, and DCM2.

### Position challenge: tag 167

The challenger first requests the segment roots for one landed position.

The executor sends tag **163, `RevealPositionV5`**. It uses:

- DCR1 (writable);
- executor (signer);
- `DCM2` and `DPR2`;
- `PT2S`, base routes, and base geometry.

Send roots in order. The last chunk must reproduce the landed position root. A mismatch returns `REVEAL_MISMATCH`. A gap or overrun returns `REVEAL_ORDER`.

The challenger then uses tag 164 to select one segment. The executor and challenger alternate tags 168 and 169 until an entry is fixed. The executor signs tag 168; the challenger signs tag 169.

### Summary challenge: tag 171

The challenger carries the family-root table in the open. The executor reveals up to 16 descendants per round with tag **179**. The challenger selects one with tag 180. Repeat until a summary leaf is fixed.

Anyone may submit a verifying slot answer with tag **181**. The executor should prepare these answers because it has the execution artifacts. The answer is judged by deterministic comparison, not by signer identity.

## 8. Watch every deadline

The challenge window controls only opening.

Every phase change sets:

```text
deadline = now + response_window_slots
```

Executor-silent phases normally favor the challenger. Challenger-silent phases normally favor the executor.

For a position dispute, phase 7 is the executor reveal and phase 8 is the challenger selection. Missing those deadlines can decide the document without a full replay.

Watch the DCR1 phase field and account deadline. Do not infer them from log arrival order.

## 9. Close a response account

After a challenge is ruled but before it is settled, anyone may send tag **182, `CloseResponseV5`**. It uses:

- DCR1 (read-only);
- DRU1 (writable);
- the record executor (writable).

It returns all DRU1 lamports to the executor. If nobody calls it, settle (tag 131) drains a still-open DRU1 to the executor itself, so the rent is never stranded. Tag 182 refuses after settle because settle closes the DCR1 record.

## 10. Settle, resolve, and close

### Settle a challenge

Tag **131, `Settle` on a DCR1 v5 record** selects its route from DDT2. It always pays the record's bond to the ruling winner.

The built-in route is selected by a zero `settlement_program`. It uses exactly seven accounts, in this order:

1. DCR1 (writable);
2. the derived DRU1 PDA (writable);
3. ruling winner (writable);
4. record executor (writable);
5. `DCM2` (writable);
6. incinerator (writable);
7. record challenger (writable).

On the first settled challenger win, the built-in route treats the executor bond as the settlement pot. The winner receives `floor(pot × executor_reward_bps / 10,000)`, the loser receives zero, and the incinerator receives the exact remainder. Later challenger wins receive their record bond but do not divide the pot again. Settle also drains a live DRU1 to the executor and returns the closed DCR1 account's remaining rent to the record challenger.

A nonzero `settlement_program` selects the custom route. It uses those seven accounts followed by:

8. the committed settlement program (executable, read-only);
9. the escrow PDA `"dcg-hcl-settlement" | challenge` (writable);
10. DCR2 v5 (read-only);
11. system program (read-only).

Settle signs for the escrow PDA, moves the pot into it, and makes the exact BSS1 CPI. The callback must pay every escrow lamport, including any pre-funded amount, and cannot reduce the winner, loser, or incinerator below their starting balances. Its code chooses the payout allocation. Our example settlement program is deliberately untrusted: it splits the pot in half between winner and loser and gives the odd lamport to the winner.

After a challenger ruling, DCR1 bytes 170..178 hold `custom_settlement_deadline`; byte 178 holds the ruling cause. The deadline is zero for a zero program or an executor win. Before the deadline, tag 131 attempts only the custom route. At or after the deadline, it ignores the callback and uses the built-in payout as a fallback, with the eleven-account list still required. A failed CPI is atomic, so it can be retried until the deadline. A program key, account-list, escrow, or postcondition mismatch returns 798. DLE1 version 2 records route 1 for built-in, route 2 for custom, and route 3 for fallback. A settle that moves no pot reports route 1.

### Resolve the result

Tag **178, `ResolveResultV5`** uses `DCM2` and writable `DCR2`. Anyone may send it. It writes `REFUTED` when a challenger has won. Otherwise it writes `FINAL` only after the deadline, with no open challenge and every output attested.

### Close the document

Tag **172, `CloseDocumentV5`** uses:

- any signer;
- `DCM2`, `DPR2`, `DFS2`, and `DCR2` (writable);
- executor (writable).

After the allowed deadline with no open challenge, anyone may close. The executor receives every working-account lamport and any held executor bond. CloseDocumentV5 sets the DCR2 v5 retention start to the current slot and its deadline to `start + result_retention_slots`. DCR2 remains at the same address after close.

### Close the retained result

At or after `retention_deadline`, anyone may send tag **185, `CloseResultV6`**. It uses any signer, writable DCR2, and the writable executor. It replaces DCR2 v5 with a 96-byte DCRZ tombstone, destroys the outputs and bitmap, and returns every lamport above the tombstone's rent-exempt minimum to the executor. It refuses before the deadline, and no scheduler closes the result automatically. Consumers must reject DCRZ.

## What can go wrong

- **Wrong document accounts:** rebuild every PDA from the exact descriptor. A reused address is not a recovery plan.
- **Template refusal:** the exact `PT2S` is not approved, or a prior approval was revoked.
- **Registry or admission refusal:** the `DRP2` root or `DEA2` does not match the plan.
- **Terms refusal:** a mechanical DDT2 floor, cap, or settlement-program/window relation fails. Zero policy bonds are valid.
- **Run-binding refusal:** the request fields, executor, seed, output range, or output width differ.
- **Landing refusal:** roots are out of order, zero, past `P`, after finalization, or signed by another key.
- **Packet too large:** reduce the landing batch or use a v0 transaction with an address lookup table.
- **Output proof refusal:** the position is not landed or the proof does not reach its DPR2 root.
- **Round timeout:** the named party missed its phase deadline. Continue monitoring and settle after the ruling.
- **Settlement refusal:** a custom or fallback settle did not use the exact committed account list and escrow. Refusal 798 rolls back the attempt.
- **Response account growth:** a grow-only call returned early. Retry the verification instruction.
- **Pending result:** an output is missing, the challenge window is open, or a challenge remains open.
- **DCRZ result:** the retention deadline passed and tag 185 replaced DCR2. Consumers must reject the tombstone.
- **Response rent:** returned by tag 182 after a ruling, or by settle if 182 was skipped. Close the document after all challenges settle.

See the [generated reference](reference.md) for every builder-facing tag, account layout, address seed, event, and error.
