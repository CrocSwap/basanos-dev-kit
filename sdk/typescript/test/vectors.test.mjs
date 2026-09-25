import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as sdk from "../dist/index.js";

const repo = path.resolve(new URL("../../..", import.meta.url).pathname);
const golden = JSON.parse(fs.readFileSync(path.join(repo, "vectors/dcg/unified_v1.json"), "utf8"));
const bytes = (value) => Buffer.from(value, "hex");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest();
const terms = () => new sdk.DisputeTerms(golden.ddt1.fields);
const binding = () => sdk.RunBinding.decode(bytes(golden.drb1.hex));

test("revision, addresses, and descriptor match the revision-6 goldens", () => {
  const fields = golden.dpd2.fields;
  const descriptor = bytes(golden.dpd2.digest);
  const book = sdk.addresses(golden.addresses.program, {
    descriptor,
    pt2s: sha256(Buffer.from("basanos/dcg-unified-v1-vector/pt2s")),
    pt2sSha256: sha256(Buffer.from("basanos/dcg-unified-v1-vector/pt2s-sha256")),
    challenger: golden.addresses.challenger,
    nonce: golden.addresses.nonce,
    registryId: 1,
    registry: bytes(fields.registry),
    positionCount: 80,
  });
  for (const [name, expected] of Object.entries(golden.addresses)) {
    if (!Array.isArray(expected)) continue;
    const actual = book.asDict()[name];
    assert.equal(actual[0].toBase58(), expected[0]);
    assert.equal(actual[1], expected[1]);
  }
  assert.equal(book.response[0].toBase58(), sdk.pda(golden.addresses.program, sdk.RESPONSE_SEED, book.challenge[0])[0].toBase58());
  assert.equal(sdk.SPEC_REVISION, 6);
});

test("terms, binding, descriptor, and init data match the goldens", () => {
  assert.equal(terms().encode().toString("hex"), golden.ddt1.hex);
  assert.equal(binding().encode().toString("hex"), golden.drb1.hex);
  const fields = golden.dpd2.fields;
  const spec = new sdk.DescriptorSpec({
    positionCount: fields.position_count,
    segmentCount: fields.segment_count,
    familyCount: fields.family_count,
    totalEntries: fields.total_entries,
    terms: terms(),
    binding: binding(),
    compilerVersion: fields.compiler_version,
    clause12V4: bytes(fields.clause12_v4),
    definitionSha256: bytes(fields.definition_sha256),
    baseDigests: fields.base_digests.map(bytes),
    modelRoot: bytes(fields.model_root),
    positionTableRoot: bytes(fields.position_table_root),
    promptCommitment: bytes(fields.prompt_commitment),
    registryEpoch: fields.registry_epoch,
    registry: bytes(fields.registry),
    registryTableRoot: bytes(fields.registry_table_root),
    familyBody: bytes(golden.inputs.family_body),
  });
  assert.equal(spec.preimage().toString("hex"), golden.dpd2.preimage);
  assert.equal(spec.digest().toString("hex"), golden.dpd2.digest);
  const init = sdk.encodeUnifiedInit(terms(), binding(), {
    modelRoot: bytes(fields.model_root),
    positionTableRoot: bytes(fields.position_table_root),
    promptCommitment: bytes(fields.prompt_commitment),
    familyBody: bytes(golden.inputs.family_body),
  });
  assert.equal(init.length, golden.drb1.init_data_bytes);
});

test("result and document codecs round-trip", () => {
  const result = sdk.ResultV4.decode(bytes(golden.dcr2_v4.final));
  assert.equal(result.encode().toString("hex"), golden.dcr2_v4.final);
  const document = sdk.Dcm2V5.decode(bytes(golden.finalize.after));
  assert.equal(document.encode().toString("hex"), golden.finalize.after);
  const landed = sdk.Dcm2V5.decode(bytes(golden.dcm2_v5.init));
  const roots = golden.dcm2_v5.position_roots.map(bytes);
  const table = Array(roots.length).fill(null);
  sdk.landPositionRoots(landed, table, sdk.encodeLandPositionRoots(landed.descriptor, 0, roots.slice(0, 5)), landed.authority);
  assert.equal(landed.encode().toString("hex"), golden.dcm2_v5.after_5);
  assert.equal(sdk.maxLandBatch(), 28);
  assert.equal(sdk.maxRevealChunk(), 25);
});

