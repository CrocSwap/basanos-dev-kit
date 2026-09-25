"""Offline agreement tests for the vendored consensus bytes."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest
from basanos_sdk import consensus as sdk

REPO = Path(__file__).resolve().parents[3]
GOLDEN = json.loads((REPO / "vectors/dcg/unified_v1.json").read_text())


def terms() -> sdk.DisputeTerms:
    return sdk.DisputeTerms(**GOLDEN["ddt1"]["fields"])


def binding() -> sdk.RunBinding:
    return sdk.RunBinding.decode(bytes.fromhex(GOLDEN["drb1"]["hex"]))


def test_revision_and_addresses_match_golden():
    fields = GOLDEN["dpd2"]["fields"]
    descriptor = bytes.fromhex(GOLDEN["dpd2"]["digest"])
    program = GOLDEN["addresses"]["program"]
    pt2s = hashlib.sha256(b"basanos/dcg-unified-v1-vector/pt2s").digest()
    pt2s_sha = hashlib.sha256(b"basanos/dcg-unified-v1-vector/pt2s-sha256").digest()
    book = sdk.addresses(program, descriptor=descriptor, pt2s=pt2s, pt2s_sha256=pt2s_sha,
                         challenger=GOLDEN["addresses"]["challenger"], nonce=GOLDEN["addresses"]["nonce"],
                         registry_id=1, registry=bytes.fromhex(fields["registry"]), position_count=80)
    for name, expected in GOLDEN["addresses"].items():
        if not isinstance(expected, list):
            continue
        got = book.as_dict()[name]
        assert [sdk.b58(got[0]), got[1]] == expected
    assert book.response == sdk.pda(program, sdk.RESPONSE_SEED, book.challenge[0])
    assert sdk.SPEC_REVISION == 6


def test_terms_binding_init_and_descriptor_match_mirror_vectors():
    assert terms().encode().hex() == GOLDEN["ddt1"]["hex"]
    assert binding().encode().hex() == GOLDEN["drb1"]["hex"]
    fields = dict(GOLDEN["dpd2"]["fields"])
    fields["clause12_v4"] = bytes.fromhex(fields["clause12_v4"])
    fields["definition_sha256"] = bytes.fromhex(fields["definition_sha256"])
    fields["base_digests"] = tuple(bytes.fromhex(value) for value in fields["base_digests"])
    fields["model_root"] = bytes.fromhex(fields["model_root"])
    fields["position_table_root"] = bytes.fromhex(fields["position_table_root"])
    fields["prompt_commitment"] = bytes.fromhex(fields["prompt_commitment"])
    fields["registry"] = bytes.fromhex(fields["registry"])
    fields["registry_table_root"] = bytes.fromhex(fields["registry_table_root"])
    family_body = bytes.fromhex(GOLDEN["inputs"]["family_body"])
    spec = sdk.DescriptorSpec(position_count=fields["position_count"], segment_count=fields["segment_count"],
                              family_count=fields["family_count"], total_entries=fields["total_entries"],
                              terms=terms(), binding=binding(), compiler_version=fields["compiler_version"],
                              clause12_v4=fields["clause12_v4"], definition_sha256=fields["definition_sha256"],
                              base_digests=fields["base_digests"], model_root=fields["model_root"],
                              position_table_root=fields["position_table_root"],
                              prompt_commitment=fields["prompt_commitment"], registry_epoch=fields["registry_epoch"],
                              registry=fields["registry"], registry_table_root=fields["registry_table_root"],
                              family_body=family_body)
    assert spec.preimage().hex() == GOLDEN["dpd2"]["preimage"]
    assert spec.digest().hex() == GOLDEN["dpd2"]["digest"]
    init = sdk.encode_unified_init(terms(), binding(), model_root=fields["model_root"],
                                   position_table_root=fields["position_table_root"],
                                   prompt_commitment=fields["prompt_commitment"], family_body=family_body)
    assert len(init) == GOLDEN["drb1"]["init_data_bytes"]


def test_result_and_document_codecs_round_trip():
    result = sdk.ResultV4.decode(bytes.fromhex(GOLDEN["dcr2_v4"]["final"]))
    assert result.encode().hex() == GOLDEN["dcr2_v4"]["final"]
    document = sdk.Dcm2V5.decode(bytes.fromhex(GOLDEN["finalize"]["after"]))
    assert document.encode().hex() == GOLDEN["finalize"]["after"]
    landed = sdk.Dcm2V5.decode(bytes.fromhex(GOLDEN["dcm2_v5"]["init"]))
    roots = [bytes.fromhex(value) for value in GOLDEN["dcm2_v5"]["position_roots"]]
    table = [None] * len(roots)
    sdk.land_position_roots(landed, table, sdk.encode_land_position_roots(landed.descriptor, 0, roots[:5]), landed.authority)
    assert landed.encode().hex() == GOLDEN["dcm2_v5"]["after_5"]


def test_event_and_spp1_vectors():
    for name, raw in GOLDEN["events"].items():
        event = sdk.decode_event(bytes.fromhex(raw))
        assert event["kind"] == name
        assert sdk.encode_event(name, descriptor=event["descriptor"], slot=event["slot"],
                                **{key: value for key, value in event.items() if key not in ("kind", "descriptor", "slot")}).hex() == raw
    descriptor = bytes.fromhex(GOLDEN["dpd2"]["digest"])
    for position, value in GOLDEN["spp1"].items():
        proof = bytes.fromhex(value["spp1"])
        segment_root = bytes.fromhex(value["segment_root"])
        assert sdk.verify_spp1(descriptor, int(position), len(GOLDEN["segment_tables"][position]["segments"]),
                               segment_root, proof, bytes.fromhex(GOLDEN["dcm2_v5"]["position_roots"][int(position)]),
                               bytes.fromhex(GOLDEN["segment_tables"][position]["root"]))


def test_attestation_vector_verifies():
    value = GOLDEN["attest_output"]
    coordinate = dict(value["coordinate"])
    coordinate["segment_table_root"] = bytes.fromhex(coordinate["segment_table_root"])
    result = sdk.verify_attestation(bytes.fromhex(value["data"]), width=16, position=value["position"],
                                    segment_count=coordinate["segment_count"], segment=coordinate["segment_id"],
                                    entries=coordinate["entries"], local=coordinate["local"], region=coordinate["region"],
                                    offset=coordinate["offset"], landed_root=bytes.fromhex(GOLDEN["dcm2_v5"]["position_roots"][value["position"]]),
                                    expected_table_root=coordinate["segment_table_root"], expected_index=value["index"])
    assert result["value"].hex() == value["value"]


def test_research_mirror_agreement_when_available():
    mirror = pytest.importorskip("basanos.dcg.unified_v1")
    assert terms().encode() == mirror.DisputeTerms(**GOLDEN["ddt1"]["fields"]).encode()
    assert binding().encode() == mirror.RunBinding.decode(bytes.fromhex(GOLDEN["drb1"]["hex"])).encode()
    assert sdk.encode_finalize_document(bytes.fromhex(GOLDEN["dpd2"]["digest"]),
                                        [bytes.fromhex(value) for value in GOLDEN["dfs2"]["family_roots"]]) == \
        mirror.encode_finalize_document(bytes.fromhex(GOLDEN["dpd2"]["digest"]),
                                        [bytes.fromhex(value) for value in GOLDEN["dfs2"]["family_roots"]])
