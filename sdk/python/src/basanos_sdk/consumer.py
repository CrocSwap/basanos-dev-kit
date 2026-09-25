"""Consumer-side result and event verification helpers."""
from __future__ import annotations

import struct
from dataclasses import dataclass

from solders.pubkey import Pubkey

from . import consensus as c
from .transport import RpcClient


@dataclass(frozen=True)
class ConsumerView:
    result: c.ResultV5
    events: tuple[dict, ...]


class Consumer:
    """Read DCR2 records, DLE1 events, and validate output attestations."""

    def __init__(self, rpc: RpcClient, dcg_program: Pubkey | str | bytes | bytearray) -> None:
        self.rpc = rpc
        self.dcg_program = c.key_bytes(dcg_program)

    def result_address(self, descriptor: bytes) -> bytes:
        return c.addresses(self.dcg_program, descriptor=descriptor).result[0]

    def read_result(self, descriptor: bytes) -> c.ResultV5:
        account = self.rpc.read_account(self.result_address(descriptor))
        if account is None:
            raise LookupError("result account is absent")
        if account.data[:4] == b"DCRZ":
            raise ValueError("result has been replaced by a DCRZ tombstone")
        return c.ResultV5.decode(account.data)

    def events(self, signature: str) -> list[dict]:
        return self.rpc.events_from_logs(signature, program=self.dcg_program)

    def view(self, descriptor: bytes, signature: str) -> ConsumerView:
        return ConsumerView(self.read_result(descriptor), tuple(self.events(signature)))

    def verify_output(self, data: bytes, *, position: int, segment_count: int, segment: int, entries: int,
                      local: int, region: int, offset: int, landed_root: bytes, width: int,
                      expected_table_root: bytes | None = None, expected_index: int | None = None,
                      expected_descriptor: bytes | None = None) -> dict:
        return c.verify_attestation(data, width=width, position=position, segment_count=segment_count,
                                    segment=segment, entries=entries, local=local, region=region, offset=offset,
                                    landed_root=landed_root, expected_table_root=expected_table_root,
                                    expected_index=expected_index, expected_descriptor=expected_descriptor)

    def tokens(self, result: c.ResultV5, *, vocab: int) -> list[int]:
        return usable_tokens(result, vocab=vocab)


def decode_token(value: bytes, vocab: int) -> int:
    # Bytes 0..8 hold the argmax best score (i64); only the token at 8..16 is the output.
    if len(value) != 16:
        raise ValueError(c.OUTPUT_PROOF)
    token = int.from_bytes(value[8:16], "little", signed=True)
    if not 0 <= token < vocab:
        raise ValueError(c.OUTPUT_PROOF)
    return token


def token_value(token: int) -> bytes:
    if not 0 <= token < (1 << 63):
        raise ValueError("token out of range")
    return bytes(8) + struct.pack("<q", token)


def usable_tokens(result: c.ResultV5, *, vocab: int) -> list[int]:
    if result.status not in c.USABLE_STATUSES or result.document_root == bytes(32):
        raise ValueError("result is not usable")
    if result.outputs is None or result.outputs_attested != result.output_count:
        raise ValueError(c.OUTPUT_PROOF)
    return [decode_token(value, vocab) for value in result.outputs if value is not None]
