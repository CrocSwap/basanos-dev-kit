# DCG builder reference

Generated from `dcg-unified-v1.md` (spec: to be published), revision 6, dated 2026-09-24.

Specification SHA-256: `d6f3f92cbbd4dc49770ddccac2b0057c548661a80082592070b67f95d33f5b4a`

This page is generated from the unpublished protocol specification and should not be edited by hand.

The program address and SDK entry points are deployment placeholders. This reference describes wire and account mechanics, not model quality.

## Instruction tags

The unified-format allocation is parsed from specification §10. CloseResponseV5 is parsed from §7.4 because revision 6 added it there.

| Tag | Instruction | Builder role | Spec |
|---|---|---|---|
| 156 | `RegistryCreateV2` | Registry authority | §4.3 |
| 157 | `RegistryWriteV2` | Registry authority | §4.3 |
| 158 | `RegistryFreezeV2` | Registry authority | §4.3 |
| 159 | `AdmissionBeginV2` | Anyone | §5.2 |
| 160 | `AdmissionStepV2` | Anyone | §5.2 |
| 161 | `UnifiedInit` | Executor | §6.5 |
| 162 | `LandPositionRoots` | Executor | §6.6 |
| 163 | `RevealPositionV5` | Executor in a challenge | §7.5 |
| 164 | `SelectSegmentV5` | Challenger | §7.5 |
| 165 | `FinalizeDocumentV5` | Executor | §6.6 |
| 166 | `ChallengeLeafV5` | Challenger | §7.2 |
| 167 | `ChallengePositionV5` | Challenger | §7.5 |
| 168 | `RevealV5` | Executor | §7.2 |
| 169 | `DescendV5` | Challenger | §7.2 |
| 170 | `SummaryLeafChallenge` | Challenger | §8.3.5 |
| 171 | `ChallengeSummary` | Challenger | §8.3.5 |
| 172 | `CloseDocumentV5` | Anyone when close is allowed | §6.12 |
| 173 | `RevealFamilyTableV5` | Any signer | §7.7 |
| 174 | `ConfigInit` | Program upgrade authority | §16.1 |
| 175 | `ConfigSetAuthority` | Config admin; new admin also signs | §16.1 |
| 176 | `TemplateSeal` | Template-seal authority | §16.2 |
| 177 | `AttestOutputV5` | Anyone | §6.11 |
| 178 | `ResolveResultV5` | Anyone | §6.11 |
| 179 | `RevealSummaryV5` | Executor | §8.3.5 |
| 180 | `SelectSummaryV5` | Challenger | §8.3.5 |
| 181 | `AnswerSummaryV5` | Anyone | §8.3.5 |
| 182 | `CloseResponseV5` | Anyone after a DCR1 v5 ruling | §7.4 |

### Reused response and ruling tags

The unified specification reuses these existing tags for DCR1 v5. Tag 119 never applies to a v5 challenge.

| Tag | Instruction | Builder role | Spec |
|---|---|---|---|
| 115 | `BeginResponse` | Executor | §7.4 |
| 116 | `GrowResponse` | Executor | §7.4 |
| 117 | `WriteResponse` | Executor | §7.4 |
| 118 | `SealResponse` | Executor | §7.4 |
| 119 | `CancelPending` | No v5 path; refused | §7.4 |
| 120 | `VerifyTarget` | Executor | §7.4 |
| 121 | `VerifyReads` | Executor | §7.4 |
| 122 | `WeightsAnchor` | Executor | §7.4 |
| 123 | `WeightsRows` | Executor | §7.4 |
| 124 | `Execute` | Executor | §7.4 |
| 125 | `WriteResponseAt` | Executor | §7.4 |
| 126 | `RestageResponse` | Executor | §7.4 |
| 127 | `VerifyArtifacts` | Executor | §7.4 |
| 128 | `VerifyOutputs` | Executor | §7.4 |
| 129 | `VerifyRangeSlots` | Executor | §7.4 |
| 131 | `Settle` | Anyone after a ruling | §7.4 |
| 132 | `Timeout` | Anyone after a deadline | §7.4 |

### Existing PT2S setup tags

