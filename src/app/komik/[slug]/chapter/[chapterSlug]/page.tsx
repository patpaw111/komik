import { notFound } from "next/navigation";
import { ChapterReader } from "@/components/komik/ChapterReader";
import { supabaseRead } from "@/lib/supabase/read";

type PageProps = {
  params: Promise<{ slug: string; chapterSlug: string }>;
};

async function getChapterData(slug: string, chapterSlug: string) {
  try {
    // Get series by slug
    const { data: seriesData, error: seriesError } = await supabaseRead
      .from("series")
      .select(
        `
        id,
        title,
        slug,
        cover_image_url,
        series_authors(authors(id, name), role),
        series_genres(genres(id, name))
        `
      )
      .eq("slug", slug)
      .single();

    if (seriesError || !seriesData) {
      return null;
    }

    const series_authors = Array.isArray(seriesData.series_authors)
      ? (seriesData.series_authors
          .map((a: any) => {
            const av = Array.isArray(a.authors) ? a.authors[0] ?? null : a.authors ?? null;
            return av
              ? {
                  authors: { id: String(av.id ?? ""), name: String(av.name ?? "") },
                  role: String(a.role ?? ""),
                }
              : null;
          })
          .filter(Boolean) as Array<{ authors: { id: string; name: string }; role: string }>)
      : [];

    const series_genres = Array.isArray(seriesData.series_genres)
      ? (seriesData.series_genres
          .map((g: any) => {
            const gv = Array.isArray(g.genres) ? g.genres[0] ?? null : g.genres ?? null;
            return gv ? { genres: { id: String(gv.id ?? ""), name: String(gv.name ?? "") } } : null;
          })
          .filter(Boolean) as Array<{ genres: { id: string; name: string } }>)
      : [];

    const series = {
      id: String(seriesData.id ?? ""),
      title: String(seriesData.title ?? ""),
      slug: String(seriesData.slug ?? ""),
      cover_image_url: seriesData.cover_image_url ?? null,
      series_authors,
      series_genres,
    };

    // Get all chapters for this series
    const { data: chaptersData, error: chaptersError } = await supabaseRead
      .from("chapters")
      .select("id, chapter_number, title, slug, index")
      .eq("series_id", series.id)
      .order("index", { ascending: false })
      .limit(1000);

    if (chaptersError) {
      console.error("[chapter reader] supabase chapters error", chaptersError);
      return null;
    }

    const chapters = (Array.isArray(chaptersData) ? chaptersData : []).map((ch: any) => ({
      id: String(ch.id ?? ""),
      chapter_number: String(ch.chapter_number ?? ""),
      title: ch.title ?? null,
      slug: String(ch.slug ?? ""),
      index: Number(ch.index ?? 0),
      series_id: series.id,
    }));
    
    // Find current chapter by slug or id
    const currentChapter = chapters.find(
      (ch: any) => ch.slug === chapterSlug || ch.id === chapterSlug
    );

    if (!currentChapter) {
      return null;
    }

    // Get chapter images
    const { data: imagesData, error: imagesError } = await supabaseRead
      .from("chapter_images")
      .select("*")
      .eq("chapter_id", currentChapter.id)
      .order("page_number", { ascending: true });

    if (imagesError) {
      console.error("[chapter reader] supabase images error", imagesError);
      return null;
    }

    const images = (imagesData ?? []).map((img: any) => ({
      ...img,
      page_number: Number(img.page_number ?? 0),
    }));

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
      images,
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

