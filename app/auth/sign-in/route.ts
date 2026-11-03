import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const next = request.nextUrl.searchParams.get("next") || "/pixa/create";
  const redirectTo = new URL("/auth/callback", request.nextUrl.origin);
  redirectTo.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    // No offline access: the app only reads the Google address, and asking for
    // a refresh token puts Google's own tokens in the session cookie, which
    // grows it past the single-cookie limit and forces it to be chunked.
    options: { redirectTo: redirectTo.toString() },
  });

  if (error) {
    const url = new URL("/pixa/create", request.url);
    url.searchParams.set("auth_error", error.message);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(data.url);
}
