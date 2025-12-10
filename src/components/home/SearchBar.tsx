"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  cover_image_url?: string | null;
  latestChapter?: {
    chapter_number: string;
    published_at?: string;
    created_at?: string;
  } | null;
};

type SeriesWithChapter = {
  id: string;
  title: string;
  slug: string;
  cover_image_url?: string | null;
  latest_chapter?: {
    chapter_number: string;
    published_at?: string;
    created_at?: string;
  } | null;
};

const placeholders = [
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=640&q=80",
];

function formatRelative(dateString?: string | null) {
  if (!dateString) return "baru";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "baru";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  const weeks = Math.floor(days / 7);
  return `${weeks} minggu lalu`;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        // Ambil series dan chapters terbaru
        const [seriesRes, chaptersRes] = await Promise.all([
          fetch(`/api/series?limit=100&page=1`),
          fetch(`/api/chapters?limit=200&page=1`),
        ]);

        const seriesJson = await seriesRes.json();
        const chaptersJson = await chaptersRes.json();

        if (seriesJson.success && Array.isArray(seriesJson.data)) {
          const searchLower = query.toLowerCase().trim();
          const filtered = seriesJson.data
            .filter((item: any) => {
              const title = (item.title || "").toLowerCase();
              const altTitle = (item.alternative_title || "").toLowerCase();
              const slug = (item.slug || "").toLowerCase();
              return (
                title.includes(searchLower) ||
                altTitle.includes(searchLower) ||
                slug.includes(searchLower)
              );
            })
            .slice(0, 10);

          // Cari chapter terbaru untuk setiap series
          const resultsWithChapters: SearchResult[] = filtered.map(
            (item: any) => {
              // Cari chapter terbaru untuk series ini
              let latestChapter: SearchResult["latestChapter"] = null;
              if (
                chaptersJson.success &&
                Array.isArray(chaptersJson.data)
              ) {
                const seriesChapters = chaptersJson.data
                  .filter((ch: any) => ch.series_id === item.id)
                  .sort((a: any, b: any) => {
                    const timeA = new Date(
                      a.published_at ?? a.created_at ?? 0
                    ).getTime();
                    const timeB = new Date(
                      b.published_at ?? b.created_at ?? 0
                    ).getTime();
                    return timeB - timeA;
                  });

                if (seriesChapters.length > 0) {
                  const latest = seriesChapters[0];
                  latestChapter = {
                    chapter_number: latest.chapter_number,
                    published_at: latest.published_at,
                    created_at: latest.created_at,
                  };
                }
              }

              return {
                id: item.id,
                title: item.title,
                slug: item.slug,
                cover_image_url: item.cover_image_url,
                latestChapter,
              };
            }
          );

          setResults(resultsWithChapters);
          setShowResults(resultsWithChapters.length > 0);
        }
      } catch (err) {
        console.error("[SearchBar] search error", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          placeholder="Cari komik..."
          className="w-full rounded-full border border-border bg-card px-4 py-2 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m16.5 16.5 5 5" />
        </svg>
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          <div className="p-2">
            {results.map((item, idx) => (
              <Link
                key={item.id}
                href={`/komik/${item.slug}`}
                onClick={() => {
                  setQuery("");
                  setShowResults(false);
                }}
                className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
              >
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded border border-border">
                  <Image
                    src={item.cover_image_url || placeholders[idx % placeholders.length]}
                    alt={item.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  {item.latestChapter && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary">
                        Chapter {item.latestChapter.chapter_number}
                      </span>
                      <span>
                        {formatRelative(
                          item.latestChapter.published_at ??
                            item.latestChapter.created_at
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

