import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("authors")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("[GET /api/authors] error", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil authors" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}


