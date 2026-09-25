"""Offline tests for the bounded RPC transport."""
from __future__ import annotations

import base64
import json
import tempfile
from pathlib import Path

import pytest
from basanos_sdk import consensus as c
from basanos_sdk.transport import RpcBodyTooLarge, RpcClient, load_keypair
from solders.hash import Hash
from solders.keypair import Keypair
from solders.system_program import transfer


class Response:
    def __init__(self, value: dict) -> None:
        self.value = value

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self.value


class FakeClient:
    def __init__(self, responses: list[dict]) -> None:
        self.responses = list(responses)
        self.requests: list[bytes] = []
        self.closed = False

    def post(self, _endpoint: str, *, content: bytes, headers: dict) -> Response:
        self.requests.append(content)
        return Response(self.responses.pop(0))

    def close(self) -> None:
        self.closed = True


def rpc(responses: list[dict]) -> tuple[RpcClient, FakeClient]:
    fake = FakeClient(responses)
    return RpcClient("https://rpc.invalid", client=fake), fake


def test_body_limit_is_checked_before_transport() -> None:
    client, fake = rpc([{"jsonrpc": "2.0", "id": 1, "result": "ok"}])
    with pytest.raises(RpcBodyTooLarge):
        client.call("custom", ["x" * 52_000])
    assert fake.requests == []


def test_account_and_log_decoding() -> None:
    raw = b"DCR2" + bytes(3)
    encoded = base64.b64encode(raw).decode()
    address = "11111111111111111111111111111111"
    client, fake = rpc([
        {"jsonrpc": "2.0", "id": 1, "result": {"data": [encoded, "base64"], "owner": address, "lamports": 7}},
        {"jsonrpc": "2.0", "id": 2, "result": {"meta": {"logMessages": [
            f"Program {address} invoke [1]", "Program data: " + base64.b64encode(c.encode_event(
                "resolve", descriptor=bytes(32), slot=9, status=1, challenger_wins=0, outputs_attested=0)).decode(),
        ]}}},
    ])
    account = client.read_account(address)
    assert account is not None and account.data == raw and account.lamports == 7
    assert client.events_from_logs("signature", program=address)[0]["kind"] == "resolve"
    assert len(fake.requests) == 2


def test_events_from_failed_transaction_are_ignored() -> None:
    address = "11111111111111111111111111111111"
    event = base64.b64encode(c.encode_event(
        "resolve", descriptor=bytes(32), slot=9, status=1, challenger_wins=0, outputs_attested=0)).decode()
    client, _fake = rpc([{"jsonrpc": "2.0", "id": 1, "result": {"meta": {"err": {"InstructionError": "x"},
                                                                         "logMessages": [
                                                                             f"Program {address} invoke [1]",
                                                                             "Program data: " + event,
                                                                         ]}}}])
    assert client.events_from_logs("signature", program=address) == []


def test_transaction_signing_and_confirmation() -> None:
    payer = Keypair.from_seed(bytes([1]) * 32)
    receiver = Keypair.from_seed(bytes([2]) * 32).pubkey()
    instruction = transfer({"from_pubkey": payer.pubkey(), "to_pubkey": receiver, "lamports": 1})
    blockhash = Hash.from_string("11111111111111111111111111111111")
    fake = FakeClient([
        {"jsonrpc": "2.0", "id": 1, "result": "signature"},
        {"jsonrpc": "2.0", "id": 2, "result": {"value": [{"slot": 12, "confirmationStatus": "confirmed"}]}},
    ])
    client = RpcClient("https://rpc.invalid", client=fake)
    transaction = client.build_transaction([instruction], payer, blockhash=blockhash)
    assert len(bytes(transaction)) > 0
    receipt = client.send_raw_transaction(bytes(transaction))
    assert receipt.signature == "signature"
    assert client.confirm("signature", poll_interval=0, sleep=lambda _: None).slot == 12


def test_key_file_mode_is_enforced_without_exposing_key() -> None:
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "key.json"
        key = Keypair.from_seed(bytes([3]) * 32)
        path.write_text(json.dumps(list(key.to_bytes())))
        path.chmod(0o644)
        with pytest.raises(ValueError) as error:
            load_keypair(path)
        assert str(path) not in str(error.value)
        path.chmod(0o600)
        assert load_keypair(path).pubkey() == key.pubkey()
