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

// POST /api/chapters/upload
// Upload gambar chapter ke Supabase Storage (dari server side, bypass RLS)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const chapterId = formData.get("chapter_id") as string | null;
    const pageNumber = formData.get("page_number") as string | null;

    if (!file || !(file instanceof File)) {
      return fail("File tidak ditemukan atau tidak valid", 400);
    }

    if (!chapterId || typeof chapterId !== "string") {
      return fail("chapter_id wajib diisi", 400);
    }

    if (!pageNumber || typeof pageNumber !== "string") {
      return fail("page_number wajib diisi", 400);
    }

    // Validasi file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size === 0) {
      return fail("File kosong", 400);
    }
    if (file.size > maxSize) {
      return fail("File terlalu besar (maksimal 10MB)", 400);
    }

    // Validasi file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!file.type || !allowedTypes.includes(file.type)) {
      return fail("Tipe file tidak diizinkan (hanya JPEG, PNG, WebP)", 400);
    }

    // Generate filename
    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `${chapterId}-${pageNumber}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    // Baca file sebagai ArrayBuffer untuk memastikan data lengkap
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload ke Supabase Storage menggunakan service role (bypass RLS)
    const { data: uploadData, error: uploadError } =
      await supabaseAdmin.storage.from("chapters").upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("[POST /api/chapters/upload] upload error", uploadError);
      return fail("Gagal meng-upload file", 500, uploadError.message);
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("chapters")
      .getPublicUrl(uploadData.path);

    return ok({
      path: uploadData.path,
      url: publicUrlData.publicUrl,
    });
  } catch (err: any) {
    console.error("[POST /api/chapters/upload] unexpected error", err);
    return fail("Terjadi kesalahan saat meng-upload file", 500);
  }
}

