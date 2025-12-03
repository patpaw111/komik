import { supabaseAdmin } from "@/lib/supabase/server";
import { SeriesCreateForm } from "./SeriesCreateForm";
import { SeriesTable } from "./SeriesTable";

export const dynamic = "force-dynamic";

export default async function SeriesDashboardPage() {
  const { data, error } = await supabaseAdmin
    .from("series")
    .select("id, title, slug, alternative_title, description, status, cover_image_url, format_id")
    .order("created_at", { ascending: false });

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
  }[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Series</h2>
          <p className="text-sm text-muted-foreground">
            Kelola daftar komik yang tampil di aplikasi.
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Daftar Series</h3>
          <SeriesTable items={seriesList} error={error?.message} />
        </section>

        <section>
          <SeriesCreateForm />
        </section>
      </div>
    </div>
  );
}


