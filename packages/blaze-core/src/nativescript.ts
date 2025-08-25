import {
  type Address,
  NativeScript,
  ScriptAll,
  ScriptPubkey,
  CredentialType,
  Ed25519KeyHashHex,
  type NetworkId,
  ScriptAny,
  Script,
  ScriptNOfK,
  type Slot,
  TimelockStart,
  TimelockExpiry,
  type Address,
} from "./types";
import { addressFromBech32, addressFromValidator } from "./util";

function keyhashFromAddress(address: string, networkId: NetworkId) {
  const props = addressFromBech32(address).getProps();
  if (props.networkId != networkId) {
    throw new Error(
      `Address ${address} is on network ${props.networkId} not on network ${networkId}`,
    );
  }
  if (
    props.paymentPart?.type == CredentialType.KeyHash &&
    props.paymentPart.hash
  ) {
    return Ed25519KeyHashHex(props.paymentPart!.hash);
  } else {
    throw new Error(`Address ${address} is not a payment address`);
  }
}

export function allOf(...addresses: NativeScript[]): NativeScript {
  return NativeScript.newScriptAll(new ScriptAll(addresses));
}

export function anyOf(...addresses: NativeScript[]): NativeScript {
  return NativeScript.newScriptAny(new ScriptAny(addresses));
}

export function atLeastNOfK(
  n: number,
  ...addresses: NativeScript[]
): NativeScript {
  return NativeScript.newScriptNOfK(new ScriptNOfK(addresses, n));
}

export function justAddress(
  address: string,
  networkId: NetworkId,
): NativeScript {
  return NativeScript.newScriptPubkey(
    new ScriptPubkey(keyhashFromAddress(address, networkId)),
  );
}

export function before(slot: Slot): NativeScript {
  return NativeScript.newTimelockExpiry(new TimelockExpiry(slot));
}

export function after(slot: Slot): NativeScript {
  return NativeScript.newTimelockStart(new TimelockStart(slot));
}

export function address(ns: NativeScript, networkId: NetworkId): Address {
  return addressFromValidator(networkId, Script.newNativeScript(ns));
}
