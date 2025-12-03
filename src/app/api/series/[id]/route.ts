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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    console.log("[PATCH /api/series/[id]] received body:", JSON.stringify(body, null, 2));

    // cuma update field yang dikirim dari body
    const payload: Record<string, any> = {};
    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) {
        return fail("title tidak boleh kosong", 400);
      }
      payload.title = title;
    }
    if (body.alternative_title !== undefined) {
      const altTitle = String(body.alternative_title || "").trim();
      payload.alternative_title = altTitle || null;
    }
    if (body.slug !== undefined) {
      const slug = String(body.slug).trim();
      if (!slug) {
        return fail("slug tidak boleh kosong", 400);
      }
      if (slug.includes(" ")) {
        return fail("slug tidak boleh mengandung spasi", 400);
      }
      payload.slug = slug;
    }
    if (body.description !== undefined) {
      const desc = String(body.description || "").trim();
      payload.description = desc || null;
    }
    if (body.format_id !== undefined) {
      // pastikan format_id adalah UUID yang valid atau null
      const formatId = body.format_id;
      // handle null, undefined, empty string, atau string "null"/"undefined"
      if (
        !formatId ||
        formatId === "" ||
        formatId === "null" ||
        formatId === "undefined" ||
        formatId === null ||
        formatId === undefined
      ) {
        payload.format_id = null;
      } else {
        // validasi UUID format sederhana
        const formatIdStr = String(formatId).trim();
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(formatIdStr)) {
          payload.format_id = formatIdStr;
        } else {
          console.error("[PATCH /api/series/[id]] invalid format_id:", formatId);
          return fail("format_id tidak valid (harus UUID atau null)", 400);
        }
      }
    }
    if (body.status !== undefined) {
      // validasi status harus sesuai enum
      const validStatuses = ["Ongoing", "Completed", "Hiatus", "Cancelled"];
      if (!validStatuses.includes(body.status)) {
        return fail(
          `status tidak valid. Harus salah satu dari: ${validStatuses.join(", ")}`,
          400
        );
      }
      payload.status = body.status;
    }
    if (body.cover_image_url !== undefined) {
      const coverUrl = body.cover_image_url;
      // handle null, empty string, atau string "null"
      if (!coverUrl || coverUrl === "" || coverUrl === "null") {
        payload.cover_image_url = null;
      } else {
        payload.cover_image_url = String(coverUrl).trim();
      }
    }

    if (Object.keys(payload).length === 0) {
      return fail("Tidak ada field yang diupdate", 400);
    }

    console.log("[PATCH /api/series/[id]] payload before sanitization:", JSON.stringify(payload, null, 2));

    // sanitasi payload: hapus field yang nilainya undefined atau string "undefined"
    const sanitizedPayload: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      // skip jika undefined atau string "undefined"
      if (value === undefined || value === "undefined") {
        continue;
      }
      // untuk field nullable, kirim null jika memang null atau string "null"
      if (value === null || value === "null") {
        sanitizedPayload[key] = null;
      } else {
        sanitizedPayload[key] = value;
      }
    }

    console.log("[PATCH /api/series/[id]] payload to update:", JSON.stringify(sanitizedPayload, null, 2));
    console.log("[PATCH /api/series/[id]] series ID:", id);

    if (Object.keys(sanitizedPayload).length === 0) {
      return fail("Tidak ada field yang diupdate", 400);
    }

    // cek dulu apakah series dengan id ini ada
    const { data: existingSeries, error: checkError } = await supabaseAdmin
      .from("series")
      .select("id, slug")
      .eq("id", id)
      .single();

    if (checkError || !existingSeries) {
      console.error("[PATCH /api/series/[id]] series not found:", checkError);
      return fail("Series tidak ditemukan", 404, checkError?.message);
    }

    // kalau slug diubah, cek apakah slug baru sudah digunakan oleh series lain
    if (sanitizedPayload.slug && sanitizedPayload.slug !== existingSeries.slug) {
      const { data: duplicateSlug, error: slugCheckError } = await supabaseAdmin
        .from("series")
        .select("id")
        .eq("slug", sanitizedPayload.slug)
        .neq("id", id)
        .single();

      if (slugCheckError && slugCheckError.code !== "PGRST116") {
        // PGRST116 = no rows returned (yang berarti tidak ada duplicate)
        console.error("[PATCH /api/series/[id]] error checking slug:", slugCheckError);
        return fail("Gagal memvalidasi slug", 500, slugCheckError.message);
      }

      if (duplicateSlug) {
        return fail("Slug sudah digunakan oleh series lain", 409);
      }
    }

    const { data, error } = await supabaseAdmin
      .from("series")
      .update(sanitizedPayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/series/[id]] Supabase error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: JSON.stringify(error, null, 2),
      });
      return fail("Gagal mengubah series", 500, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }

    console.log("[PATCH /api/series/[id]] success, updated data:", data);
    return ok(data);
  } catch (err: any) {
    console.error("[PATCH /api/series/[id]] unexpected error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    return fail("Terjadi kesalahan saat mengubah series", 500, {
      message: err.message,
      name: err.name,
    });
  }
}

// helper function untuk extract path dari Supabase Storage URL
function extractPathFromUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    
    // cari index "covers" di pathname
    const coversIndex = pathParts.indexOf("covers");
    if (coversIndex === -1 || coversIndex === pathParts.length - 1) {
      console.warn("[DELETE /api/series/[id]] cannot find 'covers' in URL:", url);
      return null;
    }
    
    // ambil semua bagian setelah "covers"
    const pathAfterCovers = pathParts.slice(coversIndex + 1).join("/");
    return pathAfterCovers || null;
  } catch (err) {
    console.warn("[DELETE /api/series/[id]] error parsing URL:", url, err);
    // fallback: coba split manual
    const urlParts = url.split("/covers/");
    if (urlParts.length > 1) {
      const pathWithQuery = urlParts[1];
      return pathWithQuery.split("?")[0].split("#")[0].trim() || null;
    }
    return null;
  }
}

// DELETE /api/series/[id]
// hapus komik berdasarkan id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // ambil data series dulu untuk mendapatkan cover_image_url
    const { data: seriesData, error: fetchError } = await supabaseAdmin
      .from("series")
      .select("cover_image_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("[DELETE /api/series/[id]] error fetching series", fetchError);
      return fail("Series tidak ditemukan", 404, fetchError.message);
    }

    // hapus cover dari bucket kalau ada
    if (seriesData?.cover_image_url) {
      const coverPath = extractPathFromUrl(seriesData.cover_image_url);
      
      if (coverPath && coverPath.trim()) {
        try {
          console.log("[DELETE /api/series/[id]] deleting cover:", coverPath);
          const { error: storageError } = await supabaseAdmin.storage
            .from("covers")
            .remove([coverPath.trim()]);
          
          if (storageError) {
            console.warn("[DELETE /api/series/[id]] failed to delete cover", {
              error: storageError,
              path: coverPath,
            });
            // tidak gagalkan proses delete series kalau hapus cover gagal
          } else {
            console.log("[DELETE /api/series/[id]] cover deleted successfully:", coverPath);
          }
        } catch (storageErr: any) {
          console.warn("[DELETE /api/series/[id]] error deleting cover", {
            error: storageErr,
            path: coverPath,
          });
          // tidak gagalkan proses delete series kalau hapus cover gagal
        }
      } else {
        console.warn("[DELETE /api/series/[id]] cannot extract path from cover URL:", seriesData.cover_image_url);
      }
    }

    // hapus series dari database
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

