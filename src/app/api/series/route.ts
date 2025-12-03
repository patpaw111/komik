import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// GET /api/series
// ambil daftar komik (series) dengan pagination sederhana
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const offset = (page - 1) * limit; // hitung offset biar bisa paginasi

  const { data, error, count } = await supabaseAdmin
    .from("series")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[GET /api/series] error", error);
    return NextResponse.json(
      { message: "Gagal mengambil data series", error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data,
    page,
    limit,
    total: count ?? 0,
  });
}

// POST /api/series
// bikin komik (series) baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || !body.slug) {
      return NextResponse.json(
        { message: "title dan slug wajib diisi" },
        { status: 400 }
      );
    }

    const payload = {
      title: body.title,
      alternative_title: body.alternative_title ?? null,
      slug: body.slug,
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
      return NextResponse.json(
        { message: "Gagal membuat series", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/series] unexpected error", err);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat membuat series" },
      { status: 500 }
    );
  }
}


