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

// GET /api/genres/[id]
// ambil detail 1 genre berdasarkan id
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const { data, error } = await supabaseAdmin
      .from("genres")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("[GET /api/genres/[id]] error", error);
      return fail("Genre tidak ditemukan", 404, error.message);
    }

    return ok(data);
  } catch (err: any) {
    console.error("[GET /api/genres/[id]] unexpected error", err);
    return fail("Terjadi kesalahan saat mengambil detail genre", 500);
  }
}

// PATCH /api/genres/[id]
// update data genre tertentu
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const body = await request.json();

    // cuma update field yang dikirim dari body
    const payload: Record<string, any> = {};
    if (body.name !== undefined) payload.name = String(body.name).trim();
    if (body.slug !== undefined) payload.slug = String(body.slug).trim();

    if (Object.keys(payload).length === 0) {
      return fail("Tidak ada field yang diupdate", 400);
    }

    // validasi
    if (payload.name && payload.name.length > 50) {
      return fail("name kepanjangan (maksimal 50 karakter)", 400);
    }

    if (payload.slug) {
      if (payload.slug.includes(" ") || payload.slug.length > 50) {
        return fail("slug tidak boleh mengandung spasi dan maksimal 50 karakter", 400);
      }
    }

    const { data, error } = await supabaseAdmin
      .from("genres")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/genres/[id]] error", error);

      if ((error as any).code === "23505") {
        return fail("Slug sudah digunakan, pakai slug lain", 409);
      }

      return fail("Gagal mengubah genre", 500, error.message);
    }

    return ok(data);
  } catch (err: any) {
    console.error("[PATCH /api/genres/[id]] unexpected error", err);
    return fail("Terjadi kesalahan saat mengubah genre", 500);
  }
}

// DELETE /api/genres/[id]
// hapus genre berdasarkan id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const { error } = await supabaseAdmin.from("genres").delete().eq("id", id);

    if (error) {
      console.error("[DELETE /api/genres/[id]] error", error);
      return fail("Gagal menghapus genre", 500, error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Genre berhasil dihapus",
    });
  } catch (err: any) {
    console.error("[DELETE /api/genres/[id]] unexpected error", err);
    return fail("Terjadi kesalahan saat menghapus genre", 500);
  }
}

