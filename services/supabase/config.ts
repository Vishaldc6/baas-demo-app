import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://inlkcwgznkffqnjptkuo.supabase.co";
// process.env.EXPO_PUBLIC_SUPABASE_URL ||
export const SUPABASE_ANON_KEY =
  "sb_publishable_5slWSC4zf-sZN0SUxLTGZQ_NFmpOchz";
// process.env.EXPO_PUBLIC_SUPABASE_KEY ||

console.log({ SUPABASE_URL, SUPABASE_ANON_KEY });

// In a real scenario, you would initialize client here:
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabaseClient;
