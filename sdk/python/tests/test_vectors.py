"""Offline agreement tests for the revision-7 SDK encodings."""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from basanos_sdk import consensus as sdk
from basanos_sdk import instructions as ix
from solders.pubkey import Pubkey

REPO = Path(__file__).resolve().parents[3]
GOLDEN = json.loads((REPO / "vectors/dcg/unified_v7.json").read_text())


def raw(value: str) -> bytes:
    return bytes.fromhex(value)


def terms(custom: bool = False) -> sdk.RunTerms:
    return sdk.RunTerms(**{key: raw(value) if key == "settlement_program" else value
                          for key, value in GOLDEN["ddt2"]["custom" if custom else "default"].items()})


def binding() -> sdk.RunBinding:
    return sdk.RunBinding.decode(raw(GOLDEN["drb1"]["hex"]))


def descriptor_fields() -> dict:
    return dict(GOLDEN["dpd2"]["fields"])


def family_body() -> bytes:
    return raw(GOLDEN["dfs2"]["hex"])[48:]


def make_spec(run_terms: sdk.RunTerms) -> sdk.DescriptorSpecV7:
    fields = descriptor_fields()
    return sdk.DescriptorSpecV7(
        position_count=fields["position_count"],
        segment_count=fields["segment_count"],
        family_count=fields["family_count"],
        total_entries=fields["total_entries"],
        terms=run_terms,
        binding=binding(),
        compiler_version=fields["compiler_version"],
        clause12_v4=raw(fields["clause12_v4"]),
        definition_sha256=raw(fields["definition_sha256"]),
        base_digests=tuple(raw(value) for value in fields["base_digests"]),
        model_root=raw(fields["model_root"]),
        position_table_root=raw(fields["position_table_root"]),
        prompt_commitment=raw(fields["prompt_commitment"]),
        registry_epoch=fields["registry_epoch"],
        registry=raw(fields["registry"]),
        registry_table_root=raw(fields["registry_table_root"]),
        family_body=family_body(),
    )


def test_revision_and_addresses_match_golden() -> None:
    fields = descriptor_fields()
    descriptor = raw(GOLDEN["dpd2"]["digest"])
    pt2s = sdk.sha256(b"basanos/dcg-unified-v1-vector/pt2s")
    pt2s_sha = sdk.sha256(b"basanos/dcg-unified-v1-vector/pt2s-sha256")
    book = sdk.addresses(GOLDEN["addresses"]["program"], descriptor=descriptor, pt2s=pt2s,
                         pt2s_sha256=pt2s_sha, challenger=GOLDEN["addresses"]["challenger"],
                         nonce=GOLDEN["addresses"]["nonce"], registry_id=1, registry=raw(fields["registry"]),
                         position_count=80, settlement=True)
    for name, expected in GOLDEN["addresses"].items():
        if not isinstance(expected, list):
            continue
        actual = book.as_dict()[name]
        assert [sdk.b58(actual[0]), actual[1]] == expected
    assert book.settlement_escrow == sdk.settlement_escrow_address(GOLDEN["addresses"]["program"], book.challenge[0])
    assert sdk.SPEC_REVISION == 7


def test_terms_descriptor_and_init_match_golden() -> None:
    default = terms()
    assert default.encode().hex() == GOLDEN["ddt2"]["default_hex"]
    custom = terms(True)
    assert custom.encode().hex() == GOLDEN["ddt2"]["custom_hex"]
    assert sdk.built_in_settlement(default) == tuple(GOLDEN["ddt2"]["built_in_split"])
    spec = make_spec(default)
    assert spec.preimage().hex() == GOLDEN["dpd2"]["preimage"]
    assert spec.digest().hex() == GOLDEN["dpd2"]["digest"]
    custom_spec = make_spec(custom)
    assert custom_spec.preimage().hex() == GOLDEN["dpd2"]["custom_preimage"]
    assert custom_spec.digest().hex() == GOLDEN["dpd2"]["custom_digest"]
    fields = descriptor_fields()
    init = sdk.encode_unified_init(default, binding(), model_root=raw(fields["model_root"]),
                                   position_table_root=raw(fields["position_table_root"]),
                                   prompt_commitment=raw(fields["prompt_commitment"]), family_body=family_body())
    assert len(init) == GOLDEN["drb1"]["init_data_bytes"] == 533


def test_result_document_and_tombstone_round_trip() -> None:
    result = sdk.ResultV5.decode(raw(GOLDEN["dcr2_v5"]["final"]))
    assert result.encode().hex() == GOLDEN["dcr2_v5"]["final"]
    tombstone = sdk.ResultTombstone.decode(raw(GOLDEN["dcr2_v5"]["tombstone"]))
    assert tombstone.encode().hex() == GOLDEN["dcr2_v5"]["tombstone"]
    document = sdk.Dcm2V6.decode(raw(GOLDEN["dcm2_v6"]["finalized"]))
    assert document.encode().hex() == GOLDEN["dcm2_v6"]["finalized"]
    landed = sdk.Dcm2V6.decode(raw(GOLDEN["dcm2_v6"]["init"]))
    roots = [raw(value) for value in GOLDEN["dcm2_v6"]["position_roots"]]
    table: list[bytes | None] = [None] * len(roots)
    sdk.land_position_roots(landed, table, sdk.encode_land_position_roots(landed.descriptor, 0, roots[:5]), landed.authority)
    assert landed.positions_complete == 5
    assert document.encode().hex() == GOLDEN["dcm2_v6"]["finalized"]


