from __future__ import annotations

import hashlib
from collections.abc import Sequence
from dataclasses import dataclass

from solders.instruction import Instruction
from solders.pubkey import Pubkey

from . import consensus as c
from . import instructions as ix
from .requester import REQUEST_SEED, RequestBlockV7
from .requester import request_address as derive_request_address
from .transport import RpcClient

KeyLike = Pubkey | str | bytes | bytearray
CONFIG_SEED = b"tco-config"
PROMPT_SEED = b"tco-prompt"
MACHINE_DOMAIN = b"basanos/tierc-machine/1"
MACHINE_BYTES = 384
REQUEST_BYTES = 1072
TOKEN_WIDTH = 16
STATUS_OPEN = 0
STATUS_BOUND = 1
STATUS_RESOLVED = 2
TAG_CREATE_REQUEST = 10
TAG_APPEND_PROMPT = 11
TAG_BIND_DOCUMENT = 12
TAG_RESOLVE = 13


def _key(value: KeyLike) -> bytes:
    return c.key_bytes(value)


def _read_u16(raw: bytes, at: int) -> int:
    return int.from_bytes(raw[at:at + 2], "little")


def _read_u32(raw: bytes, at: int) -> int:
    return int.from_bytes(raw[at:at + 4], "little")


def _read_u64(raw: bytes, at: int) -> int:
    return int.from_bytes(raw[at:at + 8], "little")


@dataclass(frozen=True)
class RequestMachine:
    dcg_program: bytes
    pt2s: bytes
    pt2s_sha256: bytes
    model_root: bytes
    position_table_root: bytes
    registry: bytes
    registry_table_root: bytes
    definition_sha256: bytes
    clause12_v4: bytes
    family_count: int
    compiler_version: int
    rs1_height: int
    position_count: int
    segment_count: int
    total_entries: int
    token_base_entry: int
    token_write: int
    token_width: int
    vocab: int
    prompt_region: int
    prompt_positions: int

    def validate(self) -> None:
        fields = (self.dcg_program, self.pt2s, self.pt2s_sha256, self.model_root,
                  self.position_table_root, self.registry, self.registry_table_root,
                  self.definition_sha256)
        if any(len(value) != 32 or value == bytes(32) for value in fields):
            raise ValueError("machine keys and digests must be nonzero 32-byte values")
        if len(self.clause12_v4) != 43 or self.clause12_v4[:5] != b"\x04PT2P":
            raise ValueError("machine clause is not PT2P v4")
        if not 1 <= self.family_count <= 24 or self.compiler_version != 1:
            raise ValueError("machine family count or compiler is invalid")
        if not 1 <= self.segment_count <= 128 or self.position_count == 0 or self.total_entries == 0:
            raise ValueError("machine dimensions are invalid")
        if self.vocab == 0 or not 1 <= self.prompt_positions <= self.position_count:
            raise ValueError("machine tokenizer geometry is invalid")
        if (_read_u32(self.clause12_v4, 5) != self.position_count
                or _read_u16(self.clause12_v4, 9) != self.segment_count):
            raise ValueError("machine clause geometry is invalid")
        height = 0 if self.position_count <= 1 else (self.position_count - 1).bit_length()
        if (self.rs1_height != height or self.token_width != TOKEN_WIDTH
                or not 0 <= self.token_base_entry < 1 << 32 or not 0 <= self.token_write <= 255
                or not 0 <= self.prompt_region <= 0xFFFE or not 0 <= self.vocab < 1 << 32):
            raise ValueError("machine output geometry is invalid")

    def encode(self) -> bytes:
        self.validate()
        out = bytearray(MACHINE_BYTES)
        out[:4] = b"TMC1"
        out[4:8] = c.uint(1, 2) + bytes(2)
        out[8:40] = self.dcg_program
        out[40:72] = self.pt2s
        out[72:104] = self.pt2s_sha256
        out[104:136] = self.model_root
        out[136:168] = self.position_table_root
        out[168:200] = self.registry
        out[200:232] = self.registry_table_root
        out[264:296] = self.definition_sha256
        out[296:339] = self.clause12_v4
        out[339:341] = c.uint(self.family_count, 2)
        out[341:342] = c.uint(self.compiler_version, 1)
        out[342:343] = c.uint(self.rs1_height, 1)
        out[344:348] = c.uint(self.position_count, 4)
        out[348:350] = c.uint(self.segment_count, 2)
        out[352:360] = c.uint(self.total_entries, 8)
        out[360:364] = c.uint(self.token_base_entry, 4)
        out[364:365] = c.uint(self.token_write, 1)
        out[365:366] = c.uint(self.token_width, 1)
        out[368:372] = c.uint(self.vocab, 4)
        out[372:374] = c.uint(self.prompt_region, 2)
        out[374:376] = c.uint(self.prompt_positions, 2)
        return bytes(out)

    @classmethod
    def decode(cls, raw: bytes) -> RequestMachine:
        raw = bytes(raw)
        if len(raw) != MACHINE_BYTES or raw[:4] != b"TMC1" or raw[4:8] != b"\x01\x00\x00\x00":
            raise ValueError("malformed TMC1")
        machine = cls(raw[8:40], raw[40:72], raw[72:104], raw[104:136], raw[136:168],
                      raw[168:200], raw[200:232], raw[264:296], raw[296:339],
                      _read_u16(raw, 339), raw[341], raw[342], _read_u32(raw, 344),
                      _read_u16(raw, 348), _read_u64(raw, 352), _read_u32(raw, 360), raw[364],
                      raw[365], _read_u32(raw, 368), _read_u16(raw, 372), _read_u16(raw, 374))
        if machine.encode() != raw:
            raise ValueError("noncanonical TMC1")
        return machine

    def machine_id(self) -> bytes:
        return hashlib.sha256(MACHINE_DOMAIN + self.encode()).digest()


