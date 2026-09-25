"""Compare SDK instruction builders with a checked revision-7 lifecycle plan.

The retained plan is an external experiment receipt, not a source import. Set
``BASANOS_LIFECYCLE_PLAN`` to its ``plan.jsonl`` path when running in a fresh
checkout; the test is skipped when the receipt is unavailable.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import pytest
from basanos_sdk import consensus as c
from basanos_sdk import instructions as ix
from solders.pubkey import Pubkey

CANDIDATES = [
    Path(value) for value in [os.environ.get("BASANOS_LIFECYCLE_PLAN", "")] if value
]
PLAN = next((path for path in CANDIDATES if path.exists()), None)
pytestmark = pytest.mark.skipif(PLAN is None, reason="retained lifecycle plan is unavailable")


@pytest.fixture(scope="module")
def rows() -> dict[str, dict]:
    value = {row["label"]: row for row in (json.loads(line) for line in PLAN.read_text().splitlines()) if "label" in row}
    init = value.get("H:init")
    if init is None or len(bytes.fromhex(init["data"])) != 533 or bytes.fromhex(init["data"])[1:5] != b"DDT2":
        pytest.skip("retained lifecycle plan is not revision 7")
    return value


def address(row: dict, index: int) -> Pubkey:
    return Pubkey.from_string(row["metas"][index][0])


def assert_instruction(instruction, row: dict) -> None:
    assert str(instruction.program_id) == row["program"]
    assert bytes(instruction.data).hex() == row["data"]
    actual = [(str(meta.pubkey), meta.is_signer, meta.is_writable) for meta in instruction.accounts]
    expected = [(value, bool(signer), bool(writable)) for value, signer, writable in row["metas"]]
    assert actual == expected


def test_revision_lifecycle_builders_match_plan_bytes(rows: dict[str, dict]) -> None:
    program = Pubkey.from_string(rows["H:init"]["program"])
    init_row = rows["H:init"]
    executor = address(init_row, 0)
    document = address(init_row, 1)
    positions = address(init_row, 2)
    family_slots = address(init_row, 3)
    pt2s, routes, geometry, payloads, registry, admission, seal, result = (address(init_row, index) for index in (5, 6, 7, 8, 9, 10, 11, 12))
    init_data = bytes.fromhex(init_row["data"])
    terms = c.RunTerms.decode(init_data[1:97])
    binding = c.RunBinding.decode(init_data[97:257])
    family_body = init_data[353:]
    got_init = ix.unified_init(program, executor, document, positions, family_slots, c.SYSTEM_PROGRAM, pt2s, routes,
                               geometry, payloads, registry, admission, seal, result, terms, binding,
                               init_data[257:289], init_data[289:321], init_data[321:353], family_body)
    assert_instruction(got_init, init_row)

    land_row = rows["H:land:0"]
    land_data = bytes.fromhex(land_row["data"])
    first = int.from_bytes(land_data[33:37], "little")
    count = land_data[37]
    roots = [land_data[38 + 32 * index:70 + 32 * index] for index in range(count)]
    assert_instruction(ix.land_position_roots(program, address(land_row, 0), address(land_row, 1), address(land_row, 2),
                                                land_data[1:33], first, roots), land_row)

    finalize_row = rows["H:finalize"]
    finalize_data = bytes.fromhex(finalize_row["data"])
    family_count = int.from_bytes(finalize_data[33:35], "little")
    family_roots = [finalize_data[35 + 32 * index:67 + 32 * index] for index in range(family_count)]
    assert_instruction(ix.finalize_document(program, address(finalize_row, 0), address(finalize_row, 1), address(finalize_row, 2),
                                            finalize_data[1:33], family_roots), finalize_row)

    open_row = rows["A:open"]
    open_data = bytes.fromhex(open_row["data"])
    position = int.from_bytes(open_data[33:37], "little")
    nonce = int.from_bytes(open_data[37:41], "little")
    assert_instruction(ix.challenge_position(program, address(open_row, 0), address(open_row, 1), address(open_row, 2),
                                             address(open_row, 3), address(open_row, 5), address(open_row, 6), address(open_row, 7),
                                             address(open_row, 8), open_data[1:33], position, nonce), open_row)

    reveal_row = rows["A:reveal:0"]
    reveal_data = bytes.fromhex(reveal_row["data"])
    first = int.from_bytes(reveal_data[1:3], "little")
    count = reveal_data[3]
    roots = [reveal_data[4 + 32 * index:36 + 32 * index] for index in range(count)]
    assert_instruction(ix.reveal_position(program, address(reveal_row, 0), address(reveal_row, 1), address(reveal_row, 2),
                                          address(reveal_row, 3), address(reveal_row, 4), address(reveal_row, 5), address(reveal_row, 6),
                                          first, roots), reveal_row)

    select_row = rows["A:select"]
    select_data = bytes.fromhex(select_row["data"])
    assert_instruction(ix.select_segment(program, address(select_row, 0), address(select_row, 1), address(select_row, 2),
                                         address(select_row, 3), address(select_row, 4), address(select_row, 5),
                                         int.from_bytes(select_data[1:3], "little")), select_row)

    descent_reveal_row = rows["A:descent-reveal:0"]
    descent_data = bytes.fromhex(descent_reveal_row["data"])
    count = descent_data[1]
    at = 2 + (32 if count else 0)
    descendants = [descent_data[at + 32 * index:at + 32 * (index + 1)] for index in range(count)]
    tree_root = descent_data[2:34] if count else None
    got = ix.reveal_descent(program, address(descent_reveal_row, 0), address(descent_reveal_row, 1), address(descent_reveal_row, 2),
                            descendants, tree_root)
    assert_instruction(got, descent_reveal_row)

    descent_row = rows["A:descend:0"]
    descent = bytes.fromhex(descent_row["data"])
    fix = [(address(descent_row, index), False, False) for index in (3, 4, 5, 6, 7)] if len(descent_row["metas"]) > 3 else None
    assert_instruction(ix.descend(program, address(descent_row, 0), address(descent_row, 1), address(descent_row, 2),
                                  descent[1], fixpoint_accounts=fix, document_writable=fix is not None), descent_row)

    if "A:close-response" in rows:
        close_response_row = rows["A:close-response"]
        assert_instruction(ix.close_response(program, address(close_response_row, 0), address(close_response_row, 1), address(close_response_row, 2)), close_response_row)

    settle_row = rows["A:settle"]
    if len(settle_row["metas"]) == 7:
        assert_instruction(ix.settle(program, address(settle_row, 0), address(settle_row, 1), address(settle_row, 2),
                                    address(settle_row, 3), address(settle_row, 4), address(settle_row, 6)), settle_row)
    else:
        assert bytes.fromhex(settle_row["data"]) == bytes([131])

    attest_row = rows["H:attest:0"]
    attest_data = bytes.fromhex(attest_row["data"])
    assert_instruction(ix.attest_output(program, address(attest_row, 0), address(attest_row, 1), address(attest_row, 2), address(attest_row, 3), address(attest_row, 4), address(attest_row, 5), address(attest_row, 6), attest_data), attest_row)

    resolve_row = rows["H:resolve-final"]
    resolve_data = bytes.fromhex(resolve_row["data"])
    assert_instruction(ix.resolve_result(program, address(resolve_row, 0), address(resolve_row, 1), resolve_data[1:]), resolve_row)

    close_row = rows["H:close"]
    close_data = bytes.fromhex(close_row["data"])
    assert_instruction(ix.close_document(program, address(close_row, 0), address(close_row, 1), address(close_row, 2), address(close_row, 3), address(close_row, 4), address(close_row, 5), close_data[1:]), close_row)


def test_all_supported_non_executor_plan_rows_match_builders(rows: dict[str, dict]) -> None:
    supported = {156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169,
                 172, 173, 174, 175, 176, 177, 178, 131, 132}
    for row in rows.values():
        if row.get("label", "").startswith("refuse:") or "data" not in row:
            continue
        data = bytes.fromhex(row["data"])
        tag = data[0]
        if tag not in supported:
            continue
        program = Pubkey.from_string(row["program"])
        metas = [(Pubkey.from_string(value), bool(signer), bool(writable)) for value, signer, writable in row["metas"]]
        if tag == 156:
            got = ix.registry_create(program, metas[0][0], metas[1][0], metas[2][0], int.from_bytes(data[1:5], "little"),
                                    int.from_bytes(data[5:9], "little"), data[9:])
        elif tag == 157:
            got = ix.registry_write(program, metas[0][0], metas[1][0], metas[2][0], int.from_bytes(data[1:5], "little"),
                                    int.from_bytes(data[5:9], "little"), data[9:])
        elif tag == 158:
            got = ix.registry_freeze(program, metas[0][0], metas[1][0], metas[2][0], int.from_bytes(data[1:5], "little"))
        elif tag == 159:
            got = ix.admission_begin(program, metas[0][0], metas[1][0], metas[2][0], metas[3][0], metas[4][0], metas[5][0])
        elif tag == 160:
            got = ix.admission_step(program, metas[0][0], metas[1][0], metas[2][0], metas[3][0], metas[4][0], metas[5][0],
                                    int.from_bytes(data[1:5], "little"), int.from_bytes(data[5:7], "little"))
        elif tag == 161:
            got = ix.unified_init(program, *[meta[0] for meta in metas[:13]],
                                  c.RunTerms.decode(data[1:97]), c.RunBinding.decode(data[97:257]),
                                  data[257:289], data[289:321], data[321:353], data[353:])
        elif tag == 162:
            count = data[37]
            roots = [data[38 + 32 * index:70 + 32 * index] for index in range(count)]
            got = ix.land_position_roots(program, metas[0][0], metas[1][0], metas[2][0], data[1:33],
                                        int.from_bytes(data[33:37], "little"), roots)
        elif tag == 163:
            count = data[3]
            roots = [data[4 + 32 * index:36 + 32 * index] for index in range(count)]
            got = ix.reveal_position(program, metas[0][0], metas[1][0], metas[2][0], metas[3][0], metas[4][0], metas[5][0], metas[6][0],
                                    int.from_bytes(data[1:3], "little"), roots)
        elif tag == 164:
            got = ix.select_segment(program, metas[0][0], metas[1][0], metas[2][0], metas[3][0], metas[4][0], metas[5][0],
                                    int.from_bytes(data[1:3], "little"))
        elif tag == 165:
            count = int.from_bytes(data[33:35], "little")
            roots = [data[35 + 32 * index:67 + 32 * index] for index in range(count)]
            got = ix.finalize_document(program, metas[0][0], metas[1][0], metas[2][0], data[1:33], roots)
        elif tag == 166:
            height = data[75]
            at = 76 + 32 * height
            got = ix.challenge_leaf(program, metas[0][0], metas[1][0], metas[2][0], metas[3][0], metas[5][0], metas[6][0],
                                    metas[7][0], metas[8][0], metas[9][0],
                                    c.encode_challenge_leaf(data[1:33], int.from_bytes(data[33:37], "little"),
                                                            int.from_bytes(data[37:39], "little"), int.from_bytes(data[39:43], "little"),
                                                            data[43:75],
                                                            [data[76 + 32 * index:76 + 32 * (index + 1)] for index in range(height)],
                                                            data[at:-4], int.from_bytes(data[-4:], "little")))
        elif tag == 167:
            got = ix.challenge_position(program, metas[0][0], metas[1][0], metas[2][0], metas[3][0], metas[5][0], metas[6][0],
                                         metas[7][0], metas[8][0], data[1:33], int.from_bytes(data[33:37], "little"),
                                         int.from_bytes(data[37:41], "little"))
        elif tag == 168:
            count = data[1]
            has_root = len(data) == 2 + 32 * (count + 1)
            at = 2 + (32 if has_root else 0)
            descendants = [data[at + 32 * index:at + 32 * (index + 1)] for index in range(count)]
            fixpoint = metas[3:] if len(metas) > 3 else None
            got = ix.reveal_descent(program, metas[0][0], metas[1][0], metas[2][0], descendants,
                                    data[2:34] if has_root else None, fixpoint_accounts=fixpoint)
        elif tag == 169:
            fixpoint = metas[3:] if len(metas) > 3 else None
            got = ix.descend(program, metas[0][0], metas[1][0], metas[2][0], data[1], fixpoint_accounts=fixpoint,
                             document_writable=metas[2][2])
        elif tag == 172:
            got = ix.close_document(program, metas[0][0], metas[1][0], metas[2][0], metas[3][0], metas[4][0], metas[5][0], data[1:])
        elif tag == 173:
            count = data[2]
            roots = [data[3 + 32 * index:35 + 32 * index] for index in range(count)]
            got = ix.reveal_family_table(program, metas[0][0], metas[1][0], metas[2][0], data[1], roots)
        elif tag == 174:
            got = ix.config_init(program, metas[0][0], metas[1][0], metas[3][0], data[1:33], data[33:65], data[65:])
        elif tag == 175:
            got = ix.config_set(program, metas[0][0], metas[1][0], data[1], data[2:], metas[2][0] if len(metas) > 2 else None)
        elif tag == 176:
            got = ix.template_seal(program, metas[0][0], metas[1][0], metas[2][0], metas[3][0], data[1])
        elif tag == 177:
            got = ix.attest_output(program, metas[0][0], metas[1][0], metas[2][0], metas[3][0], metas[4][0], metas[5][0], metas[6][0], data)
        elif tag == 178:
            got = ix.resolve_result(program, metas[0][0], metas[1][0], data[1:])
        elif tag == 131:
            if len(metas) != 7:
                continue
            got = ix.settle(program, metas[0][0], metas[1][0], metas[2][0], metas[3][0], metas[4][0], metas[6][0])
        elif tag == 132:
            got = ix.timeout(program, metas[0][0], metas[1][0])
        else:
            continue
        assert_instruction(got, row)


def test_current_revision7_settle_includes_response_and_executor() -> None:
    program = Pubkey.from_bytes(bytes([9]) * 32)
    keys = [Pubkey.from_bytes(bytes([value]) * 32) for value in range(1, 7)]
    instruction = ix.settle(program, *keys)
    assert bytes(instruction.data) == bytes([131])
    assert [(str(meta.pubkey), meta.is_signer, meta.is_writable) for meta in instruction.accounts] == [
        *[(str(key), False, True) for key in keys[:5]],
        (str(c.INCINERATOR), False, True),
        (str(keys[5]), False, True),
    ]
