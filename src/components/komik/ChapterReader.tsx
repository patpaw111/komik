"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChapterSelectModal } from "./ChapterSelectModal";

type ChapterImage = {
  id: string;
  image_url: string;
  page_number: number;
};

type Chapter = {
  id: string;
  chapter_number: string;
  title: string | null;
  slug: string;
  series_id: string;
};

type Series = {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  series_authors: Array<{ authors: { id: string; name: string }; role: string }>;
  series_genres: Array<{ genres: { id: string; name: string } }>;
};

type ChapterReaderData = {
  series: Series;
  chapter: Chapter;
  images: ChapterImage[];
  chapters: Chapter[];
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
};

type ChapterReaderProps = {
  data: ChapterReaderData;
};

export function ChapterReader({ data }: ChapterReaderProps) {
  const { series, chapter, images, chapters, prevChapter, nextChapter } = data;
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  };

  const breadcrumbText = `${series.title} > Chapter ${chapter.chapter_number}`;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 py-3 md:px-6">
        <Link
          href={`/komik/${series.slug}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <span>←</span>
          <span className="hidden sm:inline">Kembali</span>
        </Link>

        <div className="flex-1 px-4 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-full">
            {breadcrumbText}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
            aria-label="Home"
          >
            ⌂
          </Link>
          <button
            onClick={() => setShowChapterModal(true)}
            className="text-muted-foreground hover:text-foreground transition"
            aria-label="Chapter menu"
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
                d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {/* Chapter Images */}
        <div className="mx-auto max-w-4xl px-4 py-6 pb-32 lg:pb-6">
          {images.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Belum ada gambar untuk chapter ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {images.map((image) => (
                <div key={image.id} className="relative w-full">
                  <Image
                    src={image.image_url}
                    alt={`Page ${image.page_number}`}
                    width={1200}
                    height={1600}
                    className="w-full h-auto object-contain"
                    priority={image.page_number <= 3}
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}

          {/* Chapter Navigation Buttons */}
          <div className="mt-8 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center border-t border-border pt-6">
            {prevChapter ? (
              <Link
                href={`/komik/${series.slug}/chapter/${prevChapter.slug || prevChapter.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-4 hover:bg-muted active:bg-muted transition w-full sm:w-auto sm:min-w-[200px] justify-start"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6 shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs text-muted-foreground mb-0.5">Previous Chapter</span>
                  <span className="text-sm font-semibold truncate">
                    Chapter {prevChapter.chapter_number}
                    {prevChapter.title && ` - ${prevChapter.title}`}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="w-full sm:w-auto sm:min-w-[200px]" />
            )}

            {nextChapter ? (
              <Link
                href={`/komik/${series.slug}/chapter/${nextChapter.slug || nextChapter.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-4 hover:bg-muted active:bg-muted transition w-full sm:w-auto sm:min-w-[200px] justify-start sm:justify-end sm:flex-row-reverse"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6 shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
                <div className="flex flex-col sm:items-end min-w-0 flex-1">
                  <span className="text-xs text-muted-foreground mb-0.5">Next Chapter</span>
                  <span className="text-sm font-semibold truncate text-left sm:text-right">
                    Chapter {nextChapter.chapter_number}
                    {nextChapter.title && ` - ${nextChapter.title}`}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="w-full sm:w-auto sm:min-w-[200px]" />
            )}
          </div>
        </div>
      </main>

      {/* Scroll Buttons - Desktop Only */}
      <div className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 z-40 flex-col gap-2">
        <button
          onClick={scrollToTop}
          className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-background transition-all hover:scale-110 flex items-center justify-center"
          aria-label="Scroll to top"
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
              d="M4.5 15.75l7.5-7.5 7.5 7.5"
            />
          </svg>
        </button>
        <button
          onClick={scrollToBottom}
          className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-background transition-all hover:scale-110 flex items-center justify-center"
          aria-label="Scroll to bottom"
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
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>
      </div>

      {/* Scroll Buttons - Mobile Only */}
      <div className="lg:hidden fixed right-4 bottom-20 z-40 flex-col gap-2">
        <button
          onClick={scrollToTop}
          className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg active:bg-background transition-all active:scale-95 flex items-center justify-center mb-2"
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 15.75l7.5-7.5 7.5 7.5"
            />
          </svg>
        </button>
        <button
          onClick={scrollToBottom}
          className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg active:bg-background transition-all active:scale-95 flex items-center justify-center"
          aria-label="Scroll to bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-around px-4 py-3">
          {prevChapter ? (
            <Link
              href={`/komik/${series.slug}/chapter/${prevChapter.slug || prevChapter.id}`}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-card border border-border hover:bg-muted transition"
              aria-label="Previous chapter"
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
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </Link>
          ) : (
            <div className="w-12 h-12" />
          )}

          <button
            onClick={() => setShowChapterModal(true)}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-card border border-border hover:bg-muted transition"
            aria-label="Chapter menu"
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
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>

          <Link
            href="/"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-card border border-border hover:bg-muted transition"
            aria-label="Home"
          >
            <span className="text-sm font-medium">⌂</span>
          </Link>
        </div>
      </div>

      {/* Chapter Select Modal */}
      {showChapterModal && (
        <ChapterSelectModal
          series={series}
          chapters={chapters}
          currentChapter={chapter}
          onClose={() => setShowChapterModal(false)}
        />
      )}
    </div>
  );
}

