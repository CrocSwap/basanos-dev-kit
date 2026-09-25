import { createHash } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

export type BytesLike = Uint8Array;
export type Integer = number | bigint;
export type Seed = Uint8Array | string | PublicKey;
export type Pda = readonly [PublicKey, number];

export const SPEC_REVISION = 6;
export const SYSTEM_PROGRAM = new PublicKey("11111111111111111111111111111111");
export const COMPUTE_BUDGET_PROGRAM = new PublicKey("ComputeBudget111111111111111111111111111111");
export const UPGRADEABLE_LOADER = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");
export const INCINERATOR = new PublicKey("1nc1nerator11111111111111111111111111111111");

export const EPOCH = 4;
export const REGISTRY_VERSION = 2;
export const ROW_VERSION = 2;
export const ROW_BYTES = 64;
export const REGISTRY_HEADER = 192;
export const MAX_ROWS = 64;
export const REGISTRY_SEED = Buffer.from("dcg-envelope-registry-pt2", "ascii");
export const ADMISSION_SEED = Buffer.from("dcg-envelope-admission-v2", "ascii");
export const FAMILY_SLOTS_SEED = Buffer.from("dcg-hcl-family-slots", "ascii");
export const DOCUMENT_SEED = Buffer.from("dcg-hcl-document", "ascii");
export const POSITIONS_SEED = Buffer.from("dcg-hcl-positions", "ascii");
export const RESULT_SEED = Buffer.from("dcg-hcl-result", "ascii");
export const CONFIG_SEED = Buffer.from("dcg-config", "ascii");
export const TEMPLATE_SEAL_SEED = Buffer.from("dcg-template-seal", "ascii");
export const CHALLENGE_SEED = Buffer.from("dcg-unified-challenge", "ascii");
export const RESPONSE_SEED = Buffer.from("dcg-hcl-response", "ascii");
export const ROOT_DOMAIN = Buffer.from("basanos/dcg-envelope-seal-registry/2", "ascii");
export const DESCRIPTOR_DOMAIN = Buffer.from("basanos/dcg-unified-descriptor/3", "ascii");
export const FAMILY_TABLE_DOMAIN = Buffer.from("basanos/dcg-rs1-table/1", "ascii");
export const UNIFIED_VERSION = 1;
export const STORAGE_ROOT_ONLY = 1;
export const COMMITMENT_VERSION = 3;
export const MAX_FAMILIES = 24;
export const MAX_SEGMENTS = 128;
export const MAX_RS1_HEIGHT = 19;
export const MAX_RANGE_SLOTS = 64;
export const MAX_OUTPUT_WIDTH = 32;
export const MAX_ACCOUNT_BYTES = 10_485_760;
export const PACKET_BYTES = 1_232;
export const JSON_RPC_BODY_LIMIT = 50 * 1024;
export const TERMS_BYTES = 48;
export const BINDING_BYTES = 160;
export const WINDOW_CAP = 1n << 62n;
export const BPS_DENOMINATOR = 10_000;

export const REGISTRY_ACCOUNT = 770;
export const REGISTRY_AUTHORITY = 771;
export const REGISTRY_STATE = 772;
export const REGISTRY_EPOCH = 773;
export const REGISTRY_ROOT = 774;
export const ROW_MALFORMED = 775;
export const ROW_CAPABILITY = 776;
export const FORM_ABSENT = 777;
export const WITHDRAW_ONLY = 778;
export const OVER_CU = 779;
export const SHAPE_BOUND = 780;
export const RESPOND_LIMIT = 781;
export const ADMISSION_STATE = 782;
export const ENVELOPE_CANCEL = 783;
export const TEMPLATE_BINDING = 784;
export const PLAN_BINDING = 785;
export const WITNESS_DOMAIN = 786;
export const RANGE_BOUND = 787;
export const APPEND_ORDER = 788;
export const REVEAL_MISMATCH = 789;
export const REVEAL_ORDER = 790;
export const DISPUTE_TERMS = 791;
export const CONFIG_AUTHORITY = 792;
export const TEMPLATE_SEAL = 793;
export const RUN_BINDING = 794;
export const OUTPUT_PROOF = 795;
export const RESULT_STATE = 796;
export const SUMMARY_PRODUCER = 797;
export const CL_MALFORMED = 580;
export const CL_COORDINATE = 581;
export const CL_AUTHORITY = 582;
export const CL_ROOT = 583;
export const CL_MISSING = 591;
export const CL_AFTER_FINAL = 592;
export const CL_OVERFLOW = 598;
export const CL_CLOSE = 599;
export const DCR1_BAD = 730;
export const DCR1_AUTH = 731;
export const DCR1_PHASE = 733;
export const DCR1_PROOF = 734;
export const DCR1_DEADLINE = 736;

export const TAGS: Readonly<Record<number, string>> = {
  156: "RegistryCreateV2",
  157: "RegistryWriteV2",
  158: "RegistryFreezeV2",
  159: "AdmissionBeginV2",
  160: "AdmissionStepV2",
  161: "UnifiedInit",
  162: "LandPositionRoots",
  163: "RevealPositionV5",
  164: "SelectSegmentV5",
  165: "FinalizeDocumentV5",
  166: "ChallengeLeafV5",
  167: "ChallengePositionV5",
  168: "RevealV5",
  169: "DescendV5",
  170: "SummaryLeafChallenge",
  171: "ChallengeSummary",
  172: "CloseDocumentV5",
  173: "RevealFamilyTableV5",
  174: "ConfigInit",
  175: "ConfigSetAuthority",
  176: "TemplateSeal",
  177: "AttestOutputV5",
  178: "ResolveResultV5",
  179: "RevealSummaryV5",
  180: "SelectSummaryV5",
  181: "AnswerSummaryV5",
  182: "CloseResponseV5",
};
export const TAG_REGISTRY_CREATE = 156;
export const TAG_REGISTRY_WRITE = 157;
export const TAG_REGISTRY_FREEZE = 158;
export const TAG_ADMISSION_BEGIN = 159;
export const TAG_ADMISSION_STEP = 160;
export const TAG_UNIFIED_INIT = 161;
export const TAG_LAND_POSITION_ROOTS = 162;
export const TAG_REVEAL_POSITION = 163;
export const TAG_SELECT_SEGMENT = 164;
export const TAG_FINALIZE_DOCUMENT = 165;
export const TAG_CHALLENGE_LEAF = 166;
export const TAG_CHALLENGE_POSITION = 167;
export const TAG_REVEAL = 168;
export const TAG_DESCEND = 169;
export const TAG_SUMMARY_LEAF = 170;
export const TAG_CHALLENGE_SUMMARY = 171;
export const TAG_CLOSE_DOCUMENT = 172;
export const TAG_REVEAL_FAMILY_TABLE = 173;
export const TAG_CONFIG_INIT = 174;
export const TAG_CONFIG_SET = 175;
export const TAG_TEMPLATE_SEAL = 176;
export const TAG_ATTEST_OUTPUT = 177;
export const TAG_RESOLVE_RESULT = 178;
export const TAG_REVEAL_SUMMARY = 179;
export const TAG_SELECT_SUMMARY = 180;
export const TAG_ANSWER_SUMMARY = 181;
export const TAG_CLOSE_RESPONSE = 182;

export const DCM2_V5_HEADER = 2_024;
export const DCM2_TERMS_AT = 1_816;
export const DCM2_BINDING_AT = 1_864;
export const DCM2_HEADER = 536;
export const PEAK_SLOTS = 32;
export const PEAK_BYTES = 40;
export const DPR2_HEADER = 48;
export const DCR1_BYTES = 8_192;
export const DCR1_VERSION = 5;
export const RESULT_VERSION = 4;
export const RESULT_HEADER = 264;
export const RESULT_TERMS_AT = 216;
export const STATUS_PENDING = 0;
export const STATUS_FINAL = 1;
export const STATUS_REFUTED = 2;
export const STATUS_SETTLED = 3;
export const USABLE_STATUSES: ReadonlySet<number> = new Set([STATUS_FINAL, STATUS_SETTLED]);
export const FLAG_ARMED = 1;
export const FLAG_FINAL = 2;
export const FLAG_REFUTED = 4;
export const FLAG_CLOSED = 8;
export const FLAG_ROOT_ONLY = 16;
export const FLAG_SEALED = 32;
export const BOND_NONE = 0;
export const BOND_HELD = 1;
export const BOND_PAID = 2;
export const BOND_RETURNED = 3;
export const PHASE_RESPOND = 1;
export const PHASE_SEALED = 2;
export const PHASE_RULED = 3;
export const PHASE_SETTLED = 4;
export const PHASE_REVEAL = 5;
export const PHASE_DESCEND = 6;
export const PHASE_POSITION_REVEAL = 7;
export const PHASE_SELECT = 8;
export const WINNER_EXECUTOR = 1;
export const WINNER_CHALLENGER = 2;
export const EVENT_MAGIC = Buffer.from("DLE1", "ascii");
export const EVENT_VERSION = 1;
export const EVENT_HEADER = 48;

type EventField = readonly [string | null, number];
type EventSchema = readonly [string, readonly EventField[]];
export const EVENT_SCHEMA: Readonly<Record<number, EventSchema>> = {
  1: ["init", [["executor", 32], ["request_id", 32], ["position_count", 4], ["output_count", 4], ["executor_bond", 8]]],
  2: ["land", [["first", 4], ["count", 4], ["positions_complete", 4], [null, 4], ["prefix_root", 32]]],
  3: ["finalize", [["document_root", 32], ["family_table_digest", 32], ["dispute_deadline", 8]]],
  4: ["challenge_open", [["challenge", 32], ["challenger", 32], ["position", 4], ["challenge_kind", 1], [null, 3], ["deadline", 8], ["bond", 8]]],
  5: ["respond", [["challenge", 32], ["tag", 1], ["actor", 1], ["phase_from", 1], ["phase_to", 1], [null, 4], ["deadline", 8]]],
  6: ["ruling", [["challenge", 32], ["winner", 1], ["cause", 1], [null, 2], ["code", 4], ["challenger_wins", 4], [null, 4]]],
  7: ["settle", [["challenge", 32], ["winner", 32], ["bond_paid", 8], ["executor_reward", 8], ["executor_burned", 8]]],
  8: ["close", [["executor", 32], ["refund", 8], ["executor_bond_returned", 8], ["result_status", 1], ["finalized", 1], [null, 6]]],
  9: ["output", [["index", 4], ["outputs_attested", 4], ["position", 4], ["width", 1], [null, 3], ["value", 32]]],
  10: ["resolve", [["status", 1], [null, 3], ["challenger_wins", 4], ["outputs_attested", 4], [null, 4]]],
};
export const EVENT_KINDS: Readonly<Record<string, number>> = Object.fromEntries(
  Object.entries(EVENT_SCHEMA).map(([kind, [name]]) => [name, Number(kind)]),
);

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

export class Refusal extends Error {
  readonly code: number;

  constructor(code: number, message = "") {
    super(`${code} ${message}`.trim());
    this.name = "Refusal";
    this.code = code;
  }
}

function asBigInt(value: Integer, label = "integer"): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new Error(`${label} must be an integer`);
  return BigInt(value);
}

function integer(value: Integer): Integer {
  const converted = asBigInt(value);
  return converted >= -MAX_SAFE && converted <= MAX_SAFE ? Number(converted) : converted;
}

function requireNumber(value: Integer, label = "integer"): number {
  const converted = asBigInt(value, label);
  if (converted < -MAX_SAFE || converted > MAX_SAFE) throw new Error(`${label} is outside the safe integer range`);
  return Number(converted);
}

