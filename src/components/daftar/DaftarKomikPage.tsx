"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type SeriesItem = {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  status: string;
  series_genres: Array<{ genres: { id: string; name: string } }>;
  formats?: { id: string; name: string } | null;
};

type ApiResponse = {
  success: boolean;
  data: SeriesItem[];
  meta?: { total: number; page: number; limit: number };
};

const PAGE_SIZE = 20;

export default function DaftarKomikPage() {
  const [data, setData] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [formatFilters, setFormatFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [filterLogic, setFilterLogic] = useState<"AND" | "OR">("AND");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/series?limit=200&page=1", { cache: "no-store" });
        const json = (await res.json()) as ApiResponse;
        if (json.success && Array.isArray(json.data)) {
          setData(json.data);
        }
      } catch (err) {
        console.error("[DaftarKomik] load error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const genres = useMemo(() => {
    const set = new Set<string>();
    data.forEach((s) =>
      s.series_genres?.forEach((g) => g.genres?.name && set.add(g.genres.name))
    );
    return Array.from(set).sort();
  }, [data]);

  const formats = useMemo(() => {
    const set = new Set<string>();
    data.forEach((s) => s.formats?.name && set.add(s.formats.name));
    return Array.from(set).sort();
  }, [data]);

  const statuses = ["Ongoing", "Completed", "Hiatus", "Cancelled"];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const matchList = (selected: string[], values: string[]) => {
      if (selected.length === 0) return true;
      if (filterLogic === "AND") {
        return selected.every((s) => values.includes(s));
      }
      // OR
      return selected.some((s) => values.includes(s));
    };

    return data.filter((s) => {
      if (q && !s.title.toLowerCase().includes(q) && !s.slug.toLowerCase().includes(q)) {
        return false;
      }
      const names = s.series_genres?.map((g) => g.genres?.name) ?? [];
      if (!matchList(genreFilters, names)) return false;

      const formatVals = s.formats?.name ? [s.formats.name] : [];
      if (!matchList(formatFilters, formatVals)) return false;

      const statusVals = s.status ? [s.status.toLowerCase()] : [];
      const selectedStatus = statusFilters.map((x) => x.toLowerCase());
      if (!matchList(selectedStatus, statusVals)) return false;

      return true;
    });
  }, [data, search, genreFilters, formatFilters, statusFilters, filterLogic]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setGenreFilters([]);
    setFormatFilters([]);
    setStatusFilters([]);
    setFilterLogic("AND");
  };

  const FilterSidebar = (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-20 rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold">Filter</h3>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Logic:</span>
          <div className="flex rounded-full border border-border overflow-hidden">
            <button
              onClick={() => setFilterLogic("AND")}
              className={`px-3 py-1 ${filterLogic === "AND" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              AND
            </button>
            <button
              onClick={() => setFilterLogic("OR")}
              className={`px-3 py-1 ${filterLogic === "OR" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              OR
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Genre</p>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => {
              const active = genreFilters.includes(g);
              return (
                <button
                  key={g}
                  onClick={() =>
                    setGenreFilters((prev) =>
                      active ? prev.filter((x) => x !== g) : [...prev, g]
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Format</p>
          <div className="flex flex-wrap gap-2">
            {formats.map((f) => {
              const active = formatFilters.includes(f);
              return (
                <button
                  key={f}
                  onClick={() =>
                    setFormatFilters((prev) =>
                      active ? prev.filter((x) => x !== f) : [...prev, f]
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => {
              const active = statusFilters.includes(s);
              return (
                <button
                  key={s}
                  onClick={() =>
                    setStatusFilters((prev) =>
                      active ? prev.filter((x) => x !== s) : [...prev, s]
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={resetFilters}
          className="w-full rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted"
        >
          Reset Filter
        </button>
      </div>
    </aside>
  );

  const MobileFilterModal = showMobileFilter && (
    <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
      <div className="w-full rounded-t-2xl border border-border bg-card p-4 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Filter</h3>
          <button
            onClick={() => setShowMobileFilter(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Logic:</span>
          <div className="flex rounded-full border border-border overflow-hidden">
            <button
              onClick={() => setFilterLogic("AND")}
              className={`px-3 py-1 ${filterLogic === "AND" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              AND
            </button>
            <button
              onClick={() => setFilterLogic("OR")}
              className={`px-3 py-1 ${filterLogic === "OR" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              OR
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Genre</p>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => {
              const active = genreFilters.includes(g);
              return (
                <button
                  key={g}
                  onClick={() =>
                    setGenreFilters((prev) =>
                      active ? prev.filter((x) => x !== g) : [...prev, g]
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {g}
                </button>
              );
            })}
          </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Format</p>
            <div className="flex flex-wrap gap-2">
            {formats.map((f) => {
              const active = formatFilters.includes(f);
              return (
                <button
                  key={f}
                  onClick={() =>
                    setFormatFilters((prev) =>
                      active ? prev.filter((x) => x !== f) : [...prev, f]
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {f}
                </button>
              );
            })}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
            {statuses.map((s) => {
              const active = statusFilters.includes(s);
              return (
                <button
                  key={s}
                  onClick={() =>
                    setStatusFilters((prev) =>
                      active ? prev.filter((x) => x !== s) : [...prev, s]
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {s}
                </button>
              );
            })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              resetFilters();
              setShowMobileFilter(false);
            }}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Reset
          </button>
          <button
            onClick={() => setShowMobileFilter(false)}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-16 pt-6 md:px-6">
      {/* Header & Search */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Daftar Komik</h1>
          <p className="text-sm text-muted-foreground">
            Jelajahi komik dan filter berdasarkan genre, format, atau status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari judul atau slug..."
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <button
            onClick={() => setShowMobileFilter(true)}
            className="lg:hidden rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Filter
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {FilterSidebar}

        <section className="flex-1">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat komik...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada komik yang cocok.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-fr">
                {pageItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/komik/${item.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-3/4 overflow-hidden shrink-0">
                      <Image
                        src={item.cover_image_url || "/placeholder-cover.jpg"}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        className="object-cover transition duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute left-2 right-2 top-2 flex items-center gap-2 text-[10px] font-semibold text-white">
                        <span className="rounded-full bg-black/60 px-2 py-0.5">
                          {item.formats?.name || "Series"}
                        </span>
                        <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground">
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-3 min-h-[100px]">
                      <h3 className="line-clamp-2 text-sm font-semibold text-foreground min-h-[2.5rem]">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                        {item.series_genres?.slice(0, 3).map((g, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-muted px-2 py-0.5 text-foreground"
                          >
                            {g.genres?.name}
                          </span>
                        ))}
                        {item.series_genres?.length > 3 && (
                          <span className="text-[11px]">+{item.series_genres.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`rounded-lg border px-3 py-1 text-sm ${
                          page === pageNum
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {MobileFilterModal}
    </div>
  );
}

