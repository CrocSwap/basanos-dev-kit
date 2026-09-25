import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import * as c from "./consensus.js";
import { instruction } from "./instructions.js";
import type { AccountSpec, KeyLike } from "./instructions.js";
import { CONSUMER_DOMAIN_V7, REQUEST_SEED, RequestBlockV7, requestAddress } from "./requester.js";
import { RpcClient } from "./transport.js";

export const CONFIG_SEED = Buffer.from("tco-config", "ascii");
export const PROMPT_SEED = Buffer.from("tco-prompt", "ascii");
export const MACHINE_DOMAIN = Buffer.from("basanos/tierc-machine/1", "ascii");
export const MACHINE_BYTES = 384;
export const REQUEST_BYTES = 1072;
export const TOKEN_WIDTH = 16;
export const STATUS_OPEN = 0;
export const STATUS_BOUND = 1;
export const STATUS_RESOLVED = 2;
export const TAG_CREATE_REQUEST = 10;
export const TAG_APPEND_PROMPT = 11;
export const TAG_BIND_DOCUMENT = 12;
export const TAG_RESOLVE = 13;

function zero32(): Buffer { return Buffer.alloc(32); }
function isZero32(value: Uint8Array): boolean { return value.length === 32 && value.every((item) => item === 0); }
function readU16(raw: Buffer, at: number): number { return raw.readUInt16LE(at); }
function readU32(raw: Buffer, at: number): number { return raw.readUInt32LE(at); }
function readU64(raw: Buffer, at: number): bigint { return raw.readBigUInt64LE(at); }
function integer(value: c.Integer): bigint { return typeof value === "bigint" ? value : BigInt(value); }
function allZero(...values: readonly Uint8Array[]): boolean { return values.every((value) => value.every((item) => item === 0)); }

export interface RequestMachineInput {
  dcgProgram: KeyLike;
  pt2s: KeyLike;
  pt2sSha256: Uint8Array;
  modelRoot: Uint8Array;
  positionTableRoot: Uint8Array;
  registry: KeyLike;
  registryTableRoot: Uint8Array;
  definitionSha256: Uint8Array;
  clause12V4: Uint8Array;
  familyCount: number;
  compilerVersion: number;
  rs1Height: number;
  positionCount: number;
  segmentCount: number;
  totalEntries: c.Integer;
  tokenBaseEntry: number;
  tokenWrite: number;
  tokenWidth: number;
  vocab: number;
  promptRegion: number;
  promptPositions: number;
}

export class RequestMachine {
  readonly dcgProgram: Buffer;
  readonly pt2s: Buffer;
  readonly pt2sSha256: Buffer;
  readonly modelRoot: Buffer;
  readonly positionTableRoot: Buffer;
  readonly registry: Buffer;
  readonly registryTableRoot: Buffer;
  readonly definitionSha256: Buffer;
  readonly clause12V4: Buffer;
  readonly familyCount: number;
  readonly compilerVersion: number;
  readonly rs1Height: number;
  readonly positionCount: number;
  readonly segmentCount: number;
  readonly totalEntries: c.Integer;
  readonly tokenBaseEntry: number;
  readonly tokenWrite: number;
  readonly tokenWidth: number;
  readonly vocab: number;
  readonly promptRegion: number;
  readonly promptPositions: number;

  constructor(input: RequestMachineInput) {
    this.dcgProgram = c.keyBytes(input.dcgProgram);
    this.pt2s = c.keyBytes(input.pt2s);
    this.pt2sSha256 = c.buffer(input.pt2sSha256);
    this.modelRoot = c.buffer(input.modelRoot);
    this.positionTableRoot = c.buffer(input.positionTableRoot);
    this.registry = c.keyBytes(input.registry);
    this.registryTableRoot = c.buffer(input.registryTableRoot);
    this.definitionSha256 = c.buffer(input.definitionSha256);
    this.clause12V4 = c.buffer(input.clause12V4);
    this.familyCount = input.familyCount;
    this.compilerVersion = input.compilerVersion;
    this.rs1Height = input.rs1Height;
    this.positionCount = input.positionCount;
    this.segmentCount = input.segmentCount;
    this.totalEntries = input.totalEntries;
    this.tokenBaseEntry = input.tokenBaseEntry;
    this.tokenWrite = input.tokenWrite;
    this.tokenWidth = input.tokenWidth;
    this.vocab = input.vocab;
    this.promptRegion = input.promptRegion;
    this.promptPositions = input.promptPositions;
  }

