import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const env = getPublicEnv();

  if (!env.ok) {
    throw new Error(env.message);
  }

  return createBrowserClient(env.value.supabaseUrl, env.value.supabaseAnonKey);
}
