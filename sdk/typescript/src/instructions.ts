import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import * as c from "./consensus.js";

export type KeyLike = PublicKey | string | Uint8Array;
export type AccountSpec = readonly [KeyLike, boolean, boolean];

export type Meta = {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;
};

function meta(value: KeyLike, signer = false, writable = false): Meta {
  return { pubkey: c.key(value), isSigner: signer, isWritable: writable };
}

function metas(values: readonly AccountSpec[]): Meta[] {
  return values.map(([value, signer, writable]) => meta(value, signer, writable));
}

export function instruction(program: KeyLike, data: Uint8Array, accounts: readonly AccountSpec[]): TransactionInstruction {
  return new TransactionInstruction({ programId: c.key(program), keys: metas(accounts), data: Buffer.from(data) });
}

export function configInit(program: KeyLike, upgradeAuthority: KeyLike, config: KeyLike, programdata: KeyLike, admin: Uint8Array, registryAuthority: Uint8Array, templateSealAuthority: Uint8Array): TransactionInstruction {
  return instruction(program, c.configInitData(admin, registryAuthority, templateSealAuthority), [[upgradeAuthority, true, true], [config, false, true], [program, false, false], [programdata, false, false], [c.SYSTEM_PROGRAM, false, false]]);
}

export function configSet(program: KeyLike, admin: KeyLike, config: KeyLike, role: number, newKey: Uint8Array, newAdmin?: KeyLike): TransactionInstruction {
  const accounts: AccountSpec[] = [[admin, true, false], [config, false, true]];
  if (role === 0 && !isZero(newKey)) {
    if (newAdmin === undefined) throw new Error("new admin signer is required");
    accounts.push([newAdmin, true, false]);
  }
  return instruction(program, c.configSetData(role, newKey), accounts);
}

function isZero(value: Uint8Array): boolean { return value.length === 32 && value.every((item) => item === 0); }

export function templateSeal(program: KeyLike, authority: KeyLike, config: KeyLike, seal: KeyLike, pt2s: KeyLike, action: number): TransactionInstruction {
  return instruction(program, c.templateSealData(action), [[authority, true, true], [config, false, false], [seal, false, true], [pt2s, false, false], [c.SYSTEM_PROGRAM, false, false]]);
}

/** `machineName` undefined sends the 41-byte form; a name sends the 105-byte revision-7 form (NUL-padded 64-byte field). */
export function registryCreate(program: KeyLike, authority: KeyLike, config: KeyLike, registry: KeyLike, registryId: number, rowCount: number, censusDigest: Uint8Array, machineName?: Uint8Array): TransactionInstruction {
  if (rowCount < 1 || rowCount > 64 || censusDigest.length !== 32 || censusDigest.every((value) => value === 0)) throw new Error("invalid registry census");
  const parts = [Buffer.from([c.TAG_REGISTRY_CREATE]), c.uint(registryId, 4), c.uint(rowCount, 4), c.digest(censusDigest)];
  if (machineName !== undefined) {
    const name = Buffer.from(machineName);
    if (!name.equals(c.MACHINE_NAME) && !name.equals(c.MACHINE_NAME_V7)) throw new Error("machine name is not accepted by this image");
    const field = Buffer.alloc(64);
    name.copy(field);
    parts.push(field);
  }
  const data = Buffer.concat(parts);
  return instruction(program, data, [[authority, true, true], [config, false, false], [registry, false, true], [c.SYSTEM_PROGRAM, false, false]]);
}

export function registryWrite(program: KeyLike, authority: KeyLike, config: KeyLike, registry: KeyLike, registryId: number, index: number, row: Uint8Array): TransactionInstruction {
  if (row.length !== 64) throw new Error("registry row must be 64 bytes");
  return instruction(program, Buffer.concat([Buffer.from([c.TAG_REGISTRY_WRITE]), c.uint(registryId, 4), c.uint(index, 4), row]), [[authority, true, false], [config, false, false], [registry, false, true]]);
}

export function registryFreeze(program: KeyLike, authority: KeyLike, config: KeyLike, registry: KeyLike, registryId: number): TransactionInstruction {
  return instruction(program, Buffer.concat([Buffer.from([c.TAG_REGISTRY_FREEZE]), c.uint(registryId, 4)]), [[authority, true, false], [config, false, false], [registry, false, true]]);
}

