"""Watcher-side monitoring and challenge-descent helpers."""
from __future__ import annotations

import hashlib
from collections.abc import Sequence
from dataclasses import dataclass

from solders.instruction import Instruction
from solders.keypair import Keypair
from solders.pubkey import Pubkey

from . import consensus as c
from . import instructions as ix
from .transport import RpcClient


@dataclass(frozen=True)
class WatcherAccounts:
    dcg_program: bytes
    pt2s: bytes
    pt1s: bytes
    routes: bytes
    geometry: bytes
    registry: bytes
    pt2s_sha256: bytes | None = None

    @classmethod
    def create(cls, dcg_program: Pubkey | str | bytes | bytearray, *, pt2s: Pubkey | str | bytes | bytearray,
               pt1s: Pubkey | str | bytes | bytearray, routes: Pubkey | str | bytes | bytearray,
               geometry: Pubkey | str | bytes | bytearray, registry: Pubkey | str | bytes | bytearray,
               pt2s_sha256: bytes | None = None) -> WatcherAccounts:
        return cls(c.key_bytes(dcg_program), c.key_bytes(pt2s), c.key_bytes(pt1s), c.key_bytes(routes),
                   c.key_bytes(geometry), c.key_bytes(registry), bytes(pt2s_sha256) if pt2s_sha256 is not None else None)


@dataclass(frozen=True)
class DescentRound:
    descendants: tuple[bytes, ...]
    tree_root: bytes | None
    choice: int
    fixpoint: bool = False


@dataclass(frozen=True)
class ChallengeHandle:
    descriptor: bytes
    record: bytes
    nonce: int
    position: int
    instruction: Instruction
    response: bytes = b""