The unified specification starts from a sealed PT2S. These unchanged tags remain outside the v5 lifecycle.

| Tag | Instruction | Builder role | Spec |
|---|---|---|---|
| 140 | `BaseInit` | Plan uploader | §16.2 |
| 141 | `BaseUpload` | Plan uploader | §16.2 |
| 142 | `BaseSeal` | Plan uploader | §16.2 |
| 143 | `PT2SInit` | Plan uploader | §16.2 |
| 144 | `PT2SHash` | Plan uploader | §16.2 |
| 145 | `PT2SSeal` | Plan uploader | §16.2 |

## Account index

| Account | Status | Role | PDA seeds |
|---|---|---|---|
| `PT2S` | existing, unchanged (`pt2p_onchain.rs:29-45`) | sealed PT2P plan: base triple digests, `PWR1`, clause-12 v4, definition SHA-256 | caller account (not a PDA) |
| `DRP2` | new | frozen per-form registry, row version 2 | `"dcg-envelope-registry-pt2" \| EPOCH:u32 \| registry_id:u32` |
| `DEA2` | new | class-admission record | `"dcg-envelope-admission-v2" \| registry[32] \| PT2S[32] \| P:u32` |
| `DCM2` v5 | new version | document header, no manifest | `"dcg-hcl-document" \| descriptor` (unchanged seed) |
| `DPR2` v1 | unchanged layout | landed position roots (LandPositionRoots) | `"dcg-hcl-positions" \| descriptor` (unchanged) |
| `DFS2` | new (rev 2) | the DFS2 family slot table; no roots | `"dcg-hcl-family-slots" \| descriptor` |
| `DSR1` | not used by v5 | — | — |
| `DCR1` v5 | new version | ROOT_ONLY challenge record with convict | rev 4: `"dcg-unified-challenge" \| descriptor \| challenger \| nonce:u32`, 8,192 bytes, created by the opening instruction (rev 3: challenger-created, as v3/v4) |
| `DCR2` v4 | new version (rev 4; rev 3's v3 withdrawn) | the result record other programs read: status, proven outputs, request binding, every dispute term (§6.9) | `"dcg-hcl-result" \| descriptor` (unchanged seed), created by UnifiedInit |
| `DCF1` | new (rev 4) | program config: admin, registry-admission authority, template-seal authority (§16.1) | `"dcg-config"` |
| `DTA1` | new (rev 4) | template-seal approval of one sealed PT2S at one SHA-256 (§16.2) | `"dcg-template-seal" \| PT2S \| PT2S_sha256` |

## Account and wire layouts

The text blocks below are extracted from the normative specification.

### DCF1 configuration account

```text
  0  magic "DCF1"
  4  version:u16 = 1
  6  reserved:u16 = 0
  8  admin[32]                    rotates every role; zero = the config is frozen
 40  registry_authority[32]       signs tags 156-158; zero = no new registries
 72  template_seal_authority[32]  signs tag 176; zero = no new approvals or revocations
104  created_slot:u64
112  rotations:u32                successful ConfigSetAuthority count
116  reserved[12] = 0
128  end
```

### DTA1 template approval

```text
  0  magic "DTA1"
  4  version:u16 = 1
  6  state:u8           1 approved, 2 revoked
  7  zero:u8
  8  PT2S[32]
 40  PT2S_sha256[32]    SHA-256 of the whole sealed PT2S account data (as DEA2 104)
 72  sealer[32]         the template-seal authority that last wrote it
104  slot:u64
112  end
```

### DRP2 registry header

```text
  0  magic "DRP2"
  4  version:u16 = 2
  6  flags:u16            bit 0 frozen; other bits zero
  8  epoch:u32            = EPOCH (4 for the re-key image)
 12  registry_id:u32
 16  row_count:u32        1..=64
 20  rows_written:u32
 24  authority[32]        the compiled registry authority
 56  machine_name[64]     the image's machine name, NUL-padded: "basanos/qwen35-4b-a16/1" (Q12)
120  census_digest[32]    nonzero
152  table_root[32]       zero until frozen
184  zero[8]
192  rows[row_count][64]  strictly ascending by form_id
```

### DRP2 registry row

```text
  0  form_id:u16          nonzero; 0xF001 = RS1 summary pseudo-form
  2  respond_path:u8      0 none, 1 generic respond
  3  witness_kind:u8      0 routed, 1 DWW1 rows, 2 position-table row, 3 model tensors
  4  max_reads:u16
  6  max_writes:u16
  8  max_read_bytes:u32
 12  max_write_bytes:u32
 16  max_payload_bytes:u32
 20  execute_cu:u32       0 = unmeasured
 24  respond_cu:u32       0 = unmeasured
 28  measured_position:u32   provenance only
 32  measured_entry:u32      provenance only
 36  row_version:u8       = 2
 37  max_rs1_height:u8    0..=19
 38  reserved:u16 = 0
 40  max_range_slots:u32
 44  position_limit:u32   nonzero; instances need p < position_limit
 48  measured_positions:u32  provenance: P of the censused document
 52  reserved[12] = 0
```

### DEA2 class-admission record

```text
  0  magic "DEA2"
  4  version:u16 = 2
  6  flags:u16            bit 0 complete; other bits zero
  8  registry[32]         DRP2 address
 40  table_root[32]       the frozen DRP2 root at begin
 72  PT2S[32]
104  PT2S_sha256[32]      SHA-256 of the whole sealed PT2S account data
136  position_count:u32   P
140  base_classes:u32     B
144  generated_classes:u32  L · G
148  admitted:u32
152  n_max:u32
156  rs1_height:u8        H
157  zero[35]
192  bitmap, ⌈(B + L·G)/8⌉ bytes; bit i = class i admitted
```

### DPD2 descriptor preimage

```text
"basanos/dcg-unified-descriptor/3"        32 ASCII bytes (rev 4; /1 and /2 withdrawn unimplemented)
unified_version:u16 = 1
storage_mode:u8 = 1                       ROOT_ONLY (Q6)
commitment_version:u8 = 3                 §8
position_count:u32                        P
segment_count:u16                         1..=128 (rev 2)
family_count:u16                          F, 1..=24 (rev 2; was 1..=64)
rs1_height:u8                             H = ⌈log2 P⌉
pt2p_compiler_version:u8                  pinned profile of PWR1 (pt2p_compiler.py)
reserved:u16 = 0
total_entries:u64                         Σ_{p<P} entry_count(p)
dispute_terms[48]                         DDT1 (rev 3, §6.8): every dispute term of the run
run_binding[160]                          DRB1 (rev 4, §6.10): executor, request binding, seed, outputs
clause12_v4[43]                           the PT2S's (P, segment count, PWR1 digest)
definition_sha256[32]                     the PT2S's
base_digest[3][32]                        routes, geometry, payloads (= PWR1 bytes 40..136)
model_root[32]                            nonzero
position_table_root[32]                   nonzero
prompt_commitment[32]                     nonzero
registry_epoch:u32
registry[32]                              DRP2 address
registry_table_root[32]
dfs2_sha256[32]                           SHA-256 of the DFS2 body
```

### DCM2 v5 document header

```text
   0  magic "DCM2"
   4  version:u16 = 5
   6  flags:u16             1 armed, 2 finalized, 4 refuted, 8 closed, 16 ROOT_ONLY, 32 sealed;
                            16|32 always set; other bits zero
   8  descriptor[32]        DPD2 digest
  40  authority[32]         executor = init signer
  72  position_count:u32    P
  76  segment_count:u16
  78  reserved:u16 = 0
  80  reserved:u32 = 0      (v1 entries_per_position)
  84  positions_complete:u32 roots landed so far (LandPositionRoots)
  88  entries_complete:u64  0 until FinalizeDocumentV5 sets it to total_entries (rev 2)
  96  document_root[32]     final v3 prefix root; zero until finalized
 128  open_challenges:u32
 132  challenger_wins:u32  every ruling for a challenger, by any path (§7.9); rev 1–3 named it
                            refuted_positions (it counts rulings, so one position may count twice)
 136  finalize_slot:u64
 144  dispute_deadline:u64  LSD1 at FinalizeDocumentV5
 152  prefix_root[32]       v3 prefix root after positions_complete positions (batch end)
 184  challenge_window_slots:u64   = DDT1 bytes 8..16 (rev 3; LSD1 reads it here)
 192  total_entries:u64
 200  PT2S[32]
 232  PT2S_sha256[32]
 264  model_root[32]
 296  position_table_root[32]
 328  prompt_commitment[32]
 360  registry[32]          DRP2
 392  registry_table_root[32]
 424  DEA2[32]
 456  DFS2[32]              the DFS2 table account (rev 1: DFR1)
 488  family_table_digest[32]   zero until FinalizeDocumentV5; then SHA256(rs1-table | descriptor | F | roots)
 520  registry_epoch:u32
 524  family_count:u16
 526  rs1_height:u8
 527  commitment_version:u8 = 3
 528  peak_count:u8         0..=32
 529  executor_bond_state:u8   rev 3: 0 none (bond 0), 1 held, 2 paid on refutation, 3 returned at close
 530  reserved[6] = 0
 536  peaks[32] × 40        level:u8 | zero[3] | first:u32 | digest[32]; unused slots zero
1816  dispute_terms[48]     DDT1 (§6.8), written at init, never changed
1864  run_binding[160]      DRB1 (§6.10, rev 4), written at init, never changed; seed at 1,968
2024  end
```

### DFS2 family-slot account

```text
  0  magic "DFS2"
  4  version:u16 = 1
  6  flags:u16 = 0
  8  descriptor[32]
 40  family_count:u16   F, 1..=24
 42  rs1_height:u8      H
 43  zero:u8
 44  body_len:u32
 48  DFS2 body (§6.2)
```

### DDT1 dispute terms

```text
 0  magic "DDT1"
 4  version:u16 = 1
 6  reserved:u16 = 0
 8  challenge_window_slots:u64     a challenge may open until finalize_slot + this
16  response_window_slots:u64      every per-round deadline is phase-change slot + this
24  challenger_bond_lamports:u64   escrowed by each challenger at open; any value, 0 allowed
32  executor_bond_lamports:u64     escrowed by the executor at UnifiedInit; any value, 0 allowed
40  executor_reward_bps:u16        share of the executor bond paid to the challenger, 0..=10,000
42  reserved[6] = 0
48  end
```

### DCR2 v4 result record

```text
  0  magic "DCR2"               discriminator
  4  version:u16 = 4
  6  status:u8                  0 PENDING, 1 FINAL, 2 REFUTED, 3 SETTLED
  7  closed:u8                  1 once CloseDocumentV5 ran, else 0
  8  descriptor[32]
 40  document_root[32]          zero until FinalizeDocumentV5
 72  request_id[32]             DRB1; opaque to DCG (Tier C: the request account address)
104  consumer_digest[32]        DRB1; opaque to DCG (Tier C: SHA-256 of TRQ1)
136  executor[32]               the DCM2 authority
168  finalize_slot:u64          zero until FinalizeDocumentV5
176  dispute_deadline:u64       finalize_slot + challenge_window_slots
184  status_slot:u64            slot of the last status change; 0 while PENDING
192  challenger_wins:u32        DCM2 132 when the status was last set
196  output_count:u32           DRB1
200  output_first_position:u32  DRB1
204  outputs_attested:u32       popcount of the bitmap
208  output_width:u8            DRB1, 1..=32
209  zero[7]
216  dispute_terms[48]          DDT1, copied from DCM2 at init; immutable
264  outputs[output_count][output_width]   zero until attested
264 + count·width  attested bitmap, ⌈count/8⌉ bytes, LSB-first, write-once
```

### DRB1 run binding

```text
  0  magic "DRB1"
  4  version:u16 = 1
  6  reserved:u16 = 0
  8  executor[32]               must be the UnifiedInit signer (= DCM2 40)
 40  request_id[32]             opaque to DCG; zero = no consumer request
 72  consumer_digest[32]        opaque to DCG; zero exactly when request_id is zero
104  seed[32]                   committed random seed; zero = none (greedy)
136  output_first_position:u32
140  output_count:u32           ≥ 1
144  output_base_entry:u32      base (old) index o of the entry whose write is the output
148  output_write:u8            write ordinal of that entry
149  output_width:u8            1..=32 bytes per output
150  reserved[10] = 0
160  end
```

### SPP1 segment-to-position proof

```text
segment_ordinal:u16 | path_count:u8 | 0:u8 | segment_table_root[32] | sibling[path_count][32]
```

### DLE1 event header

```text
  0  magic "DLE1"
  4  version:u16 = 1
  6  kind:u8
  7  zero:u8
  8  descriptor[32]
 40  slot:u64            the Clock slot of the instruction
 48  body                fixed length per kind; 32-byte fields are keys or digests
                         (an output value is zero-padded); integers LE; pads zero
```

### TRQ1 Tier C request block

```text
  0  magic "TRQ1"
  4  version:u16 = 1
  6  sampler_form:u8          0 = greedy argmax committed by the template
  7  zero:u8
  8  request[32]              the request account = DRB1 request_id
 40  requester[32]
 72  nonce:u64
 80  prompt_token_count:u32
 84  max_new_tokens:u32       = DRB1 output_count
 88  prompt_commitment[32]    = DCM2 328
120  prompt_tokens_sha256[32] SHA-256 of the prompt ids, u32 LE each
152  tokenizer_sha256[32]     nonzero
184  sampling_params[32]      zero for sampler 0
216  seed[32]                 = DRB1 seed; zero for sampler 0
248  machine_id[32]           the Tier C machine (template, model, geometry)
280  dispute_terms[48]        = the document's DDT1
328  end
```

### DCR1 v5 revision regions

| bytes | phases | content |
|---|---|---|
| `176..178` `staged:u16`, `178..180` `segment_count:u16`, `180` `verified:u8`, `181..192` zero, `192..192+32S` roots | 7, 8 | position-reveal staging (§7.5); cleared by SelectSegmentV5 |
| `3072` `verified:u8`, `3073` zero, `3074..3076` `staged:u16`, `3076..3080` zero, `3080..3080+32F` roots | 1, 2 | family-table reveal, FTR (§7.7); ends at most at 3,848 |

### DPR2 v1 inherited layout

```text
  0  magic "DPR2"
  4  version:u16 = 1
  6  reserved:u16 = 0
  8  descriptor[32]
 40  position_count:u32
 44  positions_written:u32
 48  position_root[P][32]
```

### DRU1 inherited response layout

```text
  0  magic "DRU1"
  4  version:u16 = 1
  6  phase:u16             1 staging, 2 sealed
  8  challenge[32]
 40  executor[32]
 72  declared_total:u32
 76  cursor:u32
 80  body_sha256[32]
112  deadline:u64
120  reserved[8] = 0
128  body[declared_total]
```

DPR2 and DRU1 are inherited layouts. The unified specification does not change their wire versions.

## Derived addresses

All PDAs use the deployed DCG program unless the table says otherwise. Integer seeds are unsigned little-endian.

| Account | Seeds (program = the DCG program) |
|---|---|
| DCF1 | `"dcg-config"` |
| DRP2 | `"dcg-envelope-registry-pt2" \| EPOCH:u32 \| registry_id:u32` |
| DTA1 | `"dcg-template-seal" \| PT2S \| PT2S_sha256` |
| DEA2 | `"dcg-envelope-admission-v2" \| DRP2 \| PT2S \| P:u32` |
| DCM2 v5 | `"dcg-hcl-document" \| descriptor` |
| DPR2 | `"dcg-hcl-positions" \| descriptor` |
| DFS2 | `"dcg-hcl-family-slots" \| descriptor` |
| DCR2 v4 | `"dcg-hcl-result" \| descriptor` |
| DCR1 v5 | `"dcg-unified-challenge" \| descriptor \| challenger \| nonce:u32` (rev 4; created by 166, 167 and, rev 5, 171) |
| Tier C request | `"tco-request" \| requester \| nonce:u64` under the Tier C program (its address is the request id, §16.6) |
| DRU1 | `"dcg-hcl-response" \| challenge[32]` (§7.4) |
| ProgramData | upgradeable-loader PDA `[program_id]` (§16.1) |

Revision 6 permits a predictable account to hold lamports before creation. The creating instruction tops it up to rent. Existing data or a non-system owner still fails.

## Events

| kind | name | emitted by | body (bytes) |
|---|---|---|---|
| 1 | `init` | 161 | executor[32], request_id[32], position_count:u32, output_count:u32, executor_bond:u64 (80) |
| 2 | `land` | 162 | first:u32, count:u32, positions_complete:u32, zero:u32, prefix_root[32] (48) |
| 3 | `finalize` | 165 | document_root[32], family_table_digest[32], dispute_deadline:u64 (72) |
| 4 | `challenge_open` | 166, 167, 171 (rev 5) | challenge[32] (DCR1 address), challenger[32], position:u32 (171: the family index), challenge_kind:u8 (1 leaf, 2 position, 3 summary), zero[3], deadline:u64, bond:u64 (88) |
| 5 | `respond` | 163, 164, 168, 169, 173, the respond tags, 170, 179, 180, 181 (rev 5) | challenge[32], tag:u8, actor:u8 (1 executor, 2 challenger, 0 any signer: 181), phase_from:u8, phase_to:u8, zero:u32, deadline:u64 (48) |
| 6 | `ruling` | every RULE (§7.9): 166/168/169 convicts, the respond verdict (incl. 181), 132 | challenge[32], winner:u8, cause:u8, zero:u16, code:u32, challenger_wins:u32, zero:u32 (48) |
| 7 | `settle` | 131 | challenge[32], winner[32], bond_paid:u64, executor_reward:u64, executor_burned:u64 (88) |
| 8 | `close` | 172 | executor[32], refund:u64, executor_bond_returned:u64, result_status:u8, finalized:u8, zero[6] (56) |
| 9 | `output` | 177 | index:u32, outputs_attested:u32, position:u32, width:u8, zero[3], value[32] (48) |
| 10 | `resolve` | 178 | status:u8, zero[3], challenger_wins:u32, outputs_attested:u32, zero:u32 (16) |

Event rules:

- Account state is authoritative. Events are an index.
- Ignore events from failed transactions.
- Attribute `Program data:` through the invoke stack to the expected program.
- Refuse unknown versions, kinds, lengths, and nonzero padding.
- CloseResponseV5 (tag 182) emits no event; its lamport delta is the receipt.
- A transaction log can be truncated. Rebuild state from accounts.

## Refusal codes

### Unified-format codes parsed from the specification

| code | name | meaning |
|---|---|---|
| **785** | `PLAN_BINDING` | PT2S not sealed or not bound (keys, lengths, digests); clause-12 v4, PWR1 base digests, compiler version, `total_entries`, `P`, `n_max` or `H` differ from the recomputed values; DFS2 table invalid |
| **786** | `WITNESS_DOMAIN` | `position ≥ row.position_limit`, or a witness-kind-2 form at `position ≥ 32,768` |
| **787** | `RANGE_BOUND` | `range_slots > row.max_range_slots`, `rs1_height > row.max_rs1_height`, or `rs1_height > 19` |
| **788** | `APPEND_ORDER` | LandPositionRoots with `first ≠ positions_complete` (gap, overlap or replay; the v3 append is in position order) |
| **789** | `REVEAL_MISMATCH` | a revealed child set does not reproduce the landed commitment (position reveal vs DPR2, FTR vs DCM2 488, SPP1 table root ≠ derived), or a revealed child is zero |
| **790** | `REVEAL_ORDER` | a reveal chunk with `first` neither 0 nor the staged count, or past the child count |
| **791** | `DISPUTE_TERMS` | (rev 3) a DDT1 block is malformed (magic, version, length, reserved bytes) or fails a mechanical check of §6.8: challenge window 0 or over 2^62, response window below `ROUND_FLOOR_SLOTS` or over 2^62, reward share over 10,000 bps |
| **792** | `CONFIG_AUTHORITY` | (rev 4) DCF1 not the PDA, not system-owned with no data at init (revision 6: it may hold lamports, topped up, §7.1), or malformed; ConfigInit not signed by the ProgramData upgrade authority, or the program/ProgramData accounts do not match; a role instruction not signed by the role's current key (a zero key disables the role); a new admin that does not co-sign; any rotation of a frozen (zero-admin) config |
| **793** | `TEMPLATE_SEAL` | (rev 4) no DTA1 approval in state 1 for `(PT2S, SHA-256 of the PT2S data)`; TemplateSeal on a PT2S that is not sealed, or approve/revoke from the wrong state |
| **794** | `RUN_BINDING` | (rev 4) a DRB1 block is malformed or fails §6.10: executor ≠ signer, request id and consumer digest not both zero or both nonzero, outputs past `P`, width outside 1..=32, a retired, missing, T-scaled or range output write, or a width that differs from the write length, or a DCR2 over 10 MiB |
| **795** | `OUTPUT_PROOF` | (rev 4) AttestOutputV5: the output is already attested or the result is closed, the leaf's write row, the leaf path or the SPP1 does not reach the landed DPR2 root at the derived coordinate |
| **796** | `RESULT_STATE` | (rev 4) ResolveResultV5 when the status is not PENDING, the record is closed, or neither REFUTED nor FINAL holds yet; CloseDocumentV5 of an unrefuted finalized document with an output unattested |
| **797** | `SUMMARY_PRODUCER` | (rev 5) a summary slot answer's producer does not match the sealed slot: the DCL2 preimage is malformed or for another descriptor, its coordinate is not the derived `(q, segment, local)`, it has no write row `write_ordinal`, or that row is not `(region(f), q · stride(f), stride(f))` (§8.3.5) |

### Reused closure, DCR1, and ESL1 codes

| Code | Name | Meaning |
|---|---|---|
| 580 | `CL_MALFORMED` | Malformed instruction data or account encoding |
| 581 | `CL_COORDINATE` | Coordinate, position, segment, or index out of range |
| 582 | `CL_AUTHORITY` | Wrong signer or authority account |
| 583 | `CL_ROOT` | Required root is zero |
| 586 | `Path mismatch` | Merkle or summary path does not reach the committed root |
| 591 | `CL_MISSING` | Not all positions are landed |
| 592 | `CL_AFTER_FINAL` | Instruction is not allowed after finalization |
| 598 | `CL_OVERFLOW` | Checked integer or lamport arithmetic overflow |
| 599 | `CL_CLOSE` | Close state or timing is not allowed |
| 602 | `PT2P decode` | PT2P plan or clause decoding failed |
| 603 | `PT2P decode` | PWR1 or plan geometry decoding failed |
| 730 | `DCR1_BAD` | Challenge instruction data is malformed |
| 731 | `DCR1_AUTH` | Wrong signer, account, or binding |
| 733 | `DCR1_PHASE` | Challenge or account is in the wrong phase |
| 734 | `DCR1_PROOF` | Choice, slot, or proof index is invalid |
| 736 | `DCR1_DEADLINE` | Current slot is past the round deadline |
| 741 | `DCR1_INCOMPLETE` | Response is incomplete |
| 770 | `REGISTRY_ACCOUNT` | Registry account is not the expected PDA or state |
| 771 | `REGISTRY_AUTHORITY` | Wrong registry authority signer |
| 772 | `REGISTRY_STATE` | Registry, admission, or account state is wrong |
| 773 | `REGISTRY_EPOCH` | Registry epoch is wrong |
| 774 | `REGISTRY_ROOT` | Frozen registry root does not match |
| 775 | `ROW_MALFORMED` | Registry row is malformed or out of order |
| 776 | `ROW_CAPABILITY` | Registry row capability differs from the image |
| 777 | `FORM_ABSENT` | No registry row exists for the form |
| 778 | `WITHDRAW_ONLY` | Form has no generic respond path |
| 779 | `OVER_CU` | Execute or respond CU is unmeasured or over the limit |
| 780 | `SHAPE_BOUND` | Instance exceeds a registry row shape limit |
| 781 | `RESPOND_LIMIT` | Instance exceeds a compiled respond limit |
| 782 | `ADMISSION_STATE` | Admission record or account state is wrong |
| 783 | `ENVELOPE_CANCEL` | Envelope cancellation is not allowed |
| 784 | `TEMPLATE_BINDING` | Legacy template binding is invalid |
