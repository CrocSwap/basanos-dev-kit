import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import * as c from "./consensus.js";
import * as ix from "./instructions.js";
import { RpcClient } from "./transport.js";

export const REQUEST_SEED = Buffer.from("tco-request", "ascii");
export const CONSUMER_DOMAIN = Buffer.from("basanos/tierc-request/1", "ascii");
export const TRQ1_BYTES = 328;
export const CONSUMER_DOMAIN_V7 = Buffer.from("basanos/tierc-request/2", "ascii");
export const TRQ1_V7_BYTES = 376;
export const TOKEN_WIDTH = 16;
export const SAMPLER_GREEDY = 0;

export type KeyLike = PublicKey | string | Uint8Array;

export function hashPromptTokens(tokens: readonly number[]): Buffer {
  return c.sha256(...tokens.map((token) => c.uint(token, 4)));
}

export const promptTokensSha256 = hashPromptTokens;
export const hash_prompt_tokens = hashPromptTokens;

export function requestAddress(program: KeyLike, requester: KeyLike, nonce: number): c.Pda {
  return c.pda(program, REQUEST_SEED, c.keyBytes(requester), c.uint(nonce, 8));
}

export const request_address = requestAddress;

export interface RequestBlockOptions {
  nonce: number;
  promptTokenCount: number;
  maxNewTokens: number;
  promptCommitment: Uint8Array;
  promptTokens?: readonly number[];
  promptTokensSha256?: Uint8Array;
  prompt_tokens?: readonly number[];
  prompt_tokens_sha256?: Uint8Array;
  tokenizerSha256: Uint8Array;
  machineId: Uint8Array;
  terms: c.DisputeTerms;
  samplerForm?: number;
  samplingParams?: Uint8Array;
  seed?: Uint8Array;
  requestId?: KeyLike;
  prompt_token_count?: number;
  max_new_tokens?: number;
  prompt_commitment?: Uint8Array;
  tokenizer_sha256?: Uint8Array;
  machine_id?: Uint8Array;
  sampler_form?: number;
  sampling_params?: Uint8Array;
}

export interface RequestBlockInput {
  request: Uint8Array;
  requester: Uint8Array;
  nonce: number;
  promptTokenCount: number;
  maxNewTokens: number;
  promptCommitment: Uint8Array;
  promptTokensSha256: Uint8Array;
  tokenizerSha256: Uint8Array;
  machineId: Uint8Array;
  terms: c.DisputeTerms;
  samplerForm?: number;
  samplingParams?: Uint8Array;
  seed?: Uint8Array;
  request_id?: Uint8Array;
  prompt_token_count?: number;
  max_new_tokens?: number;
  prompt_commitment?: Uint8Array;
  prompt_tokens_sha256?: Uint8Array;
  tokenizer_sha256?: Uint8Array;
  machine_id?: Uint8Array;
  sampler_form?: number;
  sampling_params?: Uint8Array;
}

export class RequestBlockV6 {
  readonly request: Buffer;
  readonly requester: Buffer;
  readonly nonce: number;
  readonly promptTokenCount: number;
  readonly maxNewTokens: number;
  readonly promptCommitment: Buffer;
  readonly promptTokensSha256: Buffer;
  readonly tokenizerSha256: Buffer;
  readonly machineId: Buffer;
  readonly terms: c.DisputeTerms;
  readonly samplerForm: number;
  readonly samplingParams: Buffer;
  readonly seed: Buffer;