export function admissionBegin(program: KeyLike, payer: KeyLike, admission: KeyLike, registry: KeyLike, pt2s: KeyLike, routes: KeyLike, geometry: KeyLike): TransactionInstruction {
  return instruction(program, Buffer.from([c.TAG_ADMISSION_BEGIN]), [[payer, true, true], [admission, false, true], [registry, false, false], [pt2s, false, false], [routes, false, false], [geometry, false, false], [c.SYSTEM_PROGRAM, false, false]]);
}

export function admissionStep(program: KeyLike, admission: KeyLike, registry: KeyLike, pt2s: KeyLike, pt1s: KeyLike, routes: KeyLike, geometry: KeyLike, first: number, count: number): TransactionInstruction {
  if (count < 1 || count > 256) throw new Error("admission count must be 1..256");
  return instruction(program, Buffer.concat([Buffer.from([c.TAG_ADMISSION_STEP]), c.uint(first, 4), c.uint(count, 2)]), [[admission, false, true], [registry, false, false], [pt2s, false, false], [pt1s, false, false], [routes, false, false], [geometry, false, false]]);
}

export function unifiedInit(program: KeyLike, executor: KeyLike, document: KeyLike, positions: KeyLike, familySlots: KeyLike, systemProgram: KeyLike, pt2s: KeyLike, routes: KeyLike, geometry: KeyLike, payloads: KeyLike, registry: KeyLike, admission: KeyLike, templateSeal: KeyLike, result: KeyLike, terms: c.RunTerms, binding: c.RunBinding, modelRoot: Uint8Array, positionTableRoot: Uint8Array, promptCommitment: Uint8Array, familyBody: Uint8Array): TransactionInstruction {
  const data = c.encodeUnifiedInit(terms, binding, { modelRoot, positionTableRoot, promptCommitment, familyBody });
  return instruction(program, data, [[executor, true, true], [document, false, true], [positions, false, true], [familySlots, false, true], [systemProgram, false, false], [pt2s, false, false], [routes, false, false], [geometry, false, false], [payloads, false, false], [registry, false, false], [admission, false, false], [templateSeal, false, false], [result, false, true]]);
}

export function unifiedInitV7(...args: Parameters<typeof unifiedInit>): TransactionInstruction { return unifiedInit(...args); }

export function landPositionRoots(program: KeyLike, executor: KeyLike, document: KeyLike, positions: KeyLike, descriptor: Uint8Array, first: number, roots: readonly Uint8Array[]): TransactionInstruction {
  return instruction(program, c.encodeLandPositionRoots(descriptor, first, roots), [[executor, true, false], [document, false, true], [positions, false, true]]);
}

export function finalizeDocument(program: KeyLike, executor: KeyLike, document: KeyLike, result: KeyLike, descriptor: Uint8Array, familyRoots: readonly Uint8Array[]): TransactionInstruction {
  return instruction(program, c.encodeFinalizeDocument(descriptor, familyRoots), [[executor, true, false], [document, false, true], [result, false, true]]);
}

export function attestOutput(program: KeyLike, signer: KeyLike, document: KeyLike, positions: KeyLike, result: KeyLike, pt2s: KeyLike, routes: KeyLike, geometry: KeyLike, data: Uint8Array): TransactionInstruction {
  return instruction(program, data, [[signer, true, false], [document, false, false], [positions, false, false], [result, false, true], [pt2s, false, false], [routes, false, false], [geometry, false, false]]);
}

export function resolveResult(program: KeyLike, document: KeyLike, result: KeyLike, descriptor: Uint8Array): TransactionInstruction {
  return instruction(program, c.encodeResolveResult(descriptor), [[document, false, false], [result, false, true]]);
}

export function closeDocument(program: KeyLike, signer: KeyLike, document: KeyLike, positions: KeyLike, familySlots: KeyLike, result: KeyLike, executor: KeyLike, descriptor: Uint8Array): TransactionInstruction {
  return instruction(program, c.encodeCloseDocument(descriptor), [[signer, true, false], [document, false, true], [positions, false, true], [familySlots, false, true], [result, false, true], [executor, false, true]]);
}

