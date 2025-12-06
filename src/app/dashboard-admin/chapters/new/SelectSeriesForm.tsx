"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SeriesOption = {
  id: string;
  title: string;
  slug: string;
};

export function SelectSeriesForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const seriesId = searchParams.get("series_id");

  const [series, setSeries] = useState<SeriesOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (seriesId) {
      setLoading(false);
      return;
    }

    const loadSeries = async () => {
      try {
        const res = await fetch("/api/series?limit=1000");
        const json = await res.json();

        if (json.success) {
          setSeries(
            (json.data ?? []).map((s: any) => ({
              id: s.id,
              title: s.title,
              slug: s.slug,
            }))
          );
        }
      } catch (err) {
        console.error("[SelectSeriesForm] load error", err);
      } finally {
        setLoading(false);
      }
    };

    loadSeries();
  }, [seriesId]);

  const filteredSeries = series.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectSeries = (selectedSeriesId: string) => {
    router.push(`/dashboard-admin/chapters/new?series_id=${selectedSeriesId}`);
  };

  if (seriesId) {
    return null; // Hide form jika series sudah dipilih
  }

  return (
    <>
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Tambah Chapter Baru</h2>
        <p className="text-sm text-muted-foreground">
          Pilih series terlebih dahulu untuk menambahkan chapter baru.
        </p>
      </header>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari series..."
            className="w-full rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat data series...</p>
        ) : filteredSeries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {search ? "Tidak ada series yang cocok." : "Belum ada series."}
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredSeries.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSeries(s.id)}
                className="rounded border border-border bg-card p-3 text-left transition-colors hover:bg-muted hover:border-primary"
              >
                <p className="font-medium text-sm text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.slug}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

