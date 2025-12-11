"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

type ChapterData = {
  id: string;
  chapter_number: string;
  title: string | null;
  slug: string;
  published_at: string | null;
  created_at: string;
  view_count: number;
};

type ChapterSearchProps = {
  chapters: ChapterData[];
  seriesSlug: string;
  seriesTitle: string;
  seriesCover: string | null;
  placeholderCover: string;
};

function formatRelative(dateString?: string | null) {
  if (!dateString) return "baru";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "baru";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bln lalu`;
  return `${Math.floor(months / 12)} tahun lalu`;
}

export function ChapterSearch({
  chapters,
  seriesSlug,
  seriesTitle,
  seriesCover,
  placeholderCover,
}: ChapterSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) {
      return chapters;
    }

    const query = searchQuery.trim().toLowerCase();
    return chapters.filter((chapter) => {
      const chapterNum = chapter.chapter_number.toLowerCase();
      const chapterTitle = (chapter.title || "").toLowerCase();
      return chapterNum.includes(query) || chapterTitle.includes(query);
    });
  }, [chapters, searchQuery]);

  return (
    <>
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari Chapter, Contoh: 69 atau 76"
          className="w-full rounded-lg border border-border bg-input px-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg leading-none w-6 h-6 flex items-center justify-center"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Chapters Grid */}
      {filteredChapters.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Tidak ada chapter yang ditemukan untuk &quot;{searchQuery}&quot;
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChapters.map((chapter, idx) => {
            const isRecent = idx < 3;
            const chapterTime = chapter.published_at || chapter.created_at;
            return (
              <Link
                key={chapter.id}
                href={`/komik/${seriesSlug}/chapter/${chapter.slug || chapter.id}`}
                className="group flex gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted transition"
              >
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded border border-border">
                  <Image
                    src={seriesCover || placeholderCover}
                    alt={`${seriesTitle} Chapter ${chapter.chapter_number}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                  {isRecent && (
                    <div className="absolute top-1 right-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      UP
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-semibold line-clamp-2">
                      Chapter {chapter.chapter_number}
                      {chapter.title && ` ${chapter.title}`}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(chapterTime)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