def test_event_and_spp1_vectors() -> None:
    for name, value in GOLDEN["events"].items():
        event = sdk.decode_event_v7(raw(value))
        assert event["kind"] == name
        fields = {key: item for key, item in event.items() if key not in ("kind", "descriptor", "slot")}
        assert sdk.encode_event_v7(name, descriptor=event["descriptor"], slot=event["slot"], **fields).hex() == value
    descriptor = raw(GOLDEN["dpd2"]["digest"])
    for position, value in GOLDEN["spp1"].items():
        coordinate = GOLDEN["segment_tables"][position]
        assert sdk.verify_spp1(descriptor, int(position), len(coordinate["segments"]), raw(value["segment_root"]),
                               raw(value["spp1"]), raw(GOLDEN["dcm2_v6"]["position_roots"][int(position)]),
                               raw(coordinate["root"]))


def test_challenge_and_settlement_wire_formats() -> None:
    assert sdk.encode_challenge_position(raw(GOLDEN["dpd2"]["digest"]), 79, 0).hex() == GOLDEN["position_reveal"]["data"]
    settlement = raw(GOLDEN["settlement"]["instruction"])
    assert settlement[:4] == b"BSS1" and len(settlement) == 200
    assert sdk.encode_settlement_instruction(
        ruling=settlement[6], cause=settlement[7], winner=settlement[8:40], loser=settlement[40:72],
        challenge=settlement[72:104], result=settlement[104:136], descriptor=settlement[136:168],
        settlement_pot=int.from_bytes(settlement[168:176], "little"),
        challenger_bond=int.from_bytes(settlement[176:184], "little"),
        built_in_winner_amount=int.from_bytes(settlement[184:192], "little"),
        built_in_burn_amount=int.from_bytes(settlement[192:200], "little"),
    ) == settlement
    assert sdk.encode_close_result(raw(GOLDEN["dpd2"]["digest"])) == bytes([sdk.TAG_CLOSE_RESULT]) + raw(GOLDEN["dpd2"]["digest"])


def test_dcr1_ruling_fields_are_phase_aware() -> None:
    record = bytearray(sdk.DCR1_BYTES)
    record[:4] = b"DCR1"
    record[4] = sdk.PHASE_POSITION_REVEAL
    record[6:8] = sdk.uint(sdk.DCR1_VERSION, 2)
    record[144] = 1
    record[170:174] = sdk.uint(17, 4)
    record[174:176] = sdk.uint(23, 2)
    live = sdk.decode_challenge_record(record)
    assert live["entry"] == 17 and live["form"] == 23
    assert "custom_settlement_deadline" not in live and "ruling_cause" not in live
    record[4] = sdk.PHASE_RULED
    record[170:178] = sdk.uint(1234, 8)
    record[178] = sdk.CAUSE_CONVICT
    ruled = sdk.decode_challenge_record(record)
    assert ruled["custom_settlement_deadline"] == 1234 and ruled["ruling_cause"] == sdk.CAUSE_CONVICT


def test_settlement_and_close_instruction_accounts() -> None:
    program = Pubkey.from_bytes(bytes([9]) * 32)
    keys = [Pubkey.from_bytes(bytes([value]) * 32) for value in range(1, 8)]
    built_in = ix.settle(program, *keys[:6])
    assert len(built_in.accounts) == 7
    settlement_program = Pubkey.from_bytes(bytes([8]) * 32)
    escrow = Pubkey.from_bytes(bytes([7]) * 32)
    custom = ix.settle(program, *keys[:6], settlement_program=settlement_program, escrow=escrow, result=keys[6])
    assert len(custom.accounts) == 11
    assert custom.accounts[7].pubkey == settlement_program and custom.accounts[8].pubkey == escrow
    close = ix.close_result(program, keys[0], keys[1], keys[2], bytes([4]) * 32)
    assert len(close.accounts) == 3 and bytes(close.data)[0] == sdk.TAG_CLOSE_RESULT


def test_research_mirror_agreement_when_available() -> None:
    mirror = pytest.importorskip("basanos.dcg.unified_v1")
    assert terms().encode() == mirror.RunTerms(**{key: raw(value) if key == "settlement_program" else value
                                                    for key, value in GOLDEN["ddt2"]["default"].items()}).encode()
    assert binding().encode() == mirror.RunBinding.decode(raw(GOLDEN["drb1"]["hex"])).encode()
