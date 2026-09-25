import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as sdk from "../dist/index.js";

const repo = path.resolve(new URL("../../..", import.meta.url).pathname);
const golden = JSON.parse(fs.readFileSync(path.join(repo, "vectors/dcg/unified_v7.json"), "utf8"));
const bytes = (value) => Buffer.from(value, "hex");
const terms = (custom = false) => {
  const value = { ...golden.ddt2[custom ? "custom" : "default"] };
  value.settlement_program = bytes(value.settlement_program);
  return new sdk.RunTerms(value);
};
const binding = () => sdk.RunBinding.decode(bytes(golden.drb1.hex));
const familyBody = () => bytes(golden.dfs2.hex).subarray(48);
const fields = () => golden.dpd2.fields;
const spec = (runTerms = terms()) => new sdk.DescriptorSpec({
  positionCount: fields().position_count,
  segmentCount: fields().segment_count,
  familyCount: fields().family_count,
  totalEntries: fields().total_entries,
  terms: runTerms,
  binding: binding(),
  compilerVersion: fields().compiler_version,
  clause12V4: bytes(fields().clause12_v4),
  definitionSha256: bytes(fields().definition_sha256),
  baseDigests: fields().base_digests.map(bytes),
  modelRoot: bytes(fields().model_root),
  positionTableRoot: bytes(fields().position_table_root),
  promptCommitment: bytes(fields().prompt_commitment),
  registryEpoch: fields().registry_epoch,
  registry: bytes(fields().registry),
  registryTableRoot: bytes(fields().registry_table_root),
  familyBody: familyBody(),
});

test("revision, addresses, and descriptor match the revision-7 goldens", () => {
  const descriptor = bytes(golden.dpd2.digest);
  const book = sdk.addresses(golden.addresses.program, {
    descriptor,
    pt2s: crypto.createHash("sha256").update("basanos/dcg-unified-v1-vector/pt2s").digest(),
    pt2sSha256: crypto.createHash("sha256").update("basanos/dcg-unified-v1-vector/pt2s-sha256").digest(),
    challenger: golden.addresses.challenger,
    nonce: golden.addresses.nonce,
    registryId: 1,
    registry: bytes(fields().registry),
    positionCount: 80,
    settlement: true,
  });
  for (const [name, expected] of Object.entries(golden.addresses)) {
    if (!Array.isArray(expected)) continue;
    const actual = book.asDict()[name];
    assert.equal(actual[0].toBase58(), expected[0]);
    assert.equal(actual[1], expected[1]);
  }
  assert.equal(book.settlement_escrow[0].toBase58(), sdk.settlementEscrowAddress(golden.addresses.program, book.challenge[0])[0].toBase58());
  assert.equal(sdk.SPEC_REVISION, 7);
});

test("DDT2, descriptor, and init data match the goldens", () => {
  assert.equal(terms().encode().toString("hex"), golden.ddt2.default_hex);
  assert.equal(terms(true).encode().toString("hex"), golden.ddt2.custom_hex);
  assert.deepEqual(sdk.builtInSettlement(terms()), golden.ddt2.built_in_split);
  const defaultSpec = spec();
  assert.equal(defaultSpec.preimage().toString("hex"), golden.dpd2.preimage);
  assert.equal(defaultSpec.digest().toString("hex"), golden.dpd2.digest);
  const customSpec = spec(terms(true));
  assert.equal(customSpec.preimage().toString("hex"), golden.dpd2.custom_preimage);
  assert.equal(customSpec.digest().toString("hex"), golden.dpd2.custom_digest);
  const init = sdk.encodeUnifiedInit(terms(), binding(), {
    modelRoot: bytes(fields().model_root),
    positionTableRoot: bytes(fields().position_table_root),
    promptCommitment: bytes(fields().prompt_commitment),
    familyBody: familyBody(),
  });
  assert.equal(init.length, golden.drb1.init_data_bytes);
  assert.equal(init.length, 533);
});

