import { supabaseAdmin } from "@/lib/supabase/server";
import { SeriesCreateForm } from "./SeriesCreateForm";
import { SeriesTable } from "./SeriesTable";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ page?: string; limit?: string }>;
};

export default async function SeriesDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawPage = Number(params.page ?? "1");
  const rawLimit = Number(params.limit ?? "20");

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 100
      ? rawLimit
      : 20;

  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from("series")
    .select(
      `
      id,
      title,
      slug,
      alternative_title,
      description,
      status,
      cover_image_url,
      format_id,
      formats(id, name),
      series_genres(genres(id, name)),
      series_authors(authors(id, name), role)
      `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[dashboard-admin/series] error", error);
  }

  const seriesList = (data ?? []) as {
    id: string;
    title: string;
    slug: string;
    alternative_title: string | null;
    description: string | null;
    status: string;
    cover_image_url: string | null;
    format_id: string | null;
    formats: { id: string; name: string } | null;
    series_genres: Array<{ genres: { id: string; name: string } }>;
    series_authors: Array<{ authors: { id: string; name: string }; role: string }>;
  }[];

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex w-full flex-col gap-6 px-2">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Series</h2>
          <p className="text-sm text-muted-foreground">
            Kelola daftar komik yang tampil di aplikasi.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <section className="rounded-lg border border-border bg-card p-2">
          <h3 className="mb-3 text-lg font-semibold">Daftar Series</h3>
          <SeriesTable
            items={seriesList}
            error={error?.message}
            currentPage={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
          />
        </section>

        <section>
          <SeriesCreateForm />
        </section>
      </div>
    </div>
  );
}