  constructor(input: RequestBlockInput) {
    this.request = c.buffer(input.request);
    this.requester = c.buffer(input.requester);
    this.nonce = input.nonce;
    this.promptTokenCount = input.promptTokenCount ?? input.prompt_token_count ?? 0;
    this.maxNewTokens = input.maxNewTokens ?? input.max_new_tokens ?? 0;
    this.promptCommitment = c.buffer(input.promptCommitment ?? input.prompt_commitment ?? new Uint8Array());
    this.promptTokensSha256 = c.buffer(input.promptTokensSha256 ?? input.prompt_tokens_sha256 ?? new Uint8Array());
    this.tokenizerSha256 = c.buffer(input.tokenizerSha256 ?? input.tokenizer_sha256 ?? new Uint8Array());
    this.machineId = c.buffer(input.machineId ?? input.machine_id ?? new Uint8Array());
    this.terms = input.terms;
    this.samplerForm = input.samplerForm ?? input.sampler_form ?? SAMPLER_GREEDY;
    this.samplingParams = c.buffer(input.samplingParams ?? input.sampling_params ?? new Uint8Array(32));
    this.seed = c.buffer(input.seed ?? new Uint8Array(32));
  }

  get request_id(): Buffer { return this.request; }
  get requestPublicKey(): PublicKey { return new PublicKey(this.request); }
  get requesterPublicKey(): PublicKey { return new PublicKey(this.requester); }
  get prompt_token_count(): number { return this.promptTokenCount; }
  get max_new_tokens(): number { return this.maxNewTokens; }
  get prompt_commitment(): Buffer { return this.promptCommitment; }
  get prompt_tokens_sha256(): Buffer { return this.promptTokensSha256; }
  get tokenizer_sha256(): Buffer { return this.tokenizerSha256; }
  get machine_id(): Buffer { return this.machineId; }
  get sampler_form(): number { return this.samplerForm; }
  get sampling_params(): Buffer { return this.samplingParams; }

  static create(requestProgram: KeyLike, requester: KeyLike, options: RequestBlockOptions): RequestBlockV6 {
    const requesterBytes = c.keyBytes(requester);
    const derived = requestAddress(requestProgram, requesterBytes, options.nonce)[0];
    const tokens = options.promptTokens ?? options.prompt_tokens;
    const suppliedHash = options.promptTokensSha256 ?? options.prompt_tokens_sha256;
    const selectedHash = tokens === undefined ? suppliedHash : hashPromptTokens(tokens);
    if (tokens !== undefined && suppliedHash !== undefined && !hashPromptTokens(tokens).equals(Buffer.from(suppliedHash))) throw new Error("prompt token hash does not match prompt tokens");
    if (selectedHash === undefined) throw new Error("prompt token hash is required");
    const hash = Buffer.from(selectedHash);
    if (options.requestId !== undefined && !c.keyBytes(options.requestId).equals(derived.toBytes())) throw new Error("request id is not the derived request account");
    const result = new RequestBlockV6({
      request: derived.toBytes(),
      requester: requesterBytes,
      nonce: options.nonce,
      promptTokenCount: options.promptTokenCount ?? options.prompt_token_count ?? 0,
      maxNewTokens: options.maxNewTokens ?? options.max_new_tokens ?? 0,
      promptCommitment: options.promptCommitment ?? options.prompt_commitment ?? new Uint8Array(),
      promptTokensSha256: hash,
      tokenizerSha256: options.tokenizerSha256 ?? options.tokenizer_sha256 ?? new Uint8Array(),
      machineId: options.machineId ?? options.machine_id ?? new Uint8Array(),
      terms: options.terms,
      samplerForm: options.samplerForm ?? options.sampler_form ?? SAMPLER_GREEDY,
      samplingParams: options.samplingParams ?? options.sampling_params ?? new Uint8Array(32),
      seed: options.seed ?? new Uint8Array(32),
    });
    result.validate();
    return result;
  }

  validate(): void {
    const zero = new Uint8Array(32);
    if (this.samplerForm !== SAMPLER_GREEDY || !this.samplingParams.equals(zero) || !this.seed.equals(zero) || this.promptTokenCount < 1 || this.maxNewTokens < 1 || this.tokenizerSha256.equals(zero) || this.request.equals(zero) || this.requester.equals(zero) || this.promptCommitment.equals(zero) || this.promptTokensSha256.length !== 32 || this.machineId.length !== 32) throw new Error("malformed TRQ1");
    c.uint(this.nonce, 8);
  }

