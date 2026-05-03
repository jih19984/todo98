import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  const env = getPublicEnv();

  if (!env.ok) {
    throw new Error(env.message);
  }

  const cookieStore = await cookies();

  return createServerClient(env.value.supabaseUrl, env.value.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot mutate cookies. Route Handlers still can.
        }
      },
    },
  });
}
