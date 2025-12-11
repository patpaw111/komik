import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Navbar";
import { ChapterSearch } from "@/components/komik/ChapterSearch";

type SeriesData = {
  id: string;
  title: string;
  alternative_title: string | null;
  slug: string;
  description: string | null;
  status: string;
  cover_image_url: string | null;
  view_count: number;
  rating: number;
  formats: { id: string; name: string } | null;
  series_genres: Array<{ genres: { id: string; name: string } }>;
  series_authors: Array<{ authors: { id: string; name: string }; role: string }>;
};

type ChapterData = {
  id: string;
  chapter_number: string;
  title: string | null;
  slug: string;
  published_at: string | null;
  created_at: string;
  view_count: number;
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
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

async function getSeries(slug: string): Promise<SeriesData | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window === "undefined" ? "http://localhost:3000" : window.location.origin);

  try {
    const res = await fetch(`${baseUrl}/api/series/slug/${slug}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    if (!json.success) {
      return null;
    }

    return json.data as SeriesData;
  } catch (err) {
    console.error("[series detail] error fetching series", err);
    return null;
  }
}

async function getChapters(seriesId: string, page: number = 1) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window === "undefined" ? "http://localhost:3000" : window.location.origin);

  const limit = 30;
  try {
    const res = await fetch(
      `${baseUrl}/api/chapters?series_id=${seriesId}&page=${page}&limit=${limit}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return { data: [], total: 0, totalPages: 0 };
    }

    const json = await res.json();
    if (!json.success) {
      return { data: [], total: 0, totalPages: 0 };
    }

    const chapters = (json.data ?? []) as ChapterData[];
    const total = json.meta?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    return { data: chapters, total, totalPages };
  } catch (err) {
    console.error("[series detail] error fetching chapters", err);
    return { data: [], total: 0, totalPages: 0 };
  }
}

export default async function SeriesDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? "1") || 1;

  const series = await getSeries(slug);
  if (!series) {
    notFound();
  }

  const { data: chapters, totalPages } = await getChapters(series.id, page);

  const storyAuthors = series.series_authors
    .filter((sa) => sa.role === "Story")
    .map((sa) => sa.authors.name);
  const artAuthors = series.series_authors
    .filter((sa) => sa.role === "Art")
    .map((sa) => sa.authors.name);
  const genres = series.series_genres.map((sg) => sg.genres.name);

  const placeholderCover =
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=640&q=80";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 py-3 md:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <span>←</span>
            <span>Kembali</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
            aria-label="Home"
          >
            ⌂
          </Link>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          {/* Series Info Section */}
          <div className="mb-8 grid gap-6 md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr]">
            {/* Cover Image */}
            <div className="relative aspect-3/4 overflow-hidden rounded-lg border border-border">
              <Image
                src={series.cover_image_url || placeholderCover}
                alt={series.title}
                fill
                sizes="(max-width: 768px) 200px, 240px"
                className="object-cover"
                priority
              />
            </div>

            {/* Series Details */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold md:text-3xl lg:text-4xl mb-2">
                  {series.title}
                </h1>
                {series.alternative_title && (
                  <p className="text-sm text-muted-foreground">
                    {series.alternative_title}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/komik/${series.slug}/chapter/${chapters[0]?.slug || chapters[0]?.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
                >
                  <span>►</span>
                  <span>Baca</span>
                </Link>
                <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition">
                  <span>🔖</span>
                  <span>Bookmark</span>
                </button>
                <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition">
                  <span>📋</span>
                  <span>Tambah ke Readlist</span>
                </button>
              </div>

              {/* Statistics */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <span>⭐</span>
                  <span className="font-semibold">{series.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🔖</span>
                  <span className="font-semibold">
                    {Math.floor(series.view_count / 1000)}k
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>👁️</span>
                  <span className="font-semibold">
                    {series.view_count >= 1000000
                      ? `${(series.view_count / 1000000).toFixed(1)}m`
                      : series.view_count >= 1000
                      ? `${(series.view_count / 1000).toFixed(1)}k`
                      : series.view_count}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-primary">📚</span>
                  <span className="font-semibold">{chapters.length}</span>
                </div>
              </div>

              {/* Description */}
              {series.description && (
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
                    {series.description}
                  </p>
                  <button className="text-sm text-primary hover:underline">
                    Read More
                  </button>
                </div>
              )}

              {/* Metadata */}
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                {genres.length > 0 && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Genre: </span>
                    <span className="text-foreground">
                      {genres.join(", ")}
                    </span>
                  </div>
                )}
                {series.formats && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Format: </span>
                    <span className="text-foreground">{series.formats.name}</span>
                  </div>
                )}
                {storyAuthors.length > 0 && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Author: </span>
                    <span className="text-foreground">{storyAuthors.join(", ")}</span>
                  </div>
                )}
                {artAuthors.length > 0 && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Artist: </span>
                    <span className="text-foreground">{artAuthors.join(", ")}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-muted-foreground">Status: </span>
                  <span className="text-foreground">{series.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chapters Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span>📑</span>
                <span>Chapters</span>
              </h2>
            </div>

            <ChapterSearch
              chapters={chapters}
              seriesSlug={series.slug}
              seriesTitle={series.title}
              seriesCover={series.cover_image_url}
              placeholderCover={placeholderCover}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Link
                  href={`/komik/${slug}?page=${Math.max(1, page - 1)}`}
                  className={`rounded-lg border border-border px-3 py-2 text-sm ${
                    page <= 1
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-muted"
                  }`}
                >
                  &lt;
                </Link>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Link
                      key={pageNum}
                      href={`/komik/${slug}?page=${pageNum}`}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        page === pageNum
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
                <Link
                  href={`/komik/${slug}?page=${Math.min(totalPages, page + 1)}`}
                  className={`rounded-lg border border-border px-3 py-2 text-sm ${
                    page >= totalPages
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-muted"
                  }`}
                >
                  &gt;
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

