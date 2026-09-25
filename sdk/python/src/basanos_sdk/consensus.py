"""Standalone DCG unified-format byte and address mirror.

This module is intentionally independent of the research package.  It contains
the public-input address rules and the consensus byte layouts needed by the
SDK: dispute terms, run bindings, descriptor fields, document and result
records, event records, output attestations, and position proofs.
"""
from __future__ import annotations

import hashlib
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

from solders.pubkey import Pubkey

SPEC_REVISION = 6
SYSTEM_PROGRAM = Pubkey.from_string("11111111111111111111111111111111")
COMPUTE_BUDGET_PROGRAM = Pubkey.from_string("ComputeBudget111111111111111111111111111111")
UPGRADEABLE_LOADER = Pubkey.from_string("BPFLoaderUpgradeab1e11111111111111111111111")
INCINERATOR = Pubkey.from_string("1nc1nerator11111111111111111111111111111111")

EPOCH = 4
REGISTRY_VERSION = 2
ROW_VERSION = 2
ROW_BYTES = 64
REGISTRY_HEADER = 192
MAX_ROWS = 64
REGISTRY_SEED = b"dcg-envelope-registry-pt2"
ADMISSION_SEED = b"dcg-envelope-admission-v2"
FAMILY_SLOTS_SEED = b"dcg-hcl-family-slots"
DOCUMENT_SEED = b"dcg-hcl-document"
POSITIONS_SEED = b"dcg-hcl-positions"
RESULT_SEED = b"dcg-hcl-result"
CONFIG_SEED = b"dcg-config"
TEMPLATE_SEAL_SEED = b"dcg-template-seal"
CHALLENGE_SEED = b"dcg-unified-challenge"
RESPONSE_SEED = b"dcg-hcl-response"
ROOT_DOMAIN = b"basanos/dcg-envelope-seal-registry/2"
DESCRIPTOR_DOMAIN = b"basanos/dcg-unified-descriptor/3"
FAMILY_TABLE_DOMAIN = b"basanos/dcg-rs1-table/1"
UNIFIED_VERSION = 1
STORAGE_ROOT_ONLY = 1
COMMITMENT_VERSION = 3
MACHINE_NAME = b"basanos/qwen35-4b-a16/1"
MAX_FAMILIES = 24
MAX_SEGMENTS = 128
MAX_RS1_HEIGHT = 19
MAX_RANGE_SLOTS = 64
MAX_OUTPUT_WIDTH = 32
MAX_ACCOUNT_BYTES = 10_485_760
PACKET_BYTES = 1_232
JSON_RPC_BODY_LIMIT = 50 * 1024
TERMS_BYTES = 48
BINDING_BYTES = 160
WINDOW_CAP = 1 << 62
BPS_DENOMINATOR = 10_000

REGISTRY_ACCOUNT, REGISTRY_AUTHORITY, REGISTRY_STATE, REGISTRY_EPOCH = 770, 771, 772, 773
REGISTRY_ROOT, ROW_MALFORMED, ROW_CAPABILITY, FORM_ABSENT = 774, 775, 776, 777
WITHDRAW_ONLY, OVER_CU, SHAPE_BOUND, RESPOND_LIMIT = 778, 779, 780, 781
ADMISSION_STATE, ENVELOPE_CANCEL, TEMPLATE_BINDING = 782, 783, 784
PLAN_BINDING = 785
WITNESS_DOMAIN = 786
RANGE_BOUND = 787
APPEND_ORDER = 788
REVEAL_MISMATCH = 789
REVEAL_ORDER = 790
DISPUTE_TERMS = 791
CONFIG_AUTHORITY = 792
TEMPLATE_SEAL = 793
RUN_BINDING = 794
OUTPUT_PROOF = 795
RESULT_STATE = 796
SUMMARY_PRODUCER = 797
CL_MALFORMED, CL_COORDINATE, CL_AUTHORITY, CL_ROOT = 580, 581, 582, 583
CL_MISSING, CL_AFTER_FINAL = 591, 592
CL_OVERFLOW, CL_CLOSE = 598, 599
DCR1_BAD, DCR1_AUTH, DCR1_PHASE, DCR1_PROOF, DCR1_DEADLINE = 730, 731, 733, 734, 736

TAGS = {
    156: "RegistryCreateV2",
    157: "RegistryWriteV2",
    158: "RegistryFreezeV2",
    159: "AdmissionBeginV2",
    160: "AdmissionStepV2",
    161: "UnifiedInit",
    162: "LandPositionRoots",
    163: "RevealPositionV5",
    164: "SelectSegmentV5",
    165: "FinalizeDocumentV5",
    166: "ChallengeLeafV5",
    167: "ChallengePositionV5",
    168: "RevealV5",
    169: "DescendV5",
    170: "SummaryLeafChallenge",
    171: "ChallengeSummary",
    172: "CloseDocumentV5",
    173: "RevealFamilyTableV5",
    174: "ConfigInit",
    175: "ConfigSetAuthority",
    176: "TemplateSeal",
    177: "AttestOutputV5",
    178: "ResolveResultV5",
    179: "RevealSummaryV5",
    180: "SelectSummaryV5",
    181: "AnswerSummaryV5",
    182: "CloseResponseV5",
}
TAG_REGISTRY_CREATE = 156
TAG_REGISTRY_WRITE = 157
TAG_REGISTRY_FREEZE = 158
TAG_ADMISSION_BEGIN = 159
TAG_ADMISSION_STEP = 160
TAG_UNIFIED_INIT = 161
TAG_LAND_POSITION_ROOTS = 162
TAG_REVEAL_POSITION = 163
TAG_SELECT_SEGMENT = 164
TAG_FINALIZE_DOCUMENT = 165
TAG_CHALLENGE_LEAF = 166
TAG_CHALLENGE_POSITION = 167
TAG_REVEAL = 168
TAG_DESCEND = 169
TAG_SUMMARY_LEAF = 170
TAG_CHALLENGE_SUMMARY = 171
TAG_CLOSE_DOCUMENT = 172
TAG_REVEAL_FAMILY_TABLE = 173
TAG_CONFIG_INIT = 174
TAG_CONFIG_SET = 175
TAG_TEMPLATE_SEAL = 176
TAG_ATTEST_OUTPUT = 177
TAG_RESOLVE_RESULT = 178
TAG_REVEAL_SUMMARY = 179
TAG_SELECT_SUMMARY = 180
TAG_ANSWER_SUMMARY = 181
TAG_CLOSE_RESPONSE = 182

