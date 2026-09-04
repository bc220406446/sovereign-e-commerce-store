import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/account";

  const supabase = await createClient();
  let error = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    const allowedTypes = ["signup", "email", "magiclink", "recovery", "invite"] as const;
    if ((allowedTypes as readonly string[]).includes(type)) {
      ({ error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as (typeof allowedTypes)[number],
      }));
    } else {
      error = new Error("Unsupported verification type");
    }
  } else {
    error = new Error("Missing authentication parameters");
  }

  if (!error) {
    const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
    return NextResponse.redirect(`${origin}${destination}`);
  }

  return NextResponse.redirect(`${origin}/auth?error=Could+not+authenticate`);
}
