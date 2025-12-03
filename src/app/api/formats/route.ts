import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("formats")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) {
    console.error("[GET /api/formats] error", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil formats" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}