DCM2_V5_HEADER = 2_024
DCM2_TERMS_AT = 1_816
DCM2_BINDING_AT = 1_864
DCM2_HEADER = 536
PEAK_SLOTS = 32
PEAK_BYTES = 40
DPR2_HEADER = 48
DCR1_BYTES = 8_192
DCR1_VERSION = 5
RESULT_VERSION = 4
RESULT_HEADER = 264
RESULT_TERMS_AT = 216
STATUS_PENDING, STATUS_FINAL, STATUS_REFUTED, STATUS_SETTLED = 0, 1, 2, 3
USABLE_STATUSES = frozenset({STATUS_FINAL, STATUS_SETTLED})
FLAG_ARMED, FLAG_FINAL, FLAG_REFUTED, FLAG_CLOSED, FLAG_ROOT_ONLY, FLAG_SEALED = 1, 2, 4, 8, 16, 32
BOND_NONE, BOND_HELD, BOND_PAID, BOND_RETURNED = 0, 1, 2, 3
PHASE_RESPOND, PHASE_SEALED, PHASE_RULED, PHASE_SETTLED = 1, 2, 3, 4
PHASE_REVEAL, PHASE_DESCEND, PHASE_POSITION_REVEAL, PHASE_SELECT = 5, 6, 7, 8
WINNER_EXECUTOR, WINNER_CHALLENGER = 1, 2
EVENT_MAGIC = b"DLE1"
EVENT_VERSION = 1
EVENT_HEADER = 48
EVENT_SCHEMA = {
    1: ("init", [("executor", 32), ("request_id", 32), ("position_count", 4), ("output_count", 4),
                  ("executor_bond", 8)]),
    2: ("land", [("first", 4), ("count", 4), ("positions_complete", 4), (None, 4), ("prefix_root", 32)]),
    3: ("finalize", [("document_root", 32), ("family_table_digest", 32), ("dispute_deadline", 8)]),
    4: ("challenge_open", [("challenge", 32), ("challenger", 32), ("position", 4),
                             ("challenge_kind", 1), (None, 3), ("deadline", 8), ("bond", 8)]),
    5: ("respond", [("challenge", 32), ("tag", 1), ("actor", 1), ("phase_from", 1), ("phase_to", 1),
                     (None, 4), ("deadline", 8)]),
    6: ("ruling", [("challenge", 32), ("winner", 1), ("cause", 1), (None, 2), ("code", 4),
                     ("challenger_wins", 4), (None, 4)]),
    7: ("settle", [("challenge", 32), ("winner", 32), ("bond_paid", 8), ("executor_reward", 8),
                    ("executor_burned", 8)]),
    8: ("close", [("executor", 32), ("refund", 8), ("executor_bond_returned", 8), ("result_status", 1),
                    ("finalized", 1), (None, 6)]),
    9: ("output", [("index", 4), ("outputs_attested", 4), ("position", 4), ("width", 1), (None, 3),
                     ("value", 32)]),
    10: ("resolve", [("status", 1), (None, 3), ("challenger_wins", 4), ("outputs_attested", 4), (None, 4)]),
}
EVENT_KINDS = {name: kind for kind, (name, _) in EVENT_SCHEMA.items()}


class Refusal(ValueError):
    """A local validation refusal carrying the program's custom code."""

    def __init__(self, code: int, message: str = ""):
        super().__init__(f"{code} {message}".strip())
        self.code = code


def uint(value: int, width: int) -> bytes:
    if not isinstance(value, int) or isinstance(value, bool) or not 0 <= value < 1 << (8 * width):
        raise ValueError(f"u{width * 8} overflow")
    return value.to_bytes(width, "little")


def digest(value: bytes, name: str = "digest") -> bytes:
    value = bytes(value)
    if len(value) != 32:
        raise ValueError(f"{name} must be 32 bytes")
    return value


def key_bytes(value: Pubkey | str | bytes | bytearray) -> bytes:
    if isinstance(value, Pubkey):
        return bytes(value)
    if isinstance(value, str):
        return bytes(Pubkey.from_string(value))
    if isinstance(value, (bytes, bytearray)):
        value = bytes(value)
        if len(value) != 32:
            raise ValueError("public key must be 32 bytes")
        return value
    raise TypeError("expected a public key, base58 string, or 32 bytes")


def key(value: Pubkey | str | bytes | bytearray) -> Pubkey:
    return Pubkey.from_bytes(key_bytes(value))


def b58(value: Pubkey | str | bytes | bytearray) -> str:
    return str(key(value))


def sha256(*parts: bytes) -> bytes:
    return hashlib.sha256(b"".join(parts)).digest()


def pda(program: Pubkey | str | bytes | bytearray, *seeds: bytes) -> tuple[bytes, int]:
    address, bump = Pubkey.find_program_address([bytes(seed) for seed in seeds], key(program))
    return bytes(address), bump


@dataclass(frozen=True)
class AddressBook:
    """The public-input account map for one document and its optional callers."""

    program: bytes
    config: tuple[bytes, int]
    programdata: tuple[bytes, int]
    registry: tuple[bytes, int] | None = None
    template_seal: tuple[bytes, int] | None = None
    admission: tuple[bytes, int] | None = None
    document: tuple[bytes, int] | None = None
    positions: tuple[bytes, int] | None = None
    family_slots: tuple[bytes, int] | None = None
    result: tuple[bytes, int] | None = None
    challenge: tuple[bytes, int] | None = None
    response: tuple[bytes, int] | None = None

    def as_dict(self) -> dict[str, tuple[bytes, int]]:
        out = {"config": self.config, "programdata": self.programdata}
        for name in ("registry", "template_seal", "admission", "document", "positions", "family_slots", "result", "challenge", "response"):
            value = getattr(self, name)
            if value is not None:
                out[name] = value
        return out

    def key(self, name: str) -> Pubkey:
        value = self.as_dict().get(name)
        if value is None:
            raise KeyError(name)
        return Pubkey.from_bytes(value[0])


def addresses(program: Pubkey | str | bytes | bytearray, *, descriptor: bytes | None = None,
              pt2s: bytes | None = None, pt2s_sha256: bytes | None = None,
              challenger: Pubkey | str | bytes | bytearray | None = None, nonce: int = 0,
              registry_id: int | None = None, registry: bytes | None = None,
              position_count: int | None = None) -> AddressBook:
    """Derive every DCG account address from public inputs."""
    program_key = key_bytes(program)
    out = AddressBook(program_key, pda(program_key, CONFIG_SEED), pda(UPGRADEABLE_LOADER, program_key))
    values = out.as_dict()
    if registry_id is not None:
        values["registry"] = pda(program_key, REGISTRY_SEED, uint(EPOCH, 4), uint(registry_id, 4))
    if pt2s is not None and pt2s_sha256 is not None:
        values["template_seal"] = pda(program_key, TEMPLATE_SEAL_SEED, digest(pt2s), digest(pt2s_sha256))
    if registry is not None and pt2s is not None and position_count is not None:
        values["admission"] = pda(program_key, ADMISSION_SEED, digest(registry), digest(pt2s), uint(position_count, 4))
    if descriptor is not None:
        descriptor = digest(descriptor, "descriptor")
        values["document"] = pda(program_key, DOCUMENT_SEED, descriptor)
        values["positions"] = pda(program_key, POSITIONS_SEED, descriptor)
        values["family_slots"] = pda(program_key, FAMILY_SLOTS_SEED, descriptor)
        values["result"] = pda(program_key, RESULT_SEED, descriptor)
        if challenger is not None:
            values["challenge"] = pda(program_key, CHALLENGE_SEED, descriptor, key_bytes(challenger), uint(nonce, 4))
            values["response"] = pda(program_key, RESPONSE_SEED, values["challenge"][0])
    return AddressBook(program_key, values["config"], values["programdata"], values.get("registry"),
                       values.get("template_seal"), values.get("admission"), values.get("document"),
                       values.get("positions"), values.get("family_slots"), values.get("result"),
                       values.get("challenge"), values.get("response"))


derive_addresses = addresses