test("result, document, and tombstone codecs round-trip", () => {
  const result = sdk.ResultV5.decode(bytes(golden.dcr2_v5.final));
  assert.equal(result.encode().toString("hex"), golden.dcr2_v5.final);
  const tombstone = sdk.ResultTombstone.decode(bytes(golden.dcr2_v5.tombstone));
  assert.equal(tombstone.encode().toString("hex"), golden.dcr2_v5.tombstone);
  const document = sdk.Dcm2V6.decode(bytes(golden.dcm2_v6.finalized));
  assert.equal(document.encode().toString("hex"), golden.dcm2_v6.finalized);
  const landed = sdk.Dcm2V6.decode(bytes(golden.dcm2_v6.init));
  const roots = golden.dcm2_v6.position_roots.map(bytes);
  const table = Array(roots.length).fill(null);
  sdk.landPositionRoots(landed, table, sdk.encodeLandPositionRoots(landed.descriptor, 0, roots.slice(0, 5)), landed.authority);
  assert.equal(landed.positionsComplete, 5);
  assert.equal(sdk.maxLandBatch(), 28);
  assert.equal(sdk.maxRevealChunk(), 25);
});

test("DLE1 v2 and SPP1 vectors verify", () => {
  for (const [name, raw] of Object.entries(golden.events)) {
    const event = sdk.decodeEventV7(bytes(raw));
    assert.equal(event.kind, name);
    const fields = Object.fromEntries(Object.entries(event).filter(([key]) => !["kind", "descriptor", "slot"].includes(key)));
    assert.equal(sdk.encodeEventV7(name, { descriptor: event.descriptor, slot: event.slot, ...fields }).toString("hex"), raw, name);
  }
  const descriptor = bytes(golden.dpd2.digest);
  for (const [position, value] of Object.entries(golden.spp1)) {
    const coordinate = golden.segment_tables[position];
    assert.equal(sdk.verifySpp1(descriptor, Number(position), coordinate.segments.length, bytes(value.segment_root), bytes(value.spp1), bytes(golden.dcm2_v6.position_roots[position]), bytes(coordinate.root)), true, position);
  }
});

test("challenge, settlement, and tag 185 wire formats", () => {
  assert.equal(sdk.encodeChallengePosition(bytes(golden.dpd2.digest), 79, 0).toString("hex"), golden.position_reveal.data);
  const settlement = bytes(golden.settlement.instruction);
  assert.equal(settlement.subarray(0, 4).toString("ascii"), "BSS1");
  assert.equal(settlement.length, 200);
  assert.deepEqual(sdk.encodeSettlementInstruction({
    ruling: settlement[6], cause: settlement[7], winner: settlement.subarray(8, 40), loser: settlement.subarray(40, 72),
    challenge: settlement.subarray(72, 104), result: settlement.subarray(104, 136), descriptor: settlement.subarray(136, 168),
    settlementPot: Number(settlement.readBigUInt64LE(168)), challengerBond: Number(settlement.readBigUInt64LE(176)),
    builtInWinnerAmount: Number(settlement.readBigUInt64LE(184)), builtInBurnAmount: Number(settlement.readBigUInt64LE(192)),
  }), settlement);
  assert.equal(sdk.encodeCloseResult(bytes(golden.dpd2.digest)).length, 33);
});

test("DCR1 ruling fields are exposed only after a ruling", () => {
  const record = Buffer.alloc(sdk.DCR1_BYTES);
  record.write("DCR1", 0, "ascii");
  record[4] = sdk.PHASE_POSITION_REVEAL;
  record.writeUInt16LE(sdk.DCR1_VERSION, 6);
  record[144] = 1;
  record.writeUInt32LE(17, 170);
  record.writeUInt16LE(23, 174);
  const live = sdk.decodeChallengeRecord(record);
  assert.equal(live.entry, 17);
  assert.equal(live.form, 23);
  assert.equal(live.customSettlementDeadline, undefined);
  assert.equal(live.rulingCause, undefined);
  record[4] = sdk.PHASE_RULED;
  record.writeBigUInt64LE(1234n, 170);
  record[178] = sdk.CAUSE_CONVICT;
  const ruled = sdk.decodeChallengeRecord(record);
  assert.equal(ruled.customSettlementDeadline, 1234);
  assert.equal(ruled.rulingCause, sdk.CAUSE_CONVICT);
});

