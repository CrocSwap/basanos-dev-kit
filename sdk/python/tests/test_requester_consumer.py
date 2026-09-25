"""Offline revision-7 requester and consumer API tests."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest
from basanos_sdk import consensus as c
from basanos_sdk.consumer import decode_token, token_value, usable_tokens
from basanos_sdk.requester import RequestBlock, RequestBlockV7, request_address
from basanos_sdk.request_program import RequestAccount, RequestMachine, RequestProgramClient


def run_terms() -> c.RunTerms:
    return c.RunTerms(90_000, 45_000, 1_000_000, 5_000_000, 5_000, bytes(32), 0, 2_592_000)


def request_fixture() -> RequestBlock:
    return RequestBlock.create(
        "9Dg7fWD2iidk5SxVKBKFy3etJiv89NV7u5HhuCkSgjPW",
        "DMbXxEWZ56waNzGrdSHRvchxFEdrGZmAvMSJmnpXdxND",
        nonce=7,
        prompt_token_count=30,
        max_new_tokens=2,
        prompt_commitment=bytes([2]) * 32,
        prompt_tokens=[1, 2, 3],
        tokenizer_sha256=bytes([3]) * 32,
        machine_id=bytes([4]) * 32,
        terms=run_terms(),
    )


def test_request_block_and_binding_are_stable() -> None:
    request = request_fixture()
    encoded = request.encode()
    assert len(encoded) == 376
    assert request.consumer_digest() == hashlib.sha256(b"basanos/tierc-request/2" + encoded).digest()
    assert request.request == request_address(
        "9Dg7fWD2iidk5SxVKBKFy3etJiv89NV7u5HhuCkSgjPW",
        "DMbXxEWZ56waNzGrdSHRvchxFEdrGZmAvMSJmnpXdxND", 7)[0]
    binding = request.run_binding(bytes([5]) * 32, output_base_entry=28037)
    assert binding.request_id == request.request
    assert binding.output_first_position == 29 and binding.output_count == 2
    assert binding.encode()[:4] == b"DRB1"


def test_token_helpers_and_result_usable_gate() -> None:
    terms = c.RunTerms(1, 1, 0, 0, 0, bytes(32), 0, 1)
    binding = c.RunBinding(bytes([1]) * 32, bytes(32), bytes(32), bytes(32), 0, 2, 1, 0, 16)
    result = c.ResultV5.at_init(bytes([6]) * 32, binding, terms)
    assert not result.usable
    result.status = c.STATUS_FINAL
    result.document_root = bytes([7]) * 32
    result.outputs = [token_value(3), token_value(4)]
    assert result.usable and usable_tokens(result, vocab=10) == [3, 4]
    result.document_closed = 1
    assert usable_tokens(result, vocab=10) == [3, 4]
    with pytest.raises(ValueError):
        decode_token(bytes(15), 10)


def _npr_plan() -> dict[str, dict]:
    path = Path(__file__).resolve().parents[3] / "tests/golden/tierc/npr_request_program.json"
    return json.loads(path.read_text())


def _assert_instruction(instruction, row: dict) -> None:
    assert bytes(instruction.data) == bytes.fromhex(row["data"])
    assert [(str(meta.pubkey), meta.is_signer, meta.is_writable) for meta in instruction.accounts] == [tuple(meta) for meta in row["metas"]]


def test_request_program_matches_npr_instruction_bytes_and_tcr1() -> None:
    plan = _npr_plan()
    create = bytes.fromhex(plan["request:create"]["data"])
    trq1, machine_raw = create[1:377], create[377:761]
    request = RequestBlockV7(
        request=trq1[8:40], requester=trq1[40:72], nonce=int.from_bytes(trq1[72:80], "little"),
        prompt_token_count=int.from_bytes(trq1[80:84], "little"),
        max_new_tokens=int.from_bytes(trq1[84:88], "little"),
        prompt_commitment=trq1[88:120], prompt_tokens_sha256=trq1[120:152],
        tokenizer_sha256=trq1[152:184], sampling_params=trq1[184:216], seed=trq1[216:248],
        machine_id=trq1[248:280], terms=c.RunTerms.decode(trq1[280:376]),
    )
    machine = RequestMachine.decode(machine_raw)
    client = RequestProgramClient("HdZX3FLaKhzXpoyhiwrHU6FKVtY1ySPRJcGR3GAxAfz2")
    assert request.sampling_params != bytes(32)
    _assert_instruction(client.create_request(
        request, machine, deadline_slots=int.from_bytes(create[761:769], "little"),
    ), plan["request:create"])
    for label in ("request:prompt:0", "request:prompt:200", "request:prompt:400"):
        row = plan[label]
        raw = bytes.fromhex(row["data"])
        offset = int.from_bytes(raw[1:5], "little")
        tokens = [int.from_bytes(raw[at:at + 4], "little") for at in range(5, len(raw), 4)]
        _assert_instruction(client.append_prompt(row["metas"][0][0], row["metas"][1][0], offset, tokens), row)
    bind = plan["request:bind"]["metas"]
    _assert_instruction(client.bind_document(
        bind[0][0], bind[1][0], bind[2][0], bind[3][0], bind[4][0], bind[6][0], bind[7][0], bind[8][0],
    ), plan["request:bind"])
    resolve = plan["request:resolve"]["metas"]
    _assert_instruction(client.resolve(*(meta[0] for meta in resolve)), plan["request:resolve"])
    account = bytearray(1072)
    account[:4] = b"TCR1"
    account[4:6] = (1).to_bytes(2, "little")
    account[8:40] = request.requester
    account[40:48] = request.nonce.to_bytes(8, "little")
    account[48:56] = (10).to_bytes(8, "little")
    account[56:64] = (1_000_010).to_bytes(8, "little")
    account[64:96] = request.consumer_digest()
    account[96:472] = trq1
    account[472:856] = machine_raw
    account[856:888] = client.prompt_address(request.request)[0]
    account[7] = client.request_address(request.requester, request.nonce)[1]
    decoded = RequestAccount.decode(account)
    assert len(account) == 1072
    assert decoded.request.encode() == trq1 and decoded.machine.encode() == machine_raw
    with pytest.raises(ValueError):
        RequestAccount.decode(account[:-1])