export function challengeLeaf(program: KeyLike, record: KeyLike, challenger: KeyLike, document: KeyLike, positions: KeyLike, pt2s: KeyLike, routes: KeyLike, geometry: KeyLike, registry: KeyLike, pt1s: KeyLike, data: Uint8Array): TransactionInstruction {
  return instruction(program, data, [[record, false, true], [challenger, true, true], [document, false, true], [positions, false, false], [c.SYSTEM_PROGRAM, false, false], [pt2s, false, false], [routes, false, false], [geometry, false, false], [registry, false, false], [pt1s, false, false]]);
}

export function challengePosition(program: KeyLike, record: KeyLike, challenger: KeyLike, document: KeyLike, positions: KeyLike, pt2s: KeyLike, routes: KeyLike, geometry: KeyLike, registry: KeyLike, descriptor: Uint8Array, position: number, nonce: number): TransactionInstruction {
  return instruction(program, c.encodeChallengePosition(descriptor, position, nonce), [[record, false, true], [challenger, true, true], [document, false, true], [positions, false, false], [c.SYSTEM_PROGRAM, false, false], [pt2s, false, false], [routes, false, false], [geometry, false, false], [registry, false, false]]);
}

export function revealPosition(program: KeyLike, record: KeyLike, executor: KeyLike, document: KeyLike, positions: KeyLike, pt2s: KeyLike, routes: KeyLike, geometry: KeyLike, first: number, roots: readonly Uint8Array[]): TransactionInstruction {
  return instruction(program, c.encodeRevealPosition(first, roots), [[record, false, true], [executor, true, false], [document, false, false], [positions, false, false], [pt2s, false, false], [routes, false, false], [geometry, false, false]]);
}

export function selectSegment(program: KeyLike, record: KeyLike, challenger: KeyLike, document: KeyLike, pt2s: KeyLike, routes: KeyLike, geometry: KeyLike, ordinal: number): TransactionInstruction {
  return instruction(program, c.encodeSelectSegment(ordinal), [[record, false, true], [challenger, true, false], [document, false, false], [pt2s, false, false], [routes, false, false], [geometry, false, false]]);
}

export function revealDescent(program: KeyLike, record: KeyLike, signer: KeyLike, document: KeyLike, descendants: readonly Uint8Array[], treeRoot?: Uint8Array, options: { fixpointAccounts?: readonly AccountSpec[]; documentWritable?: boolean } = {}): TransactionInstruction {
  const accounts: AccountSpec[] = [[record, false, true], [signer, true, false], [document, false, options.documentWritable ?? false]];
  if (options.fixpointAccounts !== undefined) accounts.push(...options.fixpointAccounts);
  return instruction(program, c.encodeReveal(descendants, treeRoot), accounts);
}

export function descend(program: KeyLike, record: KeyLike, challenger: KeyLike, document: KeyLike, choice: number, options: { fixpointAccounts?: readonly AccountSpec[]; documentWritable?: boolean } = {}): TransactionInstruction {
  const accounts: AccountSpec[] = [[record, false, true], [challenger, true, false], [document, false, options.documentWritable ?? false]];
  if (options.fixpointAccounts !== undefined) accounts.push(...options.fixpointAccounts);
  return instruction(program, c.encodeDescend(choice), accounts);
}

export function revealFamilyTable(program: KeyLike, record: KeyLike, signer: KeyLike, document: KeyLike, first: number, roots: readonly Uint8Array[]): TransactionInstruction {
  return instruction(program, c.encodeRevealFamilyTable(first, roots), [[record, false, true], [signer, true, false], [document, false, false]]);
}

export function challengeSummary(program: KeyLike, record: KeyLike, challenger: KeyLike, document: KeyLike, familySlots: KeyLike, pt2s: KeyLike, data: Uint8Array): TransactionInstruction {
  return instruction(program, data, [[record, false, true], [challenger, true, true], [document, false, true], [familySlots, false, false], [pt2s, false, false], [c.SYSTEM_PROGRAM, false, false]]);
}

export function summaryReveal(program: KeyLike, record: KeyLike, signer: KeyLike, document: KeyLike, descendants: readonly Uint8Array[], treeRoot?: Uint8Array): TransactionInstruction {
  return instruction(program, c.encodeSummaryReveal(descendants, treeRoot), [[record, false, true], [signer, true, false], [document, false, false]]);
}

