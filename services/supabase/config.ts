import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://inlkcwgznkffqnjptkuo.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  "sb_publishable_5slWSC4zf-sZN0SUxLTGZQ_NFmpOchz";

console.log({ SUPABASE_URL, SUPABASE_ANON_KEY });

// In a real scenario, you would initialize client here:
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
