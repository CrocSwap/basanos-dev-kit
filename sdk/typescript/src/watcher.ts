import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import type { PathLike } from "node:fs";
import * as c from "./consensus.js";
import * as ix from "./instructions.js";
import { RpcClient } from "./transport.js";

export type KeyLike = PublicKey | string | Uint8Array;

export interface WatcherAccountsOptions {
  pt2s: KeyLike;
  pt1s: KeyLike;
  routes: KeyLike;
  geometry: KeyLike;
  registry: KeyLike;
  pt2sSha256?: Uint8Array;
  pt2s_sha256?: Uint8Array;
}

export class WatcherAccounts {
  readonly dcgProgram: PublicKey;
  readonly pt2s: PublicKey;
  readonly pt1s: PublicKey;
  readonly routes: PublicKey;
  readonly geometry: PublicKey;
  readonly registry: PublicKey;
  readonly pt2sSha256?: Buffer;

  private constructor(dcgProgram: PublicKey, pt2s: PublicKey, pt1s: PublicKey, routes: PublicKey, geometry: PublicKey, registry: PublicKey, pt2sSha256?: Buffer) {
    this.dcgProgram = dcgProgram;
    this.pt2s = pt2s;
    this.pt1s = pt1s;
    this.routes = routes;
    this.geometry = geometry;
    this.registry = registry;
    this.pt2sSha256 = pt2sSha256;
  }

  static create(dcgProgram: KeyLike, options: WatcherAccountsOptions): WatcherAccounts {
    const hash = options.pt2sSha256 ?? options.pt2s_sha256;
    return new WatcherAccounts(c.key(dcgProgram), c.key(options.pt2s), c.key(options.pt1s), c.key(options.routes), c.key(options.geometry), c.key(options.registry), hash === undefined ? undefined : c.buffer(hash));
  }

  get dcg_program(): PublicKey { return this.dcgProgram; }
  get pt2s_sha256(): Buffer | undefined { return this.pt2sSha256; }
}

export class DescentRound {
  readonly descendants: readonly Uint8Array[];
  readonly treeRoot?: Uint8Array;
  readonly choice: number;
  readonly fixpoint: boolean;

  constructor(descendants: readonly Uint8Array[], treeRoot: Uint8Array | undefined, choice: number, fixpoint = false) {
    this.descendants = descendants;
    this.treeRoot = treeRoot;
    this.choice = choice;
    this.fixpoint = fixpoint;
  }
}

export interface ChallengeHandle {
  descriptor: Buffer;
  record: Uint8Array;
  nonce: number;
  position: number;
  instruction: TransactionInstruction;
  response: Uint8Array;
}

export class Watcher {
  readonly rpc: RpcClient;
  readonly accounts: WatcherAccounts;

  constructor(rpc: RpcClient, dcgProgram: KeyLike, accounts: WatcherAccounts) {
    this.rpc = rpc;
    this.accounts = accounts;
    if (c.key(dcgProgram).equals(accounts.dcgProgram) === false) throw new Error("watcher program does not match account map");
  }

  book(descriptor: Uint8Array, options: { challenger?: KeyLike; nonce?: number; positionCount?: number } = {}): c.AddressBook {
    return c.addresses(this.accounts.dcgProgram, { descriptor, pt2s: this.accounts.pt2s.toBytes(), pt2sSha256: this.accounts.pt2sSha256, challenger: options.challenger, nonce: options.nonce ?? 0, registry: this.accounts.registry.toBytes(), positionCount: options.positionCount });
  }

  async readDocument(descriptor: Uint8Array): Promise<c.Dcm2V5> {
    const value = requiredPda(this.book(descriptor).document, "document");
    const account = await this.rpc.readAccount(value[0]);
    if (account === null) throw new Error("document account is absent");
    return c.Dcm2V5.decode(account.data);
  }

  async read_document(descriptor: Uint8Array): Promise<c.Dcm2V5> { return this.readDocument(descriptor); }

  async positions(descriptor: Uint8Array): Promise<Buffer[]> {
    const value = requiredPda(this.book(descriptor).positions, "positions");
    const account = await this.rpc.readAccount(value[0]);
    if (account === null) throw new Error("positions account is absent");
    return c.decodeDpr2(account.data, { allowPartial: true }).roots;
  }

  async listPositions(descriptor: Uint8Array): Promise<Array<[number, Buffer]>> {
    return (await this.positions(descriptor)).map((root, index) => [index, root]);
  }

