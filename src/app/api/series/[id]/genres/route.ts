import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const genreIds: string[] = Array.isArray(body.genre_ids)
      ? body.genre_ids
      : [];

    // hapus semua genre lama
    const { error: deleteError } = await supabaseAdmin
      .from("series_genres")
      .delete()
      .eq("series_id", id);

    if (deleteError) {
      console.error("[PUT /api/series/[id]/genres] delete error", deleteError);
      return NextResponse.json(
        { success: false, message: "Gagal menghapus genre lama" },
        { status: 500 }
      );
    }

    if (genreIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const rows = genreIds.map((genreId) => ({
      series_id: id,
      genre_id: genreId,
    }));

    const { data, error: insertError } = await supabaseAdmin
      .from("series_genres")
      .insert(rows)
      .select();

    if (insertError) {
      console.error("[PUT /api/series/[id]/genres] insert error", insertError);
      return NextResponse.json(
        { success: false, message: "Gagal menyimpan genre series" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[PUT /api/series/[id]/genres] unexpected error", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengubah genre" },
      { status: 500 }
    );
  }
}


