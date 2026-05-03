"use client";

import { useState } from "react";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroWindow } from "@/components/ui/RetroWindow";
import { createOAuthLogin, type OAuthProvider } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginWindow() {
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(provider: OAuthProvider) {
    try {
      setError(null);
      const supabase = createSupabaseBrowserClient();
      await createOAuthLogin(supabase, window.location.origin)(provider);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "로그인을 시작하지 못했습니다.");
    }
  }

  return (
    <RetroWindow title="Login.exe" className="login-window">
      <p className="window-copy">Google 또는 Kakao 계정으로 Todo98을 시작하세요.</p>
      <div className="login-actions">
        <RetroButton type="button" onClick={() => void handleLogin("google")}>
          Google로 계속하기
        </RetroButton>
        <RetroButton type="button" onClick={() => void handleLogin("kakao")}>
          Kakao로 계속하기
        </RetroButton>
      </div>
      {error && <p className="retro-error">{error}</p>}
    </RetroWindow>
  );
}
