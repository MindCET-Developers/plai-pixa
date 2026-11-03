import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseBrowserEnv } from "@/lib/supabase/env";

// Pages that read the signed-in user render as Server Components, where Next.js
// forbids cookie writes. Refreshing the session here, where writes are allowed,
// keeps the refreshed tokens in the browser instead of making every render
// refresh again. The matcher leaves out the student and API routes, which never
// read a session, so the hot paths stay free of an extra invocation.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseBrowserEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/", "/pixa/create", "/report", "/admin/:path*"],
};
