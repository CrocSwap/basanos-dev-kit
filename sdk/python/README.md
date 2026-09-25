# basanos-sdk

`basanos-sdk` is the standalone Python client for the DCG unified builder interface. It targets revision 7 of `dcg-unified-v1`, uses DDT2/DCM2 v6/DCR2 v5, and does not import the research package.

## Install

```sh
python -m pip install -e sdk/python
```

The package uses public `solders` and `httpx` packages. Pass a signer object or an owner-only key-file path to the transport; private key bytes are never printed or included in RPC error messages.

## Requester

```python
from basanos_sdk import Requester, RequestBlock, consensus

requester = Requester(program_id)
request = RequestBlock.create(
    request_program_id,
    requester_pubkey,
    nonce=7,
    prompt_token_count=30,
    max_new_tokens=51,
    prompt_commitment=prompt_commitment,
    prompt_tokens=prompt_token_ids,
    tokenizer_sha256=tokenizer_hash,
    machine_id=machine_hash,
    terms=consensus.RunTerms(
        90_000, 45_000, 1_000_000, 5_000_000, 5_000,
        bytes(32), 0, 2_592_000,
    ),
)
binding = request.run_binding(executor_pubkey, output_base_entry=28_037)
print(request.consumer_digest().hex())
```

`Requester.document_plan(...)` returns the revision-7 `UnifiedInit`, gapless landing batches, and `FinalizeDocumentV5` instructions. The transport can sign and send those instructions with a `solders.keypair.Keypair`.

## Watcher

```python
from basanos_sdk import Watcher, WatcherAccounts

watcher = Watcher(rpc, program_id, WatcherAccounts.create(
    program_id, pt2s=pt2s, pt1s=pt1s, routes=routes, geometry=geometry, registry=registry))
position = watcher.pick_sample(descriptor, watcher.read_document(descriptor).position_count)
handle = watcher.open_position(descriptor, challenger_pubkey, position, nonce=1)
print(handle.record)
```

Challenge openings carry no response length; the executor declares the response length in DRU1. `Watcher.reveal_position`, `select_segment`, and `descent_instructions` build the challenge path. `read_challenge`, `ruling`, and `events` read DCR1 state and DLE1 v2 events.

## Settlement and consumer

A zero `RunTerms.settlement_program` uses the seven-account built-in settle route. A nonzero program uses the eleven-account route; the SDK derives the escrow PDA with `settlement=True` or `settlement_escrow_address(...)`.

```python
from basanos_sdk import Consumer

consumer = Consumer(rpc, program_id)
result = consumer.read_result(descriptor)
if result.usable:
    tokens = consumer.tokens(result, vocab=32_000)
```

`Consumer.verify_output(...)` checks an `AttestOutputV5` payload against its landed position root. A DCRZ tombstone is rejected as a result. The SDK does not include an executor role.
