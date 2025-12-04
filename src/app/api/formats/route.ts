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

// GET /api/formats
// ambil daftar semua format
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("formats")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error) {
      console.error("[GET /api/formats] error", error);
      return fail("Gagal mengambil formats", 500, error.message);
    }

    return ok(data ?? []);
  } catch (err: any) {
    console.error("[GET /api/formats] unexpected error", err);
    return fail("Terjadi kesalahan saat mengambil formats", 500);
  }
}

// POST /api/formats
// bikin format baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const slug = String(body.slug ?? "").trim();

    if (!name || !slug) {
      return fail("name dan slug wajib diisi", 400);
    }

    if (name.length > 50) {
      return fail("name kepanjangan (maksimal 50 karakter)", 400);
    }

    if (slug.includes(" ") || slug.length > 50) {
      return fail("slug tidak boleh mengandung spasi dan maksimal 50 karakter", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("formats")
      .insert({ name, slug })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/formats] error", error);

      // handle case slug unik bentrok
      if ((error as any).code === "23505") {
        return fail("Slug sudah digunakan, pakai slug lain", 409);
      }

      return fail("Gagal membuat format", 500, error.message);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/formats] unexpected error", err);
    return fail("Terjadi kesalahan saat membuat format", 500);
  }
}