  validate(): void {
    const fields = [this.dcgProgram, this.pt2s, this.pt2sSha256, this.modelRoot, this.positionTableRoot, this.registry, this.registryTableRoot, this.definitionSha256];
    if (fields.some((value) => value.length !== 32 || isZero32(value))) throw new Error("machine keys and digests must be nonzero 32-byte values");
    if (this.clause12V4.length !== 43 || !this.clause12V4.subarray(0, 5).equals(Buffer.from([4, 80, 84, 50, 80]))) throw new Error("machine clause is not PT2P v4");
    if (this.familyCount < 1 || this.familyCount > 24 || this.compilerVersion !== 1) throw new Error("machine family count or compiler is invalid");
    if (this.segmentCount < 1 || this.segmentCount > 128 || this.positionCount === 0 || integer(this.totalEntries) === 0n) throw new Error("machine dimensions are invalid");
    if (this.vocab === 0 || this.promptPositions < 1 || this.promptPositions > this.positionCount) throw new Error("machine tokenizer geometry is invalid");
    if (readU32(this.clause12V4, 5) !== this.positionCount || readU16(this.clause12V4, 9) !== this.segmentCount) throw new Error("machine clause geometry is invalid");
    const height = this.positionCount <= 1 ? 0 : 32 - Math.clz32(this.positionCount - 1);
    if (this.rs1Height !== height || this.tokenWidth !== TOKEN_WIDTH || this.tokenBaseEntry < 0 || this.tokenBaseEntry >= 2 ** 32 || !Number.isSafeInteger(this.tokenWrite) || this.tokenWrite < 0 || this.tokenWrite > 255 || this.promptRegion < 0 || this.promptRegion > 0xfffe || this.vocab < 0 || this.vocab >= 2 ** 32) throw new Error("machine output geometry is invalid");
    c.uint(this.familyCount, 2);
    c.uint(this.rs1Height, 1);
    c.uint(this.positionCount, 4);
    c.uint(this.segmentCount, 2);
    c.uint(this.totalEntries, 8);
    c.uint(this.tokenBaseEntry, 4);
    c.uint(this.vocab, 4);
    c.uint(this.promptRegion, 2);
    c.uint(this.promptPositions, 2);
  }

  encode(): Buffer {
    this.validate();
    const out = Buffer.alloc(MACHINE_BYTES);
    out.write("TMC1", 0, "ascii");
    c.uint(1, 2).copy(out, 4);
    this.dcgProgram.copy(out, 8);
    this.pt2s.copy(out, 40);
    this.pt2sSha256.copy(out, 72);
    this.modelRoot.copy(out, 104);
    this.positionTableRoot.copy(out, 136);
    this.registry.copy(out, 168);
    this.registryTableRoot.copy(out, 200);
    this.definitionSha256.copy(out, 264);
    this.clause12V4.copy(out, 296);
    c.uint(this.familyCount, 2).copy(out, 339);
    out[341] = this.compilerVersion;
    out[342] = this.rs1Height;
    c.uint(this.positionCount, 4).copy(out, 344);
    c.uint(this.segmentCount, 2).copy(out, 348);
    c.uint(this.totalEntries, 8).copy(out, 352);
    c.uint(this.tokenBaseEntry, 4).copy(out, 360);
    out[364] = this.tokenWrite;
    out[365] = this.tokenWidth;
    c.uint(this.vocab, 4).copy(out, 368);
    c.uint(this.promptRegion, 2).copy(out, 372);
    c.uint(this.promptPositions, 2).copy(out, 374);
    return out;
  }

  static decode(raw: Uint8Array): RequestMachine {
    const bytes = c.buffer(raw);
    if (bytes.length !== MACHINE_BYTES || !bytes.subarray(0, 4).equals(Buffer.from("TMC1", "ascii")) || readU16(bytes, 4) !== 1) throw new Error("malformed TMC1");
    const result = new RequestMachine({
      dcgProgram: bytes.subarray(8, 40), pt2s: bytes.subarray(40, 72), pt2sSha256: bytes.subarray(72, 104), modelRoot: bytes.subarray(104, 136), positionTableRoot: bytes.subarray(136, 168), registry: bytes.subarray(168, 200), registryTableRoot: bytes.subarray(200, 232), definitionSha256: bytes.subarray(264, 296), clause12V4: bytes.subarray(296, 339), familyCount: readU16(bytes, 339), compilerVersion: bytes[341], rs1Height: bytes[342], positionCount: readU32(bytes, 344), segmentCount: readU16(bytes, 348), totalEntries: readU64(bytes, 352), tokenBaseEntry: readU32(bytes, 360), tokenWrite: bytes[364], tokenWidth: bytes[365], vocab: readU32(bytes, 368), promptRegion: readU16(bytes, 372), promptPositions: readU16(bytes, 374),
    });
    if (!result.encode().equals(bytes)) throw new Error("noncanonical TMC1");
    return result;
  }

