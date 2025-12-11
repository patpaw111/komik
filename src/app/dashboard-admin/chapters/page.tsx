import { supabaseAdmin } from "@/lib/supabase/server";
import { ChapterTable } from "./ChapterTable";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ page?: string; limit?: string; series_id?: string }>;
};

export default async function ChaptersDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawPage = Number(params.page ?? "1");
  const rawLimit = Number(params.limit ?? "20");
  const seriesId = params.series_id;

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 100
      ? rawLimit
      : 20;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("chapters")
    .select(
      `
      id,
      title,
      chapter_number,
      slug,
      index,
      view_count,
      created_at,
      published_at,
      series_id,
      series(id, title, slug)
      `,
      { count: "exact" }
    )
    .order("index", { ascending: false });

  if (seriesId) {
    query = query.eq("series_id", seriesId);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error("[dashboard-admin/chapters] error", error);
  }

  const chaptersList = (data ?? []).map((item: any) => {
    const seriesValue = Array.isArray(item.series)
      ? item.series[0] ?? null
      : item.series ?? null;

    return {
      id: String(item.id),
      title: item.title ?? null,
      chapter_number: String(item.chapter_number),
      slug: String(item.slug),
      index: Number(item.index ?? 0),
      view_count: Number(item.view_count ?? 0),
      created_at: String(item.created_at ?? ""),
      published_at: String(item.published_at ?? ""),
      series_id: String(item.series_id ?? ""),
      series: seriesValue
        ? {
            id: String(seriesValue.id ?? ""),
            title: String(seriesValue.title ?? ""),
            slug: String(seriesValue.slug ?? ""),
          }
        : null,
    };
  }) as {
    id: string;
    title: string | null;
    chapter_number: string;
    slug: string;
    index: number;
    view_count: number;
    created_at: string;
    published_at: string;
    series_id: string;
    series: { id: string; title: string; slug: string } | null;
  }[];

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  // Ambil semua series untuk filter dropdown
  const { data: allSeries } = await supabaseAdmin
    .from("series")
    .select("id, title, slug")
    .order("title", { ascending: true });

  const selectedSeries = seriesId
    ? (allSeries ?? []).find((s) => s.id === seriesId)
    : null;

  return (
    <div className="flex w-full flex-col gap-6 px-2">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Chapters</h2>
          <p className="text-sm text-muted-foreground">
            {selectedSeries
              ? `Chapters dari: ${selectedSeries.title}`
              : "Kelola daftar chapter komik."}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedSeries && (
            <a
              href={`/dashboard-admin/chapters/new?series_id=${selectedSeries.id}`}
              className="inline-flex items-center justify-center rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              + Tambah Chapter ({selectedSeries.title})
            </a>
          )}
          <a
            href="/dashboard-admin/chapters/new"
            className="inline-flex items-center justify-center rounded border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            + Tambah Chapter Baru
          </a>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Pilih Series</h3>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            <a
              href="/dashboard-admin/chapters"
              className={`block rounded px-3 py-2 text-xs transition-colors ${
                !seriesId
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Semua Series
            </a>
            {(allSeries ?? []).map((s) => (
              <a
                key={s.id}
                href={`/dashboard-admin/chapters?series_id=${s.id}`}
                className={`block rounded px-3 py-2 text-xs transition-colors ${
                  seriesId === s.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {s.title}
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-2">
          <ChapterTable
            items={chaptersList}
            error={error?.message}
            currentPage={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            seriesId={seriesId}
            allSeries={(allSeries ?? []) as Array<{ id: string; title: string; slug: string }>}
          />
        </section>
      </div>
    </div>
  );
}