@dataclass(frozen=True)
class DisputeTerms:
    challenge_window_slots: int
    response_window_slots: int
    challenger_bond_lamports: int
    executor_bond_lamports: int
    executor_reward_bps: int

    def encode(self) -> bytes:
        if check_dispute_terms(self) != 0:
            raise Refusal(DISPUTE_TERMS)
        out = b"DDT1" + uint(1, 2) + bytes(2) + uint(self.challenge_window_slots, 8)
        out += uint(self.response_window_slots, 8) + uint(self.challenger_bond_lamports, 8)
        out += uint(self.executor_bond_lamports, 8) + uint(self.executor_reward_bps, 2) + bytes(6)
        if len(out) != TERMS_BYTES:
            raise AssertionError("terms length")
        return out

    @classmethod
    def decode(cls, raw: bytes) -> DisputeTerms:
        raw = bytes(raw)
        if (len(raw) != TERMS_BYTES or raw[:4] != b"DDT1" or raw[4:6] != b"\x01\x00"
                or raw[6:8] != bytes(2) or raw[42:48] != bytes(6)):
            raise Refusal(DISPUTE_TERMS)
        result = cls(int.from_bytes(raw[8:16], "little"), int.from_bytes(raw[16:24], "little"),
                     int.from_bytes(raw[24:32], "little"), int.from_bytes(raw[32:40], "little"),
                     int.from_bytes(raw[40:42], "little"))
        if check_dispute_terms(result) != 0:
            raise Refusal(DISPUTE_TERMS)
        return result


def check_dispute_terms(terms: DisputeTerms, round_floor_slots: int = 1) -> int:
    if round_floor_slots < 1:
        raise ValueError("round floor")
    if not (1 <= terms.challenge_window_slots <= WINDOW_CAP
            and round_floor_slots <= terms.response_window_slots <= WINDOW_CAP
            and 0 <= terms.challenger_bond_lamports < 1 << 64
            and 0 <= terms.executor_bond_lamports < 1 << 64
            and 0 <= terms.executor_reward_bps <= BPS_DENOMINATOR):
        return DISPUTE_TERMS
    return 0


@dataclass(frozen=True)
class RunBinding:
    executor: bytes
    request_id: bytes
    consumer_digest: bytes
    seed: bytes
    output_first_position: int
    output_count: int
    output_base_entry: int
    output_write: int
    output_width: int

    def encode(self) -> bytes:
        if check_run_binding(self) != 0:
            raise Refusal(RUN_BINDING)
        out = b"DRB1" + uint(1, 2) + bytes(2) + digest(self.executor) + digest(self.request_id)
        out += digest(self.consumer_digest) + digest(self.seed) + uint(self.output_first_position, 4)
        out += uint(self.output_count, 4) + uint(self.output_base_entry, 4) + uint(self.output_write, 1)
        out += uint(self.output_width, 1) + bytes(10)
        if len(out) != BINDING_BYTES:
            raise AssertionError("binding length")
        return out

    @classmethod
    def decode(cls, raw: bytes) -> RunBinding:
        raw = bytes(raw)
        if (len(raw) != BINDING_BYTES or raw[:4] != b"DRB1" or raw[4:6] != b"\x01\x00"
                or raw[6:8] != bytes(2) or raw[150:160] != bytes(10)):
            raise Refusal(RUN_BINDING)
        result = cls(raw[8:40], raw[40:72], raw[72:104], raw[104:136], int.from_bytes(raw[136:140], "little"),
                     int.from_bytes(raw[140:144], "little"), int.from_bytes(raw[144:148], "little"),
                     raw[148], raw[149])
        if check_run_binding(result) != 0:
            raise Refusal(RUN_BINDING)
        return result


def result_bytes(output_count: int, output_width: int) -> int:
    return RESULT_HEADER + output_count * output_width + (output_count + 7) // 8


def check_run_binding(binding: RunBinding, *, position_count: int | None = None,
                      signer: bytes | None = None) -> int:
    zero = bytes(32)
    valid = (len(binding.executor) == len(binding.request_id) == len(binding.consumer_digest) == len(binding.seed) == 32
             and binding.executor != zero
             and (binding.request_id == zero) == (binding.consumer_digest == zero)
             and binding.output_count >= 1 and 1 <= binding.output_width <= MAX_OUTPUT_WIDTH
             and 0 <= binding.output_write < 256 and 0 <= binding.output_base_entry < 1 << 32
             and 0 <= binding.output_first_position < 1 << 32 and binding.output_count < 1 << 32
             and result_bytes(binding.output_count, binding.output_width) <= MAX_ACCOUNT_BYTES)
    if valid and position_count is not None:
        valid = binding.output_first_position + binding.output_count <= position_count
    if valid and signer is not None:
        valid = signer == binding.executor
    return 0 if valid else RUN_BINDING