  machineId(): Buffer { return c.sha256(MACHINE_DOMAIN, this.encode()); }
  machine_id(): Buffer { return this.machineId(); }
}

export class RequestAccount {
  readonly status: number;
  readonly bump: number;
  readonly requester: Buffer;
  readonly nonce: number;
  readonly created: bigint;
  readonly deadline: bigint;
  readonly consumerDigest: Buffer;
  readonly request: RequestBlockV7;
  readonly machine: RequestMachine;
  readonly prompt: Buffer;
  readonly callback: Buffer;
  readonly callbackPresent: number;
  readonly callbackPending: number;
  readonly fee: bigint;
  readonly bond: bigint;
  readonly descriptor: Buffer;
  readonly document: Buffer;
  readonly result: Buffer;
  readonly executor: Buffer;

  constructor(input: { status: number; bump: number; requester: Uint8Array; nonce: number; created: bigint; deadline: bigint; consumerDigest: Uint8Array; request: RequestBlockV7; machine: RequestMachine; prompt: Uint8Array; callback: Uint8Array; callbackPresent: number; callbackPending: number; fee: bigint; bond: bigint; descriptor: Uint8Array; document: Uint8Array; result: Uint8Array; executor: Uint8Array }) {
    this.status = input.status;
    this.bump = input.bump;
    this.requester = c.buffer(input.requester);
    this.nonce = input.nonce;
    this.created = input.created;
    this.deadline = input.deadline;
    this.consumerDigest = c.buffer(input.consumerDigest);
    this.request = input.request;
    this.machine = input.machine;
    this.prompt = c.buffer(input.prompt);
    this.callback = c.buffer(input.callback);
    this.callbackPresent = input.callbackPresent;
    this.callbackPending = input.callbackPending;
    this.fee = input.fee;
    this.bond = input.bond;
    this.descriptor = c.buffer(input.descriptor);
    this.document = c.buffer(input.document);
    this.result = c.buffer(input.result);
    this.executor = c.buffer(input.executor);
  }

  get consumer_digest(): Buffer { return this.consumerDigest; }
  get callback_present(): number { return this.callbackPresent; }
  get callback_pending(): number { return this.callbackPending; }

  static decode(raw: Uint8Array): RequestAccount {
    const bytes = c.buffer(raw);
    if (bytes.length !== REQUEST_BYTES || !bytes.subarray(0, 4).equals(Buffer.from("TCR1", "ascii")) || readU16(bytes, 4) !== 1 || bytes[6] > STATUS_RESOLVED || bytes[921] > 1 || !allZero(bytes.subarray(922, 928), bytes.subarray(928, 944)) || (bytes[921] === 1 && (bytes[6] !== STATUS_RESOLVED || bytes[920] !== 1))) throw new Error("malformed TCR1");
    const trq1 = bytes.subarray(96, 472);
    const nonceBig = readU64(bytes, 40);
    const nonce = Number(nonceBig);
    if (!Number.isSafeInteger(nonce)) throw new Error("TCR1 nonce exceeds the SDK integer range");
    const request = new RequestBlockV7({
      request: trq1.subarray(8, 40), requester: trq1.subarray(40, 72), nonce, promptTokenCount: readU32(trq1, 80), maxNewTokens: readU32(trq1, 84), promptCommitment: trq1.subarray(88, 120), promptTokensSha256: trq1.subarray(120, 152), tokenizerSha256: trq1.subarray(152, 184), samplingParams: trq1.subarray(184, 216), seed: trq1.subarray(216, 248), machineId: trq1.subarray(248, 280), terms: c.RunTerms.decode(trq1.subarray(280, 376)),
    });
    const machine = RequestMachine.decode(bytes.subarray(472, 856));
    const descriptor = bytes.subarray(944, 976);
    const document = bytes.subarray(976, 1008);
    const result = bytes.subarray(1008, 1040);
    const executor = bytes.subarray(1040, 1072);
    if (!request.encode().equals(trq1) || !request.requester.equals(bytes.subarray(8, 40)) || !request.machineId.equals(machine.machineId()) || machine.promptPositions !== request.promptTokenCount || request.maxNewTokens > machine.positionCount - machine.promptPositions + 1 || !request.consumerDigest().equals(bytes.subarray(64, 96)) || isZero32(bytes.subarray(856, 888)) || readU64(bytes, 56) < readU64(bytes, 48) || bytes[920] > 1 || (bytes[920] === 0 && !isZero32(bytes.subarray(888, 920))) || (bytes[920] === 1 && isZero32(bytes.subarray(888, 920))) || (bytes[6] === STATUS_OPEN && ![descriptor, document, result, executor].every(isZero32)) || (bytes[6] !== STATUS_OPEN && [descriptor, document, result, executor].some(isZero32))) throw new Error("TCR1 fields are inconsistent");
    return new RequestAccount({ status: bytes[6], bump: bytes[7], requester: bytes.subarray(8, 40), nonce, created: readU64(bytes, 48), deadline: readU64(bytes, 56), consumerDigest: bytes.subarray(64, 96), request, machine, prompt: bytes.subarray(856, 888), callback: bytes.subarray(888, 920), callbackPresent: bytes[920], callbackPending: bytes[921], fee: readU64(bytes, 928), bond: readU64(bytes, 936), descriptor, document, result, executor });
  }
}

