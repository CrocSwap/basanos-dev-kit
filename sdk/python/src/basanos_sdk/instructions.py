"""Instruction builders for the DCG unified-format lifecycle.

Every builder returns a solders ``Instruction``.  Account order is the order
specified by the DCG lifecycle plan; no builder reads or stores a private key.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from solders.instruction import AccountMeta, Instruction
from solders.pubkey import Pubkey

from . import consensus as c

KeyLike = Pubkey | str | bytes | bytearray


def _key(value: KeyLike) -> Pubkey:
    return c.key(value)


def _meta(value: KeyLike, signer: bool = False, writable: bool = False) -> AccountMeta:
    return AccountMeta(_key(value), signer, writable)


def _metas(values: Sequence[tuple[KeyLike, bool, bool]]) -> list[AccountMeta]:
    return [_meta(value, signer, writable) for value, signer, writable in values]


def instruction(program: KeyLike, data: bytes, accounts: Sequence[tuple[KeyLike, bool, bool]]) -> Instruction:
    return Instruction(_key(program), bytes(data), _metas(accounts))


def config_init(program: KeyLike, upgrade_authority: KeyLike, config: KeyLike, programdata: KeyLike,
                admin: bytes, registry_authority: bytes, template_seal_authority: bytes) -> Instruction:
    data = c.config_init_data(admin, registry_authority, template_seal_authority)
    return instruction(program, data, [(upgrade_authority, True, True), (config, False, True),
                                       (program, False, False), (programdata, False, False),
                                       (c.SYSTEM_PROGRAM, False, False)])


def config_set(program: KeyLike, admin: KeyLike, config: KeyLike, role: int, new_key: bytes,
               new_admin: KeyLike | None = None) -> Instruction:
    accounts: list[tuple[KeyLike, bool, bool]] = [(admin, True, False), (config, False, True)]
    if role == 0 and new_key != bytes(32):
        if new_admin is None:
            raise ValueError("new admin signer is required")
        accounts.append((new_admin, True, False))
    return instruction(program, c.config_set_data(role, new_key), accounts)


def template_seal(program: KeyLike, authority: KeyLike, config: KeyLike, seal: KeyLike, pt2s: KeyLike,
                  action: int) -> Instruction:
    return instruction(program, c.template_seal_data(action), [(authority, True, True), (config, False, False),
                                                               (seal, False, True), (pt2s, False, False),
                                                               (c.SYSTEM_PROGRAM, False, False)])


def registry_create(program: KeyLike, authority: KeyLike, config: KeyLike, registry: KeyLike,
                    registry_id: int, row_count: int, census_digest: bytes,
                    machine_name: bytes | None = None) -> Instruction:
    """``machine_name=None`` sends the 41-byte form (``MACHINE_NAME``); a name
    sends the 105-byte revision-7 form with the NUL-padded 64-byte field."""
    if not 1 <= row_count <= 64 or bytes(census_digest) == bytes(32):
        raise ValueError("invalid registry census")
    data = bytes([c.TAG_REGISTRY_CREATE]) + c.uint(registry_id, 4) + c.uint(row_count, 4) + c.digest(census_digest)
    if machine_name is not None:
        if machine_name not in c.ACCEPTED_MACHINES:
            raise ValueError("machine name is not accepted by this image")
        data += machine_name.ljust(64, b"\0")
    return instruction(program, data, [(authority, True, True), (config, False, False), (registry, False, True),
                                       (c.SYSTEM_PROGRAM, False, False)])


def registry_write(program: KeyLike, authority: KeyLike, config: KeyLike, registry: KeyLike,
                   registry_id: int, index: int, row: bytes) -> Instruction:
    if len(row) != 64:
        raise ValueError("registry row must be 64 bytes")
    data = bytes([c.TAG_REGISTRY_WRITE]) + c.uint(registry_id, 4) + c.uint(index, 4) + row
    return instruction(program, data, [(authority, True, False), (config, False, False), (registry, False, True)])


def registry_freeze(program: KeyLike, authority: KeyLike, config: KeyLike, registry: KeyLike,
                    registry_id: int) -> Instruction:
    return instruction(program, bytes([c.TAG_REGISTRY_FREEZE]) + c.uint(registry_id, 4),
                       [(authority, True, False), (config, False, False), (registry, False, True)])


def admission_begin(program: KeyLike, payer: KeyLike, admission: KeyLike, registry: KeyLike,
                    pt2s: KeyLike, routes: KeyLike, geometry: KeyLike) -> Instruction:
    return instruction(program, bytes([c.TAG_ADMISSION_BEGIN]),
                       [(payer, True, True), (admission, False, True), (registry, False, False),
                        (pt2s, False, False), (routes, False, False), (geometry, False, False),
                        (c.SYSTEM_PROGRAM, False, False)])


def admission_step(program: KeyLike, admission: KeyLike, registry: KeyLike, pt2s: KeyLike,
                   pt1s: KeyLike, routes: KeyLike, geometry: KeyLike, first: int, count: int) -> Instruction:
    if not 1 <= count <= 256:
        raise ValueError("admission count must be 1..256")
    return instruction(program, bytes([c.TAG_ADMISSION_STEP]) + c.uint(first, 4) + c.uint(count, 2),
                       [(admission, False, True), (registry, False, False), (pt2s, False, False),
                        (pt1s, False, False), (routes, False, False), (geometry, False, False)])


def unified_init(program: KeyLike, executor: KeyLike, document: KeyLike, positions: KeyLike,
                 family_slots: KeyLike, system_program: KeyLike, pt2s: KeyLike, routes: KeyLike,
                 geometry: KeyLike, payloads: KeyLike, registry: KeyLike, admission: KeyLike,
                  template_seal: KeyLike, result: KeyLike, terms: c.RunTerms, binding: c.RunBinding,
                  model_root: bytes, position_table_root: bytes, prompt_commitment: bytes,
                 family_body: bytes) -> Instruction:
    data = c.encode_unified_init(terms, binding, model_root=model_root, position_table_root=position_table_root,
                                 prompt_commitment=prompt_commitment, family_body=family_body)
    return instruction(program, data, [(executor, True, True), (document, False, True), (positions, False, True),
                                       (family_slots, False, True), (system_program, False, False), (pt2s, False, False),
                                       (routes, False, False), (geometry, False, False), (payloads, False, False),
                                       (registry, False, False), (admission, False, False),
                                       (template_seal, False, False), (result, False, True)])


def unified_init_v7(*args, **kwargs) -> Instruction:
    return unified_init(*args, **kwargs)


def land_position_roots(program: KeyLike, executor: KeyLike, document: KeyLike, positions: KeyLike,
                        descriptor: bytes, first: int, roots: Sequence[bytes]) -> Instruction:
    return instruction(program, c.encode_land_position_roots(descriptor, first, roots),
                       [(executor, True, False), (document, False, True), (positions, False, True)])


def finalize_document(program: KeyLike, executor: KeyLike, document: KeyLike, result: KeyLike,
                      descriptor: bytes, family_roots: Sequence[bytes]) -> Instruction:
    return instruction(program, c.encode_finalize_document(descriptor, family_roots),
                       [(executor, True, False), (document, False, True), (result, False, True)])


def attest_output(program: KeyLike, signer: KeyLike, document: KeyLike, positions: KeyLike, result: KeyLike,
                  pt2s: KeyLike, routes: KeyLike, geometry: KeyLike, data: bytes) -> Instruction:
    return instruction(program, data, [(signer, True, False), (document, False, False), (positions, False, False),
                                       (result, False, True), (pt2s, False, False), (routes, False, False),
                                       (geometry, False, False)])


def resolve_result(program: KeyLike, document: KeyLike, result: KeyLike, descriptor: bytes) -> Instruction:
    return instruction(program, c.encode_resolve_result(descriptor), [(document, False, False), (result, False, True)])


def close_document(program: KeyLike, signer: KeyLike, document: KeyLike, positions: KeyLike,
                   family_slots: KeyLike, result: KeyLike, executor: KeyLike, descriptor: bytes) -> Instruction:
    return instruction(program, c.encode_close_document(descriptor),
                       [(signer, True, False), (document, False, True), (positions, False, True),
                        (family_slots, False, True), (result, False, True), (executor, False, True)])


def challenge_leaf(program: KeyLike, record: KeyLike, challenger: KeyLike, document: KeyLike,
                   positions: KeyLike, pt2s: KeyLike, routes: KeyLike, geometry: KeyLike,
                   registry: KeyLike, pt1s: KeyLike, data: bytes) -> Instruction:
    return instruction(program, data, [(record, False, True), (challenger, True, True), (document, False, True),
                                       (positions, False, False), (c.SYSTEM_PROGRAM, False, False), (pt2s, False, False),
                                       (routes, False, False), (geometry, False, False), (registry, False, False),
                                       (pt1s, False, False)])


def challenge_position(program: KeyLike, record: KeyLike, challenger: KeyLike, document: KeyLike,
                       positions: KeyLike, pt2s: KeyLike, routes: KeyLike, geometry: KeyLike,
                       registry: KeyLike, descriptor: bytes, position: int, nonce: int) -> Instruction:
    data = c.encode_challenge_position(descriptor, position, nonce)
    return instruction(program, data, [(record, False, True), (challenger, True, True), (document, False, True),
                                       (positions, False, False), (c.SYSTEM_PROGRAM, False, False), (pt2s, False, False),
                                       (routes, False, False), (geometry, False, False), (registry, False, False)])


def reveal_position(program: KeyLike, record: KeyLike, executor: KeyLike, document: KeyLike,
                    positions: KeyLike, pt2s: KeyLike, routes: KeyLike, geometry: KeyLike,
                    first: int, roots: Sequence[bytes]) -> Instruction:
    return instruction(program, c.encode_reveal_position(first, roots),
                       [(record, False, True), (executor, True, False), (document, False, False),
                        (positions, False, False), (pt2s, False, False), (routes, False, False),
                        (geometry, False, False)])


def select_segment(program: KeyLike, record: KeyLike, challenger: KeyLike, document: KeyLike,
                   pt2s: KeyLike, routes: KeyLike, geometry: KeyLike, ordinal: int) -> Instruction:
    return instruction(program, c.encode_select_segment(ordinal),
                       [(record, False, True), (challenger, True, False), (document, False, False),
                        (pt2s, False, False), (routes, False, False), (geometry, False, False)])


def reveal_descent(program: KeyLike, record: KeyLike, signer: KeyLike, document: KeyLike,
                   descendants: Sequence[bytes], tree_root: bytes | None = None, *,
                   fixpoint_accounts: Sequence[tuple[KeyLike, bool, bool]] | None = None,
                   document_writable: bool = False) -> Instruction:
    accounts: list[tuple[KeyLike, bool, bool]] = [(record, False, True), (signer, True, False),
                                                   (document, False, document_writable)]
    if fixpoint_accounts is not None:
        accounts.extend(fixpoint_accounts)
    return instruction(program, c.encode_reveal(descendants, tree_root), accounts)


def descend(program: KeyLike, record: KeyLike, challenger: KeyLike, document: KeyLike, choice: int,
            *, fixpoint_accounts: Sequence[tuple[KeyLike, bool, bool]] | None = None,
            document_writable: bool = False) -> Instruction:
    accounts: list[tuple[KeyLike, bool, bool]] = [(record, False, True), (challenger, True, False), (document, False, document_writable)]
    if fixpoint_accounts is not None:
        accounts.extend(fixpoint_accounts)
    return instruction(program, c.encode_descend(choice), accounts)


def reveal_family_table(program: KeyLike, record: KeyLike, signer: KeyLike, document: KeyLike,
                         first: int, roots: Sequence[bytes]) -> Instruction:
    return instruction(program, c.encode_reveal_family_table(first, roots),
                       [(record, False, True), (signer, True, False), (document, False, False)])


def challenge_summary(program: KeyLike, record: KeyLike, challenger: KeyLike, document: KeyLike,
                      family_slots: KeyLike, pt2s: KeyLike, data: bytes) -> Instruction:
    return instruction(program, data, [(record, False, True), (challenger, True, True), (document, False, True),
                                       (family_slots, False, False), (pt2s, False, False), (c.SYSTEM_PROGRAM, False, False)])


def summary_reveal(program: KeyLike, record: KeyLike, signer: KeyLike, document: KeyLike,
                   descendants: Sequence[bytes], tree_root: bytes | None = None) -> Instruction:
    return instruction(program, c.encode_summary_reveal(descendants, tree_root),
                       [(record, False, True), (signer, True, False), (document, False, False)])


def summary_select(program: KeyLike, record: KeyLike, challenger: KeyLike, document: KeyLike,
                   choice: int) -> Instruction:
    return instruction(program, c.encode_summary_select(choice),
                       [(record, False, True), (challenger, True, False), (document, False, False)])


def summary_answer(program: KeyLike, record: KeyLike, signer: KeyLike, document: KeyLike,
                   positions: KeyLike, family_slots: KeyLike, pt2s: KeyLike, routes: KeyLike,
                   geometry: KeyLike, data: bytes) -> Instruction:
    return instruction(program, data, [(record, False, True), (signer, True, False),
                                       (document, False, True), (positions, False, False),
                                       (family_slots, False, False), (pt2s, False, False),
                                       (routes, False, False), (geometry, False, False)])


def begin_response(program: KeyLike, response: KeyLike, executor: KeyLike, record: KeyLike,
                   body_length: int, body_sha256: bytes) -> Instruction:
    if not 1 <= body_length <= 1_048_576:
        raise ValueError("response body length is outside the DRU1 cap")
    data = bytes([115]) + c.uint(body_length, 4) + c.digest(body_sha256)
    return instruction(program, data, [(response, False, True), (executor, True, True),
                                        (record, False, False), (c.SYSTEM_PROGRAM, False, False)])


def grow_response(program: KeyLike, response: KeyLike, executor: KeyLike, record: KeyLike) -> Instruction:
    return instruction(program, bytes([116]), [(response, False, True), (executor, True, False),
                                               (record, False, False)])


def write_response(program: KeyLike, response: KeyLike, executor: KeyLike, record: KeyLike,
                   offset: int, chunk: bytes) -> Instruction:
    if not 1 <= len(chunk) <= 900:
        raise ValueError("DRU1 write must be 1..900 bytes")
    data = bytes([125]) + c.uint(offset, 4) + bytes(chunk)
    return instruction(program, data, [(response, False, True), (executor, True, False),
                                       (record, False, False)])


def seal_response(program: KeyLike, response: KeyLike, executor: KeyLike, record: KeyLike) -> Instruction:
    return instruction(program, bytes([118]), [(response, False, True), (executor, True, False),
                                               (record, False, False)])


def verify_target(program: KeyLike, record: KeyLike, response: KeyLike, document: KeyLike,
                  pt2s: KeyLike, pt1s: KeyLike, routes: KeyLike, geometry: KeyLike,
                  payloads: KeyLike) -> Instruction:
    return instruction(program, bytes([120]), [(record, False, True), (response, False, False),
                                               (document, False, False), (pt2s, False, False),
                                               (pt1s, False, False), (routes, False, False),
                                               (geometry, False, False), (payloads, False, False)])


def verify_reads(program: KeyLike, record: KeyLike, response: KeyLike, document: KeyLike,
                 positions: KeyLike, routes: KeyLike, geometry: KeyLike, pt2s: KeyLike,
                 family_slots: KeyLike, first: int, count: int) -> Instruction:
    if not 1 <= count <= 0xFFFF or not 0 <= first <= 0xFFFF:
        raise ValueError("read verification range is invalid")
    data = bytes([121]) + c.uint(first, 2) + c.uint(count, 2)
    return instruction(program, data, [(record, False, True), (response, False, False),
                                       (document, False, False), (positions, False, False),
                                       (routes, False, False), (geometry, False, False),
                                       (pt2s, False, False), (family_slots, False, False)])


def verify_range(program: KeyLike, record: KeyLike, response: KeyLike, document: KeyLike,
                 positions: KeyLike, routes: KeyLike, geometry: KeyLike, pt2s: KeyLike,
                 family_slots: KeyLike, read_index: int, first: int, count: int) -> Instruction:
    if not 1 <= count <= 0xFFFF or not 0 <= first <= 0xFFFF or not 0 <= read_index <= 0xFFFF:
        raise ValueError("range verification range is invalid")
    data = bytes([129]) + c.uint(read_index, 2) + c.uint(first, 2) + c.uint(count, 2)
    return instruction(program, data, [(record, False, True), (response, False, False),
                                       (document, False, False), (positions, False, False),
                                       (routes, False, False), (geometry, False, False),
                                       (pt2s, False, False), (family_slots, False, False)])


def execute_response(program: KeyLike, record: KeyLike, response: KeyLike, document: KeyLike,
                     routes: KeyLike, geometry: KeyLike, pt2s: KeyLike) -> Instruction:
    return instruction(program, bytes([124]), [(record, False, True), (response, False, False),
                                               (document, False, True), (routes, False, False),
                                               (geometry, False, False), (pt2s, False, False)])


def timeout(program: KeyLike, record: KeyLike, document: KeyLike) -> Instruction:
    return instruction(program, bytes([132]), [(record, False, True), (document, False, True)])


def settle(program: KeyLike, record: KeyLike, response: KeyLike, winner: KeyLike, executor: KeyLike,
            document: KeyLike, challenger: KeyLike, settlement_program: KeyLike | None = None,
            escrow: KeyLike | None = None, result: KeyLike | None = None,
            system_program: KeyLike = c.SYSTEM_PROGRAM) -> Instruction:
    accounts: list[tuple[KeyLike, bool, bool]] = [(record, False, True), (response, False, True),
                                                   (winner, False, True), (executor, False, True),
                                                   (document, False, True), (c.INCINERATOR, False, True),
                                                   (challenger, False, True)]
    custom = (settlement_program, escrow, result)
    if any(value is not None for value in custom):
        if not all(value is not None for value in custom):
            raise ValueError("custom settlement requires program, escrow, and result")
        accounts.extend([(settlement_program, False, False), (escrow, False, True), (result, False, False),
                         (system_program, False, False)])
    return instruction(program, bytes([131]), accounts)


def settle_custom(program: KeyLike, record: KeyLike, response: KeyLike, winner: KeyLike, executor: KeyLike,
                  document: KeyLike, challenger: KeyLike, settlement_program: KeyLike, escrow: KeyLike,
                  result: KeyLike, system_program: KeyLike = c.SYSTEM_PROGRAM) -> Instruction:
    return settle(program, record, response, winner, executor, document, challenger,
                  settlement_program=settlement_program, escrow=escrow, result=result, system_program=system_program)


def close_result(program: KeyLike, signer: KeyLike, result: KeyLike, executor: KeyLike,
                 descriptor: bytes) -> Instruction:
    return instruction(program, c.encode_close_result(descriptor),
                       [(signer, True, False), (result, False, True), (executor, False, True)])


def close_result_v7(*args, **kwargs) -> Instruction:
    return close_result(*args, **kwargs)


def close_response(program: KeyLike, record: KeyLike, response: KeyLike, executor: KeyLike) -> Instruction:
    return instruction(program, c.encode_close_response(), [(record, False, False), (response, False, True),
                                                             (executor, False, True)])


@dataclass(frozen=True)
class InstructionSet:
    """Convenience container for a document's initial requester instructions."""

    init: Instruction
    land: tuple[Instruction, ...]
    finalize: Instruction
