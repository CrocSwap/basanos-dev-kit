"""Requester-side SDK for building DCG document transactions."""
from __future__ import annotations

import hashlib
from collections.abc import Sequence
from dataclasses import dataclass

from solders.pubkey import Pubkey

from . import consensus as c
from . import instructions as ix
from .transport import RpcClient

REQUEST_SEED = b"tco-request"
CONSUMER_DOMAIN = b"basanos/tierc-request/1"
TRQ1_BYTES = 328
CONSUMER_DOMAIN_V7 = b"basanos/tierc-request/2"
TRQ1_V7_BYTES = 376
TOKEN_WIDTH = 16
SAMPLER_GREEDY = 0


def _key(value: Pubkey | str | bytes | bytearray) -> bytes:
    return c.key_bytes(value)


def hash_prompt_tokens(tokens: Sequence[int]) -> bytes:
    return hashlib.sha256(b"".join(c.uint(int(token), 4) for token in tokens)).digest()


prompt_tokens_sha256 = hash_prompt_tokens


def request_address(program: Pubkey | str | bytes | bytearray, requester: Pubkey | str | bytes | bytearray,
                    nonce: int) -> tuple[bytes, int]:
    return c.pda(program, REQUEST_SEED, _key(requester), c.uint(nonce, 8))


@dataclass(frozen=True)
class RequestBlockV6:
    """The Tier C request block committed by ``consumer_digest``."""

    request: bytes
    requester: bytes
    nonce: int
    prompt_token_count: int
    max_new_tokens: int
    prompt_commitment: bytes
    prompt_tokens_sha256: bytes
    tokenizer_sha256: bytes
    machine_id: bytes
    terms: c.DisputeTerms
    sampler_form: int = SAMPLER_GREEDY
    sampling_params: bytes = bytes(32)
    seed: bytes = bytes(32)

    @classmethod
    def create(cls, request_program: Pubkey | str | bytes | bytearray, requester: Pubkey | str | bytes | bytearray,
               *, nonce: int, prompt_token_count: int, max_new_tokens: int, prompt_commitment: bytes,
               prompt_tokens: Sequence[int] | None = None, prompt_tokens_sha256: bytes | None = None,
               tokenizer_sha256: bytes, machine_id: bytes, terms: c.DisputeTerms,
               sampler_form: int = SAMPLER_GREEDY, sampling_params: bytes = bytes(32),
               seed: bytes = bytes(32), request_id: bytes | None = None) -> RequestBlockV6:
        requester_bytes = _key(requester)
        derived, _bump = request_address(request_program, requester_bytes, nonce)
        selected_hash = hash_prompt_tokens(prompt_tokens) if prompt_tokens is not None else prompt_tokens_sha256
        if prompt_tokens is not None and prompt_tokens_sha256 is not None and selected_hash != prompt_tokens_sha256:
            raise ValueError("prompt token hash does not match prompt tokens")
        if selected_hash is None:
            raise ValueError("prompt token hash is required")
        if request_id is not None and bytes(request_id) != derived:
            raise ValueError("request id is not the derived request account")
        result = cls(derived, requester_bytes, nonce,
                     prompt_token_count, max_new_tokens, bytes(prompt_commitment), bytes(selected_hash),
                     bytes(tokenizer_sha256), bytes(machine_id), terms, sampler_form, bytes(sampling_params), bytes(seed))
        result.validate()
        return result

    def validate(self) -> None:
        zero = bytes(32)
        if (self.sampler_form != SAMPLER_GREEDY or self.sampling_params != zero or self.seed != zero
                or self.prompt_token_count < 1 or self.max_new_tokens < 1 or self.tokenizer_sha256 == zero
                or self.request == zero or self.requester == zero or self.prompt_commitment == zero
                or len(self.prompt_tokens_sha256) != 32 or len(self.machine_id) != 32):
            raise ValueError("malformed TRQ1")

    def encode(self) -> bytes:
        self.validate()
        out = (b"TRQ1" + c.uint(1, 2) + c.uint(self.sampler_form, 1) + b"\0" + c.digest(self.request)
               + c.digest(self.requester) + c.uint(self.nonce, 8) + c.uint(self.prompt_token_count, 4)
               + c.uint(self.max_new_tokens, 4) + c.digest(self.prompt_commitment) + c.digest(self.prompt_tokens_sha256)
               + c.digest(self.tokenizer_sha256) + c.digest(self.sampling_params) + c.digest(self.seed)
               + c.digest(self.machine_id) + self.terms.encode())
        if len(out) != TRQ1_BYTES:
            raise AssertionError("TRQ1 length")
        return out

    def consumer_digest(self) -> bytes:
        return hashlib.sha256(CONSUMER_DOMAIN + self.encode()).digest()

    def run_binding(self, executor: Pubkey | str | bytes | bytearray, *, output_base_entry: int,
                    output_write: int = 0, output_width: int = TOKEN_WIDTH) -> c.RunBinding:
        return c.RunBinding(_key(executor), self.request, self.consumer_digest(), self.seed,
                            self.prompt_token_count - 1, self.max_new_tokens, output_base_entry, output_write,
                            output_width)