export function decodeRequestAccount(raw: Uint8Array): RequestAccount { return RequestAccount.decode(raw); }
export const decode_request_account = decodeRequestAccount;
export { REQUEST_SEED, requestAddress };
export const request_address = requestAddress;
export function configAddress(program: KeyLike): c.Pda { return c.pda(program, CONFIG_SEED); }
export const config_address = configAddress;
export function promptAddress(program: KeyLike, request: KeyLike): c.Pda { return c.pda(program, PROMPT_SEED, c.key(request)); }
export const prompt_address = promptAddress;

export interface CreateRequestOptions {
  deadlineSlots: c.Integer;
  callback?: Uint8Array;
  fee?: c.Integer;
  bond?: c.Integer;
  promptTokens?: readonly number[];
  config?: KeyLike;
}

export class RequestProgramClient {
  readonly program: PublicKey;
  readonly rpc?: RpcClient;

  constructor(program: KeyLike, options: { rpc?: RpcClient } = {}) {
    this.program = c.key(program);
    this.rpc = options.rpc;
  }

  requestAddress(requester: KeyLike, nonce: number): c.Pda { return requestAddress(this.program, requester, nonce); }
  request_address(requester: KeyLike, nonce: number): c.Pda { return this.requestAddress(requester, nonce); }
  configAddress(): c.Pda { return configAddress(this.program); }
  config_address(): c.Pda { return this.configAddress(); }
  promptAddress(request: KeyLike): c.Pda { return promptAddress(this.program, request); }
  prompt_address(request: KeyLike): c.Pda { return this.promptAddress(request); }