@dataclass
class ResultV4:
    descriptor: bytes
    executor: bytes
    request_id: bytes
    consumer_digest: bytes
    terms: DisputeTerms
    output_first_position: int
    output_count: int
    output_width: int
    status: int = STATUS_PENDING
    closed: int = 0
    document_root: bytes = bytes(32)
    finalize_slot: int = 0
    dispute_deadline: int = 0
    status_slot: int = 0
    challenger_wins: int = 0
    outputs: list[bytes | None] | None = None

    def __post_init__(self) -> None:
        if self.outputs is None:
            self.outputs = [None] * self.output_count

    @classmethod
    def at_init(cls, descriptor: bytes, binding: RunBinding, terms: DisputeTerms) -> ResultV4:
        return cls(descriptor, binding.executor, binding.request_id, binding.consumer_digest, terms,
                   binding.output_first_position, binding.output_count, binding.output_width)

    @property
    def outputs_attested(self) -> int:
        return sum(value is not None for value in (self.outputs or ()))

    @property
    def usable(self) -> bool:
        return self.status in USABLE_STATUSES and self.document_root != bytes(32) and self.outputs_attested == self.output_count

    def encode(self) -> bytes:
        if (self.status not in (STATUS_PENDING, STATUS_FINAL, STATUS_REFUTED, STATUS_SETTLED)
                or self.closed not in (0, 1) or self.outputs is None
                or len(self.outputs) != self.output_count or not 1 <= self.output_width <= MAX_OUTPUT_WIDTH):
            raise Refusal(RESULT_STATE)
        out = bytearray(b"DCR2" + uint(RESULT_VERSION, 2) + uint(self.status, 1) + uint(self.closed, 1)
                        + digest(self.descriptor) + digest(self.document_root) + digest(self.request_id)
                        + digest(self.consumer_digest) + digest(self.executor) + uint(self.finalize_slot, 8)
                        + uint(self.dispute_deadline, 8) + uint(self.status_slot, 8) + uint(self.challenger_wins, 4)
                        + uint(self.output_count, 4) + uint(self.output_first_position, 4)
                        + uint(self.outputs_attested, 4) + uint(self.output_width, 1) + bytes(7))
        if len(out) != RESULT_TERMS_AT:
            raise AssertionError("result header")
        out += self.terms.encode() + bytes(RESULT_HEADER - RESULT_TERMS_AT - TERMS_BYTES)
        bitmap = bytearray((self.output_count + 7) // 8)
        for index, value in enumerate(self.outputs):
            if value is None:
                out += bytes(self.output_width)
            else:
                if len(value) != self.output_width:
                    raise Refusal(RESULT_STATE)
                out += value
                bitmap[index // 8] |= 1 << (index % 8)
        return bytes(out + bitmap)

    @classmethod
    def decode(cls, raw: bytes) -> ResultV4:
        raw = bytes(raw)
        if len(raw) < RESULT_HEADER or raw[:4] != b"DCR2" or raw[4:6] != b"\x04\x00":
            raise Refusal(RESULT_STATE)
        count, width = int.from_bytes(raw[196:200], "little"), raw[208]
        if (raw[6] > STATUS_SETTLED or raw[7] > 1 or raw[209:216] != bytes(7)
                or raw[RESULT_TERMS_AT + TERMS_BYTES:RESULT_HEADER] != bytes(RESULT_HEADER - RESULT_TERMS_AT - TERMS_BYTES)
                or not 1 <= width <= MAX_OUTPUT_WIDTH or len(raw) != result_bytes(count, width)):
            raise Refusal(RESULT_STATE)
        bitmap_at = RESULT_HEADER + count * width
        bitmap = raw[bitmap_at:]
        if count % 8 and bitmap[-1] >> (count % 8):
            raise Refusal(RESULT_STATE)
        outputs: list[bytes | None] = []
        for index in range(count):
            value = raw[RESULT_HEADER + index * width:RESULT_HEADER + (index + 1) * width]
            present = bitmap[index // 8] >> (index % 8) & 1
            if not present and value != bytes(width):
                raise Refusal(RESULT_STATE)
            outputs.append(value if present else None)
        result = cls(raw[8:40], raw[136:168], raw[72:104], raw[104:136],
                     DisputeTerms.decode(raw[RESULT_TERMS_AT:RESULT_TERMS_AT + TERMS_BYTES]),
                     int.from_bytes(raw[200:204], "little"), count, width, raw[6], raw[7], raw[40:72],
                     int.from_bytes(raw[168:176], "little"), int.from_bytes(raw[176:184], "little"),
                     int.from_bytes(raw[184:192], "little"), int.from_bytes(raw[192:196], "little"), outputs)
        if int.from_bytes(raw[204:208], "little") != result.outputs_attested:
            raise Refusal(RESULT_STATE)
        return result


@dataclass(frozen=True)
class Peak:
    first: int
    level: int
    digest: bytes


def mmr_append(descriptor: bytes, count: int, peaks: Sequence[Peak], position_root: bytes) -> tuple[int, tuple[Peak, ...], bytes]:
    if count >= (1 << 32) - 1:
        raise Refusal(CL_OVERFLOW)
    out = list(peaks)
    carry = Peak(count, 0, sha256(b"basanos/dcg-hclosure-incremental-leaf/1", digest(descriptor), uint(count, 4), digest(position_root)))
    while out and out[-1].level == carry.level:
        left = out.pop()
        if left.first + (1 << left.level) != carry.first:
            raise Refusal(CL_COORDINATE)
        carry = Peak(left.first, carry.level + 1, sha256(b"basanos/dcg-hclosure-incremental-node/1", descriptor,
                                                          uint(left.first, 4), uint(carry.level + 1, 1), left.digest, carry.digest))
    out.append(carry)
    return count + 1, tuple(out), mmr_root(descriptor, count + 1, out)


def mmr_root(descriptor: bytes, count: int, peaks: Sequence[Peak]) -> bytes:
    if count == 0 or len(peaks) > 255:
        raise Refusal(CL_MALFORMED)
    body = bytearray(b"basanos/dcg-hclosure-incremental-document/1" + digest(descriptor) + uint(count, 4) + uint(len(peaks), 1))
    expected = 0
    for peak in peaks:
        if peak.first != expected:
            raise Refusal(CL_COORDINATE)
        body += uint(peak.level, 1) + uint(peak.first, 4) + digest(peak.digest)
        expected += 1 << peak.level
    if expected != count:
        raise Refusal(CL_COORDINATE)
    return sha256(bytes(body))


@dataclass
class Dcm2V5:
    descriptor: bytes
    authority: bytes
    position_count: int
    segment_count: int
    total_entries: int
    terms: DisputeTerms
    pt2s: bytes
    pt2s_sha256: bytes
    model_root: bytes
    position_table_root: bytes
    prompt_commitment: bytes
    registry: bytes
    registry_table_root: bytes
    dea2: bytes
    dfs2: bytes
    registry_epoch: int
    family_count: int
    run_binding: RunBinding
    flags: int = FLAG_ARMED | FLAG_ROOT_ONLY | FLAG_SEALED
    positions_complete: int = 0
    entries_complete: int = 0
    document_root: bytes = bytes(32)
    open_challenges: int = 0
    challenger_wins: int = 0
    finalize_slot: int = 0
    dispute_deadline: int = 0
    prefix_root: bytes = bytes(32)
    family_table_digest: bytes = bytes(32)
    peaks: tuple[Peak, ...] = ()
    executor_bond_state: int | None = None

    def __post_init__(self) -> None:
        if self.run_binding.executor != self.authority:
            raise Refusal(RUN_BINDING)
        if self.executor_bond_state is None:
            self.executor_bond_state = BOND_HELD if self.terms.executor_bond_lamports else BOND_NONE

    @property
    def dispute_window(self) -> int:
        return self.terms.challenge_window_slots

    def encode(self) -> bytes:
        state = BOND_NONE if self.executor_bond_state is None else self.executor_bond_state
        if len(self.peaks) > PEAK_SLOTS:
            raise Refusal(CL_MALFORMED)
        out = b"DCM2" + uint(5, 2) + uint(self.flags, 2) + digest(self.descriptor) + digest(self.authority)
        out += uint(self.position_count, 4) + uint(self.segment_count, 2) + bytes(2) + bytes(4)
        out += uint(self.positions_complete, 4) + uint(self.entries_complete, 8) + digest(self.document_root)
        out += uint(self.open_challenges, 4) + uint(self.challenger_wins, 4) + uint(self.finalize_slot, 8)
        out += uint(self.dispute_deadline, 8) + digest(self.prefix_root) + uint(self.dispute_window, 8)
        out += uint(self.total_entries, 8) + digest(self.pt2s) + digest(self.pt2s_sha256) + digest(self.model_root)
        out += digest(self.position_table_root) + digest(self.prompt_commitment) + digest(self.registry)
        out += digest(self.registry_table_root) + digest(self.dea2) + digest(self.dfs2) + digest(self.family_table_digest)
        out += uint(self.registry_epoch, 4) + uint(self.family_count, 2) + uint((self.position_count - 1).bit_length(), 1)
        out += b"\x03" + uint(len(self.peaks), 1) + uint(state, 1) + bytes(6)
        for peak in self.peaks:
            out += uint(peak.level, 1) + bytes(3) + uint(peak.first, 4) + digest(peak.digest)
        out += bytes(PEAK_BYTES * (PEAK_SLOTS - len(self.peaks))) + self.terms.encode() + self.run_binding.encode()
        if len(out) != DCM2_V5_HEADER:
            raise AssertionError("DCM2 length")
        return out

    @classmethod
    def decode(cls, raw: bytes) -> Dcm2V5:
        raw = bytes(raw)
        if len(raw) != DCM2_V5_HEADER or raw[:4] != b"DCM2" or raw[4:6] != b"\x05\x00":
            raise Refusal(CL_MALFORMED)
        u16 = lambda at: int.from_bytes(raw[at:at + 2], "little")
        u32 = lambda at: int.from_bytes(raw[at:at + 4], "little")
        u64 = lambda at: int.from_bytes(raw[at:at + 8], "little")
        flags = u16(6)
        position_count = u32(72)
        if (flags & ~63 or flags & (FLAG_ROOT_ONLY | FLAG_SEALED) != FLAG_ROOT_ONLY | FLAG_SEALED
                or raw[78:84] != bytes(6) or raw[527] != COMMITMENT_VERSION or raw[526] != (position_count - 1).bit_length()
                or raw[530:536] != bytes(6) or raw[528] > PEAK_SLOTS or raw[529] > BOND_RETURNED):
            raise Refusal(CL_MALFORMED)
        terms = DisputeTerms.decode(raw[DCM2_TERMS_AT:DCM2_BINDING_AT])
        binding = RunBinding.decode(raw[DCM2_BINDING_AT:])
        if binding.executor != raw[40:72] or binding.output_first_position + binding.output_count > position_count:
            raise Refusal(CL_MALFORMED)
        if u64(184) != terms.challenge_window_slots or ((raw[529] == BOND_NONE) != (terms.executor_bond_lamports == 0)):
            raise Refusal(CL_MALFORMED)
        peaks = []
        for index in range(raw[528]):
            at = DCM2_HEADER + PEAK_BYTES * index
            if raw[at + 1:at + 4] != bytes(3):
                raise Refusal(CL_MALFORMED)
            peaks.append(Peak(u32(at + 4), raw[at], raw[at + 8:at + 40]))
        if raw[DCM2_HEADER + PEAK_BYTES * raw[528]:DCM2_TERMS_AT] != bytes(PEAK_BYTES * (PEAK_SLOTS - raw[528])):
            raise Refusal(CL_MALFORMED)
        return cls(raw[8:40], raw[40:72], position_count, u16(76), u64(192), terms, raw[200:232], raw[232:264],
                   raw[264:296], raw[296:328], raw[328:360], raw[360:392], raw[392:424], raw[424:456], raw[456:488],
                   u32(520), u16(524), binding, flags, u32(84), u64(88), raw[96:128], u32(128), u32(132),
                   u64(136), u64(144), raw[152:184], raw[488:520], tuple(peaks), raw[529])

    def append_position(self, position: int, position_root: bytes) -> None:
        if position != self.positions_complete:
            raise Refusal(APPEND_ORDER)
        self.positions_complete, self.peaks, self.prefix_root = mmr_append(self.descriptor, self.positions_complete, self.peaks, position_root)


def encode_land_position_roots(descriptor: bytes, first: int, roots: Sequence[bytes]) -> bytes:
    if not 1 <= len(roots) <= 255:
        raise Refusal(CL_MALFORMED)
    return bytes([TAG_LAND_POSITION_ROOTS]) + digest(descriptor) + uint(first, 4) + uint(len(roots), 1) + b"".join(digest(root) for root in roots)


def land_position_roots(document: Dcm2V5, dpr2: list[bytes | None], data: bytes, signer: bytes) -> None:
    if len(data) < 38 or data[0] != TAG_LAND_POSITION_ROOTS or data[37] == 0 or len(data) != 38 + 32 * data[37]:
        raise Refusal(CL_MALFORMED)
    if data[1:33] != document.descriptor or len(dpr2) != document.position_count:
        raise Refusal(CL_MALFORMED)
    if signer != document.authority:
        raise Refusal(CL_AUTHORITY)
    if document.flags & FLAG_FINAL:
        raise Refusal(CL_AFTER_FINAL)
    first, count = int.from_bytes(data[33:37], "little"), data[37]
    if first != document.positions_complete:
        raise Refusal(APPEND_ORDER)
    if first + count > document.position_count:
        raise Refusal(CL_COORDINATE)
    roots = [data[38 + 32 * index:70 + 32 * index] for index in range(count)]
    if any(root == bytes(32) for root in roots):
        raise Refusal(CL_ROOT)
    for index, root in enumerate(roots):
        document.append_position(first + index, root)
        dpr2[first + index] = root


def encode_dpr2(descriptor: bytes, position_count: int, roots: Sequence[bytes]) -> bytes:
    if position_count < 1 or len(roots) != position_count:
        raise Refusal(CL_COORDINATE)
    if any(len(root) != 32 or root == bytes(32) for root in roots):
        raise Refusal(CL_ROOT)
    return b"DPR2" + b"\x01\x00" + bytes(2) + digest(descriptor) + uint(position_count, 4) * 2 + b"".join(roots)


def decode_dpr2(raw: bytes, *, allow_partial: bool = False) -> tuple[bytes, list[bytes]]:
    raw = bytes(raw)
    if len(raw) < DPR2_HEADER or raw[:4] != b"DPR2" or raw[4:6] != b"\x01\x00" or raw[6:8] != bytes(2):
        raise Refusal(CL_MALFORMED)
    count = int.from_bytes(raw[40:44], "little")
    landed = int.from_bytes(raw[44:48], "little")
    if count < 1 or landed > count or (not allow_partial and landed != count):
        raise Refusal(CL_MALFORMED)
    if len(raw) not in (DPR2_HEADER + 32 * landed, DPR2_HEADER + 32 * count):
        raise Refusal(CL_MALFORMED)
    roots = [raw[DPR2_HEADER + 32 * index:DPR2_HEADER + 32 * (index + 1)] for index in range(landed)]
    if any(root == bytes(32) for root in roots):
        raise Refusal(CL_ROOT)
    return raw[8:40], roots


def event_body_bytes(kind: int) -> int:
    return sum(width for _, width in EVENT_SCHEMA[kind][1])


def encode_event(name: str, *, descriptor: bytes, slot: int, **fields: Any) -> bytes:
    if name not in EVENT_KINDS:
        raise ValueError("event kind")
    kind = EVENT_KINDS[name]
    values = dict(fields)
    out = bytearray(EVENT_MAGIC + uint(EVENT_VERSION, 2) + uint(kind, 1) + b"\0" + digest(descriptor) + uint(slot, 8))
    for field_name, width in EVENT_SCHEMA[kind][1]:
        if field_name is None:
            out += bytes(width)
        elif width == 32:
            value = digest(values.pop(field_name), field_name)
            out += value
        else:
            out += uint(values.pop(field_name), width)
    if values:
        raise ValueError(f"unknown event fields {sorted(values)}")
    return bytes(out)


def decode_event(raw: bytes) -> dict[str, Any]:
    raw = bytes(raw)
    if len(raw) < EVENT_HEADER or raw[:4] != EVENT_MAGIC or raw[4:6] != b"\x01\x00" or raw[7]:
        raise Refusal(CL_MALFORMED)
    kind = raw[6]
    if kind not in EVENT_SCHEMA or len(raw) != EVENT_HEADER + event_body_bytes(kind):
        raise Refusal(CL_MALFORMED)
    name, schema = EVENT_SCHEMA[kind]
    result: dict[str, Any] = {"kind": name, "descriptor": raw[8:40], "slot": int.from_bytes(raw[40:48], "little")}
    at = EVENT_HEADER
    for field_name, width in schema:
        chunk = raw[at:at + width]
        if field_name is None:
            if chunk != bytes(width):
                raise Refusal(CL_MALFORMED)
        else:
            result[field_name] = chunk if width == 32 else int.from_bytes(chunk, "little")
        at += width
    return result


def _node(descriptor: bytes, kind: int, scope: int, height: int,
          left: tuple[bytes, int, int], right: tuple[bytes, int, int]) -> tuple[bytes, int, int]:
    value = sha256(b"basanos/dcg-hclosure-node/2", digest(descriptor), uint(kind, 1), uint(scope, 4),
                   uint(left[1], 4), uint(right[2], 4), uint(height, 1), b"\1", left[0], right[0])
    return value, left[1], right[2]


def duplicate_levels(descriptor: bytes, kind: int, scope: int, values: Sequence[bytes]) -> list[list[tuple[bytes, int, int]]]:
    if not values or any(len(value) != 32 for value in values):
        raise Refusal(CL_MALFORMED)
    out = [[(digest(value), index, index + 1) for index, value in enumerate(values)]]
    while len(out[-1]) > 1:
        current = out[-1]
        out.append([_node(descriptor, kind, scope, len(out), current[index],
                           current[index + 1] if index + 1 < len(current) else current[index])
                    for index in range(0, len(current), 2)])
    return out


def duplicate_path(levels: Sequence[Sequence[tuple[bytes, int, int]]], index: int) -> list[bytes]:
    if not levels or not 0 <= index < len(levels[0]):
        raise Refusal(CL_COORDINATE)
    out = []
    for level in levels[:-1]:
        out.append(level[index ^ 1][0] if index ^ 1 < len(level) else level[index][0])
        index //= 2
    return out


def duplicate_fold(descriptor: bytes, kind: int, scope: int, count: int, index: int,
                   value: bytes, path: Sequence[bytes]) -> bytes | None:
    if not 0 <= index < count or len(path) != (count - 1).bit_length():
        return None
    node, index_now, width, span = (digest(value), index, index + 1), index, count, 1
    for level, sibling_digest in enumerate(path, 1):
        sibling_index = index_now ^ 1
        if sibling_index >= width:
            if sibling_digest != node[0]:
                return None
            sibling = node
        else:
            sibling = (digest(sibling_digest), sibling_index * span, min((sibling_index + 1) * span, count))
        node = _node(descriptor, kind, scope, level, *((node, sibling) if index_now % 2 == 0 else (sibling, node)))
        index_now, width, span = index_now // 2, (width + 1) // 2, span * 2
    return node[0]


def position_root(descriptor: bytes, position: int, segment_table_root: bytes, segment_roots: Sequence[bytes]) -> bytes:
    if not segment_roots:
        raise Refusal(CL_MALFORMED)
    tree = duplicate_levels(descriptor, 2, position, segment_roots)[-1][0][0]
    return sha256(b"basanos/dcg-hclosure-position-root/2", digest(descriptor), uint(position, 4), uint(len(segment_roots), 2),
                  digest(segment_table_root), tree, b"\1")


def encode_spp1(ordinal: int, segment_table_root: bytes, path: Sequence[bytes]) -> bytes:
    if len(path) > 255:
        raise Refusal(CL_MALFORMED)
    return uint(ordinal, 2) + uint(len(path), 1) + b"\0" + digest(segment_table_root) + b"".join(digest(item) for item in path)


def decode_spp1(raw: bytes) -> tuple[int, bytes, list[bytes]]:
    raw = bytes(raw)
    if len(raw) < 36 or raw[3] != 0 or len(raw) != 36 + 32 * raw[2]:
        raise Refusal(DCR1_BAD)
    return int.from_bytes(raw[:2], "little"), raw[4:36], [raw[36 + 32 * index:68 + 32 * index] for index in range(raw[2])]


def verify_spp1(descriptor: bytes, position: int, segment_count: int, segment_root: bytes, proof: bytes,
                landed_root: bytes, expected_table_root: bytes | None = None) -> bool:
    try:
        ordinal, table_root, path = decode_spp1(proof)
    except Refusal:
        return False
    if expected_table_root is not None and table_root != expected_table_root:
        return False
    if not 1 <= segment_count <= MAX_SEGMENTS or ordinal >= segment_count:
        return False
    folded = duplicate_fold(descriptor, 2, position, segment_count, ordinal, segment_root, path)
    if folded is None:
        return False
    tree = duplicate_fold(descriptor, 2, position, segment_count, ordinal, segment_root, path)
    root = sha256(b"basanos/dcg-hclosure-position-root/2", digest(descriptor), uint(position, 4), uint(segment_count, 2),
                  table_root, tree, b"\1")
    return root == landed_root


def _leaf_parent(descriptor: bytes, position: int, level: int,
                 left: tuple[bytes, int, int], right: tuple[bytes, int, int]) -> tuple[bytes, int, int]:
    value = sha256(b"basanos/dcg-hclosure-node/2", descriptor, b"\1", uint(position, 4), uint(left[1], 4),
                   uint(right[2], 4), uint(level, 1), b"\1", left[0], right[0])
    return value, left[1], right[2]


def segment_root_from_leaf(descriptor: bytes, position: int, segment: int, entries: int, local: int,
                           leaf_digest: bytes, path: Sequence[bytes]) -> bytes | None:
    if not 0 <= local < entries or len(path) != (entries - 1).bit_length():
        return None
    node, index, width, span = (leaf_digest, local, local + 1), local, entries, 1
    for level, sibling_digest in enumerate(path, 1):
        sibling_index = index ^ 1
        if sibling_index >= width:
            if sibling_digest != node[0]:
                return None
            sibling = node
        else:
            sibling = (sibling_digest, sibling_index * span, min((sibling_index + 1) * span, entries))
        node = _leaf_parent(descriptor, position, level, node, sibling) if index % 2 == 0 else _leaf_parent(
            descriptor, position, level, sibling, node)
        index, width, span = index // 2, (width + 1) // 2, span * 2
    return sha256(b"basanos/dcg-hclosure-segment-root/2", digest(descriptor), uint(position, 4), uint(segment, 2),
                  uint(entries, 4), node[0], b"\1")


def encode_attestation(descriptor: bytes, index: int, value: bytes, leaf_preimage: bytes,
                       path: Sequence[bytes], spp1: bytes) -> bytes:
    decode_spp1(spp1)
    if not value or len(value) > MAX_OUTPUT_WIDTH:
        raise Refusal(OUTPUT_PROOF)
    if leaf_preimage[:27] != b"basanos/dcg-hclosure-leaf/2" or leaf_preimage[27:59] != descriptor:
        raise Refusal(OUTPUT_PROOF)
    tail = leaf_preimage[69:]
    return bytes([TAG_ATTEST_OUTPUT]) + digest(descriptor) + uint(index, 4) + value + uint(len(tail), 2) + tail + uint(len(path), 1) + b"".join(path) + spp1


def decode_attestation(data: bytes, width: int) -> dict[str, Any]:
    data = bytes(data)
    try:
        if data[0] != TAG_ATTEST_OUTPUT:
            raise ValueError
        at = 37
        index = int.from_bytes(data[33:37], "little")
        value = data[at:at + width]
        at += width
        leaf_length = int.from_bytes(data[at:at + 2], "little")
        at += 2
        leaf = data[at:at + leaf_length]
        at += leaf_length
        height = data[at]
        at += 1
        path = [data[at + 32 * index:at + 32 * (index + 1)] for index in range(height)]
        at += 32 * height
        spp1 = data[at:]
        if len(value) != width or len(leaf) != leaf_length or any(len(item) != 32 for item in path):
            raise ValueError
        decode_spp1(spp1)
    except (IndexError, ValueError, Refusal):
        raise Refusal(CL_MALFORMED) from None
    return {"descriptor": data[1:33], "index": index, "value": value, "leaf": leaf, "path": path, "spp1": spp1}


def verify_attestation(data: bytes, *, width: int, position: int, segment_count: int,
                       segment: int, entries: int, local: int, region: int, offset: int,
                       landed_root: bytes, expected_table_root: bytes | None = None,
                       expected_index: int | None = None, expected_descriptor: bytes | None = None) -> dict[str, Any]:
    parsed = decode_attestation(data, width)
    if expected_descriptor is not None and parsed["descriptor"] != expected_descriptor:
        raise Refusal(OUTPUT_PROOF)
    if expected_index is not None and parsed["index"] != expected_index:
        raise Refusal(OUTPUT_PROOF)
    if len(parsed["value"]) != width:
        raise Refusal(OUTPUT_PROOF)
    leaf = b"basanos/dcg-hclosure-leaf/2" + digest(parsed["descriptor"]) + uint(position, 4) + uint(segment, 2) + uint(local, 4) + parsed["leaf"]
    if len(leaf) < 147 or leaf[145:147] != bytes(2):
        raise Refusal(OUTPUT_PROOF)
    write_count = int.from_bytes(leaf[143:145], "little")
    if len(leaf) != 147 + 48 * write_count:
        raise Refusal(OUTPUT_PROOF)
    write_rows = [leaf[147 + 48 * index:147 + 48 * (index + 1)] for index in range(write_count)]
    expected_digest = sha256(b"basanos/dcg-hclosure-write/2", digest(parsed["descriptor"]),
                              uint(position, 4) + uint(segment, 2) + uint(local, 4), uint(region, 2),
                              uint(offset, 8), uint(width, 4), parsed["value"])
    expected_row = uint(region, 2) + bytes(2) + uint(width, 4) + uint(offset, 8) + expected_digest
    if expected_row not in write_rows:
        raise Refusal(OUTPUT_PROOF)
    segment_root = segment_root_from_leaf(parsed["descriptor"], position, segment, entries, local,
                                          sha256(leaf), parsed["path"])
    if segment_root is None or not verify_spp1(parsed["descriptor"], position, segment_count, segment_root,
                                               parsed["spp1"], landed_root, expected_table_root):
        raise Refusal(OUTPUT_PROOF)
    return {**parsed, "position": position, "segment_root": segment_root, "output_digest": expected_digest}


def encode_reveal_position(first: int, roots: Sequence[bytes]) -> bytes:
    return bytes([TAG_REVEAL_POSITION]) + uint(first, 2) + uint(len(roots), 1) + b"".join(digest(root) for root in roots)


def encode_select_segment(ordinal: int) -> bytes:
    return bytes([TAG_SELECT_SEGMENT]) + uint(ordinal, 2)


def encode_reveal_family_table(first: int, roots: Sequence[bytes]) -> bytes:
    return bytes([TAG_REVEAL_FAMILY_TABLE]) + uint(first, 1) + uint(len(roots), 1) + b"".join(digest(root) for root in roots)


def encode_close_response() -> bytes:
    return bytes([TAG_CLOSE_RESPONSE])


def encode_resolve_result(descriptor: bytes) -> bytes:
    return bytes([TAG_RESOLVE_RESULT]) + digest(descriptor)


def encode_close_document(descriptor: bytes) -> bytes:
    return bytes([TAG_CLOSE_DOCUMENT]) + digest(descriptor)


def encode_finalize_document(descriptor: bytes, roots: Sequence[bytes]) -> bytes:
    return bytes([TAG_FINALIZE_DOCUMENT]) + digest(descriptor) + uint(len(roots), 2) + b"".join(digest(root) for root in roots)


def family_table_digest(descriptor: bytes, roots: Sequence[bytes]) -> bytes:
    return sha256(FAMILY_TABLE_DOMAIN, digest(descriptor), uint(len(roots), 2), *(digest(root) for root in roots))


def check_family_body(body: bytes) -> int:
    raw = bytes(body)
    if len(raw) < 2:
        raise Refusal(PLAN_BINDING)
    count = int.from_bytes(raw[:2], "little")
    if not 1 <= count <= MAX_FAMILIES:
        raise Refusal(PLAN_BINDING)
    at = 2
    ordinals = []
    for _ in range(count):
        if at + 6 > len(raw):
            raise Refusal(PLAN_BINDING)
        ordinal, _region, slot_count = (int.from_bytes(raw[at:at + 2], "little"),
                                        int.from_bytes(raw[at + 2:at + 4], "little"),
                                        int.from_bytes(raw[at + 4:at + 6], "little"))
        at += 6
        if slot_count < 1 or at + 5 * slot_count > len(raw):
            raise Refusal(PLAN_BINDING)
        slots = []
        for _slot in range(slot_count):
            slots.append((int.from_bytes(raw[at:at + 4], "little"), raw[at + 4]))
            at += 5
        if slots != sorted(set(slots)):
            raise Refusal(PLAN_BINDING)
        ordinals.append(ordinal)
    if at != len(raw) or ordinals != sorted(set(ordinals)):
        raise Refusal(PLAN_BINDING)
    return count


@dataclass(frozen=True)
class DescriptorSpec:
    """All public DPD2 fields needed to derive one document descriptor."""

    position_count: int
    segment_count: int
    family_count: int
    total_entries: int
    terms: DisputeTerms
    binding: RunBinding
    compiler_version: int
    clause12_v4: bytes
    definition_sha256: bytes
    base_digests: tuple[bytes, bytes, bytes]
    model_root: bytes
    position_table_root: bytes
    prompt_commitment: bytes
    registry_epoch: int
    registry: bytes
    registry_table_root: bytes
    family_body: bytes

    def preimage(self) -> bytes:
        clause = bytes(self.clause12_v4)
        if len(clause) != 43 or clause[:5] != b"\x04PT2P":
            raise Refusal(PLAN_BINDING)
        positions, segments = int.from_bytes(clause[5:9], "little"), int.from_bytes(clause[9:11], "little")
        body_count = check_family_body(self.family_body)
        if (positions != self.position_count or segments != self.segment_count or len(self.base_digests) != 3
                or body_count != self.family_count or min(self.position_count, self.segment_count, self.total_entries) <= 0
                or not 1 <= self.family_count <= MAX_FAMILIES or not 1 <= self.segment_count <= MAX_SEGMENTS):
            raise Refusal(PLAN_BINDING)
        if any(value == bytes(32) for value in (self.model_root, self.position_table_root, self.prompt_commitment)):
            raise Refusal(PLAN_BINDING)
        if check_run_binding(self.binding, position_count=self.position_count) != 0:
            raise Refusal(RUN_BINDING)
        out = (DESCRIPTOR_DOMAIN + uint(UNIFIED_VERSION, 2) + uint(STORAGE_ROOT_ONLY, 1) + uint(COMMITMENT_VERSION, 1)
               + uint(self.position_count, 4) + uint(self.segment_count, 2) + uint(self.family_count, 2)
               + uint((self.position_count - 1).bit_length(), 1) + uint(self.compiler_version, 1) + bytes(2)
               + uint(self.total_entries, 8) + self.terms.encode() + self.binding.encode() + clause
               + digest(self.definition_sha256) + b"".join(digest(item) for item in self.base_digests)
               + digest(self.model_root) + digest(self.position_table_root) + digest(self.prompt_commitment)
               + uint(self.registry_epoch, 4) + digest(self.registry) + digest(self.registry_table_root)
               + sha256(self.family_body))
        if len(out) != 631:
            raise AssertionError("descriptor length")
        return out

    def digest(self) -> bytes:
        return sha256(self.preimage())


def family_count_from_body(body: bytes) -> int:
    return check_family_body(body)


def encode_unified_init(terms: DisputeTerms, binding: RunBinding, *, model_root: bytes,
                        position_table_root: bytes, prompt_commitment: bytes, family_body: bytes) -> bytes:
    family_count = family_count_from_body(family_body)
    if any(value == bytes(32) for value in (model_root, position_table_root, prompt_commitment)):
        raise Refusal(PLAN_BINDING)
    return (bytes([TAG_UNIFIED_INIT]) + terms.encode() + binding.encode() + digest(model_root)
            + digest(position_table_root) + digest(prompt_commitment) + uint(family_count, 2) + family_body)


def config_init_data(admin: bytes, registry_authority: bytes, template_seal_authority: bytes) -> bytes:
    if digest(admin) == bytes(32):
        raise Refusal(CONFIG_AUTHORITY)
    return bytes([TAG_CONFIG_INIT]) + admin + digest(registry_authority) + digest(template_seal_authority)


def config_set_data(role: int, new_key: bytes) -> bytes:
    if role not in (0, 1, 2):
        raise Refusal(CONFIG_AUTHORITY)
    return bytes([TAG_CONFIG_SET, role]) + digest(new_key)


def template_seal_data(action: int) -> bytes:
    if action not in (1, 2):
        raise Refusal(TEMPLATE_SEAL)
    return bytes([TAG_TEMPLATE_SEAL, action])


def encode_template_seal(pt2s: bytes, pt2s_sha256: bytes, state: int, sealer: bytes, slot: int) -> bytes:
    if state not in (1, 2):
        raise Refusal(TEMPLATE_SEAL)
    return b"DTA1" + b"\x01\x00" + bytes([state, 0]) + digest(pt2s) + digest(pt2s_sha256) + digest(sealer) + uint(slot, 8)


def decode_template_seal(raw: bytes) -> dict[str, Any]:
    if len(raw) != 112 or raw[:4] != b"DTA1" or raw[4:6] != b"\x01\x00" or raw[6] not in (1, 2) or raw[7] != 0:
        raise Refusal(TEMPLATE_SEAL)
    return {"state": raw[6], "pt2s": raw[8:40], "pt2s_sha256": raw[40:72], "sealer": raw[72:104], "slot": int.from_bytes(raw[104:112], "little")}


def encode_challenge_leaf(descriptor: bytes, position: int, segment: int, local: int, leaf: bytes,
                          path: Sequence[bytes], spp1: bytes, response_length: int, nonce: int) -> bytes:
    decode_spp1(spp1)
    if len(path) > 255 or len(leaf) != 32:
        raise Refusal(CL_MALFORMED)
    return (bytes([TAG_CHALLENGE_LEAF]) + digest(descriptor) + uint(position, 4) + uint(segment, 2) + uint(local, 4)
            + digest(leaf) + uint(response_length, 4) + uint(len(path), 1) + b"".join(path) + spp1 + uint(nonce, 4))


def encode_challenge_position(descriptor: bytes, position: int, response_length: int, nonce: int) -> bytes:
    return bytes([TAG_CHALLENGE_POSITION]) + digest(descriptor) + uint(position, 4) + uint(response_length, 4) + uint(nonce, 4)


def encode_reveal(digests: Sequence[bytes], tree_root: bytes | None = None) -> bytes:
    return bytes([TAG_REVEAL, len(digests)]) + (digest(tree_root) if tree_root is not None else b"") + b"".join(digest(item) for item in digests)


def encode_descend(choice: int) -> bytes:
    return bytes([TAG_DESCEND, choice])


def encode_summary_challenge(descriptor: bytes, family_index: int, roots: Sequence[bytes], nonce: int) -> bytes:
    return (bytes([TAG_CHALLENGE_SUMMARY]) + digest(descriptor) + uint(family_index, 1) + uint(len(roots), 1)
            + b"".join(digest(root) for root in roots) + uint(nonce, 4))


def encode_summary_leaf(leaf_index: int, leaf: bytes, auth: Sequence[bytes]) -> bytes:
    return bytes([TAG_SUMMARY_LEAF]) + uint(leaf_index, 4) + digest(leaf) + uint(len(auth), 1) + b"".join(auth)


def encode_summary_reveal(descendants: Sequence[bytes], tree_root: bytes | None = None) -> bytes:
    return bytes([TAG_REVEAL_SUMMARY, len(descendants)]) + (digest(tree_root) if tree_root is not None else b"") + b"".join(descendants)


def encode_summary_select(choice: int) -> bytes:
    return bytes([TAG_SELECT_SUMMARY, choice])


def encode_summary_answer(slot: int, preimage: bytes, path: Sequence[bytes], spp1: bytes) -> bytes:
    return bytes([TAG_ANSWER_SUMMARY, slot]) + uint(len(preimage), 2) + preimage + uint(len(path), 1) + b"".join(path) + spp1


def decode_summary_answer(data: bytes) -> tuple[int, bytes, list[bytes], bytes]:
    data = bytes(data)
    if len(data) < 5 or data[0] != TAG_ANSWER_SUMMARY:
        raise Refusal(DCR1_BAD)
    slot = data[1]
    length = int.from_bytes(data[2:4], "little")
    at = 4 + length
    if len(data) <= at:
        raise Refusal(DCR1_BAD)
    height = data[at]
    at += 1
    if len(data) < at + 32 * height + 36:
        raise Refusal(DCR1_BAD)
    path = [data[at + 32 * index:at + 32 * (index + 1)] for index in range(height)]
    return slot, data[4:4 + length], path, data[at + 32 * height:]


def decode_challenge_record(raw: bytes) -> dict[str, Any]:
    raw = bytes(raw)
    if len(raw) != DCR1_BYTES or raw[:4] != b"DCR1" or raw[6:8] != uint(DCR1_VERSION, 2):
        raise Refusal(CL_MALFORMED)
    return {
        "phase": raw[4],
        "winner": raw[5],
        "challenger": raw[8:40],
        "executor": raw[40:72],
        "descriptor": raw[72:104],
        "leaf": raw[104:136],
        "local": int.from_bytes(raw[136:140], "little"),
        "response_length": int.from_bytes(raw[140:144], "little"),
        "source": raw[144],
        "deadline": int.from_bytes(raw[148:156], "little"),
        "position": int.from_bytes(raw[156:160], "little"),
        "segment": int.from_bytes(raw[160:162], "little"),
        "bond": int.from_bytes(raw[162:170], "little"),
        "entry": int.from_bytes(raw[170:174], "little"),
        "form": int.from_bytes(raw[174:176], "little"),
        "position_staged": int.from_bytes(raw[176:178], "little"),
        "position_segment_count": int.from_bytes(raw[178:180], "little"),
        "position_verified": raw[180],
        "target_verified": raw[176],
        "read_count": int.from_bytes(raw[178:180], "little"),
        "write_count": int.from_bytes(raw[180:182], "little"),
        "read_bits": int.from_bytes(raw[348:356], "little")
        | int.from_bytes(raw[396:404], "little") << 64,
        "family_table_verified": raw[3072],
        "family_table_staged": int.from_bytes(raw[3074:3076], "little"),
    }


def legacy_tx_bytes(data_len: int, *, keys: int, instruction_accounts: int, signatures: int = 1,
                    extra_instructions: Sequence[tuple[int, int]] = ((0, 5),)) -> int:
    def compact(value: int) -> int:
        return 1 if value < 0x80 else 2 if value < 0x4000 else 3
    instructions = [(instruction_accounts, data_len), *extra_instructions]
    size = compact(signatures) + 64 * signatures + 3 + compact(keys) + 32 * keys + 32
    size += compact(len(instructions))
    for accounts, data in instructions:
        size += 1 + compact(accounts) + accounts + compact(data) + data
    return size


def max_land_batch() -> int:
    count = 0
    while legacy_tx_bytes(38 + 32 * (count + 1), keys=5, instruction_accounts=3) <= PACKET_BYTES:
        count += 1
    return count


def max_reveal_chunk() -> int:
    count = 0
    while legacy_tx_bytes(4 + 32 * (count + 1), keys=9, instruction_accounts=7) <= PACKET_BYTES:
        count += 1
    return count
