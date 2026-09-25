# Watcher and challenger guide

A watcher checks a DCG document. A challenger opens a dispute when its independent result differs from the executor's commitment.

This guide follows **DCG unified document format v1, specification revision 6**. It is a testnet alpha. The current independent runner is reproducible on macOS only.

The normative specification (spec: to be published) defines why these checks are sound. This page gives the operational steps.

## 1. Derive and monitor the document

The descriptor is the SHA-256 digest of the committed DPD2 preimage. It binds the plan, registry, anchors, dispute terms, executor, request, seed, and output locator.

From the descriptor, derive:

- `DCM2` document account;
- `DPR2` position account;
- `DFS2` family-slot account;
- `DCR2` durable result;
- any `DCR1` challenge account from its descriptor, challenger, and nonce.

The exact seed strings are in the generated [reference](reference.md).

Watch:

| Account | Fields to read |
|---|---|
| `DCM2` | flags, `positions_complete`, `document_root`, `open_challenges`, `challenger_wins`, finalization and dispute slots |
| `DPR2` | each landed position root |
| `DCR2` | status, closed flag, request binding, output count, attested count, outputs, deadlines |
| `DCR1` | phase, winner, deadline, fixed position or family, and the current round |

Use account state as the source of truth. DLE1 logs are an index. Ignore events from failed transactions and recover missing events from accounts.

## 2. Recompute independently

Run the same supported plan off chain without trusting the executor's output. For every position, recompute:

1. entry leaves;
2. segment roots;
3. the segment-table root;
4. the position root.

The watcher must use the same sealed plan, model artifact, prompt, and integer machine rules. Agreement from one API endpoint is not enough.

Compare in this order:

1. all DPR2 position roots;
2. the family roots published in the finalization transaction;
3. the output values proven into DPR2;
4. the request binding and DDT1 in DCR2.

Save the first differing position and the first differing summary leaf for each family. The first difference helps choose the right challenge path.

## 3. Wait for the right opening time

A challenge may open only after finalization and no later than:

```text
dispute_deadline = finalize_slot + challenge_window_slots
```

The program requires `now <= dispute_deadline` for an opening instruction. A challenge already open may continue after the opening deadline.

Budget the chosen challenger bond. The program transfers it into the new DCR1 record when the bond is nonzero. Record rent is also paid by the challenger. A pre-funded record address is allowed in revision 6.

Each later phase change creates a new deadline:

```text
deadline = current_slot + response_window_slots
```

The challenger must answer challenger turns. A challenger that stops responding can lose its bond.

## 4. Choose a challenge path

### Direct leaf challenge: tag 166

Use tag **166, `ChallengeLeafV5`** when the executor published the position's segment roots and the watcher has a complete leaf proof.

It uses:

- DCR1 (writable);
- challenger (signer, writable);
- `DCM2` (writable), `DPR2`, and system program;
- `PT2S`, base routes, base geometry, `DRP2`, and `PT1S`.

The instruction creates the DCR1 PDA. The challenger chooses a `u32` nonce. The same challenger may use more than one nonce.

The proof contains the position, segment, local entry, leaf, leaf path, and SPP1 proof from the segment root to the landed position root. A wrong coordinate or proof refuses.

A direct challenge fixes the entry immediately. If the class check convicts, the challenger wins in that instruction. Otherwise the executor must answer.

### Position challenge: tag 167

Use tag **167, `ChallengePositionV5`** when the executor did not publish usable segment roots, or when following the position reveal is the better path.

It uses:

- DCR1 (writable);
- challenger (signer, writable);
- `DCM2` (writable) and `DPR2`;
- system program;
- `PT2S`, base routes, base geometry, and `DRP2`.

It creates a DCR1 PDA in phase 7. The position must be below `P`. The response length must be from 1 through 1 MiB, but the executor's later DRU1 length governs an honest response.

The challenger must not wait for this step. The executor must reveal the position's segment roots before the phase-7 deadline.

### Summary challenge: tag 171

Use tag **171, `ChallengeSummary`** when a published family root differs and the ordering rule selects that family.

It uses:

- DCR1 (writable);
- challenger (signer, writable);
- `DCM2` (writable), `DFS2`, `PT2S`, and system program.

The open carries the whole family-root table. The program checks its digest against DCM2 before creating the record. Phase 9 starts.

Do not compare only family roots. A self-consistent but false position root can make a summary challenge lose. The specification's corrected ordering compares the earliest differing summary leaf with the earliest differing landed position. Follow specification §8.3.7 (spec: to be published) for that rule.

## 5. Progress a direct challenge

A direct challenge normally leaves the next turn to the executor. Watch its DCR1 phase and deadline.

If the executor does not finish, anyone may send tag **132, `Timeout`**. It uses DCR1 (writable) and `DCM2` (writable). It rules according to the phase.

Do not submit an early timeout. A deadline refusal returns code 736 and changes nothing.