function compare(a: Integer, b: Integer): number {
  const left = asBigInt(a);
  const right = asBigInt(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

function add(a: Integer, b: Integer): Integer {
  return integer(asBigInt(a) + asBigInt(b));
}

function bitLength(value: Integer): number {
  const converted = asBigInt(value);
  if (converted === 0n) return 0;
  return (converted < 0n ? -converted : converted).toString(2).length;
}

export function uint(value: Integer, width: number): Buffer {
  const bits = requireNumber(width, "width") * 8;
  const converted = asBigInt(value, `u${bits}`);
  if (converted < 0n || converted >= 1n << BigInt(bits)) throw new Error(`u${bits} overflow`);
  const out = Buffer.alloc(width);
  let current = converted;
  for (let index = 0; index < width; index += 1) {
    out[index] = Number(current & 0xffn);
    current >>= 8n;
  }
  return out;
}

function readBigInt(raw: Uint8Array, offset: number, width: number): bigint {
  if (offset < 0 || width < 0 || offset + width > raw.length) throw new Refusal(CL_MALFORMED);
  let value = 0n;
  for (let index = 0; index < width; index += 1) value |= BigInt(raw[offset + index]) << BigInt(index * 8);
  return value;
}

function readInteger(raw: Uint8Array, offset: number, width: number): Integer {
  return integer(readBigInt(raw, offset, width));
}

function readNumber(raw: Uint8Array, offset: number, width: number): number {
  return requireNumber(readBigInt(raw, offset, width), "wire integer");
}

function isZero(value: Uint8Array): boolean {
  return value.length === 32 && value.every((item) => item === 0);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function buffer(value: Uint8Array): Buffer {
  return Buffer.from(value);
}

export function digest(value: Uint8Array, name = "digest"): Buffer {
  if (value.length !== 32) throw new Error(`${name} must be 32 bytes`);
  return buffer(value);
}

export function keyBytes(value: PublicKey | string | Uint8Array): Buffer {
  if (value instanceof PublicKey) return Buffer.from(value.toBytes());
  if (typeof value === "string") return Buffer.from(new PublicKey(value).toBytes());
  if (value instanceof Uint8Array) {
    if (value.length !== 32) throw new Error("public key must be 32 bytes");
    return buffer(value);
  }
  throw new TypeError("expected a public key, base58 string, or 32 bytes");
}

export function key(value: PublicKey | string | Uint8Array): PublicKey {
  return new PublicKey(keyBytes(value));
}

export function b58(value: PublicKey | string | Uint8Array): string {
  return key(value).toBase58();
}

export function sha256(...parts: Uint8Array[]): Buffer {
  const hash = createHash("sha256");
  for (const part of parts) hash.update(part);
  return hash.digest();
}

export function pda(program: PublicKey | string | Uint8Array, ...seeds: Seed[]): Pda {
  return PublicKey.findProgramAddressSync(seeds.map((seed) => {
    if (seed instanceof PublicKey) return Buffer.from(seed.toBytes());
    return typeof seed === "string" ? Buffer.from(seed, "ascii") : buffer(seed);
  }), key(program));
}

const ADDRESS_NAMES = ["registry", "template_seal", "admission", "document", "positions", "family_slots", "result", "challenge", "response"] as const;

export class AddressBook {
  readonly program: PublicKey;
  readonly config: Pda;
  readonly programdata: Pda;
  readonly registry?: Pda;
  readonly templateSeal?: Pda;
  readonly admission?: Pda;
  readonly document?: Pda;
  readonly positions?: Pda;
  readonly familySlots?: Pda;
  readonly result?: Pda;
  readonly challenge?: Pda;
  readonly response?: Pda;

  constructor(
    program: PublicKey,
    config: Pda,
    programdata: Pda,
    registry?: Pda,
    templateSeal?: Pda,
    admission?: Pda,
    document?: Pda,
    positions?: Pda,
    familySlots?: Pda,
    result?: Pda,
    challenge?: Pda,
    response?: Pda,
  ) {
    this.program = program;
    this.config = config;
    this.programdata = programdata;
    this.registry = registry;
    this.templateSeal = templateSeal;
    this.admission = admission;
    this.document = document;
    this.positions = positions;
    this.familySlots = familySlots;
    this.result = result;
    this.challenge = challenge;
    this.response = response;
  }

  asDict(): Record<string, Pda> {
    const values: Record<string, Pda> = { config: this.config, programdata: this.programdata };
    const entries: Record<string, Pda | undefined> = {
      registry: this.registry,
      template_seal: this.templateSeal,
      admission: this.admission,
      document: this.document,
      positions: this.positions,
      family_slots: this.familySlots,
      result: this.result,
      challenge: this.challenge,
      response: this.response,
    };
    for (const [name, value] of Object.entries(entries)) if (value !== undefined) values[name] = value;
    return values;
  }

  as_dict(): Record<string, Pda> {
    return this.asDict();
  }

  key(name: string): PublicKey {
    const value = this.asDict()[name];
    if (value === undefined) throw new Error(`unknown address ${name}`);
    return value[0];
  }

  get template_seal(): Pda | undefined { return this.templateSeal; }
  get family_slots(): Pda | undefined { return this.familySlots; }
}

export interface AddressesOptions {
  descriptor?: Uint8Array;
  pt2s?: Uint8Array;
  pt2sSha256?: Uint8Array;
  pt2s_sha256?: Uint8Array;
  challenger?: PublicKey | string | Uint8Array;
  nonce?: Integer;
  registryId?: number | null;
  registry_id?: number | null;
  registry?: Uint8Array;
  positionCount?: number;
  position_count?: number;
}

export function addresses(program: PublicKey | string | Uint8Array, options: AddressesOptions = {}): AddressBook {
  const programKey = key(program);
  const values: Record<string, Pda> = {
    config: pda(programKey, CONFIG_SEED),
    programdata: pda(UPGRADEABLE_LOADER, programKey),
  };
  const registryId = options.registryId ?? options.registry_id;
  if (registryId !== undefined && registryId !== null) values.registry = pda(programKey, REGISTRY_SEED, uint(EPOCH, 4), uint(registryId, 4));
  const pt2sSha256 = options.pt2sSha256 ?? options.pt2s_sha256;
  if (options.pt2s !== undefined && pt2sSha256 !== undefined) values.template_seal = pda(programKey, TEMPLATE_SEAL_SEED, digest(options.pt2s), digest(pt2sSha256));
  const positionCount = options.positionCount ?? options.position_count;
  if (options.registry !== undefined && options.pt2s !== undefined && positionCount !== undefined) {
    values.admission = pda(programKey, ADMISSION_SEED, digest(options.registry), digest(options.pt2s), uint(positionCount, 4));
  }
  if (options.descriptor !== undefined) {
    const descriptor = digest(options.descriptor, "descriptor");
    values.document = pda(programKey, DOCUMENT_SEED, descriptor);
    values.positions = pda(programKey, POSITIONS_SEED, descriptor);
    values.family_slots = pda(programKey, FAMILY_SLOTS_SEED, descriptor);
    values.result = pda(programKey, RESULT_SEED, descriptor);
    if (options.challenger !== undefined) {
      values.challenge = pda(programKey, CHALLENGE_SEED, descriptor, keyBytes(options.challenger), uint(options.nonce ?? 0, 4));
      values.response = pda(programKey, RESPONSE_SEED, values.challenge[0]);
    }
  }
  return new AddressBook(
    programKey,
    values.config,
    values.programdata,
    values.registry,
    values.template_seal,
    values.admission,
    values.document,
    values.positions,
    values.family_slots,
    values.result,
    values.challenge,
    values.response,
  );
}

export const deriveAddresses = addresses;
export const derive_addresses = addresses;

export interface DisputeTermsInput {
  challengeWindowSlots?: Integer;
  challenge_window_slots?: Integer;
  responseWindowSlots?: Integer;
  response_window_slots?: Integer;
  challengerBondLamports?: Integer;
  challenger_bond_lamports?: Integer;
  executorBondLamports?: Integer;
  executor_bond_lamports?: Integer;
  executorRewardBps?: Integer;
  executor_reward_bps?: Integer;
}

export class DisputeTerms {
  readonly challengeWindowSlots: Integer;
  readonly responseWindowSlots: Integer;
  readonly challengerBondLamports: Integer;
  readonly executorBondLamports: Integer;
  readonly executorRewardBps: Integer;

  constructor(input: DisputeTermsInput);
  constructor(challengeWindowSlots: Integer, responseWindowSlots: Integer, challengerBondLamports: Integer, executorBondLamports: Integer, executorRewardBps: Integer);
  constructor(inputOrChallenge: DisputeTermsInput | Integer, response?: Integer, challengerBond?: Integer, executorBond?: Integer, reward?: Integer) {
    if (typeof inputOrChallenge === "object") {
      const input = inputOrChallenge;
      this.challengeWindowSlots = input.challengeWindowSlots ?? input.challenge_window_slots ?? 0;
      this.responseWindowSlots = input.responseWindowSlots ?? input.response_window_slots ?? 0;
      this.challengerBondLamports = input.challengerBondLamports ?? input.challenger_bond_lamports ?? 0;
      this.executorBondLamports = input.executorBondLamports ?? input.executor_bond_lamports ?? 0;
      this.executorRewardBps = input.executorRewardBps ?? input.executor_reward_bps ?? 0;
    } else {
      this.challengeWindowSlots = inputOrChallenge;
      this.responseWindowSlots = response ?? 0;
      this.challengerBondLamports = challengerBond ?? 0;
      this.executorBondLamports = executorBond ?? 0;
      this.executorRewardBps = reward ?? 0;
    }
  }

  get challenge_window_slots(): Integer { return this.challengeWindowSlots; }
  get response_window_slots(): Integer { return this.responseWindowSlots; }
  get challenger_bond_lamports(): Integer { return this.challengerBondLamports; }
  get executor_bond_lamports(): Integer { return this.executorBondLamports; }
  get executor_reward_bps(): Integer { return this.executorRewardBps; }

  encode(): Buffer {
    if (checkDisputeTerms(this) !== 0) throw new Refusal(DISPUTE_TERMS);
    const out = Buffer.concat([
      Buffer.from("DDT1", "ascii"), uint(1, 2), Buffer.alloc(2), uint(this.challengeWindowSlots, 8),
      uint(this.responseWindowSlots, 8), uint(this.challengerBondLamports, 8), uint(this.executorBondLamports, 8),
      uint(this.executorRewardBps, 2), Buffer.alloc(6),
    ]);
    if (out.length !== TERMS_BYTES) throw new Error("terms length");
    return out;
  }

  static decode(raw: Uint8Array): DisputeTerms {
    const bytes = buffer(raw);
    if (bytes.length !== TERMS_BYTES || !sameBytes(bytes.subarray(0, 4), Buffer.from("DDT1")) || !sameBytes(bytes.subarray(4, 6), uint(1, 2)) || !sameBytes(bytes.subarray(6, 8), Buffer.alloc(2)) || !sameBytes(bytes.subarray(42, 48), Buffer.alloc(6))) throw new Refusal(DISPUTE_TERMS);
    const result = new DisputeTerms(readInteger(bytes, 8, 8), readInteger(bytes, 16, 8), readInteger(bytes, 24, 8), readInteger(bytes, 32, 8), readInteger(bytes, 40, 2));
    if (checkDisputeTerms(result) !== 0) throw new Refusal(DISPUTE_TERMS);
    return result;
  }
}

export function checkDisputeTerms(terms: DisputeTerms, roundFloorSlots: Integer = 1): number {
  if (asBigInt(roundFloorSlots) < 1n) throw new Error("round floor");
  const valid = compare(terms.challengeWindowSlots, 1) >= 0 && compare(terms.challengeWindowSlots, WINDOW_CAP) <= 0
    && compare(roundFloorSlots, terms.responseWindowSlots) <= 0 && compare(terms.responseWindowSlots, WINDOW_CAP) <= 0
    && compare(terms.challengerBondLamports, 0) >= 0 && compare(terms.challengerBondLamports, 1n << 64n) < 0
    && compare(terms.executorBondLamports, 0) >= 0 && compare(terms.executorBondLamports, 1n << 64n) < 0
    && compare(terms.executorRewardBps, 0) >= 0 && compare(terms.executorRewardBps, BPS_DENOMINATOR) <= 0;
  return valid ? 0 : DISPUTE_TERMS;
}

export const check_dispute_terms = checkDisputeTerms;

export interface RunBindingInput {
  executor: Uint8Array;
  requestId?: Uint8Array;
  request_id?: Uint8Array;
  consumerDigest?: Uint8Array;
  consumer_digest?: Uint8Array;
  seed: Uint8Array;
  outputFirstPosition?: number;
  output_first_position?: number;
  outputCount?: number;
  output_count?: number;
  outputBaseEntry?: number;
  output_base_entry?: number;
  outputWrite?: number;
  output_write?: number;
  outputWidth?: number;
  output_width?: number;
}

export class RunBinding {
  readonly executor: Buffer;
  readonly requestId: Buffer;
  readonly consumerDigest: Buffer;
  readonly seed: Buffer;
  readonly outputFirstPosition: number;
  readonly outputCount: number;
  readonly outputBaseEntry: number;
  readonly outputWrite: number;
  readonly outputWidth: number;

  constructor(input: RunBindingInput);
  constructor(executor: Uint8Array, requestId: Uint8Array, consumerDigest: Uint8Array, seed: Uint8Array, outputFirstPosition: number, outputCount: number, outputBaseEntry: number, outputWrite: number, outputWidth: number);
  constructor(inputOrExecutor: RunBindingInput | Uint8Array, requestId?: Uint8Array, consumerDigest?: Uint8Array, seed?: Uint8Array, outputFirstPosition?: number, outputCount?: number, outputBaseEntry?: number, outputWrite?: number, outputWidth?: number) {
    if (inputOrExecutor instanceof Uint8Array) {
      this.executor = buffer(inputOrExecutor);
      this.requestId = buffer(requestId ?? new Uint8Array(32));
      this.consumerDigest = buffer(consumerDigest ?? new Uint8Array(32));
      this.seed = buffer(seed ?? new Uint8Array(32));
      this.outputFirstPosition = outputFirstPosition ?? 0;
      this.outputCount = outputCount ?? 0;
      this.outputBaseEntry = outputBaseEntry ?? 0;
      this.outputWrite = outputWrite ?? 0;
      this.outputWidth = outputWidth ?? 0;
    } else {
      const input = inputOrExecutor;
      this.executor = buffer(input.executor);
      this.requestId = buffer(input.requestId ?? input.request_id ?? new Uint8Array(32));
      this.consumerDigest = buffer(input.consumerDigest ?? input.consumer_digest ?? new Uint8Array(32));
      this.seed = buffer(input.seed);
      this.outputFirstPosition = input.outputFirstPosition ?? input.output_first_position ?? 0;
      this.outputCount = input.outputCount ?? input.output_count ?? 0;
      this.outputBaseEntry = input.outputBaseEntry ?? input.output_base_entry ?? 0;
      this.outputWrite = input.outputWrite ?? input.output_write ?? 0;
      this.outputWidth = input.outputWidth ?? input.output_width ?? 0;
    }
  }

  get request_id(): Buffer { return this.requestId; }
  get consumer_digest(): Buffer { return this.consumerDigest; }
  get output_first_position(): number { return this.outputFirstPosition; }
  get output_count(): number { return this.outputCount; }
  get output_base_entry(): number { return this.outputBaseEntry; }
  get output_write(): number { return this.outputWrite; }
  get output_width(): number { return this.outputWidth; }

  encode(): Buffer {
    if (checkRunBinding(this) !== 0) throw new Refusal(RUN_BINDING);
    const out = Buffer.concat([
      Buffer.from("DRB1", "ascii"), uint(1, 2), Buffer.alloc(2), digest(this.executor), digest(this.requestId),
      digest(this.consumerDigest), digest(this.seed), uint(this.outputFirstPosition, 4), uint(this.outputCount, 4),
      uint(this.outputBaseEntry, 4), uint(this.outputWrite, 1), uint(this.outputWidth, 1), Buffer.alloc(10),
    ]);
    if (out.length !== BINDING_BYTES) throw new Error("binding length");
    return out;
  }

  static decode(raw: Uint8Array): RunBinding {
    const bytes = buffer(raw);
    if (bytes.length !== BINDING_BYTES || !sameBytes(bytes.subarray(0, 4), Buffer.from("DRB1")) || !sameBytes(bytes.subarray(4, 6), uint(1, 2)) || !sameBytes(bytes.subarray(6, 8), Buffer.alloc(2)) || !sameBytes(bytes.subarray(150, 160), Buffer.alloc(10))) throw new Refusal(RUN_BINDING);
    const result = new RunBinding(bytes.subarray(8, 40), bytes.subarray(40, 72), bytes.subarray(72, 104), bytes.subarray(104, 136), readNumber(bytes, 136, 4), readNumber(bytes, 140, 4), readNumber(bytes, 144, 4), bytes[148], bytes[149]);
    if (checkRunBinding(result) !== 0) throw new Refusal(RUN_BINDING);
    return result;
  }
}

export const check_run_binding = checkRunBinding;

export function resultBytes(outputCount: number, outputWidth: number): number {
  return RESULT_HEADER + outputCount * outputWidth + Math.ceil(outputCount / 8);
}

export const result_bytes = resultBytes;

export function checkRunBinding(binding: RunBinding, options: { positionCount?: number | null; signer?: Uint8Array | null } = {}): number {
  let valid = binding.executor.length === 32 && binding.requestId.length === 32 && binding.consumerDigest.length === 32 && binding.seed.length === 32
    && !isZero(binding.executor) && (isZero(binding.requestId) === isZero(binding.consumerDigest)) && binding.outputCount >= 1
    && binding.outputWidth >= 1 && binding.outputWidth <= MAX_OUTPUT_WIDTH && binding.outputWrite >= 0 && binding.outputWrite < 256
    && binding.outputBaseEntry >= 0 && binding.outputBaseEntry < 2 ** 32 && binding.outputFirstPosition >= 0 && binding.outputFirstPosition < 2 ** 32
    && binding.outputCount >= 0 && binding.outputCount < 2 ** 32 && resultBytes(binding.outputCount, binding.outputWidth) <= MAX_ACCOUNT_BYTES;
  if (valid && options.positionCount !== undefined && options.positionCount !== null) valid = binding.outputFirstPosition + binding.outputCount <= options.positionCount;
  if (valid && options.signer !== undefined && options.signer !== null) valid = sameBytes(binding.executor, options.signer);
  return valid ? 0 : RUN_BINDING;
}

export interface ResultV4Input {
  descriptor: Uint8Array;
  executor: Uint8Array;
  requestId?: Uint8Array;
  request_id?: Uint8Array;
  consumerDigest?: Uint8Array;
  consumer_digest?: Uint8Array;
  terms: DisputeTerms;
  outputFirstPosition: number;
  output_first_position?: number;
  outputCount: number;
  output_count?: number;
  outputWidth: number;
  output_width?: number;
  status?: number;
  closed?: number;
  documentRoot?: Uint8Array;
  document_root?: Uint8Array;
  finalizeSlot?: Integer;
  finalize_slot?: Integer;
  disputeDeadline?: Integer;
  dispute_deadline?: Integer;
  statusSlot?: Integer;
  status_slot?: Integer;
  challengerWins?: number;
  challenger_wins?: number;
  outputs?: Array<Uint8Array | null>;
}

export class ResultV4 {
  readonly descriptor: Buffer;
  readonly executor: Buffer;
  readonly requestId: Buffer;
  readonly consumerDigest: Buffer;
  readonly terms: DisputeTerms;
  readonly outputFirstPosition: number;
  readonly outputCount: number;
  readonly outputWidth: number;
  status: number;
  closed: number;
  documentRoot: Buffer;
  finalizeSlot: Integer;
  disputeDeadline: Integer;
  statusSlot: Integer;
  challengerWins: number;
  outputs: Array<Uint8Array | null>;

  constructor(input: ResultV4Input) {
    this.descriptor = buffer(input.descriptor);
    this.executor = buffer(input.executor);
    this.requestId = buffer(input.requestId ?? input.request_id ?? new Uint8Array(32));
    this.consumerDigest = buffer(input.consumerDigest ?? input.consumer_digest ?? new Uint8Array(32));
    this.terms = input.terms;
    this.outputFirstPosition = input.outputFirstPosition ?? input.output_first_position ?? 0;
    this.outputCount = input.outputCount ?? input.output_count ?? 0;
    this.outputWidth = input.outputWidth ?? input.output_width ?? 0;
    this.status = input.status ?? STATUS_PENDING;
    this.closed = input.closed ?? 0;
    this.documentRoot = buffer(input.documentRoot ?? input.document_root ?? new Uint8Array(32));
    this.finalizeSlot = input.finalizeSlot ?? input.finalize_slot ?? 0;
    this.disputeDeadline = input.disputeDeadline ?? input.dispute_deadline ?? 0;
    this.statusSlot = input.statusSlot ?? input.status_slot ?? 0;
    this.challengerWins = input.challengerWins ?? input.challenger_wins ?? 0;
    this.outputs = input.outputs === undefined ? Array.from({ length: this.outputCount }, () => null) : input.outputs.map((value) => value === null ? null : buffer(value));
  }

  get request_id(): Buffer { return this.requestId; }
  get consumer_digest(): Buffer { return this.consumerDigest; }
  get output_first_position(): number { return this.outputFirstPosition; }
  get output_count(): number { return this.outputCount; }
  get output_width(): number { return this.outputWidth; }
  get document_root(): Buffer { return this.documentRoot; }
  get finalize_slot(): Integer { return this.finalizeSlot; }
  get dispute_deadline(): Integer { return this.disputeDeadline; }
  get status_slot(): Integer { return this.statusSlot; }
  get challenger_wins(): number { return this.challengerWins; }

  static atInit(descriptor: Uint8Array, binding: RunBinding, terms: DisputeTerms): ResultV4 {
    return new ResultV4({ descriptor, executor: binding.executor, requestId: binding.requestId, consumerDigest: binding.consumerDigest, terms, outputFirstPosition: binding.outputFirstPosition, outputCount: binding.outputCount, outputWidth: binding.outputWidth });
  }

  get outputsAttested(): number {
    return this.outputs.reduce((count, value) => count + (value === null ? 0 : 1), 0);
  }

  get outputs_attested(): number { return this.outputsAttested; }

  get usable(): boolean {
    return USABLE_STATUSES.has(this.status) && !isZero(this.documentRoot) && this.outputsAttested === this.outputCount;
  }

  encode(): Buffer {
    if (![STATUS_PENDING, STATUS_FINAL, STATUS_REFUTED, STATUS_SETTLED].includes(this.status) || ![0, 1].includes(this.closed) || this.outputs.length !== this.outputCount || this.outputWidth < 1 || this.outputWidth > MAX_OUTPUT_WIDTH) throw new Refusal(RESULT_STATE);
    const header = Buffer.concat([
      Buffer.from("DCR2", "ascii"), uint(RESULT_VERSION, 2), uint(this.status, 1), uint(this.closed, 1), digest(this.descriptor), digest(this.documentRoot), digest(this.requestId), digest(this.consumerDigest), digest(this.executor), uint(this.finalizeSlot, 8), uint(this.disputeDeadline, 8), uint(this.statusSlot, 8), uint(this.challengerWins, 4), uint(this.outputCount, 4), uint(this.outputFirstPosition, 4), uint(this.outputsAttested, 4), uint(this.outputWidth, 1), Buffer.alloc(7),
    ]);
    if (header.length !== RESULT_TERMS_AT) throw new Error("result header");
    const outputBytes: Buffer[] = [];
    const bitmap = Buffer.alloc(Math.ceil(this.outputCount / 8));
    this.outputs.forEach((value, index) => {
      if (value === null) outputBytes.push(Buffer.alloc(this.outputWidth));
      else {
        if (value.length !== this.outputWidth) throw new Refusal(RESULT_STATE);
        outputBytes.push(buffer(value));
        bitmap[Math.floor(index / 8)] |= 1 << (index % 8);
      }
    });
    return Buffer.concat([header, this.terms.encode(), Buffer.alloc(RESULT_HEADER - RESULT_TERMS_AT - TERMS_BYTES), ...outputBytes, bitmap]);
  }

  static decode(raw: Uint8Array): ResultV4 {
    const bytes = buffer(raw);
    if (bytes.length < RESULT_HEADER || !sameBytes(bytes.subarray(0, 4), Buffer.from("DCR2")) || !sameBytes(bytes.subarray(4, 6), uint(RESULT_VERSION, 2))) throw new Refusal(RESULT_STATE);
    const count = readNumber(bytes, 196, 4);
    const width = bytes[208];
    if (bytes[6] > STATUS_SETTLED || bytes[7] > 1 || !sameBytes(bytes.subarray(209, 216), Buffer.alloc(7)) || !sameBytes(bytes.subarray(RESULT_TERMS_AT + TERMS_BYTES, RESULT_HEADER), Buffer.alloc(RESULT_HEADER - RESULT_TERMS_AT - TERMS_BYTES)) || width < 1 || width > MAX_OUTPUT_WIDTH || bytes.length !== resultBytes(count, width)) throw new Refusal(RESULT_STATE);
    const bitmapAt = RESULT_HEADER + count * width;
    const bitmap = bytes.subarray(bitmapAt);
    if (count % 8 !== 0 && (bitmap[bitmap.length - 1] >> (count % 8)) !== 0) throw new Refusal(RESULT_STATE);
    const outputs: Array<Uint8Array | null> = [];
    for (let index = 0; index < count; index += 1) {
      const value = bytes.subarray(RESULT_HEADER + index * width, RESULT_HEADER + (index + 1) * width);
      const present = ((bitmap[Math.floor(index / 8)] >> (index % 8)) & 1) !== 0;
      if (!present && !value.every((item) => item === 0)) throw new Refusal(RESULT_STATE);
      outputs.push(present ? value : null);
    }
    const result = new ResultV4({
      descriptor: bytes.subarray(8, 40), executor: bytes.subarray(136, 168), requestId: bytes.subarray(72, 104), consumerDigest: bytes.subarray(104, 136), terms: DisputeTerms.decode(bytes.subarray(RESULT_TERMS_AT, RESULT_TERMS_AT + TERMS_BYTES)), outputFirstPosition: readNumber(bytes, 200, 4), outputCount: count, outputWidth: width, status: bytes[6], closed: bytes[7], documentRoot: bytes.subarray(40, 72), finalizeSlot: readInteger(bytes, 168, 8), disputeDeadline: readInteger(bytes, 176, 8), statusSlot: readInteger(bytes, 184, 8), challengerWins: readNumber(bytes, 192, 4), outputs,
    });
    if (readNumber(bytes, 204, 4) !== result.outputsAttested) throw new Refusal(RESULT_STATE);
    return result;
  }
}

export interface Peak {
  first: number;
  level: number;
  digest: Uint8Array;
}

export function mmrAppend(descriptor: Uint8Array, count: number, peaks: readonly Peak[], positionRoot: Uint8Array): { count: number; peaks: Peak[]; root: Buffer } {
  if (count >= 2 ** 32 - 1) throw new Refusal(CL_OVERFLOW);
  const out: Peak[] = peaks.map((peak) => ({ first: peak.first, level: peak.level, digest: buffer(peak.digest) }));
  let carry: Peak = { first: count, level: 0, digest: sha256(Buffer.from("basanos/dcg-hclosure-incremental-leaf/1", "ascii"), digest(descriptor), uint(count, 4), digest(positionRoot)) };
  while (out.length > 0 && out[out.length - 1].level === carry.level) {
    const left = out.pop() as Peak;
    if (left.first + 2 ** left.level !== carry.first) throw new Refusal(CL_COORDINATE);
    carry = { first: left.first, level: carry.level + 1, digest: sha256(Buffer.from("basanos/dcg-hclosure-incremental-node/1", "ascii"), descriptor, uint(left.first, 4), uint(carry.level + 1, 1), digest(left.digest), digest(carry.digest)) };
  }
  out.push(carry);
  return { count: count + 1, peaks: out, root: mmrRoot(descriptor, count + 1, out) };
}

export const mmr_append = mmrAppend;

export function mmrRoot(descriptor: Uint8Array, count: number, peaks: readonly Peak[]): Buffer {
  if (count === 0 || peaks.length > 255) throw new Refusal(CL_MALFORMED);
  const body: Buffer[] = [Buffer.from("basanos/dcg-hclosure-incremental-document/1", "ascii"), digest(descriptor), uint(count, 4), uint(peaks.length, 1)];
  let expected = 0;
  for (const peak of peaks) {
    if (peak.first !== expected) throw new Refusal(CL_COORDINATE);
    body.push(uint(peak.level, 1), uint(peak.first, 4), digest(peak.digest));
    expected += 2 ** peak.level;
  }
  if (expected !== count) throw new Refusal(CL_COORDINATE);
  return sha256(...body);
}

export const mmr_root = mmrRoot;

export interface Dcm2V5Input {
  descriptor: Uint8Array;
  authority: Uint8Array;
  positionCount: number;
  segmentCount: number;
  totalEntries: Integer;
  terms: DisputeTerms;
  pt2s: Uint8Array;
  pt2sSha256: Uint8Array;
  modelRoot: Uint8Array;
  positionTableRoot: Uint8Array;
  promptCommitment: Uint8Array;
  registry: Uint8Array;
  registryTableRoot: Uint8Array;
  dea2: Uint8Array;
  dfs2: Uint8Array;
  registryEpoch: number;
  familyCount: number;
  runBinding: RunBinding;
  flags?: number;
  positionsComplete?: number;
  entriesComplete?: Integer;
  documentRoot?: Uint8Array;
  openChallenges?: number;
  challengerWins?: number;
  finalizeSlot?: Integer;
  disputeDeadline?: Integer;
  prefixRoot?: Uint8Array;
  familyTableDigest?: Uint8Array;
  peaks?: readonly Peak[];
  executorBondState?: number | null;
  run_binding?: RunBinding;
  pt2s_sha256?: Uint8Array;
  position_table_root?: Uint8Array;
  prompt_commitment?: Uint8Array;
  registry_table_root?: Uint8Array;
  family_count?: number;
  total_entries?: Integer;
}

export class Dcm2V5 {
  readonly descriptor: Buffer;
  readonly authority: Buffer;
  readonly positionCount: number;
  readonly segmentCount: number;
  readonly totalEntries: Integer;
  readonly terms: DisputeTerms;
  readonly pt2s: Buffer;
  readonly pt2sSha256: Buffer;
  readonly modelRoot: Buffer;
  readonly positionTableRoot: Buffer;
  readonly promptCommitment: Buffer;
  readonly registry: Buffer;
  readonly registryTableRoot: Buffer;
  readonly dea2: Buffer;
  readonly dfs2: Buffer;
  readonly registryEpoch: number;
  readonly familyCount: number;
  readonly runBinding: RunBinding;
  flags: number;
  positionsComplete: number;
  entriesComplete: Integer;
  documentRoot: Buffer;
  openChallenges: number;
  challengerWins: number;
  finalizeSlot: Integer;
  disputeDeadline: Integer;
  prefixRoot: Buffer;
  familyTableDigest: Buffer;
  peaks: Peak[];
  executorBondState: number;

  constructor(input: Dcm2V5Input) {
    this.descriptor = buffer(input.descriptor);
    this.authority = buffer(input.authority);
    this.positionCount = input.positionCount;
    this.segmentCount = input.segmentCount;
    this.totalEntries = input.totalEntries ?? input.total_entries ?? 0;
    this.terms = input.terms;
    this.pt2s = buffer(input.pt2s);
    this.pt2sSha256 = buffer(input.pt2sSha256 ?? input.pt2s_sha256);
    this.modelRoot = buffer(input.modelRoot);
    this.positionTableRoot = buffer(input.positionTableRoot ?? input.position_table_root);
    this.promptCommitment = buffer(input.promptCommitment ?? input.prompt_commitment);
    this.registry = buffer(input.registry);
    this.registryTableRoot = buffer(input.registryTableRoot ?? input.registry_table_root);
    this.dea2 = buffer(input.dea2);
    this.dfs2 = buffer(input.dfs2);
    this.registryEpoch = input.registryEpoch;
    this.familyCount = input.familyCount ?? input.family_count ?? 0;
    this.runBinding = input.runBinding ?? input.run_binding as RunBinding;
    this.flags = input.flags ?? (FLAG_ARMED | FLAG_ROOT_ONLY | FLAG_SEALED);
    this.positionsComplete = input.positionsComplete ?? 0;
    this.entriesComplete = input.entriesComplete ?? 0;
    this.documentRoot = buffer(input.documentRoot ?? new Uint8Array(32));
    this.openChallenges = input.openChallenges ?? 0;
    this.challengerWins = input.challengerWins ?? 0;
    this.finalizeSlot = input.finalizeSlot ?? 0;
    this.disputeDeadline = input.disputeDeadline ?? 0;
    this.prefixRoot = buffer(input.prefixRoot ?? new Uint8Array(32));
    this.familyTableDigest = buffer(input.familyTableDigest ?? new Uint8Array(32));
    this.peaks = (input.peaks ?? []).map((peak) => ({ first: peak.first, level: peak.level, digest: buffer(peak.digest) }));
    if (!sameBytes(this.runBinding.executor, this.authority)) throw new Refusal(RUN_BINDING);
    this.executorBondState = input.executorBondState === undefined || input.executorBondState === null ? (compare(this.terms.executorBondLamports, 0) === 0 ? BOND_NONE : BOND_HELD) : input.executorBondState;
  }

  get run_binding(): RunBinding { return this.runBinding; }
  get disputeWindow(): Integer { return this.terms.challengeWindowSlots; }
  get dispute_window(): Integer { return this.disputeWindow; }

  encode(): Buffer {
    if (this.peaks.length > PEAK_SLOTS) throw new Refusal(CL_MALFORMED);
    const out: Buffer[] = [
      Buffer.from("DCM2", "ascii"), uint(5, 2), uint(this.flags, 2), digest(this.descriptor), digest(this.authority), uint(this.positionCount, 4), uint(this.segmentCount, 2), Buffer.alloc(6), uint(this.positionsComplete, 4), uint(this.entriesComplete, 8), digest(this.documentRoot), uint(this.openChallenges, 4), uint(this.challengerWins, 4), uint(this.finalizeSlot, 8), uint(this.disputeDeadline, 8), digest(this.prefixRoot), uint(this.disputeWindow, 8), uint(this.totalEntries, 8), digest(this.pt2s), digest(this.pt2sSha256), digest(this.modelRoot), digest(this.positionTableRoot), digest(this.promptCommitment), digest(this.registry), digest(this.registryTableRoot), digest(this.dea2), digest(this.dfs2), digest(this.familyTableDigest), uint(this.registryEpoch, 4), uint(this.familyCount, 2), uint(bitLength(add(this.positionCount, -1)), 1), Buffer.from([3]), uint(this.peaks.length, 1), uint(this.executorBondState, 1), Buffer.alloc(6),
    ];
    for (const peak of this.peaks) out.push(uint(peak.level, 1), Buffer.alloc(3), uint(peak.first, 4), digest(peak.digest));
    out.push(Buffer.alloc(PEAK_BYTES * (PEAK_SLOTS - this.peaks.length)), this.terms.encode(), this.runBinding.encode());
    const encoded = Buffer.concat(out);
    if (encoded.length !== DCM2_V5_HEADER) throw new Error("DCM2 length");
    return encoded;
  }

  static decode(raw: Uint8Array): Dcm2V5 {
    const bytes = buffer(raw);
    if (bytes.length !== DCM2_V5_HEADER || !sameBytes(bytes.subarray(0, 4), Buffer.from("DCM2")) || !sameBytes(bytes.subarray(4, 6), uint(5, 2))) throw new Refusal(CL_MALFORMED);
    const flags = readNumber(bytes, 6, 2);
    const positionCount = readNumber(bytes, 72, 4);
    if ((flags & ~63) !== 0 || (flags & (FLAG_ROOT_ONLY | FLAG_SEALED)) !== (FLAG_ROOT_ONLY | FLAG_SEALED) || !sameBytes(bytes.subarray(78, 84), Buffer.alloc(6)) || bytes[527] !== COMMITMENT_VERSION || bytes[526] !== bitLength(add(positionCount, -1)) || !sameBytes(bytes.subarray(530, 536), Buffer.alloc(6)) || bytes[528] > PEAK_SLOTS || bytes[529] > BOND_RETURNED) throw new Refusal(CL_MALFORMED);
    const terms = DisputeTerms.decode(bytes.subarray(DCM2_TERMS_AT, DCM2_BINDING_AT));
    const binding = RunBinding.decode(bytes.subarray(DCM2_BINDING_AT));
    if (!sameBytes(binding.executor, bytes.subarray(40, 72)) || binding.outputFirstPosition + binding.outputCount > positionCount) throw new Refusal(CL_MALFORMED);
    if (readBigInt(bytes, 184, 8) !== asBigInt(terms.challengeWindowSlots) || ((bytes[529] === BOND_NONE) !== (compare(terms.executorBondLamports, 0) === 0))) throw new Refusal(CL_MALFORMED);
    const peaks: Peak[] = [];
    for (let index = 0; index < bytes[528]; index += 1) {
      const at = DCM2_HEADER + PEAK_BYTES * index;
      if (!sameBytes(bytes.subarray(at + 1, at + 4), Buffer.alloc(3))) throw new Refusal(CL_MALFORMED);
      peaks.push({ first: readNumber(bytes, at + 4, 4), level: bytes[at], digest: bytes.subarray(at + 8, at + 40) });
    }
    if (!sameBytes(bytes.subarray(DCM2_HEADER + PEAK_BYTES * bytes[528], DCM2_TERMS_AT), Buffer.alloc(PEAK_BYTES * (PEAK_SLOTS - bytes[528])))) throw new Refusal(CL_MALFORMED);
    return new Dcm2V5({
      descriptor: bytes.subarray(8, 40), authority: bytes.subarray(40, 72), positionCount, segmentCount: readNumber(bytes, 76, 2), totalEntries: readInteger(bytes, 192, 8), terms, pt2s: bytes.subarray(200, 232), pt2sSha256: bytes.subarray(232, 264), modelRoot: bytes.subarray(264, 296), positionTableRoot: bytes.subarray(296, 328), promptCommitment: bytes.subarray(328, 360), registry: bytes.subarray(360, 392), registryTableRoot: bytes.subarray(392, 424), dea2: bytes.subarray(424, 456), dfs2: bytes.subarray(456, 488), registryEpoch: readNumber(bytes, 520, 4), familyCount: readNumber(bytes, 524, 2), runBinding: binding, flags, positionsComplete: readNumber(bytes, 84, 4), entriesComplete: readInteger(bytes, 88, 8), documentRoot: bytes.subarray(96, 128), openChallenges: readNumber(bytes, 128, 4), challengerWins: readNumber(bytes, 132, 4), finalizeSlot: readInteger(bytes, 136, 8), disputeDeadline: readInteger(bytes, 144, 8), prefixRoot: bytes.subarray(152, 184), familyTableDigest: bytes.subarray(488, 520), peaks, executorBondState: bytes[529],
    });
  }

  appendPosition(position: number, positionRoot: Uint8Array): void {
    if (position !== this.positionsComplete) throw new Refusal(APPEND_ORDER);
    const result = mmrAppend(this.descriptor, this.positionsComplete, this.peaks, positionRoot);
    this.positionsComplete = result.count;
    this.peaks = result.peaks;
    this.prefixRoot = result.root;
  }
}

export function encodeLandPositionRoots(descriptor: Uint8Array, first: number, roots: readonly Uint8Array[]): Buffer {
  if (roots.length < 1 || roots.length > 255) throw new Refusal(CL_MALFORMED);
  return Buffer.concat([Buffer.from([TAG_LAND_POSITION_ROOTS]), digest(descriptor), uint(first, 4), uint(roots.length, 1), ...roots.map((root) => digest(root))]);
}

export const encode_land_position_roots = encodeLandPositionRoots;

export function landPositionRoots(document: Dcm2V5, dpr2: Array<Uint8Array | null>, data: Uint8Array, signer: Uint8Array): void {
  const bytes = buffer(data);
  if (bytes.length < 38 || bytes[0] !== TAG_LAND_POSITION_ROOTS || bytes[37] === 0 || bytes.length !== 38 + 32 * bytes[37]) throw new Refusal(CL_MALFORMED);
  if (!sameBytes(bytes.subarray(1, 33), document.descriptor) || dpr2.length !== document.positionCount) throw new Refusal(CL_MALFORMED);
  if (!sameBytes(signer, document.authority)) throw new Refusal(CL_AUTHORITY);
  if ((document.flags & FLAG_FINAL) !== 0) throw new Refusal(CL_AFTER_FINAL);
  const first = readNumber(bytes, 33, 4);
  const count = bytes[37];
  if (first !== document.positionsComplete) throw new Refusal(APPEND_ORDER);
  if (first + count > document.positionCount) throw new Refusal(CL_COORDINATE);
  for (let index = 0; index < count; index += 1) {
    const root = bytes.subarray(38 + 32 * index, 70 + 32 * index);
    if (isZero(root)) throw new Refusal(CL_ROOT);
    document.appendPosition(first + index, root);
    dpr2[first + index] = root;
  }
}

export const land_position_roots = landPositionRoots;

export function encodeDpr2(descriptor: Uint8Array, positionCount: number, roots: readonly Uint8Array[]): Buffer {
  if (positionCount < 1 || roots.length !== positionCount) throw new Refusal(CL_COORDINATE);
  if (roots.some((root) => root.length !== 32 || isZero(root))) throw new Refusal(CL_ROOT);
  return Buffer.concat([Buffer.from("DPR2", "ascii"), Buffer.from([1, 0]), Buffer.alloc(2), digest(descriptor), uint(positionCount, 4), uint(positionCount, 4), ...roots.map((root) => buffer(root))]);
}

export const encode_dpr2 = encodeDpr2;

export function decodeDpr2(raw: Uint8Array, options: { allowPartial?: boolean } = {}): { descriptor: Buffer; roots: Buffer[] } {
  const bytes = buffer(raw);
  if (bytes.length < DPR2_HEADER || !sameBytes(bytes.subarray(0, 4), Buffer.from("DPR2")) || !sameBytes(bytes.subarray(4, 6), Buffer.from([1, 0])) || !sameBytes(bytes.subarray(6, 8), Buffer.alloc(2))) throw new Refusal(CL_MALFORMED);
  const count = readNumber(bytes, 40, 4);
  const landed = readNumber(bytes, 44, 4);
  if (count < 1 || landed > count || (!options.allowPartial && landed !== count)) throw new Refusal(CL_MALFORMED);
  if (bytes.length !== DPR2_HEADER + 32 * landed && bytes.length !== DPR2_HEADER + 32 * count) throw new Refusal(CL_MALFORMED);
  const roots: Buffer[] = [];
  for (let index = 0; index < landed; index += 1) roots.push(bytes.subarray(DPR2_HEADER + 32 * index, DPR2_HEADER + 32 * (index + 1)));
  if (roots.some((root) => isZero(root))) throw new Refusal(CL_ROOT);
  return { descriptor: bytes.subarray(8, 40), roots };
}

export const decode_dpr2 = decodeDpr2;

export function eventBodyBytes(kind: number): number {
  const schema = EVENT_SCHEMA[kind];
  if (schema === undefined) throw new Refusal(CL_MALFORMED);
  return schema[1].reduce((sum, [, width]) => sum + width, 0);
}

export const event_body_bytes = eventBodyBytes;

export type EventFields = Record<string, Integer | Uint8Array>;
export interface EventEncodeOptions {
  descriptor: Uint8Array;
  slot: Integer;
  fields?: EventFields;
  [name: string]: Integer | Uint8Array | EventFields | undefined;
}

function eventInput(descriptorOrOptions: Uint8Array | EventEncodeOptions, slot: Integer | undefined, fields: EventFields | undefined): { descriptor: Uint8Array; slot: Integer; fields: EventFields } {
  if (descriptorOrOptions instanceof Uint8Array) {
    if (slot === undefined) throw new Error("event slot is required");
    return { descriptor: descriptorOrOptions, slot, fields: fields ?? {} };
  }
  const options = descriptorOrOptions;
  const nested = options.fields ?? {};
  const values = { ...options, ...nested } as EventFields;
  delete (values as EventFields & { descriptor?: unknown }).descriptor;
  delete (values as EventFields & { slot?: unknown }).slot;
  delete (values as EventFields & { fields?: unknown }).fields;
  return { descriptor: options.descriptor, slot: options.slot, fields: values };
}

export function encodeEvent(name: string, descriptor: Uint8Array, slot: Integer, fields?: EventFields): Buffer;
export function encodeEvent(name: string, options: EventEncodeOptions): Buffer;
export function encodeEvent(name: string, descriptorOrOptions: Uint8Array | EventEncodeOptions, slot?: Integer, fields?: EventFields): Buffer {
  const kind = EVENT_KINDS[name];
  if (kind === undefined) throw new Error("event kind");
  const input = eventInput(descriptorOrOptions, slot, fields);
  const schemaNames = new Set(EVENT_SCHEMA[kind][1].map(([fieldName]) => fieldName).filter((fieldName): fieldName is string => fieldName !== null));
  const normalized: EventFields = {};
  for (const [name, value] of Object.entries(input.fields)) {
    const snake = name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    const normalizedName = schemaNames.has(name) ? name : schemaNames.has(snake) ? snake : name;
    if (!schemaNames.has(normalizedName)) throw new Error(`unknown event field ${name}`);
    normalized[normalizedName] = value as Integer | Uint8Array;
  }
  const remaining: EventFields = normalized;
  const out: Buffer[] = [EVENT_MAGIC, uint(EVENT_VERSION, 2), uint(kind, 1), Buffer.alloc(1), digest(input.descriptor), uint(input.slot, 8)];
  for (const [fieldName, width] of EVENT_SCHEMA[kind][1]) {
    if (fieldName === null) out.push(Buffer.alloc(width));
    else {
      const value = remaining[fieldName];
      if (value === undefined) throw new Error(`missing event field ${fieldName}`);
      delete remaining[fieldName];
      out.push(width === 32 ? digest(value as Uint8Array, fieldName) : uint(value as Integer, width));
    }
  }
  if (Object.keys(remaining).length > 0) throw new Error(`unknown event fields ${Object.keys(remaining).sort().join(", ")}`);
  return Buffer.concat(out);
}

export const encode_event = encodeEvent;

export function decodeEvent(raw: Uint8Array): Record<string, Integer | Buffer | string> {
  const bytes = buffer(raw);
  if (bytes.length < EVENT_HEADER || !sameBytes(bytes.subarray(0, 4), EVENT_MAGIC) || !sameBytes(bytes.subarray(4, 6), uint(EVENT_VERSION, 2)) || bytes[7] !== 0) throw new Refusal(CL_MALFORMED);
  const kind = bytes[6];
  const schema = EVENT_SCHEMA[kind];
  if (schema === undefined || bytes.length !== EVENT_HEADER + eventBodyBytes(kind)) throw new Refusal(CL_MALFORMED);
  const result: Record<string, Integer | Buffer | string> = { kind: schema[0], descriptor: bytes.subarray(8, 40), slot: readInteger(bytes, 40, 8) };
  let at = EVENT_HEADER;
  for (const [fieldName, width] of schema[1]) {
    const chunk = bytes.subarray(at, at + width);
    if (fieldName === null) {
      if (!chunk.every((value) => value === 0)) throw new Refusal(CL_MALFORMED);
    } else result[fieldName] = width === 32 ? chunk : readInteger(chunk, 0, width);
    at += width;
  }
  return result;
}

export const decode_event = decodeEvent;

interface TreeNode { digest: Buffer; first: number; last: number }

function node(descriptor: Uint8Array, kind: number, scope: number, height: number, left: TreeNode, right: TreeNode): TreeNode {
  return { digest: sha256(Buffer.from("basanos/dcg-hclosure-node/2", "ascii"), digest(descriptor), uint(kind, 1), uint(scope, 4), uint(left.first, 4), uint(right.last, 4), uint(height, 1), Buffer.from([1]), left.digest, right.digest), first: left.first, last: right.last };
}

export function duplicateLevels(descriptor: Uint8Array, kind: number, scope: number, values: readonly Uint8Array[]): TreeNode[][] {
  if (values.length === 0 || values.some((value) => value.length !== 32)) throw new Refusal(CL_MALFORMED);
  const out: TreeNode[][] = [values.map((value, index) => ({ digest: digest(value), first: index, last: index + 1 }))];
  while (out[out.length - 1].length > 1) {
    const current = out[out.length - 1];
    const next: TreeNode[] = [];
    for (let index = 0; index < current.length; index += 2) next.push(node(descriptor, kind, scope, out.length, current[index], current[index + 1] ?? current[index]));
    out.push(next);
  }
  return out;
}

export const duplicate_levels = duplicateLevels;

export function duplicatePath(levels: readonly TreeNode[][], index: number): Buffer[] {
  if (levels.length === 0 || index < 0 || index >= levels[0].length) throw new Refusal(CL_COORDINATE);
  const out: Buffer[] = [];
  let current = index;
  for (let levelIndex = 0; levelIndex < levels.length - 1; levelIndex += 1) {
    const level = levels[levelIndex];
    const sibling = current ^ 1;
    out.push(sibling < level.length ? level[sibling].digest : level[current].digest);
    current = Math.floor(current / 2);
  }
  return out;
}

export const duplicate_path = duplicatePath;

export function duplicateFold(descriptor: Uint8Array, kind: number, scope: number, count: number, index: number, value: Uint8Array, path: readonly Uint8Array[]): Buffer | null {
  if (index < 0 || index >= count || path.length !== bitLength(count - 1)) return null;
  let current: TreeNode = { digest: digest(value), first: index, last: index + 1 };
  let currentIndex = index;
  let width = count;
  let span = 1;
  for (let level = 1; level <= path.length; level += 1) {
    const siblingIndex = currentIndex ^ 1;
    let sibling: TreeNode;
    if (siblingIndex >= width) {
      if (!sameBytes(path[level - 1], current.digest)) return null;
      sibling = current;
    } else sibling = { digest: digest(path[level - 1]), first: siblingIndex * span, last: Math.min((siblingIndex + 1) * span, count) };
    current = node(descriptor, kind, scope, level, currentIndex % 2 === 0 ? current : sibling, currentIndex % 2 === 0 ? sibling : current);
    currentIndex = Math.floor(currentIndex / 2);
    width = Math.ceil(width / 2);
    span *= 2;
  }
  return current.digest;
}

export const duplicate_fold = duplicateFold;

export function positionRoot(descriptor: Uint8Array, position: number, segmentTableRoot: Uint8Array, segmentRoots: readonly Uint8Array[]): Buffer {
  if (segmentRoots.length === 0) throw new Refusal(CL_MALFORMED);
  const tree = duplicateLevels(descriptor, 2, position, segmentRoots).at(-1)?.[0].digest;
  if (tree === undefined) throw new Refusal(CL_MALFORMED);
  return sha256(Buffer.from("basanos/dcg-hclosure-position-root/2", "ascii"), digest(descriptor), uint(position, 4), uint(segmentRoots.length, 2), digest(segmentTableRoot), tree, Buffer.from([1]));
}

export const position_root = positionRoot;

export function encodeSpp1(ordinal: number, segmentTableRoot: Uint8Array, path: readonly Uint8Array[]): Buffer {
  if (path.length > 255) throw new Refusal(CL_MALFORMED);
  return Buffer.concat([uint(ordinal, 2), uint(path.length, 1), Buffer.alloc(1), digest(segmentTableRoot), ...path.map((value) => digest(value))]);
}

export const encode_spp1 = encodeSpp1;

export function decodeSpp1(raw: Uint8Array): { ordinal: number; tableRoot: Buffer; path: Buffer[] } {
  const bytes = buffer(raw);
  if (bytes.length < 36 || bytes[3] !== 0 || bytes.length !== 36 + 32 * bytes[2]) throw new Refusal(DCR1_BAD);
  const path: Buffer[] = [];
  for (let index = 0; index < bytes[2]; index += 1) path.push(bytes.subarray(36 + 32 * index, 68 + 32 * index));
  return { ordinal: readNumber(bytes, 0, 2), tableRoot: bytes.subarray(4, 36), path };
}

export const decode_spp1 = decodeSpp1;

export function verifySpp1(descriptor: Uint8Array, position: number, segmentCount: number, segmentRoot: Uint8Array, proof: Uint8Array, landedRoot: Uint8Array, expectedTableRoot?: Uint8Array): boolean {
  let parsed: { ordinal: number; tableRoot: Buffer; path: Buffer[] };
  try { parsed = decodeSpp1(proof); } catch { return false; }
  if (expectedTableRoot !== undefined && !sameBytes(parsed.tableRoot, expectedTableRoot)) return false;
  if (segmentCount < 1 || segmentCount > MAX_SEGMENTS || parsed.ordinal >= segmentCount) return false;
  const folded = duplicateFold(descriptor, 2, position, segmentCount, parsed.ordinal, segmentRoot, parsed.path);
  if (folded === null) return false;
  const root = sha256(Buffer.from("basanos/dcg-hclosure-position-root/2", "ascii"), digest(descriptor), uint(position, 4), uint(segmentCount, 2), parsed.tableRoot, folded, Buffer.from([1]));
  return sameBytes(root, landedRoot);
}

export const verify_spp1 = verifySpp1;

function leafParent(descriptor: Uint8Array, position: number, level: number, left: TreeNode, right: TreeNode): TreeNode {
  return { digest: sha256(Buffer.from("basanos/dcg-hclosure-node/2", "ascii"), descriptor, Buffer.from([1]), uint(position, 4), uint(left.first, 4), uint(right.last, 4), uint(level, 1), Buffer.from([1]), left.digest, right.digest), first: left.first, last: right.last };
}

export function segmentRootFromLeaf(descriptor: Uint8Array, position: number, segment: number, entries: number, local: number, leafDigest: Uint8Array, path: readonly Uint8Array[]): Buffer | null {
  if (local < 0 || local >= entries || path.length !== bitLength(entries - 1)) return null;
  let current: TreeNode = { digest: buffer(leafDigest), first: local, last: local + 1 };
  let currentIndex = local;
  let width = entries;
  let span = 1;
  for (let level = 1; level <= path.length; level += 1) {
    const siblingIndex = currentIndex ^ 1;
    let sibling: TreeNode;
    if (siblingIndex >= width) {
      if (!sameBytes(path[level - 1], current.digest)) return null;
      sibling = current;
    } else sibling = { digest: digest(path[level - 1]), first: siblingIndex * span, last: Math.min((siblingIndex + 1) * span, entries) };
    current = leafParent(descriptor, position, level, currentIndex % 2 === 0 ? current : sibling, currentIndex % 2 === 0 ? sibling : current);
    currentIndex = Math.floor(currentIndex / 2);
    width = Math.ceil(width / 2);
    span *= 2;
  }
  return sha256(Buffer.from("basanos/dcg-hclosure-segment-root/2", "ascii"), digest(descriptor), uint(position, 4), uint(segment, 2), uint(entries, 4), current.digest, Buffer.from([1]));
}

export const segment_root_from_leaf = segmentRootFromLeaf;

export function encodeAttestation(descriptor: Uint8Array, index: number, value: Uint8Array, leafPreimage: Uint8Array, path: readonly Uint8Array[], spp1: Uint8Array): Buffer {
  decodeSpp1(spp1);
  if (value.length === 0 || value.length > MAX_OUTPUT_WIDTH || !sameBytes(leafPreimage.subarray(0, 27), Buffer.from("basanos/dcg-hclosure-leaf/2", "ascii")) || !sameBytes(leafPreimage.subarray(27, 59), descriptor)) throw new Refusal(OUTPUT_PROOF);
  const tail = leafPreimage.subarray(69);
  return Buffer.concat([Buffer.from([TAG_ATTEST_OUTPUT]), digest(descriptor), uint(index, 4), value, uint(tail.length, 2), tail, uint(path.length, 1), ...path.map((item) => digest(item)), spp1]);
}

export const encode_attestation = encodeAttestation;

export interface Attestation {
  descriptor: Buffer;
  index: number;
  value: Buffer;
  leaf: Buffer;
  path: Buffer[];
  spp1: Buffer;
}

export function decodeAttestation(data: Uint8Array, width: number): Attestation {
  const bytes = buffer(data);
  try {
    if (bytes[0] !== TAG_ATTEST_OUTPUT) throw new Error("tag");
    let at = 37;
    const index = readNumber(bytes, 33, 4);
    const value = bytes.subarray(at, at + width);
    at += width;
    const leafLength = readNumber(bytes, at, 2);
    at += 2;
    const leaf = bytes.subarray(at, at + leafLength);
    at += leafLength;
    const height = bytes[at];
    at += 1;
    const path: Buffer[] = [];
    for (let pathIndex = 0; pathIndex < height; pathIndex += 1) path.push(bytes.subarray(at + 32 * pathIndex, at + 32 * (pathIndex + 1)));
    at += 32 * height;
    const spp1 = bytes.subarray(at);
    if (value.length !== width || leaf.length !== leafLength || path.some((item) => item.length !== 32)) throw new Error("length");
    decodeSpp1(spp1);
    return { descriptor: bytes.subarray(1, 33), index, value, leaf, path, spp1 };
  } catch {
    throw new Refusal(CL_MALFORMED);
  }
}

export const decode_attestation = decodeAttestation;

export interface AttestationVerification extends Attestation {
  position: number;
  segmentRoot: Buffer;
  outputDigest: Buffer;
}

export function verifyAttestation(data: Uint8Array, options: { width: number; position: number; segmentCount: number; segment: number; entries: number; local: number; region: number; offset: number; landedRoot: Uint8Array; expectedTableRoot?: Uint8Array; expectedIndex?: number; expectedDescriptor?: Uint8Array }): AttestationVerification {
  const parsed = decodeAttestation(data, options.width);
  if (options.expectedDescriptor !== undefined && !sameBytes(parsed.descriptor, options.expectedDescriptor)) throw new Refusal(OUTPUT_PROOF);
  if (options.expectedIndex !== undefined && parsed.index !== options.expectedIndex) throw new Refusal(OUTPUT_PROOF);
  const leaf = Buffer.concat([Buffer.from("basanos/dcg-hclosure-leaf/2", "ascii"), digest(parsed.descriptor), uint(options.position, 4), uint(options.segment, 2), uint(options.local, 4), parsed.leaf]);
  if (leaf.length < 147 || !sameBytes(leaf.subarray(145, 147), Buffer.alloc(2))) throw new Refusal(OUTPUT_PROOF);
  const writeCount = readNumber(leaf, 143, 2);
  if (leaf.length !== 147 + 48 * writeCount) throw new Refusal(OUTPUT_PROOF);
  const writeRows: Buffer[] = [];
  for (let index = 0; index < writeCount; index += 1) writeRows.push(leaf.subarray(147 + 48 * index, 147 + 48 * (index + 1)));
  const outputDigest = sha256(Buffer.from("basanos/dcg-hclosure-write/2", "ascii"), digest(parsed.descriptor), Buffer.concat([uint(options.position, 4), uint(options.segment, 2), uint(options.local, 4)]), uint(options.region, 2), uint(options.offset, 8), uint(options.width, 4), parsed.value);
  const expectedRow = Buffer.concat([uint(options.region, 2), Buffer.alloc(2), uint(options.width, 4), uint(options.offset, 8), outputDigest]);
  if (!writeRows.some((row) => sameBytes(row, expectedRow))) throw new Refusal(OUTPUT_PROOF);
  const segmentRoot = segmentRootFromLeaf(parsed.descriptor, options.position, options.segment, options.entries, options.local, sha256(leaf), parsed.path);
  if (segmentRoot === null || !verifySpp1(parsed.descriptor, options.position, options.segmentCount, segmentRoot, parsed.spp1, options.landedRoot, options.expectedTableRoot)) throw new Refusal(OUTPUT_PROOF);
  return { ...parsed, position: options.position, segmentRoot, outputDigest };
}

export const verify_attestation = verifyAttestation;

export function encodeRevealPosition(first: number, roots: readonly Uint8Array[]): Buffer {
  return Buffer.concat([Buffer.from([TAG_REVEAL_POSITION]), uint(first, 2), uint(roots.length, 1), ...roots.map((root) => digest(root))]);
}

export const encode_reveal_position = encodeRevealPosition;

export function encodeSelectSegment(ordinal: number): Buffer { return Buffer.concat([Buffer.from([TAG_SELECT_SEGMENT]), uint(ordinal, 2)]); }
export const encode_select_segment = encodeSelectSegment;

export function encodeRevealFamilyTable(first: number, roots: readonly Uint8Array[]): Buffer { return Buffer.concat([Buffer.from([TAG_REVEAL_FAMILY_TABLE]), uint(first, 1), uint(roots.length, 1), ...roots.map((root) => digest(root))]); }
export const encode_reveal_family_table = encodeRevealFamilyTable;

export function encodeCloseResponse(): Buffer { return Buffer.from([TAG_CLOSE_RESPONSE]); }
export const encode_close_response = encodeCloseResponse;

export function encodeResolveResult(descriptor: Uint8Array): Buffer { return Buffer.concat([Buffer.from([TAG_RESOLVE_RESULT]), digest(descriptor)]); }
export const encode_resolve_result = encodeResolveResult;

export function encodeCloseDocument(descriptor: Uint8Array): Buffer { return Buffer.concat([Buffer.from([TAG_CLOSE_DOCUMENT]), digest(descriptor)]); }
export const encode_close_document = encodeCloseDocument;

export function encodeFinalizeDocument(descriptor: Uint8Array, roots: readonly Uint8Array[]): Buffer { return Buffer.concat([Buffer.from([TAG_FINALIZE_DOCUMENT]), digest(descriptor), uint(roots.length, 2), ...roots.map((root) => digest(root))]); }
export const encode_finalize_document = encodeFinalizeDocument;

export function familyTableDigest(descriptor: Uint8Array, roots: readonly Uint8Array[]): Buffer { return sha256(FAMILY_TABLE_DOMAIN, digest(descriptor), uint(roots.length, 2), ...roots.map((root) => digest(root))); }
export const family_table_digest = familyTableDigest;

function comparePair(left: readonly [number, number], right: readonly [number, number]): number { return left[0] - right[0] || left[1] - right[1]; }

export function checkFamilyBody(body: Uint8Array): number {
  const raw = buffer(body);
  if (raw.length < 2) throw new Refusal(PLAN_BINDING);
  const count = readNumber(raw, 0, 2);
  if (count < 1 || count > MAX_FAMILIES) throw new Refusal(PLAN_BINDING);
  let at = 2;
  const ordinals: number[] = [];
  for (let index = 0; index < count; index += 1) {
    if (at + 6 > raw.length) throw new Refusal(PLAN_BINDING);
    const ordinal = readNumber(raw, at, 2);
    readNumber(raw, at + 2, 2);
    const slotCount = readNumber(raw, at + 4, 2);
    at += 6;
    if (slotCount < 1 || at + 5 * slotCount > raw.length) throw new Refusal(PLAN_BINDING);
    const slots: Array<[number, number]> = [];
    for (let slot = 0; slot < slotCount; slot += 1) { slots.push([readNumber(raw, at, 4), raw[at + 4]]); at += 5; }
    const sorted = slots.map((item, index) => item).sort(comparePair);
    if (slots.some((item, index) => comparePair(item, sorted[index]) !== 0) || new Set(slots.map((item) => `${item[0]}:${item[1]}`)).size !== slots.length) throw new Refusal(PLAN_BINDING);
    ordinals.push(ordinal);
  }
  const sortedOrdinals = [...ordinals].sort((left, right) => left - right);
  if (at !== raw.length || ordinals.some((item, index) => item !== sortedOrdinals[index]) || new Set(ordinals).size !== ordinals.length) throw new Refusal(PLAN_BINDING);
  return count;
}

export const check_family_body = checkFamilyBody;

export interface DescriptorSpecInput {
  positionCount: number;
  segmentCount: number;
  familyCount: number;
  totalEntries: Integer;
  terms: DisputeTerms;
  binding: RunBinding;
  compilerVersion: number;
  clause12V4: Uint8Array;
  definitionSha256: Uint8Array;
  baseDigests: readonly Uint8Array[];
  modelRoot: Uint8Array;
  positionTableRoot: Uint8Array;
  promptCommitment: Uint8Array;
  registryEpoch: number;
  registry: Uint8Array;
  registryTableRoot: Uint8Array;
  familyBody: Uint8Array;
  position_count?: number;
  segment_count?: number;
  family_count?: number;
  total_entries?: Integer;
  compiler_version?: number;
  clause12_v4?: Uint8Array;
  definition_sha256?: Uint8Array;
  base_digests?: readonly Uint8Array[];
  model_root?: Uint8Array;
  position_table_root?: Uint8Array;
  prompt_commitment?: Uint8Array;
  registry_epoch?: number;
  registry_table_root?: Uint8Array;
  family_body?: Uint8Array;
}

export class DescriptorSpec {
  readonly positionCount: number;
  readonly segmentCount: number;
  readonly familyCount: number;
  readonly totalEntries: Integer;
  readonly terms: DisputeTerms;
  readonly binding: RunBinding;
  readonly compilerVersion: number;
  readonly clause12V4: Buffer;
  readonly definitionSha256: Buffer;
  readonly baseDigests: Buffer[];
  readonly modelRoot: Buffer;
  readonly positionTableRoot: Buffer;
  readonly promptCommitment: Buffer;
  readonly registryEpoch: number;
  readonly registry: Buffer;
  readonly registryTableRoot: Buffer;
  readonly familyBody: Buffer;

  constructor(input: DescriptorSpecInput) {
    this.positionCount = input.positionCount ?? input.position_count ?? 0;
    this.segmentCount = input.segmentCount ?? input.segment_count ?? 0;
    this.familyCount = input.familyCount ?? input.family_count ?? 0;
    this.totalEntries = input.totalEntries ?? input.total_entries ?? 0;
    this.terms = input.terms;
    this.binding = input.binding;
    this.compilerVersion = input.compilerVersion ?? input.compiler_version ?? 0;
    this.clause12V4 = buffer(input.clause12V4 ?? input.clause12_v4 ?? new Uint8Array());
    this.definitionSha256 = buffer(input.definitionSha256 ?? input.definition_sha256 ?? new Uint8Array());
    this.baseDigests = (input.baseDigests ?? input.base_digests ?? []).map((item) => buffer(item));
    this.modelRoot = buffer(input.modelRoot ?? input.model_root);
    this.positionTableRoot = buffer(input.positionTableRoot ?? input.position_table_root);
    this.promptCommitment = buffer(input.promptCommitment ?? input.prompt_commitment);
    this.registryEpoch = input.registryEpoch ?? input.registry_epoch ?? 0;
    this.registry = buffer(input.registry);
    this.registryTableRoot = buffer(input.registryTableRoot ?? input.registry_table_root);
    this.familyBody = buffer(input.familyBody ?? input.family_body ?? new Uint8Array());
  }

  get position_count(): number { return this.positionCount; }
  get segment_count(): number { return this.segmentCount; }
  get family_count(): number { return this.familyCount; }
  get total_entries(): Integer { return this.totalEntries; }
  get clause12_v4(): Buffer { return this.clause12V4; }
  get definition_sha256(): Buffer { return this.definitionSha256; }
  get base_digests(): Buffer[] { return this.baseDigests; }
  get model_root(): Buffer { return this.modelRoot; }
  get position_table_root(): Buffer { return this.positionTableRoot; }
  get prompt_commitment(): Buffer { return this.promptCommitment; }
  get registry_epoch(): number { return this.registryEpoch; }
  get registry_table_root(): Buffer { return this.registryTableRoot; }
  get family_body(): Buffer { return this.familyBody; }

  preimage(): Buffer {
    const clause = this.clause12V4;
    if (clause.length !== 43 || !sameBytes(clause.subarray(0, 5), Buffer.from([4, ...Buffer.from("PT2P", "ascii")]))) throw new Refusal(PLAN_BINDING);
    const positions = readNumber(clause, 5, 4);
    const segments = readNumber(clause, 9, 2);
    const bodyCount = checkFamilyBody(this.familyBody);
    if (positions !== this.positionCount || segments !== this.segmentCount || this.baseDigests.length !== 3 || bodyCount !== this.familyCount || Math.min(this.positionCount, this.segmentCount, Number(asBigInt(this.totalEntries))) <= 0 || this.familyCount < 1 || this.familyCount > MAX_FAMILIES || this.segmentCount < 1 || this.segmentCount > MAX_SEGMENTS || isZero(this.modelRoot) || isZero(this.positionTableRoot) || isZero(this.promptCommitment)) throw new Refusal(PLAN_BINDING);
    if (checkRunBinding(this.binding, { positionCount: this.positionCount }) !== 0) throw new Refusal(RUN_BINDING);
    const out = Buffer.concat([
      DESCRIPTOR_DOMAIN, uint(UNIFIED_VERSION, 2), uint(STORAGE_ROOT_ONLY, 1), uint(COMMITMENT_VERSION, 1), uint(this.positionCount, 4), uint(this.segmentCount, 2), uint(this.familyCount, 2), uint(bitLength(add(this.positionCount, -1)), 1), uint(this.compilerVersion, 1), Buffer.alloc(2), uint(this.totalEntries, 8), this.terms.encode(), this.binding.encode(), clause, digest(this.definitionSha256), ...this.baseDigests.map((item) => digest(item)), digest(this.modelRoot), digest(this.positionTableRoot), digest(this.promptCommitment), uint(this.registryEpoch, 4), digest(this.registry), digest(this.registryTableRoot), sha256(this.familyBody),
    ]);
    if (out.length !== 631) throw new Error("descriptor length");
    return out;
  }

  digest(): Buffer { return sha256(this.preimage()); }
}

export function familyCountFromBody(body: Uint8Array): number { return checkFamilyBody(body); }
export const family_count_from_body = familyCountFromBody;

export function encodeUnifiedInit(terms: DisputeTerms, binding: RunBinding, options: { modelRoot: Uint8Array; positionTableRoot: Uint8Array; promptCommitment: Uint8Array; familyBody: Uint8Array }): Buffer {
  const familyCount = familyCountFromBody(options.familyBody);
  if (isZero(options.modelRoot) || isZero(options.positionTableRoot) || isZero(options.promptCommitment)) throw new Refusal(PLAN_BINDING);
  return Buffer.concat([Buffer.from([TAG_UNIFIED_INIT]), terms.encode(), binding.encode(), digest(options.modelRoot), digest(options.positionTableRoot), digest(options.promptCommitment), uint(familyCount, 2), options.familyBody]);
}

export const encode_unified_init = encodeUnifiedInit;

export function configInitData(admin: Uint8Array, registryAuthority: Uint8Array, templateSealAuthority: Uint8Array): Buffer {
  if (isZero(admin)) throw new Refusal(CONFIG_AUTHORITY);
  return Buffer.concat([Buffer.from([TAG_CONFIG_INIT]), digest(admin), digest(registryAuthority), digest(templateSealAuthority)]);
}

export const config_init_data = configInitData;

export function configSetData(role: number, newKey: Uint8Array): Buffer {
  if (![0, 1, 2].includes(role)) throw new Refusal(CONFIG_AUTHORITY);
  return Buffer.concat([Buffer.from([TAG_CONFIG_SET, role]), digest(newKey)]);
}

export const config_set_data = configSetData;

export function templateSealData(action: number): Buffer {
  if (action !== 1 && action !== 2) throw new Refusal(TEMPLATE_SEAL);
  return Buffer.from([TAG_TEMPLATE_SEAL, action]);
}

export const template_seal_data = templateSealData;

export function encodeTemplateSeal(pt2s: Uint8Array, pt2sSha256: Uint8Array, state: number, sealer: Uint8Array, slot: Integer): Buffer {
  if (state !== 1 && state !== 2) throw new Refusal(TEMPLATE_SEAL);
  return Buffer.concat([Buffer.from("DTA1", "ascii"), uint(1, 2), Buffer.from([state, 0]), digest(pt2s), digest(pt2sSha256), digest(sealer), uint(slot, 8)]);
}

export const encode_template_seal = encodeTemplateSeal;

export function decodeTemplateSeal(raw: Uint8Array): { state: number; pt2s: Buffer; pt2sSha256: Buffer; sealer: Buffer; slot: Integer } {
  const bytes = buffer(raw);
  if (bytes.length !== 112 || !sameBytes(bytes.subarray(0, 4), Buffer.from("DTA1")) || !sameBytes(bytes.subarray(4, 6), uint(1, 2)) || ![1, 2].includes(bytes[6]) || bytes[7] !== 0) throw new Refusal(TEMPLATE_SEAL);
  return { state: bytes[6], pt2s: bytes.subarray(8, 40), pt2sSha256: bytes.subarray(40, 72), sealer: bytes.subarray(72, 104), slot: readInteger(bytes, 104, 8) };
}

export const decode_template_seal = decodeTemplateSeal;

export function encodeChallengeLeaf(descriptor: Uint8Array, position: number, segment: number, local: number, leaf: Uint8Array, path: readonly Uint8Array[], spp1: Uint8Array, responseLength: number, nonce: number): Buffer {
  decodeSpp1(spp1);
  if (path.length > 255 || leaf.length !== 32) throw new Refusal(CL_MALFORMED);
  return Buffer.concat([Buffer.from([TAG_CHALLENGE_LEAF]), digest(descriptor), uint(position, 4), uint(segment, 2), uint(local, 4), digest(leaf), uint(responseLength, 4), uint(path.length, 1), ...path.map((item) => digest(item)), spp1, uint(nonce, 4)]);
}

export const encode_challenge_leaf = encodeChallengeLeaf;

export function encodeChallengePosition(descriptor: Uint8Array, position: number, responseLength: number, nonce: number): Buffer { return Buffer.concat([Buffer.from([TAG_CHALLENGE_POSITION]), digest(descriptor), uint(position, 4), uint(responseLength, 4), uint(nonce, 4)]); }
export const encode_challenge_position = encodeChallengePosition;

export function encodeReveal(digests: readonly Uint8Array[], treeRoot?: Uint8Array): Buffer { return Buffer.concat([Buffer.from([TAG_REVEAL, digests.length]), treeRoot === undefined ? Buffer.alloc(0) : digest(treeRoot), ...digests.map((item) => digest(item))]); }
export const encode_reveal = encodeReveal;

export function encodeDescend(choice: number): Buffer { return Buffer.from([TAG_DESCEND, choice]); }
export const encode_descend = encodeDescend;

export function encodeSummaryChallenge(descriptor: Uint8Array, familyIndex: number, roots: readonly Uint8Array[], nonce: number): Buffer { return Buffer.concat([Buffer.from([TAG_CHALLENGE_SUMMARY]), digest(descriptor), uint(familyIndex, 1), uint(roots.length, 1), ...roots.map((root) => digest(root)), uint(nonce, 4)]); }
export const encode_summary_challenge = encodeSummaryChallenge;

export function encodeSummaryLeaf(leafIndex: number, leaf: Uint8Array, auth: readonly Uint8Array[]): Buffer { return Buffer.concat([Buffer.from([TAG_SUMMARY_LEAF]), uint(leafIndex, 4), digest(leaf), uint(auth.length, 1), ...auth.map((item) => digest(item))]); }
export const encode_summary_leaf = encodeSummaryLeaf;

export function encodeSummaryReveal(descendants: readonly Uint8Array[], treeRoot?: Uint8Array): Buffer { return Buffer.concat([Buffer.from([TAG_REVEAL_SUMMARY, descendants.length]), treeRoot === undefined ? Buffer.alloc(0) : digest(treeRoot), ...descendants]); }
export const encode_summary_reveal = encodeSummaryReveal;

export function encodeSummarySelect(choice: number): Buffer { return Buffer.from([TAG_SELECT_SUMMARY, choice]); }
export const encode_summary_select = encodeSummarySelect;

export function encodeSummaryAnswer(slot: number, preimage: Uint8Array, path: readonly Uint8Array[], spp1: Uint8Array): Buffer { return Buffer.concat([Buffer.from([TAG_ANSWER_SUMMARY, slot]), uint(preimage.length, 2), preimage, uint(path.length, 1), ...path.map((item) => buffer(item)), spp1]); }
export const encode_summary_answer = encodeSummaryAnswer;

export function decodeSummaryAnswer(data: Uint8Array): { slot: number; preimage: Buffer; path: Buffer[]; spp1: Buffer } {
  const bytes = buffer(data);
  if (bytes.length < 5 || bytes[0] !== TAG_ANSWER_SUMMARY) throw new Refusal(DCR1_BAD);
  const slot = bytes[1];
  const length = readNumber(bytes, 2, 2);
  let at = 4 + length;
  if (bytes.length <= at) throw new Refusal(DCR1_BAD);
  const height = bytes[at];
  at += 1;
  if (bytes.length < at + 32 * height + 36) throw new Refusal(DCR1_BAD);
  const path: Buffer[] = [];
  for (let index = 0; index < height; index += 1) path.push(bytes.subarray(at + 32 * index, at + 32 * (index + 1)));
  return { slot, preimage: bytes.subarray(4, 4 + length), path, spp1: bytes.subarray(at + 32 * height) };
}

export const decode_summary_answer = decodeSummaryAnswer;

export function decodeChallengeRecord(raw: Uint8Array): { phase: number; winner: number; challenger: Buffer; executor: Buffer; descriptor: Buffer; responseLength: number; source: number; deadline: Integer; position: number; segment: number; bond: Integer; form: number } {
  const bytes = buffer(raw);
  if (bytes.length !== DCR1_BYTES || !sameBytes(bytes.subarray(0, 4), Buffer.from("DCR1")) || !sameBytes(bytes.subarray(6, 8), uint(DCR1_VERSION, 2))) throw new Refusal(CL_MALFORMED);
  return { phase: bytes[4], winner: bytes[5], challenger: bytes.subarray(8, 40), executor: bytes.subarray(40, 72), descriptor: bytes.subarray(72, 104), responseLength: readNumber(bytes, 140, 4), source: bytes[144], deadline: readInteger(bytes, 148, 8), position: readNumber(bytes, 156, 4), segment: readNumber(bytes, 160, 2), bond: readInteger(bytes, 162, 8), form: readNumber(bytes, 174, 2) };
}

export const decode_challenge_record = decodeChallengeRecord;

export function legacyTxBytes(dataLen: number, options: { keys: number; instructionAccounts: number; signatures?: number; extraInstructions?: readonly (readonly [number, number])[] }): number {
  const compact = (value: number): number => value < 0x80 ? 1 : value < 0x4000 ? 2 : 3;
  const signatures = options.signatures ?? 1;
  const extra = options.extraInstructions ?? [[0, 5]];
  const instructions: Array<readonly [number, number]> = [[options.instructionAccounts, dataLen], ...extra];
  let size = compact(signatures) + 64 * signatures + 3 + compact(options.keys) + 32 * options.keys + 32 + compact(instructions.length);
  for (const [accounts, data] of instructions) size += 1 + compact(accounts) + accounts + compact(data) + data;
  return size;
}

export const legacy_tx_bytes = legacyTxBytes;

export function maxLandBatch(): number {
  let count = 0;
  while (legacyTxBytes(38 + 32 * (count + 1), { keys: 5, instructionAccounts: 3 }) <= PACKET_BYTES) count += 1;
  return count;
}

export const max_land_batch = maxLandBatch;

export function maxRevealChunk(): number {
  let count = 0;
  while (legacyTxBytes(4 + 32 * (count + 1), { keys: 9, instructionAccounts: 7 }) <= PACKET_BYTES) count += 1;
  return count;
}

export const max_reveal_chunk = maxRevealChunk;

export const u = uint;
export const _d = digest;