class Watcher:
    """Read document state and construct challenge/descent instructions."""

    def __init__(self, rpc: RpcClient, dcg_program: Pubkey | str | bytes | bytearray, accounts: WatcherAccounts) -> None:
        self.rpc = rpc
        self.accounts = accounts

    def book(self, descriptor: bytes, *, challenger: Pubkey | str | bytes | bytearray | None = None,
             nonce: int = 0, position_count: int | None = None) -> c.AddressBook:
        return c.addresses(self.accounts.dcg_program, descriptor=descriptor, pt2s=self.accounts.pt2s,
                           pt2s_sha256=self.accounts.pt2s_sha256, challenger=challenger,
                           nonce=nonce, registry=self.accounts.registry, position_count=position_count)

    def read_document(self, descriptor: bytes) -> c.Dcm2V5:
        book = self.book(descriptor)
        account = self.rpc.read_account(book.document[0])
        if account is None:
            raise LookupError("document account is absent")
        return c.Dcm2V5.decode(account.data)

    def positions(self, descriptor: bytes) -> list[bytes]:
        book = self.book(descriptor)
        account = self.rpc.read_account(book.positions[0])
        if account is None:
            raise LookupError("positions account is absent")
        _descriptor, roots = c.decode_dpr2(account.data, allow_partial=True)
        return roots

    def list_positions(self, descriptor: bytes) -> list[tuple[int, bytes]]:
        return list(enumerate(self.positions(descriptor)))

    def pick_sample(self, descriptor: bytes, position_count: int, *, nonce: int = 0) -> int:
        if position_count < 1 or not 0 <= nonce < 1 << 64:
            raise ValueError("invalid position count or nonce")
        value = hashlib.sha256(c.digest(descriptor) + c.uint(nonce, 8)).digest()
        return int.from_bytes(value[:8], "little") % position_count

    def open_position(self, descriptor: bytes, challenger: Pubkey | str | bytes | bytearray, position: int,
                      *, response_length: int, nonce: int) -> ChallengeHandle:
        who = c.key_bytes(challenger)
        book = self.book(descriptor, challenger=who, nonce=nonce)
        record = book.challenge[0]
        data = c.encode_challenge_position(descriptor, position, response_length, nonce)
        instruction = ix.challenge_position(self.accounts.dcg_program, record, who, book.document[0], book.positions[0],
                                            self.accounts.pt2s, self.accounts.routes, self.accounts.geometry,
                                            self.accounts.registry, self.accounts.pt1s, data)
        return ChallengeHandle(descriptor, record, nonce, position, instruction, book.response[0])

    def open_leaf(self, descriptor: bytes, challenger: Pubkey | str | bytes | bytearray, *, position: int,
                  segment: int, local: int, leaf: bytes, path: Sequence[bytes], spp1: bytes,
                  response_length: int, nonce: int) -> ChallengeHandle:
        who = c.key_bytes(challenger)
        book = self.book(descriptor, challenger=who, nonce=nonce)
        record = book.challenge[0]
        data = c.encode_challenge_leaf(descriptor, position, segment, local, leaf, path, spp1, response_length, nonce)
        instruction = ix.challenge_leaf(self.accounts.dcg_program, record, who, book.document[0], book.positions[0],
                                        self.accounts.pt2s, self.accounts.routes, self.accounts.geometry,
                                        self.accounts.registry, self.accounts.pt1s, data)
        return ChallengeHandle(descriptor, record, nonce, position, instruction, book.response[0])

    def reveal_position(self, handle: ChallengeHandle, executor: Pubkey | str | bytes | bytearray,
                        first: int, roots: Sequence[bytes]) -> Instruction:
        book = self.book(handle.descriptor)
        return ix.reveal_position(self.accounts.dcg_program, handle.record, executor, book.document[0], book.positions[0],
                                  self.accounts.pt2s, self.accounts.routes, self.accounts.geometry, first, roots)

    def select_segment(self, handle: ChallengeHandle, challenger: Pubkey | str | bytes | bytearray,
                       ordinal: int) -> Instruction:
        book = self.book(handle.descriptor)
        return ix.select_segment(self.accounts.dcg_program, handle.record, challenger, book.document[0],
                                 self.accounts.pt2s, self.accounts.routes, self.accounts.geometry, ordinal)

    def close_response(self, handle: ChallengeHandle, executor: Pubkey | str | bytes | bytearray) -> Instruction:
        response = handle.response or c.pda(self.accounts.dcg_program, c.RESPONSE_SEED, handle.record)[0]
        return ix.close_response(self.accounts.dcg_program, handle.record, response, executor)

    def settle(self, handle: ChallengeHandle, winner: Pubkey | str | bytes | bytearray,
               challenger: Pubkey | str | bytes | bytearray,
               executor: Pubkey | str | bytes | bytearray | None = None) -> Instruction:
        response = handle.response or c.pda(self.accounts.dcg_program, c.RESPONSE_SEED, handle.record)[0]
        executor = self.read_challenge(handle.record)["executor"] if executor is None else executor
        book = self.book(handle.descriptor)
        return ix.settle(self.accounts.dcg_program, handle.record, response, winner, executor,
                         book.document[0], challenger)

    def _fixpoint_accounts(self) -> list[tuple[bytes, bool, bool]]:
        return [(self.accounts.pt2s, False, False), (self.accounts.routes, False, False),
                (self.accounts.geometry, False, False), (self.accounts.registry, False, False),
                (self.accounts.pt1s, False, False)]

    def descent_instructions(self, handle: ChallengeHandle, executor: Pubkey | str | bytes | bytearray,
                             challenger: Pubkey | str | bytes | bytearray,
                             rounds: Sequence[DescentRound]) -> tuple[Instruction, ...]:
        book = self.book(handle.descriptor)
        result: list[Instruction] = []
        for round_ in rounds:
            fixpoint = self._fixpoint_accounts() if round_.fixpoint else None
            result.append(ix.reveal_descent(self.accounts.dcg_program, handle.record, executor, book.document[0],
                                            round_.descendants, round_.tree_root, fixpoint_accounts=fixpoint))
            result.append(ix.descend(self.accounts.dcg_program, handle.record, challenger, book.document[0],
                                     round_.choice, fixpoint_accounts=fixpoint, document_writable=round_.fixpoint))
        return tuple(result)

    def follow_descent(self, handle: ChallengeHandle, executor: Pubkey | str | bytes | bytearray,
                       challenger: Pubkey | str | bytes | bytearray,
                       rounds: Sequence[DescentRound]) -> tuple[Instruction, ...]:
        return self.descent_instructions(handle, executor, challenger, rounds)

    def read_challenge(self, record: Pubkey | str | bytes | bytearray) -> dict:
        account = self.rpc.read_account(record)
        if account is None:
            raise LookupError("challenge account is absent")
        return c.decode_challenge_record(account.data)

    def ruling(self, record: Pubkey | str | bytes | bytearray) -> dict:
        state = self.read_challenge(record)
        if state["phase"] != c.PHASE_RULED:
            raise RuntimeError("challenge is not ruled")
        return state

    def events(self, signature: str) -> list[dict]:
        return self.rpc.events_from_logs(signature, program=self.accounts.dcg_program)

    def send(self, instruction: Instruction, payer: Keypair, signers: Sequence[Keypair] = ()) -> str:
        receipt = self.rpc.send_transaction([instruction], payer, signers)
        return receipt.signature
