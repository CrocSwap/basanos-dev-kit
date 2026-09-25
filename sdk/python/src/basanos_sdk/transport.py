"""Small JSON-RPC transport for the DCG SDK."""
from __future__ import annotations

import base64
import json
import os
import time
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol, Self

import httpx
from solders.hash import Hash
from solders.instruction import Instruction
from solders.keypair import Keypair
from solders.message import Message
from solders.pubkey import Pubkey
from solders.transaction import Transaction

from . import consensus


class RpcError(RuntimeError):
    """A JSON-RPC error response."""


class RpcBodyTooLarge(ValueError):
    """The request cannot fit the endpoint's 50 KiB JSON body limit."""


class Signer(Protocol):
    @property
    def pubkey(self) -> Pubkey:
        ...

    def sign_transaction(self, transaction: Transaction) -> None:
        ...


@dataclass(frozen=True)
class Account:
    pubkey: Pubkey
    owner: Pubkey | None
    lamports: int
    data: bytes
    executable: bool
    rent_epoch: int | None
    space: int | None


@dataclass(frozen=True)
class Confirmation:
    signature: str
    commitment: str
    slot: int | None
    err: Any
    status: str


@dataclass(frozen=True)
class SendReceipt:
    signature: str
    rpc_response: dict[str, Any]


def load_keypair(path: str | os.PathLike[str]) -> Keypair:
    """Load a JSON byte-array or base58 key file without exposing its contents."""
    location = Path(path)
    mode = location.stat().st_mode
    if mode & 0o077:
        raise ValueError("key file must not be group or world accessible")
    raw = location.read_text().strip()
    try:
        value = json.loads(raw)
        if isinstance(value, list):
            return Keypair.from_bytes(bytes(value))
        if isinstance(value, str):
            return Keypair.from_base58_string(value)
    except (json.JSONDecodeError, TypeError, ValueError):
        pass
    try:
        return Keypair.from_base58_string(raw)
    except ValueError as error:
        raise ValueError("invalid key file") from error


def signer(value: Keypair | str | os.PathLike[str]) -> Keypair:
    return value if isinstance(value, Keypair) else load_keypair(value)


def signer_pubkey(value: Keypair | str | os.PathLike[str]) -> Pubkey:
    return signer(value).pubkey()


