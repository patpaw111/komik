import { createClient } from "@supabase/supabase-js";

// Client untuk operasi READ publik di server.
// Prioritas: service role jika tersedia (bypass RLS), fallback ke anon.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

const keyToUse = serviceRoleKey || anonKey;

if (!keyToUse) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabaseRead = createClient(supabaseUrl, keyToUse, {
  auth: { persistSession: false },
});