test("settle has seven built-in accounts and eleven custom accounts", () => {
  const program = new PublicKey(Buffer.alloc(32, 9));
  const keys = Array.from({ length: 6 }, (_, index) => new PublicKey(Buffer.alloc(32, index + 1)));
  const builtIn = sdk.instructions.settle(program, ...keys);
  assert.equal(builtIn.keys.length, 7);
  const custom = sdk.instructions.settleCustom(program, ...keys, new PublicKey(Buffer.alloc(32, 8)), new PublicKey(Buffer.alloc(32, 7)), keys[0]);
  assert.equal(custom.keys.length, 11);
  assert.equal(custom.keys[7].isSigner, false);
  assert.equal(custom.keys[8].isWritable, true);
  const close = sdk.instructions.closeResult(program, keys[0], keys[1], keys[2], Buffer.alloc(32, 4));
  assert.equal(close.keys.length, 3);
  assert.equal(close.data[0], sdk.TAG_CLOSE_RESULT);
});

function requestFixture() {
  return sdk.RequestBlock.create(
    "9Dg7fWD2iidk5SxVKBKFy3etJiv89NV7u5HhuCkSgjPW",
    "DMbXxEWZ56waNzGrdSHRvchxFEdrGZmAvMSJmnpXdxND",
    {
      nonce: 7,
      promptTokenCount: 30,
      maxNewTokens: 2,
      promptCommitment: Buffer.alloc(32, 2),
      promptTokens: [1, 2, 3],
      tokenizerSha256: Buffer.alloc(32, 3),
      machineId: Buffer.alloc(32, 4),
      terms: terms(),
    },
  );
}

test("requester v7 block, digest, and run binding are stable", () => {
  const request = requestFixture();
  const encoded = request.encode();
  assert.equal(encoded.length, 376);
  assert.deepEqual(request.consumerDigest(), crypto.createHash("sha256").update(Buffer.concat([Buffer.from("basanos/tierc-request/2"), encoded])).digest());
  assert.equal(request.request.toString("hex"), Buffer.from(sdk.requestAddress("9Dg7fWD2iidk5SxVKBKFy3etJiv89NV7u5HhuCkSgjPW", "DMbXxEWZ56waNzGrdSHRvchxFEdrGZmAvMSJmnpXdxND", 7)[0].toBytes()).toString("hex"));
  const run = request.runBinding(Buffer.alloc(32, 5), { outputBaseEntry: 28037 });
  assert.equal(run.requestId.toString("hex"), request.request.toString("hex"));
  assert.equal(run.outputFirstPosition, 29);
  assert.equal(run.outputCount, 2);
  assert.equal(run.encode().subarray(0, 4).toString("ascii"), "DRB1");
});

test("token helpers enforce the usable v5 result gate", () => {
  const termsValue = new sdk.RunTerms({ challengeWindowSlots: 1, responseWindowSlots: 1, challengerBondLamports: 0, executorBondLamports: 0, executorRewardBps: 0, resultRetentionSlots: 1 });
  const run = new sdk.RunBinding(Buffer.alloc(32, 1), Buffer.alloc(32), Buffer.alloc(32), Buffer.alloc(32), 0, 2, 1, 0, 16);
  const result = sdk.ResultV5.atInit(Buffer.alloc(32, 6), run, termsValue);
  assert.equal(result.usable, false);
  result.status = sdk.STATUS_FINAL;
  result.documentRoot = Buffer.alloc(32, 7);
  result.outputs = [sdk.tokenValue(3), sdk.tokenValue(4)];
  assert.equal(result.usable, true);
  assert.deepEqual(sdk.usableTokens(result, { vocab: 10 }), [3, 4]);
  assert.throws(() => sdk.decodeToken(Buffer.alloc(15), 10));
});

