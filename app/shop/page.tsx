import { ShopScreen } from "@/components/shop/ShopScreen";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ShopPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.getUser();
    const user = result.data.user;

    return <ShopScreen userEmail={user?.email ?? "Todo98 사용자"} />;
  } catch {
    return <ShopScreen userEmail="Todo98 사용자" />;
  }
}