@dataclass(frozen=True)
class RequestBlockV7:
    request: bytes
    requester: bytes
    nonce: int
    prompt_token_count: int
    max_new_tokens: int
    prompt_commitment: bytes
    prompt_tokens_sha256: bytes
    tokenizer_sha256: bytes
    machine_id: bytes
    terms: c.RunTerms
    sampler_form: int = SAMPLER_GREEDY
    sampling_params: bytes = bytes(32)
    seed: bytes = bytes(32)

    @classmethod
    def create(cls, request_program: Pubkey | str | bytes | bytearray, requester: Pubkey | str | bytes | bytearray,
               *, nonce: int, prompt_token_count: int, max_new_tokens: int, prompt_commitment: bytes,
               prompt_tokens: Sequence[int] | None = None, prompt_tokens_sha256: bytes | None = None,
               tokenizer_sha256: bytes, machine_id: bytes, terms: c.RunTerms,
               sampler_form: int = SAMPLER_GREEDY, sampling_params: bytes = bytes(32),
               seed: bytes = bytes(32), request_id: bytes | None = None) -> RequestBlockV7:
        requester_bytes = _key(requester)
        derived, _bump = request_address(request_program, requester_bytes, nonce)
        selected_hash = hash_prompt_tokens(prompt_tokens) if prompt_tokens is not None else prompt_tokens_sha256
        if prompt_tokens is not None and prompt_tokens_sha256 is not None and selected_hash != prompt_tokens_sha256:
            raise ValueError("prompt token hash does not match prompt tokens")
        if selected_hash is None:
            raise ValueError("prompt token hash is required")
        if request_id is not None and bytes(request_id) != derived:
            raise ValueError("request id is not the derived request account")
        result = cls(derived, requester_bytes, nonce, prompt_token_count, max_new_tokens,
                     bytes(prompt_commitment), bytes(selected_hash), bytes(tokenizer_sha256), bytes(machine_id),
                     terms, sampler_form, bytes(sampling_params), bytes(seed))
        result.validate()
        return result

    def validate(self) -> None:
        zero = bytes(32)
        if (self.sampler_form != SAMPLER_GREEDY or len(self.sampling_params) != 32
                or any(self.sampling_params[4:]) or self.seed != zero
                or self.prompt_token_count < 1 or self.max_new_tokens < 1 or self.tokenizer_sha256 == zero
                or self.request == zero or self.requester == zero or self.prompt_commitment == zero
                or len(self.prompt_tokens_sha256) != 32 or len(self.machine_id) != 32
                or c.check_run_terms(self.terms) != 0):
            raise ValueError("malformed TRQ1 v7")

    def encode(self) -> bytes:
        self.validate()
        out = (b"TRQ1" + c.uint(1, 2) + c.uint(self.sampler_form, 1) + b"\0" + c.digest(self.request)
               + c.digest(self.requester) + c.uint(self.nonce, 8) + c.uint(self.prompt_token_count, 4)
               + c.uint(self.max_new_tokens, 4) + c.digest(self.prompt_commitment) + c.digest(self.prompt_tokens_sha256)
               + c.digest(self.tokenizer_sha256) + c.digest(self.sampling_params) + c.digest(self.seed)
               + c.digest(self.machine_id) + self.terms.encode())
        if len(out) != TRQ1_V7_BYTES:
            raise AssertionError("TRQ1 v7 length")
        return out

    def consumer_digest(self) -> bytes:
        return hashlib.sha256(CONSUMER_DOMAIN_V7 + self.encode()).digest()

    def run_binding(self, executor: Pubkey | str | bytes | bytearray, *, output_base_entry: int,
                    output_write: int = 0, output_width: int = TOKEN_WIDTH) -> c.RunBinding:
        return c.RunBinding(_key(executor), self.request, self.consumer_digest(), self.seed,
                            self.prompt_token_count - 1, self.max_new_tokens, output_base_entry, output_write,
                            output_width)


def run_binding_for_v7(block: RequestBlockV7, *, executor: Pubkey | str | bytes | bytearray,
                       output_base_entry: int, output_write: int = 0,
                       output_width: int = TOKEN_WIDTH) -> c.RunBinding:
    return block.run_binding(executor, output_base_entry=output_base_entry, output_write=output_write,
                            output_width=output_width)


RequestBlock = RequestBlockV7
Request = RequestBlock


