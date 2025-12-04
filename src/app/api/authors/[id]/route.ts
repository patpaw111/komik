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

// GET /api/authors/[id]
// ambil detail 1 author berdasarkan id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data, error } = await supabaseAdmin
      .from("authors")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("[GET /api/authors/[id]] error", error);
      return fail("Author tidak ditemukan", 404, error.message);
    }

    return ok(data);
  } catch (err: any) {
    console.error("[GET /api/authors/[id]] unexpected error", err);
    return fail("Terjadi kesalahan saat mengambil detail author", 500);
  }
}

// PATCH /api/authors/[id]
// update data author tertentu
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    console.log("[PATCH /api/authors/[id]] received body:", JSON.stringify(body, null, 2));

    // cuma update field yang dikirim dari body
    const payload: Record<string, any> = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return fail("name tidak boleh kosong", 400);
      }
      if (name.length > 100) {
        return fail("name kepanjangan (maksimal 100 karakter)", 400);
      }
      payload.name = name;
    }

    if (Object.keys(payload).length === 0) {
      return fail("Tidak ada field yang diupdate", 400);
    }

    console.log("[PATCH /api/authors/[id]] payload before sanitization:", JSON.stringify(payload, null, 2));

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

    console.log("[PATCH /api/authors/[id]] payload to update:", JSON.stringify(sanitizedPayload, null, 2));
    console.log("[PATCH /api/authors/[id]] author ID:", id);

    // cek dulu apakah author dengan id ini ada
    const { data: existingAuthor, error: checkError } = await supabaseAdmin
      .from("authors")
      .select("id, name")
      .eq("id", id)
      .single();

    if (checkError || !existingAuthor) {
      console.error("[PATCH /api/authors/[id]] author not found:", checkError);
      return fail("Author tidak ditemukan", 404, checkError?.message);
    }

    const { data, error } = await supabaseAdmin
      .from("authors")
      .update(sanitizedPayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/authors/[id]] Supabase error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: JSON.stringify(error, null, 2),
      });
      return fail("Gagal mengubah author", 500, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }

    console.log("[PATCH /api/authors/[id]] success, updated data:", data);
    return ok(data);
  } catch (err: any) {
    console.error("[PATCH /api/authors/[id]] unexpected error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    return fail("Terjadi kesalahan saat mengubah author", 500, {
      message: err.message,
      name: err.name,
    });
  }
}

// DELETE /api/authors/[id]
// hapus author berdasarkan id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { error } = await supabaseAdmin.from("authors").delete().eq("id", id);

    if (error) {
      console.error("[DELETE /api/authors/[id]] error", error);
      return fail("Gagal menghapus author", 500, error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Author berhasil dihapus",
    });
  } catch (err: any) {
    console.error("[DELETE /api/authors/[id]] unexpected error", err);
    return fail("Terjadi kesalahan saat menghapus author", 500);
  }
}

