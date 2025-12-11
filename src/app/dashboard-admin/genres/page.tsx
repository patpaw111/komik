import { supabaseAdmin } from "@/lib/supabase/server";
import { GenreCreateForm } from "./GenreCreateForm";
import { GenreTable } from "./GenreTable";

export const dynamic = "force-dynamic";

export default async function GenresDashboardPage() {
  const { data, error } = await supabaseAdmin
    .from("genres")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) {
    console.error("[dashboard-admin/genres] error", error);
  }

  const genresList = (data ?? []).map((item: any) => ({
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    slug: String(item.slug ?? ""),
  })) as {
    id: string;
    name: string;
    slug: string;
  }[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Genres</h2>
          <p className="text-sm text-muted-foreground">
            Kelola daftar genre komik yang tersedia.
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Daftar Genres</h3>
          <GenreTable items={genresList} error={error?.message} />
        </section>

        <section>
          <GenreCreateForm />
        </section>
      </div>
    </div>
  );
}

