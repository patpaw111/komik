import { supabaseAdmin } from "@/lib/supabase/server";
import { AuthorCreateForm } from "./AuthorCreateForm";
import { AuthorTable } from "./AuthorTable";

export const dynamic = "force-dynamic";

export default async function AuthorsDashboardPage() {
  const { data, error } = await supabaseAdmin
    .from("authors")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("[dashboard-admin/authors] error", error);
  }

  const authorsList = (data ?? []).map((item: any) => ({
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
  })) as {
    id: string;
    name: string;
  }[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Authors</h2>
          <p className="text-sm text-muted-foreground">
            Kelola daftar author (penulis dan artis) komik yang tersedia.
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Daftar Authors</h3>
          <AuthorTable items={authorsList} error={error?.message} />
        </section>

        <section>
          <AuthorCreateForm />
        </section>
      </div>
    </div>
  );
}

