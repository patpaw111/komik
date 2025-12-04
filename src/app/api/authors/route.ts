import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// helper biar response konsisten
function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, message, details },
    { status }
  );
}

// GET /api/authors
// ambil daftar semua author
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("authors")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("[GET /api/authors] error", error);
      return fail("Gagal mengambil authors", 500, error.message);
    }

    return ok(data ?? []);
  } catch (err: any) {
    console.error("[GET /api/authors] unexpected error", err);
    return fail("Terjadi kesalahan saat mengambil authors", 500);
  }
}

// POST /api/authors
// bikin author baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();

    if (!name) {
      return fail("name wajib diisi", 400);
    }

    if (name.length > 100) {
      return fail("name kepanjangan (maksimal 100 karakter)", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("authors")
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/authors] error", error);
      return fail("Gagal membuat author", 500, error.message);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/authors] unexpected error", err);
    return fail("Terjadi kesalahan saat membuat author", 500);
  }
}


