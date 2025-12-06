import { supabaseAdmin } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChapterEditForm } from "../ChapterEditForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditChapterPage({ params }: PageProps) {
  const { id } = await params;

  const { data: chapter, error } = await supabaseAdmin
    .from("chapters")
    .select(`
      *,
      series(id, title, slug)
    `)
    .eq("id", id)
    .single();

  if (error || !chapter) {
    redirect("/dashboard-admin/chapters");
  }

  // Ambil gambar chapter
  const { data: images } = await supabaseAdmin
    .from("chapter_images")
    .select("*")
    .eq("chapter_id", id)
    .order("page_number", { ascending: true });

  return (
    <div className="flex w-full flex-col gap-6 px-2">
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Edit Chapter</h2>
        <p className="text-sm text-muted-foreground">
          Series: <span className="font-medium">{(chapter.series as any)?.title || "-"}</span>
        </p>
      </header>

      <ChapterEditForm
        chapter={{
          id: chapter.id,
          series_id: chapter.series_id,
          chapter_number: chapter.chapter_number,
          title: chapter.title,
          series: chapter.series as { id: string; title: string; slug: string } | null,
        }}
        existingImages={(images ?? []) as Array<{
          id: string;
          image_url: string;
          page_number: number;
        }>}
      />
    </div>
  );
}

