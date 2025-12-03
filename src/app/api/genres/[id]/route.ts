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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    console.log("[PATCH /api/genres/[id]] received body:", JSON.stringify(body, null, 2));

    // cuma update field yang dikirim dari body
    const payload: Record<string, any> = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return fail("name tidak boleh kosong", 400);
      }
      if (name.length > 50) {
        return fail("name kepanjangan (maksimal 50 karakter)", 400);
      }
      payload.name = name;
    }
    
    if (body.slug !== undefined) {
      const slug = String(body.slug).trim();
      if (!slug) {
        return fail("slug tidak boleh kosong", 400);
      }
      if (slug.includes(" ")) {
        return fail("slug tidak boleh mengandung spasi", 400);
      }
      if (slug.length > 50) {
        return fail("slug kepanjangan (maksimal 50 karakter)", 400);
      }
      payload.slug = slug;
    }

    if (Object.keys(payload).length === 0) {
      return fail("Tidak ada field yang diupdate", 400);
    }

    console.log("[PATCH /api/genres/[id]] payload before sanitization:", JSON.stringify(payload, null, 2));

    // sanitasi payload: hapus field yang nilainya undefined atau string "undefined"
    const sanitizedPayload: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === "undefined") {
        continue;
      }
      sanitizedPayload[key] = value;
    }

    if (Object.keys(sanitizedPayload).length === 0) {
      return fail("Tidak ada field yang diupdate", 400);
    }

    console.log("[PATCH /api/genres/[id]] payload to update:", JSON.stringify(sanitizedPayload, null, 2));
    console.log("[PATCH /api/genres/[id]] genre ID:", id);

    // cek dulu apakah genre dengan id ini ada
    const { data: existingGenre, error: checkError } = await supabaseAdmin
      .from("genres")
      .select("id, slug")
      .eq("id", id)
      .single();

    if (checkError || !existingGenre) {
      console.error("[PATCH /api/genres/[id]] genre not found:", checkError);
      return fail("Genre tidak ditemukan", 404, checkError?.message);
    }

    // kalau slug diubah, cek apakah slug baru sudah digunakan oleh genre lain
    if (sanitizedPayload.slug && sanitizedPayload.slug !== existingGenre.slug) {
      const { data: duplicateSlug, error: slugCheckError } = await supabaseAdmin
        .from("genres")
        .select("id")
        .eq("slug", sanitizedPayload.slug)
        .neq("id", id)
        .single();

      if (slugCheckError && slugCheckError.code !== "PGRST116") {
        // PGRST116 = no rows returned (yang berarti tidak ada duplicate)
        console.error("[PATCH /api/genres/[id]] error checking slug:", slugCheckError);
        return fail("Gagal memvalidasi slug", 500, slugCheckError.message);
      }

      if (duplicateSlug) {
        return fail("Slug sudah digunakan oleh genre lain", 409);
      }
    }

    const { data, error } = await supabaseAdmin
      .from("genres")
      .update(sanitizedPayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/genres/[id]] Supabase error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: JSON.stringify(error, null, 2),
      });

      if ((error as any).code === "23505") {
        return fail("Slug sudah digunakan, pakai slug lain", 409);
      }

      return fail("Gagal mengubah genre", 500, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }

    console.log("[PATCH /api/genres/[id]] success, updated data:", data);
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

