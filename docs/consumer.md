# Consumer guide

A consumer reads a DCG result and decides whether it belongs to its request. A consumer does not need to run the executor or join a challenge.

This guide follows **DCG unified document format v1, specification revision 6**. It is a testnet alpha. The program address and result-reader SDK are placeholders in the [quickstart](quickstart.md).

## 1. Find the result account

DCG results are durable DCR2 v4 accounts. Each address is derived from the document descriptor:

```text
DCR2 = PDA("dcg-hcl-result", descriptor)
```

If a Tier C request allows several executors, each executor has a different descriptor and DCR2 account. The request or Tier C bind policy chooses which bound result to fulfil.

Do not use a transaction index, display label, or executor-provided URL as the result identity.

## 2. Check the account

Before decoding, verify:

- the account owner is the deployed re-key DCG program;
- the data starts with `DCR2` version 4;
- the data length is exactly:

```text
264 + output_count × output_width + ceil(output_count / 8)
```

- the account data has no trailing bytes;
- the descriptor matches the bound document;
- the request ID and consumer digest match the request.

A closed document drains DCM2, DPR2, and DFS2. It does not drain DCR2. A consumer should normally read only DCR2 after close.

## 3. Check the request binding

Recompute the Tier C `TRQ1` block from the request policy:

```text
consumer_digest = SHA256("basanos/tierc-request/1" || TRQ1)
```

Then compare:

| DCR2 field | Required value |
|---|---|
| `request_id` | Tier C request account address |
| `consumer_digest` | Recomputed digest |
| `executor` | The executor selected by the bind or fulfil policy |
| `output_count` | Request's `max_new_tokens` |
| `output_width` | The tokenizer output format committed by the plan |
| `dispute_terms` | The request's DDT1 |

The descriptor is the hash of the full DPD2 preimage. Recompute it when the consumer has the sealed plan, registry, model anchors, prompt commitment, DDT1, and DRB1. A matching request ID alone is not enough.

If the request is a direct DCG run with no consumer, both request ID and consumer digest are zero. Do not apply the Tier C checks to that record.

## 4. Check status and time

A consumer may use outputs only when DCR2 status is:

- `FINAL`: the document passed the challenge window with every output proven; or
- `SETTLED`: such a final document was later closed.

Do not use `PENDING` or `REFUTED`.

For `FINAL` or `SETTLED`, read these fields:

| Field | Check |
|---|---|
| `closed` | `0` or `1`; both are readable. |
| `document_root` | Nonzero. |
| `finalize_slot` | Nonzero. |
| `dispute_deadline` | Nonzero. |
| `open_challenges` | Read from DCM2 before close, or trust `FINAL`/`SETTLED` after close. |
| `outputs_attested` | Exactly `output_count`. |
| attested bitmap | Every output bit is set. |

The result may still read `PENDING` just after a challenger wins. The ruling changes DCM2 at once, but DCR2 changes on the next resolve or close. `PENDING` is never usable, so this delay is safe.

The application request may have its own deadline. That deadline does not turn a `PENDING` or `REFUTED` DCG record into a final result.

## 5. Read and decode outputs

Read exactly `output_count` values of `output_width` bytes each. The attested bitmap records which values DCG proved against landed position roots.

For the current Tier C token plan, `output_width` is 16 bytes. Each value is:

```text
token_id: i64 little-endian
logit:    i64 little-endian
```

Check:

- every expected bit is set;
- every token ID is nonnegative;
- every token ID is below the committed tokenizer vocabulary;
- output positions match the prompt and sampler policy;
- no bytes are read beyond the fixed result header, output area, and bitmap.

Keep the raw bytes with the application receipt. A consumer callback should use the decoded value tied to the exact DCR2 account and request.

## 6. Use the result

A consumer may:

- run its callback;
- fulfill the Tier C request;
- compare the result with another permitted executor;
- store the DCR2 address, descriptor, request, document root, and status as evidence.

A consumer must not:

- treat `PENDING` as a fallback answer;
- use `REFUTED` outputs;
- use a result whose request binding differs;
- infer success from a DLE1 event without reading DCR2;
- use executor-provided output bytes instead of the DCR2 output area.

## 7. Optional permissionless actions

A consumer does not need these actions to read a result. It may help complete or clean up the lifecycle.

### Prove a missing output

Tag **177, `AttestOutputV5`** uses:

- any signer;
- `DCM2` and `DPR2`;
- `DCR2` (writable);
- `PT2S`, base routes, and base geometry.

The position must already be landed. The proof must reach the DPR2 root at the coordinate derived from the plan.

### Resolve the status

Tag **178, `ResolveResultV5`** uses `DCM2` and writable `DCR2`.

It can write `REFUTED` after a challenger win. It writes `FINAL` only when the document passed its deadline, has no open challenge, and has every output attested.

### Close the document

Tag **172, `CloseDocumentV5`** uses:

- any signer;
- `DCM2`, `DPR2`, `DFS2`, and `DCR2` (writable);
- executor (writable).

For a finalized, unrefuted document, every output must be attested. A refuted document may close. Closing returns document rent to the executor and keeps DCR2.

## Deadlines

| Deadline | Consumer action |
|---|---|
| Tier C request deadline | Follow the application request policy. It does not define DCG finality. |
| DCG challenge deadline | Wait for a usable DCR2 status; do not infer finality from elapsed time alone. |
| Response-round deadlines | Watch only if acting as a watcher or challenger. A consumer can wait. |

A consumer can read a closed `SETTLED` result at any later time. The record is designed to remain.

## What can go wrong

- **Wrong program or version:** another account can imitate the `DCR2` prefix. Check owner, version, exact length, and descriptor.
- **Wrong request:** the request ID, consumer digest, executor, output count, or DDT1 differs.
- **Pending result:** the deadline has not passed, a challenge is open, or outputs are missing.
- **Refuted result:** at least one challenger won. Do not use it.
- **Missing bitmap bit:** the output area is not usable yet.
- **Wrong token decode:** the output width or tokenizer policy does not match the request.
- **Multiple bound results:** Tier C policy, not DCG, chooses which executor to pay or fulfil.
- **DCM2 is gone:** this is normal after document close. Use the durable DCR2 record.
- **Event says resolve but state does not:** the transaction may have failed. Read the account again.
- **Old SDK layout:** revision 6 uses DCR2 v4. Reject v2 and v3 records on this interface.

See the [generated reference](reference.md) for exact DCR2 fields, address seeds, tags, events, and errors.