  encode(): Buffer {
    this.validate();
    const out = Buffer.concat([
      Buffer.from("TRQ1", "ascii"), c.uint(1, 2), c.uint(this.samplerForm, 1), Buffer.alloc(1), c.digest(this.request), c.digest(this.requester), c.uint(this.nonce, 8), c.uint(this.promptTokenCount, 4), c.uint(this.maxNewTokens, 4), c.digest(this.promptCommitment), c.digest(this.promptTokensSha256), c.digest(this.tokenizerSha256), c.digest(this.samplingParams), c.digest(this.seed), c.digest(this.machineId), this.terms.encode(),
    ]);
    if (out.length !== TRQ1_BYTES) throw new Error("TRQ1 length");
    return out;
  }

  consumerDigest(): Buffer { return c.sha256(CONSUMER_DOMAIN, this.encode()); }
  consumer_digest(): Buffer { return this.consumerDigest(); }

  runBinding(executor: KeyLike, options: { outputBaseEntry: number; outputWrite?: number; outputWidth?: number }): c.RunBinding {
    return new c.RunBinding({ executor: c.keyBytes(executor), requestId: this.request, consumerDigest: this.consumerDigest(), seed: this.seed, outputFirstPosition: this.promptTokenCount - 1, outputCount: this.maxNewTokens, outputBaseEntry: options.outputBaseEntry, outputWrite: options.outputWrite ?? 0, outputWidth: options.outputWidth ?? TOKEN_WIDTH });
  }

  run_binding(executor: KeyLike, options: { output_base_entry: number; output_write?: number; output_width?: number }): c.RunBinding {
    return this.runBinding(executor, { outputBaseEntry: options.output_base_entry, outputWrite: options.output_write, outputWidth: options.output_width });
  }
}

export interface RequestBlockV7Options {
  nonce: number;
  promptTokenCount: number;
  maxNewTokens: number;
  promptCommitment: Uint8Array;
  promptTokens?: readonly number[];
  promptTokensSha256?: Uint8Array;
  tokenizerSha256: Uint8Array;
  machineId: Uint8Array;
  terms: c.RunTerms;
  samplerForm?: number;
  samplingParams?: Uint8Array;
  seed?: Uint8Array;
  requestId?: KeyLike;
  prompt_token_count?: number;
  max_new_tokens?: number;
  prompt_commitment?: Uint8Array;
  prompt_tokens?: readonly number[];
  prompt_tokens_sha256?: Uint8Array;
  tokenizer_sha256?: Uint8Array;
  machine_id?: Uint8Array;
  sampler_form?: number;
  sampling_params?: Uint8Array;
}

export interface RequestBlockV7Input {
  request: Uint8Array;
  requester: Uint8Array;
  nonce: number;
  promptTokenCount: number;
  maxNewTokens: number;
  promptCommitment: Uint8Array;
  promptTokensSha256: Uint8Array;
  tokenizerSha256: Uint8Array;
  machineId: Uint8Array;
  terms: c.RunTerms;
  samplerForm?: number;
  samplingParams?: Uint8Array;
  seed?: Uint8Array;
  request_id?: Uint8Array;
  prompt_token_count?: number;
  max_new_tokens?: number;
  prompt_commitment?: Uint8Array;
  prompt_tokens_sha256?: Uint8Array;
  tokenizer_sha256?: Uint8Array;
  machine_id?: Uint8Array;
  sampler_form?: number;
  sampling_params?: Uint8Array;
}

export class RequestBlockV7 {
  readonly request: Buffer;
  readonly requester: Buffer;
  readonly nonce: number;
  readonly promptTokenCount: number;
  readonly maxNewTokens: number;
  readonly promptCommitment: Buffer;
  readonly promptTokensSha256: Buffer;
  readonly tokenizerSha256: Buffer;
  readonly machineId: Buffer;
  readonly terms: c.RunTerms;
  readonly samplerForm: number;
  readonly samplingParams: Buffer;
  readonly seed: Buffer;

