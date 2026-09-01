import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components, Server Actions and Route
 * Handlers. Reads/writes the session via Next.js cookies(), per Supabase's
 * recommended App Router pattern. Runs with the signed-in user's own
 * authority, so every query is automatically scoped by row-level security.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — middleware refreshes
            // the session on the next request, so this is safe to ignore.
          }
        },
      },
    }
  );
}
