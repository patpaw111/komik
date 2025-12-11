import { notFound } from "next/navigation";
import { ChapterReader } from "@/components/komik/ChapterReader";

type PageProps = {
  params: Promise<{ slug: string; chapterSlug: string }>;
};

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function getChapterData(slug: string, chapterSlug: string) {
  const baseUrl = getBaseUrl();

  try {
    // Get series by slug
    const seriesRes = await fetch(`${baseUrl}/api/series/slug/${slug}`, {
      cache: "no-store",
    });

    if (!seriesRes.ok) {
      return null;
    }

    const seriesJson = await seriesRes.json();
    if (!seriesJson.success) {
      return null;
    }

    const series = seriesJson.data;

    // Get all chapters for this series
    const chaptersRes = await fetch(
      `${baseUrl}/api/chapters?series_id=${series.id}&limit=1000`,
      { cache: "no-store" }
    );

    if (!chaptersRes.ok) {
      return null;
    }

    const chaptersJson = await chaptersRes.json();
    if (!chaptersJson.success) {
      return null;
    }

    const chapters = chaptersJson.data || [];
    
    // Find current chapter by slug or id
    const currentChapter = chapters.find(
      (ch: any) => ch.slug === chapterSlug || ch.id === chapterSlug
    );

    if (!currentChapter) {
      return null;
    }

    // Get chapter images
    const imagesRes = await fetch(
      `${baseUrl}/api/chapters/${currentChapter.id}/images`,
      { cache: "no-store" }
    );

    if (!imagesRes.ok) {
      return null;
    }

    const imagesJson = await imagesRes.json();
    const images = imagesJson.success ? imagesJson.data || [] : [];

    // Sort chapters by index
    const sortedChapters = chapters.sort((a: any, b: any) => b.index - a.index);
    const currentIndex = sortedChapters.findIndex(
      (ch: any) => ch.id === currentChapter.id
    );

    const prevChapter =
      currentIndex < sortedChapters.length - 1
        ? sortedChapters[currentIndex + 1]
        : null;
    const nextChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;

    return {
      series,
      chapter: currentChapter,
      images: images.sort((a: any, b: any) => a.page_number - b.page_number),
      chapters: sortedChapters,
      prevChapter,
      nextChapter,
    };
  } catch (err) {
    console.error("[chapter reader] error", err);
    return null;
  }
}

export default async function ChapterReaderPage({ params }: PageProps) {
  const { slug, chapterSlug } = await params;

  const data = await getChapterData(slug, chapterSlug);

  if (!data) {
    notFound();
  }

  return <ChapterReader data={data} />;
}