## 6. Progress a position challenge

The normal order is:

```text
challenger opens 167
executor reveals 163
challenger selects 164
executor/challenger alternate 168/169
```

### Select the segment

After the executor's last reveal chunk verifies the landed position root, send tag **164, `SelectSegmentV5`**. It uses:

- DCR1 (writable);
- challenger (signer);
- `DCM2`, `PT2S`, base routes, and base geometry.

Choose the segment whose root differs from the watcher's result. An out-of-range ordinal returns 734.

### Descend

Alternate:

- tag **168, `RevealV5`**: executor signs;
- tag **169, `DescendV5`**: challenger signs.

Each round narrows the segment to one entry. The program derives the path height, entry count, and coordinate. A caller cannot supply a shorter or longer path.

At the challenger's final descent, the account list also includes the registry, PT1S, plan routes, and plan geometry. A fix-point either admits the entry or convicts the executor for a class-check code.

After a selection, the challenger must keep acting before each challenger deadline.

## 7. Progress a summary challenge

The normal order is:

```text
challenger opens 171
executor reveals 179
challenger selects 180
repeat until a leaf is fixed
anyone answers slots with 181
```

### Select a descendant

In phase 10, send tag **180, `SelectSummaryV5`**. It uses DCR1 (writable), challenger (signer), and `DCM2`.

Choose among the descendants posted by the executor. The choice becomes the next subtree.

### Fix a leaf directly

The challenger may skip the descent with tag **170, `SummaryLeafChallenge`** in phase 9 or 10. It uses DCR1 (writable), challenger (signer), and `DCM2`.

The instruction carries the leaf index, claimed leaf, and its family-tree path. The path must fold to the published family root.

### Answer a fixed leaf

Tag **181, `AnswerSummaryV5`** is permissionless. It uses:

- DCR1 (writable);
- any signer;
- `DCM2` (writable), `DPR2`, `DFS2`, `PT2S`, base routes, and base geometry.

Each answer proves one DFS2 slot write through its segment root to the landed position root. When all slots are answered, the program compares the derived summary leaf with the claimed leaf and rules.

## 8. Finish every open challenge

### Rule a timeout

Tag **132, `Timeout`** uses DCR1 (writable) and `DCM2` (writable). The phase decides which side wins. The instruction also updates the challenger-win counter when the challenger wins.

### Return response rent

If a ruled challenge has a DRU1 response account, anyone may send tag **182, `CloseResponseV5`** before settle. It uses DCR1, DRU1 (writable), and the record executor (writable). Settle takes the same DRU1 and executor accounts and returns any rent still in DRU1, so skipping 182 strands nothing.

Do this after the ruling event and before tag 131. It returns the DRU1 rent to the executor.

### Settle

Tag **131, `Settle`** uses:

- DCR1 (writable);
- ruling winner (writable);
- `DCM2` (writable);
- incinerator (writable);
- record challenger (writable).

Read the winner from DCR1. Settle pays the challenger bond to the winner. On the first settled challenger win, it also pays the configured executor-bond reward and burns the rest. It then closes the record and returns its remaining rent to the record challenger.

### Resolve

After all challenges settle, anyone may send tag **178, `ResolveResultV5`** when the result conditions are met. It uses `DCM2` and writable `DCR2`.

### Close

After the deadline with no open challenge, anyone may send tag **172, `CloseDocumentV5`**. It returns document rent to the executor. It does not delete DCR2.

## Common failures

| Code | Meaning in a builder flow |
|---:|---|
| 581 | The position, segment, coordinate, or index is out of range. |
| 582 | The signer or executor account is wrong. |
| 583 | A required root is zero. |
| 586 | A leaf or summary path does not reach its root. |
| 730 | Instruction data is malformed or truncated. |
| 731 | Wrong signer, account, or record state. |
| 733 | The record or account is in the wrong phase. |
| 734 | A segment, choice, slot, or output index is out of range. |
| 736 | The current slot is past the round deadline. |
| 741 | A range response is incomplete or lacks a verified family-table reveal. |
| 789 | A revealed child set or SPP1 proof does not match the landed commitment. |
| 790 | A reveal chunk is out of order. |
| 795 | An output proof does not reach the landed root. |
| 796 | The result is not ready to resolve or close. |
| 797 | A summary slot proof names the wrong producer write. |

A refusal does not change state. Rebuild the transaction from the current account values before retrying.

## Watcher safety notes

- Use a unique DCR1 nonce for every challenge.
- Fund the challenger and fee payer before opening.
- Do not challenge from the executor address.
- Recompute the same fixed machine, not a different backend.
- Save the finalization transaction because it publishes the family roots.
- Use account readback after every ruling and settlement.
- On macOS, retain the exact plan, model artifact, image, and receipts used for recomputation.
- Do not treat a missing log as a failed state transition.

See the [generated reference](reference.md) for exact account layouts, address seeds, events, and all refusal codes.
