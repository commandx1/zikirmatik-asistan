import * as Crypto from "expo-crypto";

/** A client-generated id for correlating a single AI generation attempt/retry (idempotency key). */
export function createFlowId(): string {
  return Crypto.randomUUID();
}
