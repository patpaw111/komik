import { NextRequest, NextResponse } from "next/server";
import { supabaseRead } from "@/lib/supabase/read";
import { supabaseAdmin } from "@/lib/supabase/server";

function ok<T>(data: T, meta?: unknown) {
  return NextResponse.json(
    meta ? { success: true, data, meta } : { success: true, data }
  );
}

function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, message, details },
    { status }
  );
}

// GET /api/chapters
// ambil daftar chapters dengan filter series_id (opsional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get("series_id");
    const rawPage = Number(searchParams.get("page") ?? "1");
    const rawLimit = Number(searchParams.get("limit") ?? "20");

    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 100
        ? rawLimit
        : 20;

    const offset = (page - 1) * limit;

    let query = supabaseRead
      .from("chapters")
      .select(
        `
        *,
        series(id, title, slug, cover_image_url)
        `,
        { count: "exact" }
      )
      .order("index", { ascending: false });

    if (seriesId) {
      query = query.eq("series_id", seriesId);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("[GET /api/chapters] error", error);
      return fail("Gagal mengambil data chapters", 500, error.message);
    }

    return ok(data ?? [], {
      page,
      limit,
      total: count ?? 0,
    });
  } catch (err: any) {
    console.error("[GET /api/chapters] unexpected error", err);
    return fail("Terjadi kesalahan saat mengambil data chapters", 500);
  }
}

// POST /api/chapters
// bikin chapter baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const seriesId = body.series_id;
    const chapterNumber = String(body.chapter_number ?? "").trim();
    const title = body.title ? String(body.title).trim() : null;

    if (!seriesId) {
      return fail("series_id wajib diisi", 400);
    }

    if (!chapterNumber) {
      return fail("chapter_number wajib diisi", 400);
    }

    // Ambil data series untuk membuat slug
    const { data: seriesData, error: seriesError } = await supabaseAdmin
      .from("series")
      .select("slug")
      .eq("id", seriesId)
      .single();

    if (seriesError || !seriesData) {
      return fail("Series tidak ditemukan", 404);
    }

    // Hitung index dari chapter_number (misal "1" -> 1.0, "1.5" -> 1.5, "Extra" -> 999.0)
    let index: number;
    const numValue = parseFloat(chapterNumber);
    if (!isNaN(numValue)) {
      index = numValue;
    } else {
      // Untuk chapter non-numeric seperti "Extra", "Bonus", dll
      index = 999.0;
    }

    // Buat slug: series-slug-chapter-{chapter_number}
    const slug = `${seriesData.slug}-chapter-${chapterNumber}`.toLowerCase().replace(/\s+/g, "-");

    const payload = {
      series_id: seriesId,
      chapter_number: chapterNumber,
      title,
      index,
      slug,
      published_at: body.published_at ? new Date(body.published_at).toISOString() : new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("chapters")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/chapters] error", error);

      if ((error as any).code === "23505") {
        return fail("Chapter dengan nomor ini sudah ada", 409);
      }

      return fail("Gagal membuat chapter", 500, error.message);
    }

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/chapters] unexpected error", err);
    return fail("Terjadi kesalahan saat membuat chapter", 500);
  }
}

