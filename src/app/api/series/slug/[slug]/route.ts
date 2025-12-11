import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, message, details },
    { status }
  );
}

// GET /api/series/slug/[slug]
// ambil detail series berdasarkan slug
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const { data, error } = await supabaseAdmin
      .from("series")
      .select(
        `
        *,
        formats(id, name),
        series_genres(genres(id, name)),
        series_authors(authors(id, name), role)
        `
      )
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("[GET /api/series/slug/[slug]] error", error);
      return fail("Series tidak ditemukan", 404, error.message);
    }

    return ok(data);
  } catch (err: any) {
    console.error("[GET /api/series/slug/[slug]] unexpected error", err);
    return fail("Terjadi kesalahan saat mengambil detail series", 500);
  }
}