  createRequest(request: RequestBlockV7, machine: RequestMachine | Uint8Array, options: CreateRequestOptions): TransactionInstruction {
    const trq1 = request.encode();
    const machineValue = machine instanceof RequestMachine ? machine : RequestMachine.decode(machine);
    const machineRaw = machineValue.encode();
    const callback = options.callback === undefined ? zero32() : c.buffer(options.callback);
    const deadline = integer(options.deadlineSlots);
    const fee = integer(options.fee ?? 0);
    const bond = integer(options.bond ?? 0);
    const promptTokens = options.promptTokens ?? [];
    const derivedRequest = this.requestAddress(request.requester, request.nonce)[0];
    if (!Buffer.from(derivedRequest.toBytes()).equals(request.request) || !machineValue.machineId().equals(request.machineId)) throw new Error("request does not match its address or machine");
    if (deadline <= 0n || deadline >= 1n << 64n || deadline <= integer(request.terms.challengeWindowSlots)) throw new Error("request deadline must exceed the challenge window");
    if (fee !== 0n || bond !== 0n || callback.length !== 32) throw new Error("deployed request program requires zero fee and bond");
    const callbackPresent = isZero32(callback) ? 0 : 1;
    if (callbackPresent === 1 && (callback.equals(this.program.toBytes()) || callback.equals(c.SYSTEM_PROGRAM.toBytes()) || callback.equals(machineValue.dcgProgram))) throw new Error("callback program is reserved");
    if (promptTokens.length > request.promptTokenCount || machineValue.promptPositions !== request.promptTokenCount) throw new Error("prompt count does not match TMC1");
    if (promptTokens.some((token) => !Number.isSafeInteger(token) || token < 0 || token >= machineValue.vocab)) throw new Error("prompt token is out of range");
    const requestKey = c.key(request.request);
    const promptKey = this.promptAddress(requestKey)[0];
    const configKey = options.config === undefined ? this.configAddress()[0] : c.key(options.config);
    const data = Buffer.concat([Buffer.from([TAG_CREATE_REQUEST]), trq1, machineRaw, c.uint(deadline, 8), Buffer.from([callbackPresent]), callback, c.uint(fee, 8), c.uint(bond, 8), c.uint(promptTokens.length, 4), ...promptTokens.map((token) => c.uint(token, 4))]);
    return instruction(this.program, data, [[request.requester, true, true], [requestKey, false, true], [configKey, false, false], [promptKey, false, true], [c.SYSTEM_PROGRAM, false, false]]);
  }

  create_request(request: RequestBlockV7, machine: RequestMachine | Uint8Array, options: CreateRequestOptions): TransactionInstruction { return this.createRequest(request, machine, options); }

  appendPrompt(requester: KeyLike, request: KeyLike, offset: number, tokens: readonly number[]): TransactionInstruction {
    if (!Number.isSafeInteger(offset) || offset < 0 || tokens.some((token) => !Number.isSafeInteger(token) || token < 0 || token >= 2 ** 32)) throw new Error("prompt append is out of range");
    const data = Buffer.concat([Buffer.from([TAG_APPEND_PROMPT]), c.uint(offset, 4), ...tokens.map((token) => c.uint(token, 4))]);
    return instruction(this.program, data, [[requester, true, false], [request, false, true], [this.promptAddress(request)[0], false, true]]);
  }

  append_prompt(requester: KeyLike, request: KeyLike, offset: number, tokens: readonly number[]): TransactionInstruction { return this.appendPrompt(requester, request, offset, tokens); }

  bindDocument(executor: KeyLike, request: KeyLike, config: KeyLike, document: KeyLike, result: KeyLike, pt2s: KeyLike, familySlots: KeyLike, registry: KeyLike): TransactionInstruction {
    return instruction(this.program, Buffer.from([TAG_BIND_DOCUMENT]), [[executor, true, false], [request, false, true], [config, false, false], [document, false, false], [result, false, false], [this.promptAddress(request)[0], false, false], [pt2s, false, false], [familySlots, false, false], [registry, false, false]]);
  }

  bind_document(executor: KeyLike, request: KeyLike, config: KeyLike, document: KeyLike, result: KeyLike, pt2s: KeyLike, familySlots: KeyLike, registry: KeyLike): TransactionInstruction { return this.bindDocument(executor, request, config, document, result, pt2s, familySlots, registry); }

  resolve(request: KeyLike, result: KeyLike, executor: KeyLike, callbackAccounts: readonly AccountSpec[] = []): TransactionInstruction {
    return instruction(this.program, Buffer.from([TAG_RESOLVE]), [[request, false, true], [result, false, false], [executor, false, false], ...callbackAccounts]);
  }

  async readRequest(request: KeyLike, commitment?: string): Promise<RequestAccount> {
    if (this.rpc === undefined) throw new Error("RPC client is required");
    const account = await this.rpc.readAccount(request, commitment);
    if (account === null) throw new Error("request account is absent");
    if (account.owner === null || !account.owner.equals(this.program)) throw new Error("request account has the wrong owner");
    const value = RequestAccount.decode(account.data);
    const requestKey = c.key(request);
    const [address, bump] = this.requestAddress(value.requester, value.nonce);
    if (!address.equals(requestKey) || value.bump !== bump || !value.request.request.equals(requestKey.toBytes()) || !value.prompt.equals(this.promptAddress(requestKey)[0].toBytes())) throw new Error("TCR1 does not match its request address");
    return value;
  }

  async read_request(request: KeyLike, commitment?: string): Promise<RequestAccount> { return this.readRequest(request, commitment); }
}

export const RequestProgram = RequestProgramClient;
