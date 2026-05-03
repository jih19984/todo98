import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectUrl = new URL("/", request.url);

  if (!code) {
    redirectUrl.searchParams.set("auth_error", "로그인 인증 코드가 없습니다. 다시 시도해주세요.");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirectUrl.searchParams.set("auth_error", error.message);
  }

  return NextResponse.redirect(redirectUrl);
}
