export type PublicEnv =
  | {
      ok: true;
      value: {
        supabaseUrl: string;
        supabaseAnonKey: string;
      };
    }
  | {
      ok: false;
      message: string;
    };

export function getPublicEnv(source: NodeJS.ProcessEnv = process.env): PublicEnv {
  const supabaseUrl = source.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = source.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      message: "Supabase 환경변수가 필요합니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.",
    };
  }

  return {
    ok: true,
    value: { supabaseUrl, supabaseAnonKey },
  };
}
