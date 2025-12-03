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

// GET /api/series/[id]
// ambil detail 1 komik berdasarkan id
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const { data, error } = await supabaseAdmin
      .from("series")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("[GET /api/series/[id]] error", error);
      return fail("Series tidak ditemukan", 404, error.message);
    }

    return ok(data);
  } catch (err: any) {
    console.error("[GET /api/series/[id]] unexpected error", err);
    return fail("Terjadi kesalahan saat mengambil detail series", 500);
  }
}

// PATCH /api/series/[id]
// update data komik tertentu
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const body = await request.json();

    // cuma update field yang dikirim dari body
    const payload: Record<string, any> = {};
    if (body.title !== undefined) payload.title = String(body.title).trim();
    if (body.alternative_title !== undefined)
      payload.alternative_title = body.alternative_title;
    if (body.slug !== undefined) payload.slug = String(body.slug).trim();
    if (body.description !== undefined) payload.description = body.description;
    if (body.format_id !== undefined) payload.format_id = body.format_id;
    if (body.status !== undefined) payload.status = body.status;
    if (body.cover_image_url !== undefined)
      payload.cover_image_url = body.cover_image_url;

    if (Object.keys(payload).length === 0) {
      return fail("Tidak ada field yang diupdate", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("series")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/series/[id]] error", error);
      return fail("Gagal mengubah series", 500, error.message);
    }

    return ok(data);
  } catch (err: any) {
    console.error("[PATCH /api/series/[id]] unexpected error", err);
    return fail("Terjadi kesalahan saat mengubah series", 500);
  }
}

// DELETE /api/series/[id]
// hapus komik berdasarkan id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const { error } = await supabaseAdmin.from("series").delete().eq("id", id);

    if (error) {
      console.error("[DELETE /api/series/[id]] error", error);
      return fail("Gagal menghapus series", 500, error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Series berhasil dihapus",
    });
  } catch (err: any) {
    console.error("[DELETE /api/series/[id]] unexpected error", err);
    return fail("Terjadi kesalahan saat menghapus series", 500);
  }
}