class Response {
  constructor(value) { this.value = value; }
  json() { return this.value; }
}

class FakeClient {
  constructor(responses) { this.responses = [...responses]; this.requests = []; this.closed = false; }
  async post(_endpoint, init) { this.requests.push(init.body); return new Response(this.responses.shift()); }
  close() { this.closed = true; }
}

test("transport bounds bodies, decodes v2 events, and signs transactions", async () => {
  const client = new FakeClient([]);
  const rpc = new sdk.RpcClient("https://rpc.invalid", { client });
  await assert.rejects(() => rpc.call("custom", ["x".repeat(52000)]), sdk.RpcBodyTooLarge);
  assert.equal(client.requests.length, 0);
  const event = sdk.encodeEventV7("resolve", { descriptor: Buffer.alloc(32), slot: 9, status: 1, challengerWins: 0, outputsAttested: 0 });
  client.responses.push(
    { jsonrpc: "2.0", id: 1, result: { data: [Buffer.from("DCR2abc").toString("base64"), "base64"], owner: sdk.SYSTEM_PROGRAM.toBase58(), lamports: 7 } },
    { jsonrpc: "2.0", id: 2, result: { meta: { logMessages: [`Program ${sdk.SYSTEM_PROGRAM.toBase58()} invoke [1]`, `Program data: ${event.toString("base64")}`] } } },
    { jsonrpc: "2.0", id: 3, result: "signature" },
    { jsonrpc: "2.0", id: 4, result: { value: [{ slot: 12, confirmationStatus: "confirmed" }] } },
  );
  const account = await rpc.readAccount(sdk.SYSTEM_PROGRAM);
  assert.equal(account.data.toString(), "DCR2abc");
  assert.equal((await rpc.eventsFromLogs("signature", sdk.SYSTEM_PROGRAM))[0].kind, "resolve");
  const payer = Keypair.fromSeed(Uint8Array.from({ length: 32 }, () => 1));
  const receiver = Keypair.fromSeed(Uint8Array.from({ length: 32 }, () => 2)).publicKey;
  const transfer = SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: receiver, lamports: 1 });
  const transaction = await rpc.buildTransaction([transfer], payer, [], "11111111111111111111111111111111");
  assert.ok(transaction.serialize().length > 0);
  const receipt = await rpc.sendRawTransaction(transaction.serialize());
  assert.equal(receipt.signature, "signature");
  const confirmation = await rpc.confirm("signature", { pollInterval: 0, sleep: async () => {} });
  assert.equal(confirmation.slot, 12);
});

test("key file permissions are enforced without exposing the path", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "basanos-sdk-"));
  const file = path.join(directory, "key.json");
  const key = Keypair.fromSeed(Uint8Array.from({ length: 32 }, () => 3));
  fs.writeFileSync(file, JSON.stringify([...key.secretKey]));
  fs.chmodSync(file, 0o644);
  assert.throws(() => sdk.loadKeypair(file), (error) => !String(error).includes(file));
  fs.chmodSync(file, 0o600);
  assert.equal(sdk.loadKeypair(file).publicKey.toBase58(), key.publicKey.toBase58());
  fs.rmSync(directory, { recursive: true, force: true });
});

test("RegistryCreateV2 accepts the V7 machine name", () => {
  const k = Keypair.generate().publicKey;
  const n = bytes(golden.drp2.rows).length / 64;
  const census = bytes(golden.drp2.census_digest);
  const v7 = sdk.registryCreate(k, k, k, k, 1, n, census, sdk.MACHINE_NAME_V7);
  const expected = Buffer.concat([Buffer.from([156]), sdk.uint(1, 4), sdk.uint(n, 4), census, Buffer.alloc(64)]);
  sdk.MACHINE_NAME_V7.copy(expected, 41);
  assert.equal(Buffer.from(v7.data).toString("hex"), expected.toString("hex"));
  assert.throws(() => sdk.registryCreate(k, k, k, k, 1, n, census, Buffer.from("basanos/qwen35-4b-a16/3")));
});
