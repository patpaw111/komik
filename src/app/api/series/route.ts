import { NextRequest, NextResponse } from "next/server";
import { supabaseRead } from "@/lib/supabase/read";
import { supabaseAdmin } from "@/lib/supabase/server";

// helper kecil biar response API konsisten
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

// GET /api/series
// ambil daftar komik (series) dengan pagination sederhana
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPage = Number(searchParams.get("page") ?? "1");
    const rawLimit = Number(searchParams.get("limit") ?? "20");

    // jaga-jaga kalau user kirim page/limit aneh
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 100
        ? rawLimit
        : 20;

    const offset = (page - 1) * limit; // hitung offset biar bisa paginasi

    const { data, error, count } = await supabaseRead
      .from("series")
      .select(
        `
        *,
        formats(id, name),
        series_genres(genres(id, name)),
        series_authors(authors(id, name), role)
        `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[GET /api/series] error", error);
      return fail("Gagal mengambil data series", 500, error.message);
    }

    return ok(data ?? [], {
      page,
      limit,
      total: count ?? 0,
    });
  } catch (err: any) {
    console.error("[GET /api/series] unexpected error", err);
    return fail("Terjadi kesalahan saat mengambil data series", 500);
  }
}

// POST /api/series
// bikin komik (series) baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // validasi input dasar
    const title = String(body.title ?? "").trim();
    const slug = String(body.slug ?? "").trim();

    if (!title || !slug) {
      return fail("title dan slug wajib diisi", 400);
    }

    if (title.length > 255) {
      return fail("title kepanjangan (maksimal 255 karakter)", 400);
    }

    if (slug.includes(" ")) {
      return fail("slug tidak boleh mengandung spasi", 400);
    }

    const payload = {
      title,
      alternative_title: body.alternative_title ?? null,
      slug,
      description: body.description ?? null,
      format_id: body.format_id ?? null,
      status: body.status ?? "Ongoing",
      cover_image_url: body.cover_image_url ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from("series")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/series] error", error);

      // handle case slug unik bentrok
      if ((error as any).code === "23505") {
        return fail("Slug sudah digunakan, pakai slug lain", 409);
      }

      return fail("Gagal membuat series", 500, error.message);
    }

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/series] unexpected error", err);
    return fail("Terjadi kesalahan saat membuat series", 500);
  }
}