  constructor(input: RequestBlockV7Input) {
    this.request = c.buffer(input.request);
    this.requester = c.buffer(input.requester);
    this.nonce = input.nonce;
    this.promptTokenCount = input.promptTokenCount ?? input.prompt_token_count ?? 0;
    this.maxNewTokens = input.maxNewTokens ?? input.max_new_tokens ?? 0;
    this.promptCommitment = c.buffer(input.promptCommitment ?? input.prompt_commitment ?? new Uint8Array());
    this.promptTokensSha256 = c.buffer(input.promptTokensSha256 ?? input.prompt_tokens_sha256 ?? new Uint8Array());
    this.tokenizerSha256 = c.buffer(input.tokenizerSha256 ?? input.tokenizer_sha256 ?? new Uint8Array());
    this.machineId = c.buffer(input.machineId ?? input.machine_id ?? new Uint8Array());
    this.terms = input.terms;
    this.samplerForm = input.samplerForm ?? input.sampler_form ?? SAMPLER_GREEDY;
    this.samplingParams = c.buffer(input.samplingParams ?? input.sampling_params ?? new Uint8Array(32));
    this.seed = c.buffer(input.seed ?? new Uint8Array(32));
  }

  get request_id(): Buffer { return this.request; }
  get requestPublicKey(): PublicKey { return new PublicKey(this.request); }
  get requesterPublicKey(): PublicKey { return new PublicKey(this.requester); }
  get prompt_token_count(): number { return this.promptTokenCount; }
  get max_new_tokens(): number { return this.maxNewTokens; }
  get prompt_commitment(): Buffer { return this.promptCommitment; }
  get prompt_tokens_sha256(): Buffer { return this.promptTokensSha256; }
  get tokenizer_sha256(): Buffer { return this.tokenizerSha256; }
  get machine_id(): Buffer { return this.machineId; }
  get sampler_form(): number { return this.samplerForm; }
  get sampling_params(): Buffer { return this.samplingParams; }

  static create(requestProgram: KeyLike, requester: KeyLike, options: RequestBlockV7Options): RequestBlockV7 {
    const requesterBytes = c.keyBytes(requester);
    const derived = requestAddress(requestProgram, requesterBytes, options.nonce)[0];
    const tokens = options.promptTokens ?? options.prompt_tokens;
    const suppliedHash = options.promptTokensSha256 ?? options.prompt_tokens_sha256;
    const selectedHash = tokens === undefined ? suppliedHash : hashPromptTokens(tokens);
    if (tokens !== undefined && suppliedHash !== undefined && !hashPromptTokens(tokens).equals(Buffer.from(suppliedHash))) throw new Error("prompt token hash does not match prompt tokens");
    if (selectedHash === undefined) throw new Error("prompt token hash is required");
    if (options.requestId !== undefined && !c.keyBytes(options.requestId).equals(derived.toBytes())) throw new Error("request id is not the derived request account");
    const result = new RequestBlockV7({ request: derived.toBytes(), requester: requesterBytes, nonce: options.nonce, promptTokenCount: options.promptTokenCount ?? options.prompt_token_count ?? 0, maxNewTokens: options.maxNewTokens ?? options.max_new_tokens ?? 0, promptCommitment: options.promptCommitment ?? options.prompt_commitment ?? new Uint8Array(), promptTokensSha256: selectedHash, tokenizerSha256: options.tokenizerSha256 ?? options.tokenizer_sha256 ?? new Uint8Array(), machineId: options.machineId ?? options.machine_id ?? new Uint8Array(), terms: options.terms, samplerForm: options.samplerForm ?? options.sampler_form ?? SAMPLER_GREEDY, samplingParams: options.samplingParams ?? options.sampling_params ?? new Uint8Array(32), seed: options.seed ?? new Uint8Array(32) });
    result.validate();
    return result;
  }

