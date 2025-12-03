import { createClient } from "@supabase/supabase-js";

// client khusus di server buat ngurus operasi admin/CRUD ke Supabase
// NOTE:
// - isi ENV ini di file .env.local:
//   NEXT_PUBLIC_SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...
//
// - SERVICE_ROLE_KEY cuma boleh dipakai di server
//   (route handlers / server actions), jangan pernah dikirim ke client

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    // di server aku nggak butuh simpan session
    persistSession: false,
  },
});

