import { readFileSync, statSync } from "node:fs";
import type { PathLike } from "node:fs";
import { Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import bs58 from "bs58";
import * as c from "./consensus.js";

export class RpcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RpcError";
  }
}

export class RpcBodyTooLarge extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RpcBodyTooLarge";
  }
}

export interface Account {
  pubkey: PublicKey;
  owner: PublicKey | null;
  lamports: number;
  data: Buffer;
  executable: boolean;
  rentEpoch: number | null;
  space: number | null;
}

export interface Confirmation {
  signature: string;
  commitment: string;
  slot: number | null;
  err: unknown;
  status: string;
}

export interface SendReceipt {
  signature: string;
  rpcResponse: Record<string, unknown>;
}

export interface HttpResponseLike {
  ok?: boolean;
  status?: number;
  statusText?: string;
  json?: () => Promise<unknown> | unknown;
  text?: () => Promise<string> | string;
  content?: Uint8Array | string;
  raiseForStatus?: () => void;
}

export interface HttpClientLike {
  post: (url: string, init: { body: Uint8Array; headers: Record<string, string> }) => PromiseLike<HttpResponseLike> | HttpResponseLike;
  close?: () => void;
}

export interface RpcClientOptions {
  client?: HttpClientLike;
  fetch?: typeof globalThis.fetch;
  timeout?: number;
  commitment?: string;
  maxBodyBytes?: number;
}

export function loadKeypair(path: string | PathLike): Keypair {
  const location = String(path);
  return loadKeypairSync(location);
}

function loadKeypairSync(location: string): Keypair {
  const mode = statSync(location).mode;
  if ((mode & 0o077) !== 0) throw new Error("key file must not be group or world accessible");
  const raw = readFileSync(location, "utf8").trim();
  try {
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(value)) return Keypair.fromSecretKey(Uint8Array.from(value));
    if (typeof value === "string") return Keypair.fromSecretKey(bs58.decode(value));
  } catch {
    void 0;
  }
  try {
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    throw new Error("invalid key file");
  }
}

export function signer(value: Keypair | string | PathLike): Keypair {
  return value instanceof Keypair ? value : loadKeypair(value);
}

export function signerPubkey(value: Keypair | string | PathLike): PublicKey {
  return signer(value).publicKey;
}

export const load_keypair = loadKeypair;
export const signer_pubkey = signerPubkey;

type FetchClient = {
  post: (url: string, init: { body: Uint8Array; headers: Record<string, string> }) => PromiseLike<HttpResponseLike> | HttpResponseLike;
  close?: () => void;
};