class RpcClient:
    """A bounded JSON-RPC client for one Solana-compatible endpoint."""

    def __init__(self, endpoint: str, *, client: Any | None = None, timeout: float = 30.0,
                 commitment: str = "confirmed", max_body_bytes: int = consensus.JSON_RPC_BODY_LIMIT) -> None:
        if not endpoint or not isinstance(endpoint, str):
            raise ValueError("endpoint must be a URL string")
        if max_body_bytes < 1 or max_body_bytes > consensus.JSON_RPC_BODY_LIMIT:
            raise ValueError("max_body_bytes must be within the 50 KiB limit")
        self.endpoint = endpoint
        self.commitment = commitment
        self.max_body_bytes = max_body_bytes
        self._client = client or httpx.Client(timeout=timeout)
        self._owns_client = client is None
        self._request_id = 0

    def close(self) -> None:
        if self._owns_client:
            self._client.close()

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *_args: object) -> None:
        self.close()

    def _body(self, method: str, params: Sequence[Any]) -> bytes:
        self._request_id += 1
        body = json.dumps({"jsonrpc": "2.0", "id": self._request_id, "method": method, "params": list(params)},
                          separators=(",", ":"), ensure_ascii=True).encode("utf-8")
        if len(body) > self.max_body_bytes:
            raise RpcBodyTooLarge(f"{method} request is {len(body)} bytes; limit is {self.max_body_bytes}")
        return body

    def call(self, method: str, params: Sequence[Any] = ()) -> Any:
        body = self._body(method, params)
        response = self._client.post(self.endpoint, content=body,
                                     headers={"Content-Type": "application/json"})
        if hasattr(response, "raise_for_status"):
            response.raise_for_status()
        value = response.json() if hasattr(response, "json") else json.loads(response.content)
        if not isinstance(value, dict):
            raise RpcError("JSON-RPC response is not an object")
        if value.get("error") is not None:
            error = value["error"]
            if isinstance(error, dict):
                message = str(error.get("message", "RPC error"))
                code = error.get("code")
                raise RpcError(f"{code}: {message}" if code is not None else message)
            raise RpcError(str(error))
        if "result" not in value:
            raise RpcError("JSON-RPC response has no result")
        return value["result"]

    def get_account_info(self, pubkey: Pubkey | str, *, commitment: str | None = None) -> Account | None:
        value = self.call("getAccountInfo", [str(consensus.key(pubkey)), {"encoding": "base64",
                                                                            "commitment": commitment or self.commitment}])
        return self._decode_account(str(consensus.key(pubkey)), value)

    def get_multiple_accounts(self, pubkeys: Sequence[Pubkey | str], *, commitment: str | None = None) -> list[Account | None]:
        keys = [consensus.key(value) for value in pubkeys]
        result: list[Account | None] = []
        start = 0
        batch_size = min(100, len(keys))
        while start < len(keys):
            while True:
                try:
                    values = self.call("getMultipleAccounts", [[str(value) for value in keys[start:start + batch_size]],
                                                                 {"encoding": "base64", "commitment": commitment or self.commitment}])
                    break
                except RpcBodyTooLarge:
                    if batch_size == 1:
                        raise
                    batch_size = max(1, batch_size // 2)
            if len(values) != min(batch_size, len(keys) - start):
                raise RpcError("account batch response is malformed")
            result.extend(self._decode_account(str(keys[index]), value) for index, value in enumerate(values, start))
            start += batch_size
        return result

    def read_account(self, pubkey: Pubkey | str, *, commitment: str | None = None) -> Account | None:
        return self.get_account_info(pubkey, commitment=commitment)

    def read_accounts(self, pubkeys: Sequence[Pubkey | str], *, commitment: str | None = None) -> list[Account | None]:
        return self.get_multiple_accounts(pubkeys, commitment=commitment)

    @staticmethod
    def _decode_account(address: str, value: Any) -> Account | None:
        if value is None:
            return None
        if not isinstance(value, dict):
            raise RpcError("account response is malformed")
        encoded = value.get("data")
        if isinstance(encoded, list):
            if len(encoded) != 2 or encoded[1] != "base64":
                raise RpcError("unsupported account encoding")
            data = base64.b64decode(encoded[0], validate=True)
        elif isinstance(encoded, str):
            data = base64.b64decode(encoded, validate=True)
        else:
            raise RpcError("account data is missing")
        owner = value.get("owner")
        return Account(Pubkey.from_string(address), Pubkey.from_string(owner) if owner else None,
                       int(value.get("lamports", 0)), data, bool(value.get("executable", False)),
                       int(value["rentEpoch"]) if value.get("rentEpoch") is not None else None,
                       int(value["space"]) if value.get("space") is not None else None)

    def latest_blockhash(self, *, commitment: str | None = None) -> Hash:
        value = self.call("getLatestBlockhash", [{"commitment": commitment or self.commitment}])
        if not isinstance(value, dict) or not isinstance(value.get("blockhash"), str):
            raise RpcError("latest blockhash response is malformed")
        return Hash.from_string(value["blockhash"])

    def send_raw_transaction(self, transaction: bytes | str, *, skip_preflight: bool = False,
                             max_retries: int = 0) -> SendReceipt:
        encoded = transaction if isinstance(transaction, str) else base64.b64encode(transaction).decode("ascii")
        last: Exception | None = None
        for _attempt in range(max_retries + 1):
            try:
                signature = self.call("sendTransaction", [encoded, {"encoding": "base64", "skipPreflight": skip_preflight,
                                                                      "preflightCommitment": self.commitment}])
                if not isinstance(signature, str):
                    raise RpcError("sendTransaction response is malformed")
                return SendReceipt(signature, {"signature": signature})
            except RpcError as error:
                last = error
                if not _attempt:
                    continue
        raise last or RpcError("send failed")

    def build_transaction(self, instructions: Sequence[Instruction], payer: Keypair | str | os.PathLike[str],
                          signers: Sequence[Keypair | str | os.PathLike[str]] = (), *, blockhash: Hash | None = None) -> Transaction:
        payer_key = signer(payer)
        blockhash = blockhash or self.latest_blockhash()
        message = Message.new_with_blockhash(list(instructions), payer_key.pubkey(), blockhash)
        transaction = Transaction.new_unsigned(message)
        signer_keys = [signer(value) for value in signers]
        all_signers = [payer_key, *(value for value in signer_keys if value.pubkey() != payer_key.pubkey())]
        transaction.partial_sign(all_signers, blockhash)
        return transaction

    def send_transaction(self, instructions: Sequence[Instruction], payer: Keypair | str | os.PathLike[str],
                         signers: Sequence[Keypair | str | os.PathLike[str]] = (), *, skip_preflight: bool = False,
                         max_retries: int = 0) -> SendReceipt:
        transaction = self.build_transaction(instructions, payer, signers)
        return self.send_raw_transaction(bytes(transaction), skip_preflight=skip_preflight, max_retries=max_retries)

    def signature_statuses(self, signature: str) -> list[dict[str, Any]]:
        value = self.call("getSignatureStatuses", [[signature], {"searchTransactionHistory": True}])
        if not isinstance(value, dict) or not isinstance(value.get("value"), list):
            raise RpcError("signature status response is malformed")
        return value["value"]

    def confirm(self, signature: str, *, commitment: str = "confirmed", timeout: float = 60.0,
                poll_interval: float = 0.25, clock: Callable[[], float] = time.monotonic,
                sleep: Callable[[float], None] = time.sleep) -> Confirmation:
        deadline = clock() + timeout
        order = {"processed": 0, "confirmed": 1, "finalized": 2}
        target = order[commitment]
        while True:
            statuses = self.signature_statuses(signature)
            value = statuses[0] if statuses else None
            if value is not None:
                current = value.get("confirmationStatus")
                if current is None:
                    current = "processed"
                if order.get(current, 0) >= target:
                    return Confirmation(signature, current, value.get("slot"), value.get("err"), current)
                if value.get("err") is not None:
                    return Confirmation(signature, current, value.get("slot"), value.get("err"), current)
            if clock() >= deadline:
                raise TimeoutError("transaction confirmation timed out")
            sleep(poll_interval)

    def _transaction_value(self, signature: str, *, search_history: bool) -> dict[str, Any] | None:
        value = self.call("getTransaction", [signature, {"encoding": "json", "searchTransactionHistory": search_history}])
        return value if isinstance(value, dict) else None

    def transaction_logs(self, signature: str, *, search_history: bool = True) -> list[str]:
        value = self._transaction_value(signature, search_history=search_history)
        if value is None:
            return []
        meta = ((value.get("meta") or {}).get("logMessages") or [])
        return [str(item) for item in meta]

    def logs(self, signature: str, *, search_history: bool = True) -> list[str]:
        return self.transaction_logs(signature, search_history=search_history)

    def get_logs(self, signature: str, *, search_history: bool = True) -> list[str]:
        return self.transaction_logs(signature, search_history=search_history)

    def events_from_logs(self, signature: str, *, program: Pubkey | str | None = None) -> list[dict[str, Any]]:
        value = self._transaction_value(signature, search_history=True)
        if value is None or (value.get("meta") or {}).get("err") is not None:
            return []
        meta = (value.get("meta") or {}).get("logMessages") or []
        events = []
        program_text = str(consensus.key(program)) if program is not None else None
        stack: list[str] = []
        for line in (str(item) for item in meta):
            if line.startswith("Program ") and " invoke [" in line:
                stack.append(line.split()[1])
            elif line.startswith("Program ") and (" success" in line or " failed:" in line):
                if stack:
                    stack.pop()
            if "Program data:" not in line:
                continue
            current_program = stack[-1] if stack else None
            if program_text is not None and current_program != program_text:
                continue
            _prefix, encoded = line.split("Program data:", 1)
            try:
                raw = base64.b64decode(encoded.strip(), validate=True)
                events.append(consensus.decode_event_any(raw))
            except (ValueError, TypeError):
                continue
        return events