@dataclass(frozen=True)
class DocumentAccounts:
    """Public account identities required by UnifiedInit and its result record."""

    dcg_program: bytes
    executor: bytes
    pt2s: bytes
    pt1s: bytes
    routes: bytes
    geometry: bytes
    payloads: bytes
    registry: bytes
    admission: bytes
    template_seal: bytes
    pt2s_sha256: bytes | None = None

    @classmethod
    def create(cls, dcg_program: Pubkey | str | bytes | bytearray, executor: Pubkey | str | bytes | bytearray,
               *, pt2s: Pubkey | str | bytes | bytearray, pt1s: Pubkey | str | bytes | bytearray,
               routes: Pubkey | str | bytes | bytearray, geometry: Pubkey | str | bytes | bytearray,
               payloads: Pubkey | str | bytes | bytearray, registry: Pubkey | str | bytes | bytearray,
               admission: Pubkey | str | bytes | bytearray, template_seal: Pubkey | str | bytes | bytearray,
               pt2s_sha256: bytes | None = None) -> DocumentAccounts:
        return cls(_key(dcg_program), _key(executor), _key(pt2s), _key(pt1s), _key(routes), _key(geometry),
                   _key(payloads), _key(registry), _key(admission), _key(template_seal),
                   bytes(pt2s_sha256) if pt2s_sha256 is not None else None)

    def address_book(self, descriptor: bytes) -> c.AddressBook:
        return c.addresses(self.dcg_program, descriptor=descriptor, pt2s=self.pt2s,
                           pt2s_sha256=self.pt2s_sha256, registry=self.registry)


@dataclass(frozen=True)
class DocumentPlan:
    descriptor: bytes
    addresses: c.AddressBook
    init: ix.Instruction
    landing: tuple[ix.Instruction, ...]
    finalize: ix.Instruction

    def all_instructions(self) -> tuple[ix.Instruction, ...]:
        return (self.init, *self.landing, self.finalize)


class Requester:
    """Build request and document transactions without retaining private keys."""

    def __init__(self, dcg_program: Pubkey | str | bytes | bytearray, *, rpc: RpcClient | None = None) -> None:
        self.dcg_program = _key(dcg_program)
        self.rpc = rpc

    def request(self, request_program: Pubkey | str | bytes | bytearray,
                requester: Pubkey | str | bytes | bytearray, **kwargs) -> RequestBlock:
        return RequestBlock.create(request_program, requester, **kwargs)

    def document_plan(self, request: RequestBlock, accounts: DocumentAccounts, spec: c.DescriptorSpec,
                      family_body: bytes, *, position_roots: Sequence[bytes] = (), family_roots: Sequence[bytes] = (),
                      land_batch_size: int | None = None) -> DocumentPlan:
        if (spec.binding.request_id != request.request or spec.binding.consumer_digest != request.consumer_digest()
                or spec.terms != request.terms or spec.binding.executor != accounts.executor
                or spec.binding.seed != request.seed
                or spec.binding.output_first_position != request.prompt_token_count - 1
                or spec.binding.output_count != request.max_new_tokens
                or spec.binding.output_width != TOKEN_WIDTH
                or bytes(family_body) != bytes(spec.family_body)):
            raise ValueError("descriptor binding does not answer request")
        descriptor = spec.digest()
        book = c.addresses(accounts.dcg_program, descriptor=descriptor, registry=accounts.registry,
                           position_count=spec.position_count)
        init = ix.unified_init(accounts.dcg_program, accounts.executor, book.document[0], book.positions[0],
                               book.family_slots[0], c.SYSTEM_PROGRAM, accounts.pt2s, accounts.routes,
                               accounts.geometry, accounts.payloads, accounts.registry, accounts.admission,
                               accounts.template_seal, book.result[0], request.terms, spec.binding,
                               spec.model_root, spec.position_table_root, spec.prompt_commitment, family_body)
        batch = land_batch_size or c.max_land_batch()
        landing = tuple(ix.land_position_roots(accounts.dcg_program, accounts.executor, book.document[0],
                                               book.positions[0], descriptor, first, position_roots[first:first + batch])
                        for first in range(0, len(position_roots), batch))
        finalize = ix.finalize_document(accounts.dcg_program, accounts.executor, book.document[0], book.result[0],
                                       descriptor, family_roots)
        return DocumentPlan(descriptor, book, init, landing, finalize)

    def attest_output(self, accounts: DocumentAccounts, descriptor: bytes, data: bytes, *,
                      signer: Pubkey | str | bytes | bytearray) -> ix.Instruction:
        book = c.addresses(accounts.dcg_program, descriptor=descriptor)
        return ix.attest_output(accounts.dcg_program, signer, book.document[0], book.positions[0], book.result[0],
                                accounts.pt2s, accounts.routes, accounts.geometry, data)

    def resolve(self, accounts: DocumentAccounts, descriptor: bytes) -> ix.Instruction:
        book = c.addresses(accounts.dcg_program, descriptor=descriptor)
        return ix.resolve_result(accounts.dcg_program, book.document[0], book.result[0], descriptor)

    def read_result(self, descriptor: bytes) -> c.ResultV5:
        if self.rpc is None:
            raise RuntimeError("RPC client is required")
        book = c.addresses(self.dcg_program, descriptor=descriptor)
        account = self.rpc.read_account(book.result[0])
        if account is None:
            raise LookupError("result account is absent")
        if account.data[:4] == b"DCRZ":
            raise ValueError("result has been replaced by a DCRZ tombstone")
        return c.ResultV5.decode(account.data)