@dataclass(frozen=True)
class RequestAccount:
    status: int
    bump: int
    requester: bytes
    nonce: int
    created: int
    deadline: int
    consumer_digest: bytes
    request: RequestBlockV7
    machine: RequestMachine
    prompt: bytes
    callback: bytes
    callback_present: int
    callback_pending: int
    fee: int
    bond: int
    descriptor: bytes
    document: bytes
    result: bytes
    executor: bytes

    @classmethod
    def decode(cls, raw: bytes) -> RequestAccount:
        raw = bytes(raw)
        if (len(raw) != REQUEST_BYTES or raw[:4] != b"TCR1" or raw[4:6] != b"\x01\x00"
                or raw[6] > STATUS_RESOLVED or raw[921] > 1 or any(raw[922:928])
                or raw[928:944] != bytes(16)
                or (raw[921] == 1 and (raw[6] != STATUS_RESOLVED or raw[920] != 1))):
            raise ValueError("malformed TCR1")
        trq1 = raw[96:472]
        requester = raw[8:40]
        nonce = _read_u64(raw, 40)
        request = RequestBlockV7(
            request=trq1[8:40], requester=trq1[40:72], nonce=nonce,
            prompt_token_count=_read_u32(trq1, 80), max_new_tokens=_read_u32(trq1, 84),
            prompt_commitment=trq1[88:120], prompt_tokens_sha256=trq1[120:152],
            tokenizer_sha256=trq1[152:184], sampling_params=trq1[184:216], seed=trq1[216:248],
            machine_id=trq1[248:280], terms=c.RunTerms.decode(trq1[280:376]),
        )
        machine = RequestMachine.decode(raw[472:856])
        descriptor, document, result, executor = raw[944:976], raw[976:1008], raw[1008:1040], raw[1040:1072]
        if (request.encode() != trq1 or request.requester != requester or request.nonce != nonce
                or request.machine_id != machine.machine_id()
                or machine.prompt_positions != request.prompt_token_count
                or request.max_new_tokens > machine.position_count - machine.prompt_positions + 1
                or request.consumer_digest() != raw[64:96] or raw[856:888] == bytes(32)
                or _read_u64(raw, 56) < _read_u64(raw, 48)
                or raw[920] > 1 or (raw[920] == 0 and raw[888:920] != bytes(32))
                or (raw[920] == 1 and raw[888:920] == bytes(32))
                or (raw[6] == STATUS_OPEN and any(value != bytes(32) for value in
                                                  (descriptor, document, result, executor)))
                or (raw[6] != STATUS_OPEN and any(value == bytes(32) for value in
                                                  (descriptor, document, result, executor)))):
            raise ValueError("TCR1 fields are inconsistent")
        return cls(raw[6], raw[7], requester, nonce, _read_u64(raw, 48), _read_u64(raw, 56),
                   raw[64:96], request, machine, raw[856:888], raw[888:920], raw[920], raw[921],
                   _read_u64(raw, 928), _read_u64(raw, 936), descriptor, document, result, executor)


def decode_request_account(raw: bytes) -> RequestAccount:
    return RequestAccount.decode(raw)


def request_address(program: KeyLike, requester: KeyLike, nonce: int) -> tuple[bytes, int]:
    return derive_request_address(program, requester, nonce)


def config_address(program: KeyLike) -> tuple[bytes, int]:
    return c.pda(program, CONFIG_SEED)


def prompt_address(program: KeyLike, request: KeyLike) -> tuple[bytes, int]:
    return c.pda(program, PROMPT_SEED, _key(request))