  validate(): void {
    const zero = new Uint8Array(32);
    if (this.samplerForm !== SAMPLER_GREEDY || !this.samplingParams.equals(zero) || !this.seed.equals(zero) || this.promptTokenCount < 1 || this.maxNewTokens < 1 || this.tokenizerSha256.equals(zero) || this.request.equals(zero) || this.requester.equals(zero) || this.promptCommitment.equals(zero) || this.promptTokensSha256.length !== 32 || this.machineId.length !== 32 || c.checkRunTerms(this.terms) !== 0) throw new Error("malformed TRQ1 v7");
    c.uint(this.nonce, 8);
  }

  encode(): Buffer {
    this.validate();
    const out = Buffer.concat([Buffer.from("TRQ1", "ascii"), c.uint(1, 2), c.uint(this.samplerForm, 1), Buffer.alloc(1), c.digest(this.request), c.digest(this.requester), c.uint(this.nonce, 8), c.uint(this.promptTokenCount, 4), c.uint(this.maxNewTokens, 4), c.digest(this.promptCommitment), c.digest(this.promptTokensSha256), c.digest(this.tokenizerSha256), c.digest(this.samplingParams), c.digest(this.seed), c.digest(this.machineId), this.terms.encode()]);
    if (out.length !== TRQ1_V7_BYTES) throw new Error("TRQ1 v7 length");
    return out;
  }

  consumerDigest(): Buffer { return c.sha256(CONSUMER_DOMAIN_V7, this.encode()); }
  consumer_digest(): Buffer { return this.consumerDigest(); }

  runBinding(executor: KeyLike, options: { outputBaseEntry: number; outputWrite?: number; outputWidth?: number }): c.RunBinding {
    return new c.RunBinding({ executor: c.keyBytes(executor), requestId: this.request, consumerDigest: this.consumerDigest(), seed: this.seed, outputFirstPosition: this.promptTokenCount - 1, outputCount: this.maxNewTokens, outputBaseEntry: options.outputBaseEntry, outputWrite: options.outputWrite ?? 0, outputWidth: options.outputWidth ?? TOKEN_WIDTH });
  }

  run_binding(executor: KeyLike, options: { output_base_entry: number; output_write?: number; output_width?: number }): c.RunBinding {
    return this.runBinding(executor, { outputBaseEntry: options.output_base_entry, outputWrite: options.output_write, outputWidth: options.output_width });
  }
}

export function runBindingForV7(block: RequestBlockV7, executor: KeyLike, options: { outputBaseEntry: number; outputWrite?: number; outputWidth?: number }): c.RunBinding {
  return block.runBinding(executor, options);
}

export const run_binding_for_v7 = runBindingForV7;

export { RequestBlockV7 as RequestBlock };
export const Request = RequestBlockV7;

export interface DocumentAccountsOptions {
  pt2s: KeyLike;
  pt1s: KeyLike;
  routes: KeyLike;
  geometry: KeyLike;
  payloads: KeyLike;
  registry: KeyLike;
  admission: KeyLike;
  templateSeal: KeyLike;
  pt2sSha256?: Uint8Array;
  pt2s_sha256?: Uint8Array;
}

export class DocumentAccounts {
  readonly dcgProgram: PublicKey;
  readonly executor: PublicKey;
  readonly pt2s: PublicKey;
  readonly pt1s: PublicKey;
  readonly routes: PublicKey;
  readonly geometry: PublicKey;
  readonly payloads: PublicKey;
  readonly registry: PublicKey;
  readonly admission: PublicKey;
  readonly templateSeal: PublicKey;
  readonly pt2sSha256?: Buffer;

  private constructor(dcgProgram: PublicKey, executor: PublicKey, pt2s: PublicKey, pt1s: PublicKey, routes: PublicKey, geometry: PublicKey, payloads: PublicKey, registry: PublicKey, admission: PublicKey, templateSeal: PublicKey, pt2sSha256?: Buffer) {
    this.dcgProgram = dcgProgram;
    this.executor = executor;
    this.pt2s = pt2s;
    this.pt1s = pt1s;
    this.routes = routes;
    this.geometry = geometry;
    this.payloads = payloads;
    this.registry = registry;
    this.admission = admission;
    this.templateSeal = templateSeal;
    this.pt2sSha256 = pt2sSha256;
  }