export function summarySelect(program: KeyLike, record: KeyLike, challenger: KeyLike, document: KeyLike, choice: number): TransactionInstruction {
  return instruction(program, c.encodeSummarySelect(choice), [[record, false, true], [challenger, true, false], [document, false, false]]);
}

export function summaryAnswer(program: KeyLike, record: KeyLike, signer: KeyLike, document: KeyLike, positions: KeyLike, familySlots: KeyLike, pt2s: KeyLike, routes: KeyLike, geometry: KeyLike, data: Uint8Array): TransactionInstruction {
  return instruction(program, data, [[record, false, true], [signer, true, false], [document, false, true], [positions, false, false], [familySlots, false, false], [pt2s, false, false], [routes, false, false], [geometry, false, false]]);
}

export function timeout(program: KeyLike, record: KeyLike, document: KeyLike): TransactionInstruction {
  return instruction(program, Buffer.from([132]), [[record, false, true], [document, false, true]]);
}

export interface SettlementOptions {
  settlementProgram: KeyLike;
  escrow: KeyLike;
  result: KeyLike;
  systemProgram?: KeyLike;
}

export function settle(program: KeyLike, record: KeyLike, response: KeyLike, winner: KeyLike, executor: KeyLike, document: KeyLike, challenger: KeyLike, options?: SettlementOptions): TransactionInstruction {
  const accounts: AccountSpec[] = [[record, false, true], [response, false, true], [winner, false, true], [executor, false, true], [document, false, true], [c.INCINERATOR, false, true], [challenger, false, true]];
  if (options !== undefined) accounts.push([options.settlementProgram, false, false], [options.escrow, false, true], [options.result, false, false], [options.systemProgram ?? c.SYSTEM_PROGRAM, false, false]);
  return instruction(program, Buffer.from([131]), accounts);
}

export function settleCustom(program: KeyLike, record: KeyLike, response: KeyLike, winner: KeyLike, executor: KeyLike, document: KeyLike, challenger: KeyLike, settlementProgram: KeyLike, escrow: KeyLike, result: KeyLike, systemProgram: KeyLike = c.SYSTEM_PROGRAM): TransactionInstruction {
  return settle(program, record, response, winner, executor, document, challenger, { settlementProgram, escrow, result, systemProgram });
}

export function closeResult(program: KeyLike, signer: KeyLike, result: KeyLike, executor: KeyLike, descriptor: Uint8Array): TransactionInstruction {
  return instruction(program, c.encodeCloseResult(descriptor), [[signer, true, false], [result, false, true], [executor, false, true]]);
}

export function closeResponse(program: KeyLike, record: KeyLike, response: KeyLike, executor: KeyLike): TransactionInstruction {
  return instruction(program, c.encodeCloseResponse(), [[record, false, false], [response, false, true], [executor, false, true]]);
}

export class InstructionSet {
  readonly init: TransactionInstruction;
  readonly land: readonly TransactionInstruction[];
  readonly finalize: TransactionInstruction;

  constructor(init: TransactionInstruction, land: readonly TransactionInstruction[], finalize: TransactionInstruction) {
    this.init = init;
    this.land = land;
    this.finalize = finalize;
  }
}

export const config_init = configInit;
export const config_set = configSet;
export const template_seal = templateSeal;
export const registry_create = registryCreate;
export const registry_write = registryWrite;
export const registry_freeze = registryFreeze;
export const admission_begin = admissionBegin;
export const admission_step = admissionStep;
export const unified_init = unifiedInit;
export const unified_init_v7 = unifiedInitV7;
export const settle_custom = settleCustom;
export const close_result = closeResult;
export const close_result_v7 = closeResult;
export const land_position_roots = landPositionRoots;
export const finalize_document = finalizeDocument;
export const attest_output = attestOutput;
export const resolve_result = resolveResult;
export const close_document = closeDocument;
export const challenge_leaf = challengeLeaf;
export const challenge_position = challengePosition;
export const challenge_position_v7 = challengePosition;
export const challenge_leaf_v7 = challengeLeaf;
export const reveal_position = revealPosition;
export const select_segment = selectSegment;
export const reveal_descent = revealDescent;
export const reveal_family_table = revealFamilyTable;
export const challenge_summary = challengeSummary;
export const summary_reveal = summaryReveal;
export const summary_select = summarySelect;
export const summary_answer = summaryAnswer;