  async list_positions(descriptor: Uint8Array): Promise<Array<[number, Buffer]>> { return this.listPositions(descriptor); }

  pickSample(descriptor: Uint8Array, positionCount: number, nonce = 0): number {
    if (positionCount < 1 || nonce < 0 || nonce >= 2 ** 64) throw new Error("invalid position count or nonce");
    const value = c.sha256(c.digest(descriptor), c.uint(nonce, 8));
    return Number(value.readBigUInt64LE(0) % BigInt(positionCount));
  }

  pick_sample(descriptor: Uint8Array, positionCount: number, nonce = 0): number { return this.pickSample(descriptor, positionCount, nonce); }

  openPosition(descriptor: Uint8Array, challenger: KeyLike, position: number, options: { responseLength: number; nonce: number }): ChallengeHandle {
    const who = c.keyBytes(challenger);
    const book = this.book(descriptor, { challenger: who, nonce: options.nonce });
    const record = requiredPda(book.challenge, "challenge");
    const data = c.encodeChallengePosition(descriptor, position, options.responseLength, options.nonce);
    const instruction = ix.challengePosition(this.accounts.dcgProgram, record[0], who, requiredPda(book.document, "document")[0], requiredPda(book.positions, "positions")[0], this.accounts.pt2s, this.accounts.routes, this.accounts.geometry, this.accounts.registry, descriptor, position, options.responseLength, options.nonce);
    return { descriptor: c.buffer(descriptor), record: record[0].toBytes(), nonce: options.nonce, position, instruction, response: requiredPda(book.response, "response")[0].toBytes() };
  }

  open_position(descriptor: Uint8Array, challenger: KeyLike, position: number, options: { response_length: number; nonce: number }): ChallengeHandle {
    return this.openPosition(descriptor, challenger, position, { responseLength: options.response_length, nonce: options.nonce });
  }

  openLeaf(descriptor: Uint8Array, challenger: KeyLike, options: { position: number; segment: number; local: number; leaf: Uint8Array; path: readonly Uint8Array[]; spp1: Uint8Array; responseLength: number; nonce: number }): ChallengeHandle {
    const who = c.keyBytes(challenger);
    const book = this.book(descriptor, { challenger: who, nonce: options.nonce });
    const record = requiredPda(book.challenge, "challenge");
    const data = c.encodeChallengeLeaf(descriptor, options.position, options.segment, options.local, options.leaf, options.path, options.spp1, options.responseLength, options.nonce);
    const instruction = ix.challengeLeaf(this.accounts.dcgProgram, record[0], who, requiredPda(book.document, "document")[0], requiredPda(book.positions, "positions")[0], this.accounts.pt2s, this.accounts.routes, this.accounts.geometry, this.accounts.registry, this.accounts.pt1s, data);
    return { descriptor: c.buffer(descriptor), record: record[0].toBytes(), nonce: options.nonce, position: options.position, instruction, response: requiredPda(book.response, "response")[0].toBytes() };
  }

  open_leaf(descriptor: Uint8Array, challenger: KeyLike, options: { position: number; segment: number; local: number; leaf: Uint8Array; path: readonly Uint8Array[]; spp1: Uint8Array; response_length: number; nonce: number }): ChallengeHandle {
    return this.openLeaf(descriptor, challenger, { ...options, responseLength: options.response_length });
  }

  revealPosition(handle: ChallengeHandle, executor: KeyLike, first: number, roots: readonly Uint8Array[]): TransactionInstruction {
    const book = this.book(handle.descriptor);
    return ix.revealPosition(this.accounts.dcgProgram, handle.record, executor, requiredPda(book.document, "document")[0], requiredPda(book.positions, "positions")[0], this.accounts.pt2s, this.accounts.routes, this.accounts.geometry, first, roots);
  }

  reveal_position(handle: ChallengeHandle, executor: KeyLike, first: number, roots: readonly Uint8Array[]): TransactionInstruction { return this.revealPosition(handle, executor, first, roots); }

  selectSegment(handle: ChallengeHandle, challenger: KeyLike, ordinal: number): TransactionInstruction {
    const book = this.book(handle.descriptor);
    return ix.selectSegment(this.accounts.dcgProgram, handle.record, challenger, requiredPda(book.document, "document")[0], this.accounts.pt2s, this.accounts.routes, this.accounts.geometry, ordinal);
  }

