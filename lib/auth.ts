import type { SupabaseClient } from "@supabase/supabase-js";

export type OAuthProvider = "google" | "kakao";

export function createOAuthLogin(client: SupabaseClient, origin: string) {
  return async function login(provider: OAuthProvider) {
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }
  };
}
