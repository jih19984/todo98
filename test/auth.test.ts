import { describe, expect, it, vi } from "vitest";
import { createOAuthLogin, createSignOut } from "@/lib/auth";
import { getPublicEnv } from "@/lib/env";

describe("environment config", () => {
  it("returns a setup error when Supabase env vars are missing", () => {
    const result = getPublicEnv({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Supabase 환경변수");
    }
  });

  it("returns Supabase config when env vars exist", () => {
    const result = getPublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon-key",
      },
    });
  });
});

describe("OAuth login", () => {
  it("starts Google login with Supabase OAuth provider", async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({ data: {}, error: null });
    const login = createOAuthLogin({ auth: { signInWithOAuth } } as never, "https://todo98.test");

    await login("google");

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://todo98.test/auth/callback",
      },
    });
  });

  it("starts Kakao login with Supabase OAuth provider", async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({ data: {}, error: null });
    const login = createOAuthLogin({ auth: { signInWithOAuth } } as never, "https://todo98.test");

    await login("kakao");

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "kakao",
      options: {
        redirectTo: "https://todo98.test/auth/callback",
      },
    });
  });
});

describe("sign out", () => {
  it("signs out through Supabase auth", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const logout = createSignOut({ auth: { signOut } } as never);

    await logout();

    expect(signOut).toHaveBeenCalledOnce();
  });
});