function decodeBase64(value: string): Buffer {
  if (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new RpcError("account data is not valid base64");
  return Buffer.from(value, "base64");
}

export class RpcClient {
  readonly endpoint: string;
  readonly commitment: string;
  readonly maxBodyBytes: number;
  private readonly client: FetchClient;
  private readonly ownsClient: boolean;
  private requestId = 0;

  constructor(endpoint: string, options: RpcClientOptions = {}) {
    if (typeof endpoint !== "string" || endpoint.length === 0) throw new Error("endpoint must be a URL string");
    const maxBodyBytes = options.maxBodyBytes ?? c.JSON_RPC_BODY_LIMIT;
    if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes < 1 || maxBodyBytes > c.JSON_RPC_BODY_LIMIT) throw new Error("max_body_bytes must be within the 50 KiB limit");
    this.endpoint = endpoint;
    this.commitment = options.commitment ?? "confirmed";
    this.maxBodyBytes = maxBodyBytes;
    if (options.client !== undefined) {
      this.client = options.client;
      this.ownsClient = false;
    } else {
      const fetchFunction = options.fetch ?? globalThis.fetch;
      if (typeof fetchFunction !== "function") throw new Error("a fetch implementation is required");
      this.client = {
        post: async (url, init) => {
          const controller = new AbortController();
          const timer = options.timeout === undefined ? undefined : setTimeout(() => controller.abort(), options.timeout * 1000);
          try {
            return await fetchFunction(url, { method: "POST", body: init.body as unknown as BodyInit, headers: init.headers, signal: controller.signal });
          } finally {
            if (timer !== undefined) clearTimeout(timer);
          }
        },
      };
      this.ownsClient = true;
    }
  }

  close(): void {
    if (this.ownsClient) this.client.close?.();
  }

  private body(method: string, params: readonly unknown[]): Buffer {
    this.requestId += 1;
    const encoded = Buffer.from(JSON.stringify({ jsonrpc: "2.0", id: this.requestId, method, params }), "utf8");
    if (encoded.length > this.maxBodyBytes) throw new RpcBodyTooLarge(`${method} request is ${encoded.length} bytes; limit is ${this.maxBodyBytes}`);
    return encoded;
  }

  async call(method: string, params: readonly unknown[] = []): Promise<unknown> {
    const body = this.body(method, params);
    const response = await this.client.post(this.endpoint, { body, headers: { "Content-Type": "application/json" } });
    if (response.ok === false) throw new RpcError(`HTTP ${response.status ?? ""} ${response.statusText ?? ""}`.trim());
    if (response.raiseForStatus !== undefined) response.raiseForStatus();
    let value: unknown;
    if (response.json !== undefined) value = await response.json();
    else if (response.text !== undefined) value = JSON.parse(await response.text());
    else if (response.content !== undefined) value = JSON.parse(Buffer.from(response.content).toString("utf8"));
    else throw new RpcError("JSON-RPC response is not readable");
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new RpcError("JSON-RPC response is not an object");
    const object = value as Record<string, unknown>;
    if (object.error !== undefined && object.error !== null) {
      const error = object.error;
      if (typeof error === "object" && error !== null) {
        const message = String((error as Record<string, unknown>).message ?? "RPC error");
        const code = (error as Record<string, unknown>).code;
        throw new RpcError(code === undefined ? message : `${String(code)}: ${message}`);
      }
      throw new RpcError(String(error));
    }
    if (!("result" in object)) throw new RpcError("JSON-RPC response has no result");
    return object.result;
  }

  async getAccountInfo(pubkey: PublicKey | string | Uint8Array, commitment?: string): Promise<Account | null> {
    const address = c.key(pubkey);
    const value = await this.call("getAccountInfo", [address.toBase58(), { encoding: "base64", commitment: commitment ?? this.commitment }]);
    return RpcClient.decodeAccount(address, value);
  }

  async getMultipleAccounts(pubkeys: readonly (PublicKey | string | Uint8Array)[], commitment?: string): Promise<Array<Account | null>> {
    const keys = pubkeys.map((value) => c.key(value));
    const result: Array<Account | null> = [];
    let start = 0;
    let batchSize = Math.min(100, keys.length);
    while (start < keys.length) {
      let values: unknown;
      while (true) {
        try {
          values = await this.call("getMultipleAccounts", [keys.slice(start, start + batchSize).map((value) => value.toBase58()), { encoding: "base64", commitment: commitment ?? this.commitment }]);
          break;
        } catch (error) {
          if (!(error instanceof RpcBodyTooLarge) || batchSize === 1) throw error;
          batchSize = Math.max(1, Math.floor(batchSize / 2));
        }
      }
      const expected = Math.min(batchSize, keys.length - start);
      if (!Array.isArray(values) || values.length !== expected) throw new RpcError("account batch response is malformed");
      values.forEach((value, index) => result.push(RpcClient.decodeAccount(keys[start + index], value)));
      start += batchSize;
    }
    return result;
  }

  async readAccount(pubkey: PublicKey | string | Uint8Array, commitment?: string): Promise<Account | null> { return this.getAccountInfo(pubkey, commitment); }
  async readAccounts(pubkeys: readonly (PublicKey | string | Uint8Array)[], commitment?: string): Promise<Array<Account | null>> { return this.getMultipleAccounts(pubkeys, commitment); }
  async get_account_info(pubkey: PublicKey | string | Uint8Array, commitment?: string): Promise<Account | null> { return this.getAccountInfo(pubkey, commitment); }
  async get_multiple_accounts(pubkeys: readonly (PublicKey | string | Uint8Array)[], commitment?: string): Promise<Array<Account | null>> { return this.getMultipleAccounts(pubkeys, commitment); }
  async read_account(pubkey: PublicKey | string | Uint8Array, commitment?: string): Promise<Account | null> { return this.readAccount(pubkey, commitment); }
  async read_accounts(pubkeys: readonly (PublicKey | string | Uint8Array)[], commitment?: string): Promise<Array<Account | null>> { return this.readAccounts(pubkeys, commitment); }

  static decodeAccount(address: PublicKey, value: unknown): Account | null {
    if (value === null || value === undefined) return null;
    if (typeof value !== "object" || Array.isArray(value)) throw new RpcError("account response is malformed");
    const object = value as Record<string, unknown>;
    const encoded = object.data;
    let data: Buffer;
    if (Array.isArray(encoded) && encoded.length === 2 && encoded[1] === "base64") data = decodeBase64(String(encoded[0]));
    else if (typeof encoded === "string") data = decodeBase64(encoded);
    else throw new RpcError("account data is missing");
    const owner = object.owner === undefined || object.owner === null ? null : new PublicKey(String(object.owner));
    const lamportsNumber = Number(object.lamports ?? 0);
    if (!Number.isSafeInteger(lamportsNumber) || lamportsNumber < 0) throw new RpcError("account lamports are malformed");
    const rentEpoch = object.rentEpoch === undefined || object.rentEpoch === null ? null : Number(object.rentEpoch);
    const space = object.space === undefined || object.space === null ? null : Number(object.space);
    if ((rentEpoch !== null && !Number.isSafeInteger(rentEpoch)) || (space !== null && !Number.isSafeInteger(space))) throw new RpcError("account metadata is malformed");
    return { pubkey: address, owner, lamports: lamportsNumber, data, executable: Boolean(object.executable), rentEpoch, space };
  }

  async latestBlockhash(commitment?: string): Promise<string> {
    const value = await this.call("getLatestBlockhash", [{ commitment: commitment ?? this.commitment }]);
    if (typeof value !== "object" || value === null || typeof (value as Record<string, unknown>).blockhash !== "string") throw new RpcError("latest blockhash response is malformed");
    return (value as Record<string, string>).blockhash;
  }

  async sendRawTransaction(transaction: Uint8Array | string, options: { skipPreflight?: boolean; maxRetries?: number } = {}): Promise<SendReceipt> {
    const encoded = typeof transaction === "string" ? transaction : Buffer.from(transaction).toString("base64");
    const maxRetries = options.maxRetries ?? 0;
    let last: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const signature = await this.call("sendTransaction", [encoded, { encoding: "base64", skipPreflight: options.skipPreflight ?? false, preflightCommitment: this.commitment }]);
        if (typeof signature !== "string") throw new RpcError("sendTransaction response is malformed");
        return { signature, rpcResponse: { signature } };
      } catch (error) {
        last = error;
      }
    }
    throw last instanceof Error ? last : new RpcError("send failed");
  }

  async buildTransaction(instructions: readonly TransactionInstruction[], payer: Keypair | string | PathLike, signers: readonly (Keypair | string | PathLike)[] = [], blockhash?: string): Promise<Transaction> {
    const payerKey = signer(payer);
    const recentBlockhash = blockhash ?? await this.latestBlockhash();
    const transaction = new Transaction({ feePayer: payerKey.publicKey, recentBlockhash });
    transaction.add(...instructions);
    const unique = new Map<string, Keypair>();
    unique.set(payerKey.publicKey.toBase58(), payerKey);
    for (const value of signers) {
      const key = signer(value);
      if (!unique.has(key.publicKey.toBase58())) unique.set(key.publicKey.toBase58(), key);
    }
    transaction.partialSign(...unique.values());
    return transaction;
  }

  async sendTransaction(instructions: readonly TransactionInstruction[], payer: Keypair | string | PathLike, signers: readonly (Keypair | string | PathLike)[] = [], options: { skipPreflight?: boolean; maxRetries?: number } = {}): Promise<SendReceipt> {
    const transaction = await this.buildTransaction(instructions, payer, signers);
    return this.sendRawTransaction(transaction.serialize(), options);
  }

  async send_raw_transaction(transaction: Uint8Array | string, options: { skipPreflight?: boolean; maxRetries?: number } = {}): Promise<SendReceipt> { return this.sendRawTransaction(transaction, options); }
  async build_transaction(instructions: readonly TransactionInstruction[], payer: Keypair | string | PathLike, signers: readonly (Keypair | string | PathLike)[] = [], blockhash?: string): Promise<Transaction> { return this.buildTransaction(instructions, payer, signers, blockhash); }
  async send_transaction(instructions: readonly TransactionInstruction[], payer: Keypair | string | PathLike, signers: readonly (Keypair | string | PathLike)[] = [], options: { skipPreflight?: boolean; maxRetries?: number } = {}): Promise<SendReceipt> { return this.sendTransaction(instructions, payer, signers, options); }

  async signatureStatuses(signature: string): Promise<Array<Record<string, unknown>>> {
    const value = await this.call("getSignatureStatuses", [[signature], { searchTransactionHistory: true }]);
    if (typeof value !== "object" || value === null || !Array.isArray((value as Record<string, unknown>).value)) throw new RpcError("signature status response is malformed");
    return (value as { value: Array<Record<string, unknown>> }).value;
  }

  async signature_statuses(signature: string): Promise<Array<Record<string, unknown>>> { return this.signatureStatuses(signature); }

  async confirm(signature: string, options: { commitment?: string; timeout?: number; pollInterval?: number; clock?: () => number; sleep?: (seconds: number) => void } = {}): Promise<Confirmation> {
    const deadline = (options.clock ?? Date.now)() + (options.timeout ?? 60) * 1000;
    const order: Record<string, number> = { processed: 0, confirmed: 1, finalized: 2 };
    const target = order[options.commitment ?? "confirmed"] ?? 1;
    const clock = options.clock ?? Date.now;
    const sleep = options.sleep ?? ((seconds: number) => new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000)));
    while (true) {
      const statuses = await this.signatureStatuses(signature);
      const value = statuses[0];
      if (value !== undefined) {
        const current = typeof value.confirmationStatus === "string" ? value.confirmationStatus : "processed";
        if ((order[current] ?? 0) >= target) return { signature, commitment: current, slot: value.slot === undefined ? null : Number(value.slot), err: value.err ?? null, status: current };
        if (value.err !== undefined && value.err !== null) return { signature, commitment: current, slot: value.slot === undefined ? null : Number(value.slot), err: value.err, status: current };
      }
      if (clock() >= deadline) throw new Error("transaction confirmation timed out");
      await sleep(options.pollInterval ?? 0.25);
    }
  }

  private async transactionValue(signature: string, searchHistory: boolean): Promise<Record<string, unknown> | null> {
    const value = await this.call("getTransaction", [signature, { encoding: "json", searchTransactionHistory: searchHistory }]);
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
  }

  async transactionLogs(signature: string, searchHistory = true): Promise<string[]> {
    const value = await this.transactionValue(signature, searchHistory);
    if (value === null) return [];
    const meta = typeof value.meta === "object" && value.meta !== null ? value.meta as Record<string, unknown> : undefined;
    const logs = meta?.logMessages;
    return Array.isArray(logs) ? logs.map((item) => String(item)) : [];
  }

  async logs(signature: string, searchHistory = true): Promise<string[]> { return this.transactionLogs(signature, searchHistory); }
  async getLogs(signature: string, searchHistory = true): Promise<string[]> { return this.transactionLogs(signature, searchHistory); }
  async transaction_logs(signature: string, searchHistory = true): Promise<string[]> { return this.transactionLogs(signature, searchHistory); }
  async get_logs(signature: string, searchHistory = true): Promise<string[]> { return this.transactionLogs(signature, searchHistory); }

  async eventsFromLogs(signature: string, program?: PublicKey | string | Uint8Array): Promise<Array<Record<string, c.Integer | Buffer | string>>> {
    const value = await this.transactionValue(signature, true);
    if (value === null) return [];
    const meta = typeof value.meta === "object" && value.meta !== null ? value.meta as Record<string, unknown> : undefined;
    if (meta?.err !== undefined && meta.err !== null) return [];
    const logs = Array.isArray(meta?.logMessages) ? meta.logMessages.map((item) => String(item)) : [];
    const programText = program === undefined ? undefined : c.key(program).toBase58();
    let currentProgram: string | undefined;
    const events: Array<Record<string, c.Integer | Buffer | string>> = [];
    for (const line of logs) {
      if (line.startsWith("Program ") && line.includes(" invoke [")) currentProgram = line.split(/\s+/)[1];
      if (!line.includes("Program data:")) continue;
      if (programText !== undefined && currentProgram !== programText) continue;
      const encoded = line.slice(line.indexOf("Program data:") + "Program data:".length).trim();
      try { events.push(c.decodeEvent(Buffer.from(encoded, "base64"))); } catch { void 0; }
    }
    return events;
  }
  async events_from_logs(signature: string, program?: PublicKey | string | Uint8Array): Promise<Array<Record<string, c.Integer | Buffer | string>>> { return this.eventsFromLogs(signature, program); }
}

export const RpcBodyTooLargeError = RpcBodyTooLarge;

export function eventsFromLogs(rpc: RpcClient, signature: string, program?: PublicKey | string | Uint8Array): Promise<Array<Record<string, c.Integer | Buffer | string>>> {
  return rpc.eventsFromLogs(signature, program);
}

export const events_from_logs = eventsFromLogs;
