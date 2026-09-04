import { createHash } from "crypto";

const PAYFAST_SANDBOX_PROCESS = "https://sandbox.payfast.co.za/eng/process";
const PAYFAST_LIVE_PROCESS = "https://www.payfast.co.za/eng/process";

export function payfastSignature(
  fields: Record<string, string>,
  passphrase?: string
): string {
  // Hosted checkout uses PayFast's custom-form signature format: preserve
  // submitted field order, omit blank values, and URL-encode each value.
  const parts = Object.keys(fields)
    .filter((key) => key !== "signature" && fields[key] !== "")
    .map((key) => `${key}=${encodeFormValue(fields[key])}`);
  if (passphrase) parts.push(`passphrase=${encodeFormValue(passphrase)}`);
  return createHash("md5").update(parts.join("&")).digest("hex");
}

function encodeFormValue(value: string): string {
  return encodeURIComponent(String(value).trim())
    .replace(/%20/g, "+")
    .replace(/%21/g, "!")
    .replace(/%27/g, "'")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%7E/g, "~");
}

export function payfastConfig() {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  if (!merchantId || !merchantKey) {
    throw new Error(
      "PayFast not configured. Add PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY to .env.local"
    );
  }
  const sandbox = process.env.PAYFAST_SANDBOX === "true";
  return {
    merchantId,
    merchantKey,
    passphrase: process.env.PAYFAST_PASSPHRASE,
    sandbox,
    processUrl: sandbox ? PAYFAST_SANDBOX_PROCESS : PAYFAST_LIVE_PROCESS,
  };
}

export async function validatePayfastItn(
  fields: Record<string, string>,
  sandbox: boolean,
  passphrase?: string
): Promise<boolean> {
  // 1. Signature check
  const expected = payfastSignature(fields, passphrase);
  if (!fields.signature || fields.signature !== expected) return false;

  // 2. External validation (only on live)
  if (!sandbox) {
    try {
      const body = new URLSearchParams(fields);
      const res = await fetch("https://www.payfast.co.za/eng/query/validate", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const text = await res.text();
      if (text.trim().toUpperCase().startsWith("INVALID")) return false;
    } catch {
      // validation unreachable - trust signature only
    }
  }
  return true;
}
