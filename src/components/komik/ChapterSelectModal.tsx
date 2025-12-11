"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

type Chapter = {
  id: string;
  chapter_number: string;
  title: string | null;
  slug: string;
};

type Series = {
  id: string;
  title: string;
  slug: string;
};

type ChapterSelectModalProps = {
  series: Series;
  chapters: Chapter[];
  currentChapter: Chapter;
  onClose: () => void;
};

export function ChapterSelectModal({
  series,
  chapters,
  currentChapter,
  onClose,
}: ChapterSelectModalProps) {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">Search Chapter</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-border px-4 py-3">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-lg border border-border bg-input pl-10 pr-10 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Chapter List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filteredChapters.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Tidak ada chapter yang ditemukan
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredChapters.map((chapter) => {
                const isCurrent = chapter.id === currentChapter.id;
                return (
                  <Link
                    key={chapter.id}
                    href={`/komik/${series.slug}/chapter/${chapter.slug || chapter.id}`}
                    onClick={onClose}
                    className={`block px-4 py-3 text-sm transition hover:bg-muted ${
                      isCurrent
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        Chapter {chapter.chapter_number}
                        {chapter.title && ` - ${chapter.title}`}
                      </span>
                      {isCurrent && (
                        <span className="text-xs text-primary">Current</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

