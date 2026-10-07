import { createClient, SupabaseClient } from "@supabase/supabase-js";
let c: SupabaseClient | null = null;
export function sb() {
  if (!c) c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return c;
}
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