  static create(dcgProgram: KeyLike, executor: KeyLike, options: DocumentAccountsOptions): DocumentAccounts {
    const hash = options.pt2sSha256 ?? options.pt2s_sha256;
    return new DocumentAccounts(c.key(dcgProgram), c.key(executor), c.key(options.pt2s), c.key(options.pt1s), c.key(options.routes), c.key(options.geometry), c.key(options.payloads), c.key(options.registry), c.key(options.admission), c.key(options.templateSeal), hash === undefined ? undefined : c.buffer(hash));
  }

  get dcg_program(): PublicKey { return this.dcgProgram; }
  get pt2s_sha256(): Buffer | undefined { return this.pt2sSha256; }

  addressBook(descriptor: Uint8Array): c.AddressBook {
    return c.addresses(this.dcgProgram, { descriptor, pt2s: this.pt2s.toBytes(), pt2sSha256: this.pt2sSha256, registry: this.registry.toBytes() });
  }

  address_book(descriptor: Uint8Array): c.AddressBook { return this.addressBook(descriptor); }
}

function requiredPda(value: c.Pda | undefined, name: string): c.Pda {
  if (value === undefined) throw new Error(`missing ${name} address`);
  return value;
}

export class DocumentPlan {
  readonly descriptor: Buffer;
  readonly addresses: c.AddressBook;
  readonly init: TransactionInstruction;
  readonly landing: readonly TransactionInstruction[];
  readonly finalize: TransactionInstruction;

  constructor(descriptor: Uint8Array, addresses: c.AddressBook, init: TransactionInstruction, landing: readonly TransactionInstruction[], finalize: TransactionInstruction) {
    this.descriptor = c.buffer(descriptor);
    this.addresses = addresses;
    this.init = init;
    this.landing = landing;
    this.finalize = finalize;
  }

  allInstructions(): readonly TransactionInstruction[] { return [this.init, ...this.landing, this.finalize]; }
  all_instructions(): readonly TransactionInstruction[] { return this.allInstructions(); }
}

export class Requester {
  readonly dcgProgram: PublicKey;
  readonly rpc?: RpcClient;

  constructor(dcgProgram: KeyLike, options: { rpc?: RpcClient } = {}) {
    this.dcgProgram = c.key(dcgProgram);
    this.rpc = options.rpc;
  }

  request(requestProgram: KeyLike, requester: KeyLike, options: RequestBlockV7Options): RequestBlockV7 {
    return RequestBlockV7.create(requestProgram, requester, options);
  }

  documentPlan(request: RequestBlockV7, accounts: DocumentAccounts, spec: c.DescriptorSpec, familyBody: Uint8Array, options: { positionRoots?: readonly Uint8Array[]; familyRoots?: readonly Uint8Array[]; landBatchSize?: number } = {}): DocumentPlan {
    const positionRoots = options.positionRoots ?? [];
    const familyRoots = options.familyRoots ?? [];
    if (!spec.binding.requestId.equals(request.request) || !spec.binding.consumerDigest.equals(request.consumerDigest()) || !sameTerms(spec.terms, request.terms) || !spec.binding.executor.equals(accounts.executor.toBytes()) || !spec.binding.seed.equals(request.seed) || spec.binding.outputFirstPosition !== request.promptTokenCount - 1 || spec.binding.outputCount !== request.maxNewTokens || spec.binding.outputWidth !== TOKEN_WIDTH || !c.buffer(familyBody).equals(spec.familyBody)) throw new Error("descriptor binding does not answer request");
    const descriptor = spec.digest();
    const book = c.addresses(accounts.dcgProgram, { descriptor, registry: accounts.registry.toBytes(), positionCount: spec.positionCount });
    const document = requiredPda(book.document, "document");
    const positions = requiredPda(book.positions, "positions");
    const familySlots = requiredPda(book.familySlots, "family slots");
    const result = requiredPda(book.result, "result");
    const init = ix.unifiedInit(accounts.dcgProgram, accounts.executor, document[0], positions[0], familySlots[0], c.SYSTEM_PROGRAM, accounts.pt2s, accounts.routes, accounts.geometry, accounts.payloads, accounts.registry, accounts.admission, accounts.templateSeal, result[0], spec.terms, spec.binding, spec.modelRoot, spec.positionTableRoot, spec.promptCommitment, familyBody);
    const batch = options.landBatchSize ?? c.maxLandBatch();
    const landing: TransactionInstruction[] = [];
    for (let first = 0; first < positionRoots.length; first += batch) landing.push(ix.landPositionRoots(accounts.dcgProgram, accounts.executor, document[0], positions[0], descriptor, first, positionRoots.slice(first, first + batch)));
    const finalize = ix.finalizeDocument(accounts.dcgProgram, accounts.executor, document[0], result[0], descriptor, familyRoots);
    return new DocumentPlan(descriptor, book, init, landing, finalize);
  }

