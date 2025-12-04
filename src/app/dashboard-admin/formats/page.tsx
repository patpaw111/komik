import { supabaseAdmin } from "@/lib/supabase/server";
import { FormatCreateForm } from "./FormatCreateForm";
import { FormatTable } from "./FormatTable";

export const dynamic = "force-dynamic";

export default async function FormatsDashboardPage() {
  const { data, error } = await supabaseAdmin
    .from("formats")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) {
    console.error("[dashboard-admin/formats] error", error);
  }

  const formatsList = (data ?? []) as {
    id: string;
    name: string;
    slug: string;
  }[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Formats</h2>
          <p className="text-sm text-muted-foreground">
            Kelola daftar format komik yang tersedia (Manga, Manhwa, Manhua, dll).
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Daftar Formats</h3>
          <FormatTable items={formatsList} error={error?.message} />
        </section>

        <section>
          <FormatCreateForm />
        </section>
      </div>
    </div>
  );
}

