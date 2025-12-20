import crypto from "crypto";

export function verifyTypeformSignature(
  signature: string | null,
  payload: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;

  const hash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64");

  return `sha256=${hash}` === signature;
}