test("event and SPP1 vectors verify", () => {
  for (const [name, raw] of Object.entries(golden.events)) {
    const event = sdk.decodeEvent(bytes(raw));
    const fields = Object.fromEntries(Object.entries(event).filter(([key]) => !["kind", "descriptor", "slot"].includes(key)));
    assert.equal(sdk.encodeEvent(event.kind, { descriptor: event.descriptor, slot: event.slot, ...fields }).toString("hex"), raw, name);
  }
  const descriptor = bytes(golden.dpd2.digest);
  for (const [position, value] of Object.entries(golden.spp1)) {
    const coordinate = golden.segment_tables[position];
    assert.equal(sdk.verifySpp1(descriptor, Number(position), coordinate.segments.length, bytes(value.segment_root), bytes(value.spp1), bytes(golden.dcm2_v5.position_roots[position]), bytes(coordinate.root)), true, position);
  }
});

test("attestation vector verifies", () => {
  const value = golden.attest_output;
  const coordinate = value.coordinate;
  const result = sdk.verifyAttestation(bytes(value.data), {
    width: 16,
    position: value.position,
    segmentCount: coordinate.segment_count,
    segment: coordinate.segment_id,
    entries: coordinate.entries,
    local: coordinate.local,
    region: coordinate.region,
    offset: coordinate.offset,
    landedRoot: bytes(golden.dcm2_v5.position_roots[value.position]),
    expectedTableRoot: bytes(coordinate.segment_table_root),
    expectedIndex: value.index,
  });
  assert.equal(result.value.toString("hex"), value.value);
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
      terms: new sdk.DisputeTerms({ challengeWindowSlots: 90000, responseWindowSlots: 45000, challengerBondLamports: 1000000, executorBondLamports: 5000000, executorRewardBps: 5000 }),
    },
  );
}

test("requester block, digest, and run binding are stable", () => {
  const request = requestFixture();
  const raw = request.encode();
  assert.equal(raw.length, 328);
  assert.deepEqual(request.consumerDigest(), crypto.createHash("sha256").update(Buffer.concat([Buffer.from("basanos/tierc-request/1"), raw])).digest());
  assert.equal(request.request.toString("hex"), Buffer.from(sdk.requestAddress("9Dg7fWD2iidk5SxVKBKFy3etJiv89NV7u5HhuCkSgjPW", "DMbXxEWZ56waNzGrdSHRvchxFEdrGZmAvMSJmnpXdxND", 7)[0].toBytes()).toString("hex"));
  const run = request.runBinding(Buffer.alloc(32, 5), { outputBaseEntry: 28037 });
  assert.equal(run.requestId.toString("hex"), request.request.toString("hex"));
  assert.equal(run.outputFirstPosition, 29);
  assert.equal(run.outputCount, 2);
  assert.equal(run.encode().subarray(0, 4).toString("ascii"), "DRB1");
});

test("token helpers enforce the usable result gate", () => {
  const termsValue = new sdk.DisputeTerms(1, 1, 0, 0, 0);
  const run = new sdk.RunBinding(Buffer.alloc(32, 1), Buffer.alloc(32), Buffer.alloc(32), Buffer.alloc(32), 0, 2, 1, 0, 16);
  const result = sdk.ResultV4.atInit(Buffer.alloc(32, 6), run, termsValue);
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

test("transport bounds bodies, decodes accounts and events, and signs transactions", async () => {
  const client = new FakeClient([]);
  const rpc = new sdk.RpcClient("https://rpc.invalid", { client });
  await assert.rejects(() => rpc.call("custom", ["x".repeat(52000)]), sdk.RpcBodyTooLarge);
  assert.equal(client.requests.length, 0);
  const event = sdk.encodeEvent("resolve", { descriptor: Buffer.alloc(32), slot: 9, status: 1, challengerWins: 0, outputsAttested: 0 });
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
