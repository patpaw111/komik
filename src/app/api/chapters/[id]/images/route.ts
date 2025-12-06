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

// PUT /api/chapters/[id]/images
// Update urutan gambar chapter (replace semua gambar)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validasi chapter exists
    const { data: chapterData, error: chapterError } = await supabaseAdmin
      .from("chapters")
      .select("id")
      .eq("id", id)
      .single();

    if (chapterError || !chapterData) {
      return fail("Chapter tidak ditemukan", 404);
    }

    // Body format: { images: [{ image_url: string, page_number: number }] }
    const images = body.images ?? [];

    if (!Array.isArray(images)) {
      return fail("images harus berupa array", 400);
    }

    // Validasi setiap image
    for (const img of images) {
      if (!img.image_url || typeof img.page_number !== "number") {
        return fail("Setiap image harus memiliki image_url dan page_number", 400);
      }
    }

    // Hapus semua gambar lama
    const { error: deleteError } = await supabaseAdmin
      .from("chapter_images")
      .delete()
      .eq("chapter_id", id);

    if (deleteError) {
      console.error("[PUT /api/chapters/[id]/images] delete error", deleteError);
      return fail("Gagal menghapus gambar lama", 500, deleteError.message);
    }

    // Insert gambar baru
    if (images.length > 0) {
      const imagesToInsert = images.map((img) => ({
        chapter_id: id,
        image_url: img.image_url,
        page_number: img.page_number,
      }));

      const { error: insertError } = await supabaseAdmin
        .from("chapter_images")
        .insert(imagesToInsert);

      if (insertError) {
        console.error("[PUT /api/chapters/[id]/images] insert error", insertError);
        return fail("Gagal menyimpan gambar", 500, insertError.message);
      }
    }

    return ok({ message: "Gambar berhasil disimpan" });
  } catch (err: any) {
    console.error("[PUT /api/chapters/[id]/images] unexpected error", err);
    return fail("Terjadi kesalahan saat menyimpan gambar", 500);
  }
}

// GET /api/chapters/[id]/images
// Ambil daftar gambar chapter
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("chapter_images")
      .select("*")
      .eq("chapter_id", id)
      .order("page_number", { ascending: true });

    if (error) {
      console.error("[GET /api/chapters/[id]/images] error", error);
      return fail("Gagal mengambil data gambar", 500, error.message);
    }

    return ok(data ?? []);
  } catch (err: any) {
    console.error("[GET /api/chapters/[id]/images] unexpected error", err);
    return fail("Terjadi kesalahan saat mengambil data gambar", 500);
  }
}