  select_segment(handle: ChallengeHandle, challenger: KeyLike, ordinal: number): TransactionInstruction { return this.selectSegment(handle, challenger, ordinal); }

  closeResponse(handle: ChallengeHandle, executor: KeyLike): TransactionInstruction {
    const response = handle.response.length === 0 ? c.pda(this.accounts.dcgProgram, c.RESPONSE_SEED, handle.record)[0] : new PublicKey(handle.response);
    return ix.closeResponse(this.accounts.dcgProgram, handle.record, response, executor);
  }

  close_response(handle: ChallengeHandle, executor: KeyLike): TransactionInstruction { return this.closeResponse(handle, executor); }

  async settle(handle: ChallengeHandle, winner: KeyLike, challenger: KeyLike, executor?: KeyLike): Promise<TransactionInstruction> {
    const response = handle.response.length === 0 ? c.pda(this.accounts.dcgProgram, c.RESPONSE_SEED, handle.record)[0] : new PublicKey(handle.response);
    const resolvedExecutor = executor ?? (await this.readChallenge(handle.record)).executor;
    const book = this.book(handle.descriptor);
    return ix.settle(this.accounts.dcgProgram, handle.record, response, winner, resolvedExecutor, requiredPda(book.document, "document")[0], challenger);
  }

  private fixpointAccounts(): ix.AccountSpec[] {
    return [[this.accounts.pt2s, false, false], [this.accounts.routes, false, false], [this.accounts.geometry, false, false], [this.accounts.registry, false, false], [this.accounts.pt1s, false, false]];
  }

  descentInstructions(handle: ChallengeHandle, executor: KeyLike, challenger: KeyLike, rounds: readonly DescentRound[]): TransactionInstruction[] {
    const book = this.book(handle.descriptor);
    const result: TransactionInstruction[] = [];
    for (const round of rounds) {
      const fixpoint = round.fixpoint ? this.fixpointAccounts() : undefined;
      result.push(ix.revealDescent(this.accounts.dcgProgram, handle.record, executor, requiredPda(book.document, "document")[0], round.descendants, round.treeRoot, { fixpointAccounts: fixpoint }));
      result.push(ix.descend(this.accounts.dcgProgram, handle.record, challenger, requiredPda(book.document, "document")[0], round.choice, { fixpointAccounts: fixpoint, documentWritable: round.fixpoint }));
    }
    return result;
  }

  descent_instructions(handle: ChallengeHandle, executor: KeyLike, challenger: KeyLike, rounds: readonly DescentRound[]): TransactionInstruction[] { return this.descentInstructions(handle, executor, challenger, rounds); }

  followDescent(handle: ChallengeHandle, executor: KeyLike, challenger: KeyLike, rounds: readonly DescentRound[]): TransactionInstruction[] { return this.descentInstructions(handle, executor, challenger, rounds); }
  follow_descent(handle: ChallengeHandle, executor: KeyLike, challenger: KeyLike, rounds: readonly DescentRound[]): TransactionInstruction[] { return this.followDescent(handle, executor, challenger, rounds); }

  async readChallenge(record: KeyLike): Promise<ReturnType<typeof c.decodeChallengeRecord>> {
    const account = await this.rpc.readAccount(c.key(record));
    if (account === null) throw new Error("challenge account is absent");
    return c.decodeChallengeRecord(account.data);
  }

  async read_challenge(record: KeyLike): Promise<ReturnType<typeof c.decodeChallengeRecord>> { return this.readChallenge(record); }

  async ruling(record: KeyLike): Promise<ReturnType<typeof c.decodeChallengeRecord>> {
    const state = await this.readChallenge(record);
    if (state.phase !== c.PHASE_RULED) throw new Error("challenge is not ruled");
    return state;
  }

  async events(signature: string): Promise<Array<Record<string, c.Integer | Buffer | string>>> { return this.rpc.eventsFromLogs(signature, this.accounts.dcgProgram); }

  async send(instruction: TransactionInstruction, payer: Keypair | string | PathLike, signers: readonly (Keypair | string | PathLike)[] = []): Promise<string> {
    const receipt = await this.rpc.sendTransaction([instruction], payer, signers);
    return receipt.signature;
  }
}

function requiredPda(value: c.Pda | undefined, name: string): c.Pda {
  if (value === undefined) throw new Error(`missing ${name} address`);
  return value;
}
