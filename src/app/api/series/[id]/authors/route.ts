import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

type AuthorPayload = {
  author_id: string;
  role?: string;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const authors: AuthorPayload[] = Array.isArray(body.authors)
      ? body.authors
      : [];

    // hapus semua author lama
    const { error: deleteError } = await supabaseAdmin
      .from("series_authors")
      .delete()
      .eq("series_id", id);

    if (deleteError) {
      console.error("[PUT /api/series/[id]/authors] delete error", deleteError);
      return NextResponse.json(
        { success: false, message: "Gagal menghapus author lama" },
        { status: 500 }
      );
    }

    if (authors.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Filter duplikasi berdasarkan (series_id, author_id, role)
    // Sekarang kita bisa memiliki author yang sama dengan role berbeda
    const uniqueAuthors = new Map<string, AuthorPayload>();
    for (const author of authors) {
      // Key adalah kombinasi author_id dan role
      const key = `${author.author_id}:${author.role ?? "Story"}`;
      if (!uniqueAuthors.has(key)) {
        uniqueAuthors.set(key, author);
      }
    }

    const rows = Array.from(uniqueAuthors.values()).map((a) => ({
      series_id: id,
      author_id: a.author_id,
      role: a.role ?? "Story",
    }));

    const { data, error: insertError } = await supabaseAdmin
      .from("series_authors")
      .insert(rows)
      .select();

    if (insertError) {
      console.error("[PUT /api/series/[id]/authors] insert error", insertError);
      return NextResponse.json(
        { success: false, message: "Gagal menyimpan author series" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[PUT /api/series/[id]/authors] unexpected error", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengubah author" },
      { status: 500 }
    );
  }
}


