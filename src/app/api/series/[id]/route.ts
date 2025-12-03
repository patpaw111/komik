import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// GET /api/series/[id]
// ambil detail 1 komik berdasarkan id
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data, error } = await supabaseAdmin
    .from("series")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[GET /api/series/[id]] error", error);
    return NextResponse.json(
      { message: "Series tidak ditemukan", error: error.message },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
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
    if (body.title !== undefined) payload.title = body.title;
    if (body.alternative_title !== undefined)
      payload.alternative_title = body.alternative_title;
    if (body.slug !== undefined) payload.slug = body.slug;
    if (body.description !== undefined) payload.description = body.description;
    if (body.format_id !== undefined) payload.format_id = body.format_id;
    if (body.status !== undefined) payload.status = body.status;
    if (body.cover_image_url !== undefined)
      payload.cover_image_url = body.cover_image_url;

    const { data, error } = await supabaseAdmin
      .from("series")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/series/[id]] error", error);
      return NextResponse.json(
        { message: "Gagal mengubah series", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[PATCH /api/series/[id]] unexpected error", err);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengubah series" },
      { status: 500 }
    );
  }
}

// DELETE /api/series/[id]
// hapus komik berdasarkan id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { error } = await supabaseAdmin.from("series").delete().eq("id", id);

  if (error) {
    console.error("[DELETE /api/series/[id]] error", error);
    return NextResponse.json(
      { message: "Gagal menghapus series", error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Series berhasil dihapus" });
}