class RequestProgramClient:
    def __init__(self, program: KeyLike, *, rpc: RpcClient | None = None) -> None:
        self.program = _key(program)
        self.rpc = rpc

    def request_address(self, requester: KeyLike, nonce: int) -> tuple[bytes, int]:
        return derive_request_address(self.program, requester, nonce)

    def config_address(self) -> tuple[bytes, int]:
        return c.pda(self.program, CONFIG_SEED)

    def prompt_address(self, request: KeyLike) -> tuple[bytes, int]:
        return prompt_address(self.program, request)

    def create_request(self, request: RequestBlockV7, machine: RequestMachine | bytes, *,
                       deadline_slots: int, callback: bytes = bytes(32), fee: int = 0, bond: int = 0,
                       prompt_tokens: Sequence[int] = (), config: KeyLike | None = None) -> Instruction:
        trq1 = request.encode()
        machine_value = machine if isinstance(machine, RequestMachine) else RequestMachine.decode(bytes(machine))
        machine_raw = machine_value.encode()
        callback = bytes(callback)
        if request.request != self.request_address(request.requester, request.nonce)[0] or machine_value.machine_id() != request.machine_id:
            raise ValueError("request does not match its address or machine")
        if not 0 < deadline_slots < 1 << 64 or deadline_slots <= request.terms.challenge_window_slots:
            raise ValueError("request deadline must exceed the challenge window")
        if fee != 0 or bond != 0 or len(callback) != 32:
            raise ValueError("deployed request program requires zero fee and bond")
        callback_present = int(callback != bytes(32))
        if (callback_present and callback in (self.program, _key(c.SYSTEM_PROGRAM), machine_value.dcg_program)):
            raise ValueError("callback program is reserved")
        prompt_count = request.prompt_token_count
        if len(prompt_tokens) > prompt_count or machine_value.prompt_positions != prompt_count:
            raise ValueError("prompt count does not match TMC1")
        if any(type(token) is not int or not 0 <= token < machine_value.vocab for token in prompt_tokens):
            raise ValueError("prompt token is out of range")
        request_key = _key(request.request)
        prompt_key = self.prompt_address(request_key)[0]
        config_key = self.config_address()[0] if config is None else _key(config)
        data = (bytes([TAG_CREATE_REQUEST]) + trq1 + machine_raw + c.uint(deadline_slots, 8)
                + bytes([callback_present]) + callback + c.uint(fee, 8) + c.uint(bond, 8)
                + c.uint(len(prompt_tokens), 4) + b"".join(c.uint(token, 4) for token in prompt_tokens))
        return ix.instruction(self.program, data, [(request.requester, True, True),
                                                   (request_key, False, True), (config_key, False, False),
                                                   (prompt_key, False, True), (c.SYSTEM_PROGRAM, False, False)])

    def append_prompt(self, requester: KeyLike, request: KeyLike, offset: int,
                      tokens: Sequence[int]) -> Instruction:
        if offset < 0 or any(type(token) is not int or not 0 <= token < 1 << 32 for token in tokens):
            raise ValueError("prompt append is out of range")
        data = bytes([TAG_APPEND_PROMPT]) + c.uint(offset, 4) + b"".join(c.uint(token, 4) for token in tokens)
        return ix.instruction(self.program, data, [(requester, True, False), (request, False, True),
                                                   (self.prompt_address(request)[0], False, True)])

    def bind_document(self, executor: KeyLike, request: KeyLike, config: KeyLike, document: KeyLike,
                      result: KeyLike, pt2s: KeyLike, family_slots: KeyLike,
                      registry: KeyLike) -> Instruction:
        return ix.instruction(self.program, bytes([TAG_BIND_DOCUMENT]),
                              [(executor, True, False), (request, False, True), (config, False, False),
                               (document, False, False), (result, False, False),
                               (self.prompt_address(request)[0], False, False), (pt2s, False, False),
                               (family_slots, False, False), (registry, False, False)])

    def resolve(self, request: KeyLike, result: KeyLike, executor: KeyLike,
                callback_accounts: Sequence[tuple[KeyLike, bool, bool]] = ()) -> Instruction:
        accounts: list[tuple[KeyLike, bool, bool]] = [(request, False, True), (result, False, False),
                                                       (executor, False, False)]
        accounts.extend(callback_accounts)
        return ix.instruction(self.program, bytes([TAG_RESOLVE]), accounts)

    def read_request(self, request: KeyLike, *, commitment: str | None = None) -> RequestAccount:
        if self.rpc is None:
            raise RuntimeError("RPC client is required")
        account = self.rpc.read_account(request, commitment=commitment)
        if account is None:
            raise LookupError("request account is absent")
        if account.owner != Pubkey.from_bytes(self.program):
            raise ValueError("request account has the wrong owner")
        value = RequestAccount.decode(account.data)
        request_key = _key(request)
        address, bump = self.request_address(value.requester, value.nonce)
        if (address != request_key or value.bump != bump or value.request.request != request_key
                or value.prompt != self.prompt_address(request_key)[0]):
            raise ValueError("TCR1 does not match its request address")
        return value

    def read_request_account(self, request: KeyLike, *, commitment: str | None = None) -> RequestAccount:
        return self.read_request(request, commitment=commitment)


RequestProgram = RequestProgramClient
