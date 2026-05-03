import type { SupabaseClient } from "@supabase/supabase-js";

export type OAuthProvider = "google" | "kakao";

function getOAuthOptions(provider: OAuthProvider, origin: string) {
  return {
    redirectTo: `${origin}/auth/callback`,
    ...(provider === "kakao" ? { queryParams: { scope: "profile_nickname" } } : {}),
  };
}

export function createOAuthLogin(client: SupabaseClient, origin: string) {
  return async function login(provider: OAuthProvider) {
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: getOAuthOptions(provider, origin),
    });

    if (error) {
      throw error;
    }
  };
}

export function createSignOut(client: SupabaseClient) {
  return async function signOut() {
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }
  };
}
