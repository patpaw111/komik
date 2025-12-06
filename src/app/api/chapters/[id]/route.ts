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

// GET /api/chapters/[id]
// Ambil detail chapter
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("chapters")
      .select(`
        *,
        series(id, title, slug)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("[GET /api/chapters/[id]] error", error);
      return fail("Chapter tidak ditemukan", 404, error.message);
    }

    return ok(data);
  } catch (err: any) {
    console.error("[GET /api/chapters/[id]] unexpected error", err);
    return fail("Terjadi kesalahan saat mengambil data chapter", 500);
  }
}

// PUT /api/chapters/[id]
// Update chapter
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const chapterNumber = body.chapter_number ? String(body.chapter_number).trim() : null;
    const title = body.title ? String(body.title).trim() : null;

    // Validasi chapter exists
    const { data: existingChapter, error: fetchError } = await supabaseAdmin
      .from("chapters")
      .select("series_id, series(slug)")
      .eq("id", id)
      .single();

    if (fetchError || !existingChapter) {
      return fail("Chapter tidak ditemukan", 404);
    }

    const updateData: any = {};

    if (chapterNumber !== null) {
      updateData.chapter_number = chapterNumber;
      
      // Hitung index baru
      const numValue = parseFloat(chapterNumber);
      updateData.index = !isNaN(numValue) ? numValue : 999.0;

      // Update slug jika chapter_number berubah
      const seriesSlug = (existingChapter.series as any)?.slug;
      if (seriesSlug) {
        updateData.slug = `${seriesSlug}-chapter-${chapterNumber}`.toLowerCase().replace(/\s+/g, "-");
      }
    }

    if (title !== null) {
      updateData.title = title || null;
    }

    if (Object.keys(updateData).length === 0) {
      return fail("Tidak ada data yang diupdate", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("chapters")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PUT /api/chapters/[id]] error", error);
      return fail("Gagal mengupdate chapter", 500, error.message);
    }

    return ok(data);
  } catch (err: any) {
    console.error("[PUT /api/chapters/[id]] unexpected error", err);
    return fail("Terjadi kesalahan saat mengupdate chapter", 500);
  }
}

// DELETE /api/chapters/[id]
// Hapus chapter (dan semua gambar terkait)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Ambil semua gambar chapter untuk dihapus dari storage
    const { data: imagesData } = await supabaseAdmin
      .from("chapter_images")
      .select("image_url")
      .eq("chapter_id", id);

    // Hapus chapter (akan cascade delete images dari database)
    const { error } = await supabaseAdmin
      .from("chapters")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[DELETE /api/chapters/[id]] error", error);
      return fail("Gagal menghapus chapter", 500, error.message);
    }

    // Hapus gambar dari storage (jika ada)
    if (imagesData && imagesData.length > 0) {
      const pathsToDelete = imagesData
        .map((img) => {
          // Extract path dari URL
          const url = img.image_url;
          if (!url) return null;
          const match = url.match(/\/storage\/v1\/object\/public\/chapters\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      if (pathsToDelete.length > 0) {
        await supabaseAdmin.storage
          .from("chapters")
          .remove(pathsToDelete);
      }
    }

    return ok({ message: "Chapter berhasil dihapus" });
  } catch (err: any) {
    console.error("[DELETE /api/chapters/[id]] unexpected error", err);
    return fail("Terjadi kesalahan saat menghapus chapter", 500);
  }
}

