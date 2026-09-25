"""Offline requester and consumer API tests."""
from __future__ import annotations

import hashlib

import pytest
from basanos_sdk import consensus as c
from basanos_sdk.consumer import decode_token, token_value, usable_tokens
from basanos_sdk.requester import RequestBlock, request_address


def request_fixture() -> RequestBlock:
    terms = c.DisputeTerms(90_000, 45_000, 1_000_000, 5_000_000, 5_000)
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
        terms=terms,
    )


def test_request_block_and_binding_are_stable() -> None:
    request = request_fixture()
    raw = request.encode()
    assert len(raw) == 328
    assert request.consumer_digest() == hashlib.sha256(b"basanos/tierc-request/1" + raw).digest()
    assert request.request == request_address(
        "9Dg7fWD2iidk5SxVKBKFy3etJiv89NV7u5HhuCkSgjPW",
        "DMbXxEWZ56waNzGrdSHRvchxFEdrGZmAvMSJmnpXdxND", 7)[0]
    binding = request.run_binding(bytes([5]) * 32, output_base_entry=28037)
    assert binding.request_id == request.request
    assert binding.output_first_position == 29 and binding.output_count == 2
    assert binding.encode()[:4] == b"DRB1"


def test_token_helpers_and_result_usable_gate() -> None:
    terms = c.DisputeTerms(1, 1, 0, 0, 0)
    binding = c.RunBinding(bytes([1]) * 32, bytes(32), bytes(32), bytes(32), 0, 2, 1, 0, 16)
    result = c.ResultV4.at_init(bytes([6]) * 32, binding, terms)
    assert not result.usable
    result.status = c.STATUS_FINAL
    result.document_root = bytes([7]) * 32
    result.outputs = [token_value(3), token_value(4)]
    assert result.usable and usable_tokens(result, vocab=10) == [3, 4]
    result.closed = 1
    assert usable_tokens(result, vocab=10) == [3, 4]
    with pytest.raises(ValueError):
        decode_token(bytes(15), 10)