  document_plan(request: RequestBlockV7, accounts: DocumentAccounts, spec: c.DescriptorSpec, familyBody: Uint8Array, options: { positionRoots?: readonly Uint8Array[]; familyRoots?: readonly Uint8Array[]; landBatchSize?: number } = {}): DocumentPlan {
    return this.documentPlan(request, accounts, spec, familyBody, options);
  }

  attestOutput(accounts: DocumentAccounts, descriptor: Uint8Array, data: Uint8Array, options: { signer: KeyLike }): TransactionInstruction {
    const book = c.addresses(accounts.dcgProgram, { descriptor });
    return ix.attestOutput(accounts.dcgProgram, options.signer, requiredPda(book.document, "document")[0], requiredPda(book.positions, "positions")[0], requiredPda(book.result, "result")[0], accounts.pt2s, accounts.routes, accounts.geometry, data);
  }

  attest_output(accounts: DocumentAccounts, descriptor: Uint8Array, data: Uint8Array, options: { signer: KeyLike }): TransactionInstruction { return this.attestOutput(accounts, descriptor, data, options); }

  resolve(accounts: DocumentAccounts, descriptor: Uint8Array): TransactionInstruction {
    const book = c.addresses(accounts.dcgProgram, { descriptor });
    return ix.resolveResult(accounts.dcgProgram, requiredPda(book.document, "document")[0], requiredPda(book.result, "result")[0], descriptor);
  }

  async readResult(descriptor: Uint8Array): Promise<c.ResultV5> {
    if (this.rpc === undefined) throw new Error("RPC client is required");
    const book = c.addresses(this.dcgProgram, { descriptor });
    const account = await this.rpc.readAccount(requiredPda(book.result, "result")[0]);
    if (account === null) throw new Error("result account is absent");
    if (account.data.subarray(0, 4).equals(Buffer.from("DCRZ"))) throw new Error("result has been replaced by a DCRZ tombstone");
    return c.ResultV5.decode(account.data);
  }

  async read_result(descriptor: Uint8Array): Promise<c.ResultV5> { return this.readResult(descriptor); }
}

function sameTerms(left: c.RunTerms, right: c.RunTerms): boolean {
  return BigInt(left.challengeWindowSlots) === BigInt(right.challengeWindowSlots)
    && BigInt(left.responseWindowSlots) === BigInt(right.responseWindowSlots)
    && BigInt(left.challengerBondLamports) === BigInt(right.challengerBondLamports)
    && BigInt(left.executorBondLamports) === BigInt(right.executorBondLamports)
    && BigInt(left.executorRewardBps) === BigInt(right.executorRewardBps)
    && left.settlementProgram.equals(right.settlementProgram)
    && BigInt(left.customSettleWindowSlots) === BigInt(right.customSettleWindowSlots)
    && BigInt(left.resultRetentionSlots) === BigInt(right.resultRetentionSlots);
}
