import { PublicKey } from "@solana/web3.js";
import * as c from "./consensus.js";
import { RpcClient } from "./transport.js";

export interface ConsumerView {
  result: c.ResultV5;
  events: ReadonlyArray<Record<string, c.Integer | Buffer | string>>;
}

export class Consumer {
  readonly rpc: RpcClient;
  readonly dcgProgram: PublicKey;

  constructor(rpc: RpcClient, dcgProgram: PublicKey | string | Uint8Array) {
    this.rpc = rpc;
    this.dcgProgram = c.key(dcgProgram);
  }

  resultAddress(descriptor: Uint8Array): PublicKey {
    const value = c.addresses(this.dcgProgram, { descriptor }).result;
    if (value === undefined) throw new Error("missing result address");
    return value[0];
  }

  result_address(descriptor: Uint8Array): PublicKey { return this.resultAddress(descriptor); }

  async readResult(descriptor: Uint8Array): Promise<c.ResultV5> {
    const account = await this.rpc.readAccount(this.resultAddress(descriptor));
    if (account === null) throw new Error("result account is absent");
    if (account.data.subarray(0, 4).equals(Buffer.from("DCRZ"))) throw new Error("result has been replaced by a DCRZ tombstone");
    return c.ResultV5.decode(account.data);
  }

  async read_result(descriptor: Uint8Array): Promise<c.ResultV5> { return this.readResult(descriptor); }

  async events(signature: string): Promise<Array<Record<string, c.Integer | Buffer | string>>> {
    return this.rpc.eventsFromLogs(signature, this.dcgProgram);
  }

  async view(descriptor: Uint8Array, signature: string): Promise<ConsumerView> {
    return { result: await this.readResult(descriptor), events: await this.events(signature) };
  }

  verifyOutput(data: Uint8Array, options: { position: number; segmentCount: number; segment: number; entries: number; local: number; region: number; offset: number; landedRoot: Uint8Array; width: number; expectedTableRoot?: Uint8Array; expectedIndex?: number; expectedDescriptor?: Uint8Array }): c.AttestationVerification {
    return c.verifyAttestation(data, options);
  }

  verify_output(data: Uint8Array, options: { position: number; segmentCount: number; segment: number; entries: number; local: number; region: number; offset: number; landedRoot: Uint8Array; width: number; expectedTableRoot?: Uint8Array; expectedIndex?: number; expectedDescriptor?: Uint8Array }): c.AttestationVerification {
    return this.verifyOutput(data, options);
  }

  tokens(result: c.ResultV5, options: { vocab: number }): number[] { return usableTokens(result, options); }
}

export function decodeToken(value: Uint8Array, vocab: number): number {
  // Bytes 0..8 hold the argmax best score (i64); only the token at 8..16 is the output.
  if (value.length !== 16) throw new Error(String(c.OUTPUT_PROOF));
  const raw = Buffer.from(value.subarray(8, 16)).readBigUInt64LE(0);
  const token = BigInt.asIntN(64, raw);
  if (token < 0n || token >= BigInt(vocab)) throw new Error(String(c.OUTPUT_PROOF));
  return Number(token);
}

export const decode_token = decodeToken;

export function tokenValue(token: number | bigint): Buffer {
  const value = typeof token === "bigint" ? token : BigInt(token);
  if (value < 0n || value >= 1n << 63n) throw new Error("token out of range");
  const out = Buffer.alloc(16);
  out.writeBigUInt64LE(value, 8);
  return out;
}

export const token_value = tokenValue;

export function usableTokens(result: c.ResultV5, options: { vocab: number }): number[] {
  if (!c.USABLE_STATUSES.has(result.status) || result.documentRoot.length !== 32 || result.documentRoot.every((item) => item === 0)) throw new Error("result is not usable");
  if (result.outputs.length !== result.outputCount || result.outputsAttested !== result.outputCount) throw new Error(String(c.OUTPUT_PROOF));
  return result.outputs.map((value) => {
    if (value === null) throw new Error(String(c.OUTPUT_PROOF));
    return decodeToken(value, options.vocab);
  });
}

export const usable_tokens = usableTokens;
