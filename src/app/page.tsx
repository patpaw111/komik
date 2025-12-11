import BottomNavbar from "@/components/home/BottomNavbar";
import Footer from "@/components/home/Footer";
import HighlightScroller, {
  type HighlightChapter,
} from "@/components/home/HighlightScroller";
import Navbar from "@/components/home/Navbar";
import UpdatedGrid from "@/components/home/UpdatedGrid";
import type { ComicUpdate } from "@/data/home";

type ChapterApiResponse = {
  success: boolean;
  data: Array<{
    id: string;
    chapter_number: string;
    title: string | null;
    published_at?: string;
    created_at?: string;
    index: number;
    series?: {
      id: string;
      title: string;
      slug: string;
      cover_image_url?: string | null;
    } | null;
  }>;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

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
  const weeks = Math.floor(days / 7);
  return `${weeks} minggu lalu`;
}

const placeholders = [
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=640&q=80",
];

async function getLatestChapters(): Promise<HighlightChapter[]> {
  const baseUrl = getBaseUrl();

  // Ambil lebih banyak chapter (100) untuk memastikan kita punya cukup data
  // setelah filtering per series
  let apiUrl: string;
  try {
    apiUrl = new URL("/api/chapters?limit=100&page=1", baseUrl).toString();
  } catch (err) {
    console.error("[home] invalid base URL", baseUrl, err);
    return [];
  }

  let res: Response;
  try {
    res = await fetch(apiUrl, { cache: "no-store" });
  } catch (err) {
    console.error("[home] gagal fetch chapters terbaru", err);
    return [];
  }

  if (!res.ok) {
    console.error("[home] gagal ambil chapters terbaru", res.statusText);
    return [];
  }

  const json = (await res.json()) as ChapterApiResponse;
  const list = Array.isArray(json.data) ? json.data : [];

  // Group by series_id dan ambil hanya chapter terbaru per series
  const seriesMap = new Map<string, typeof list[0]>();
  
  for (const item of list) {
    const seriesId = item.series?.id;
    if (!seriesId) continue;

    const existing = seriesMap.get(seriesId);
    if (!existing) {
      seriesMap.set(seriesId, item);
      continue;
    }

    // Bandingkan waktu: ambil yang lebih terbaru
    const itemTime = new Date(item.published_at ?? item.created_at ?? 0).getTime();
    const existingTime = new Date(existing.published_at ?? existing.created_at ?? 0).getTime();
    
    if (itemTime > existingTime) {
      seriesMap.set(seriesId, item);
    }
  }

  // Convert map ke array dan sort berdasarkan waktu terbaru
  const uniqueChapters = Array.from(seriesMap.values())
    .sort((a, b) => {
      const timeA = new Date(a.published_at ?? a.created_at ?? 0).getTime();
      const timeB = new Date(b.published_at ?? b.created_at ?? 0).getTime();
      return timeB - timeA; // Descending (terbaru dulu)
    })
    .slice(0, 10); // Ambil 10 teratas

  return uniqueChapters.map((item, idx) => ({
    id: item.id,
    title: item.series?.title ?? "Tanpa judul",
    chapterLabel: `Chapter ${item.chapter_number}`,
    cover: item.series?.cover_image_url || placeholders[idx % placeholders.length],
    tagline: item.title ?? item.series?.slug ?? "",
    updatedAtText: formatRelative(item.published_at ?? item.created_at ?? null),
    slug: item.series?.slug,
  }));
}

async function getUpdatedComics(): Promise<ComicUpdate[]> {
  const baseUrl = getBaseUrl();

  // Ambil banyak chapter untuk mendapatkan latest dan previous chapter per series
  let apiUrl: string;
  try {
    apiUrl = new URL("/api/chapters?limit=200&page=1", baseUrl).toString();
  } catch (err) {
    console.error("[home] invalid base URL", baseUrl, err);
    return [];
  }

  let res: Response;
  try {
    res = await fetch(apiUrl, { cache: "no-store" });
  } catch (err) {
    console.error("[home] gagal fetch chapters untuk updated comics", err);
    return [];
  }

  if (!res.ok) {
    console.error("[home] gagal ambil chapters untuk updated comics", res.statusText);
    return [];
  }

  const json = (await res.json()) as ChapterApiResponse;
  const list = Array.isArray(json.data) ? json.data : [];

  // Group by series_id dan ambil 2 chapter terbaru per series (latest dan previous)
  const seriesMap = new Map<
    string,
    {
      latest: typeof list[0];
      previous?: typeof list[0];
    }
  >();

  for (const item of list) {
    const seriesId = item.series?.id;
    if (!seriesId) continue;

    const existing = seriesMap.get(seriesId);
    if (!existing) {
      seriesMap.set(seriesId, { latest: item });
      continue;
    }

    // Bandingkan index: ambil yang lebih tinggi sebagai latest
    const itemIndex = item.index ?? 0;
    const existingIndex = existing.latest.index ?? 0;

    if (itemIndex > existingIndex) {
      // Item baru lebih tinggi, jadi ini menjadi latest, dan yang lama jadi previous
      seriesMap.set(seriesId, {
        latest: item,
        previous: existing.latest,
      });
    } else if (!existing.previous || itemIndex > (existing.previous.index ?? 0)) {
      // Item ini bisa jadi previous jika lebih tinggi dari previous yang ada
      seriesMap.set(seriesId, {
        latest: existing.latest,
        previous: item,
      });
    }
  }

  // Convert map ke array, sort berdasarkan waktu latest chapter terbaru, dan ambil 12 teratas
  const updatedComics = Array.from(seriesMap.entries())
    .map(([seriesId, { latest, previous }]) => {
      const latestTime = new Date(latest.published_at ?? latest.created_at ?? 0).getTime();
      return {
        seriesId,
        latest,
        previous,
        latestTime,
      };
    })
    .sort((a, b) => b.latestTime - a.latestTime) // Descending (terbaru dulu)
    .slice(0, 12); // Ambil 12 teratas

  return updatedComics.map(({ latest, previous }, idx) => {
    const series = latest.series;
    return {
      id: series?.id ?? latest.id,
      title: series?.title ?? "Tanpa judul",
      cover: series?.cover_image_url || placeholders[idx % placeholders.length],
      slug: series?.slug ?? "",
      latestChapter: `Chapter ${latest.chapter_number}`,
      releaseAgo: formatRelative(latest.published_at ?? latest.created_at ?? null),
      previousChapter: previous ? `Chapter ${previous.chapter_number}` : undefined,
      previousAgo: previous
        ? formatRelative(previous.published_at ?? previous.created_at ?? null)
        : undefined,
    };
  });
}

export default async function Home() {
  const highlights = await getLatestChapters();
  const updatedComics = await getUpdatedComics();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <HighlightScroller items={highlights} />
        <UpdatedGrid items={updatedComics} />
      </main>
      <Footer />
      <BottomNavbar />
    </div>
  );
}
