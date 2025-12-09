import Footer from "@/components/home/Footer";
import HighlightScroller, {
  type HighlightChapter,
} from "@/components/home/HighlightScroller";
import Navbar from "@/components/home/Navbar";
import UpdatedGrid from "@/components/home/UpdatedGrid";
import { updatedComics } from "@/data/home";

type ChapterApiResponse = {
  success: boolean;
  data: Array<{
    id: string;
    chapter_number: string;
    title: string | null;
    published_at?: string;
    created_at?: string;
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
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window === "undefined" ? "http://localhost:3000" : window.location.origin);

  let apiUrl: string;
  try {
    apiUrl = new URL("/api/chapters?limit=10&page=1", baseUrl).toString();
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

  return list.map((item, idx) => ({
    id: item.id,
    title: item.series?.title ?? "Tanpa judul",
    chapterLabel: `Chapter ${item.chapter_number}`,
    cover: item.series?.cover_image_url || placeholders[idx % placeholders.length],
    tagline: item.title ?? item.series?.slug ?? "",
    updatedAtText: formatRelative(item.published_at ?? item.created_at ?? null),
  }));
}

export default async function Home() {
  const highlights = await getLatestChapters();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <HighlightScroller items={highlights} />
        <UpdatedGrid items={updatedComics} />
      </main>
      <Footer />
    </div>
  );
}
