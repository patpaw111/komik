"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ImageItem = {
  id: string;
  file?: File;
  preview: string;
  pageNumber: number;
  imageUrl?: string; // URL dari database (existing image)
  isExisting: boolean; // true jika gambar sudah ada di database
};

type ChapterData = {
  id: string;
  series_id: string;
  chapter_number: string;
  title: string | null;
  series: { id: string; title: string; slug: string } | null;
};

type ExistingImage = {
  id: string;
  image_url: string;
  page_number: number;
};

type Props = {
  chapter: ChapterData;
  existingImages: ExistingImage[];
};

export function ChapterEditForm({ chapter, existingImages }: Props) {
  const router = useRouter();
  const [chapterNumber, setChapterNumber] = useState(chapter.chapter_number);
  const [title, setTitle] = useState(chapter.title || "");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing images
  useEffect(() => {
    const loadedImages: ImageItem[] = existingImages.map((img) => ({
      id: img.id,
      preview: img.image_url,
      pageNumber: img.page_number,
      imageUrl: img.image_url,
      isExisting: true,
    }));
    setImages(loadedImages);
  }, [existingImages]);

  const handleAddImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const fileCopy = new File([file], file.name, { type: file.type });
        const preview = URL.createObjectURL(fileCopy);
        const newImage: ImageItem = {
          id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file: fileCopy,
          preview,
          pageNumber: images.length + 1,
          isExisting: false,
        };
        setImages([...images, newImage]);
      }
    };
    input.click();
  };

  const handleRemoveImage = (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove && !imageToRemove.isExisting) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    const newImages = images.filter((img) => img.id !== id);
    const renumbered = newImages.map((img, idx) => ({
      ...img,
      pageNumber: idx + 1,
    }));
    setImages(renumbered);
  };

  const moveImage = (id: string, direction: "up" | "down") => {
    const index = images.findIndex((img) => img.id === id);
    if (index === -1) return;

    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === images.length - 1) return;

    const newImages = [...images];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newImages[index], newImages[targetIndex]] = [
      newImages[targetIndex],
      newImages[index],
    ];

    const renumbered = newImages.map((img, idx) => ({
      ...img,
      pageNumber: idx + 1,
    }));
    setImages(renumbered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterNumber) {
      setError("Chapter number wajib diisi");
      return;
    }

    if (images.length === 0) {
      setError("Minimal harus ada 1 gambar");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Update chapter info
      const updateRes = await fetch(`/api/chapters/${chapter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter_number: chapterNumber,
          title: title || null,
        }),
      });

      const updateJson = await updateRes.json();

      if (!updateRes.ok || !updateJson.success) {
        setError(updateJson.message ?? "Gagal mengupdate chapter");
        return;
      }

      // 2. Upload gambar baru (jika ada) dan simpan urutan semua gambar
      const uploadedImages: Array<{ image_url: string; page_number: number }> = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];

        if (img.isExisting && img.imageUrl) {
          // Gunakan URL yang sudah ada
          uploadedImages.push({
            image_url: img.imageUrl,
            page_number: img.pageNumber,
          });
        } else if (img.file) {
          // Upload gambar baru
          try {
            if (!img.file || img.file.size === 0) {
              setError(`File gambar ke-${img.pageNumber} tidak valid`);
              return;
            }

            const formData = new FormData();
            formData.append("file", img.file, img.file.name);
            formData.append("chapter_id", chapter.id);
            formData.append("page_number", img.pageNumber.toString());

            const uploadRes = await fetch("/api/chapters/upload", {
              method: "POST",
              body: formData,
            });

            if (!uploadRes.ok) {
              const errorText = await uploadRes.text();
              let errorJson;
              try {
                errorJson = JSON.parse(errorText);
              } catch {
                errorJson = { message: errorText || "Unknown error" };
              }
              console.error("[ChapterEditForm] upload error", errorJson);
              setError(`Gagal meng-upload gambar ke-${img.pageNumber}: ${errorJson.message ?? "Unknown error"}`);
              return;
            }

            const uploadJson = await uploadRes.json();

            if (!uploadJson.success) {
              console.error("[ChapterEditForm] upload error", uploadJson);
              setError(`Gagal meng-upload gambar ke-${img.pageNumber}: ${uploadJson.message ?? "Unknown error"}`);
              return;
            }

            uploadedImages.push({
              image_url: uploadJson.data.url,
              page_number: img.pageNumber,
            });
          } catch (err: any) {
            console.error(`[ChapterEditForm] upload error for image ${img.pageNumber}`, err);
            setError(`Gagal meng-upload gambar ke-${img.pageNumber}: ${err.message ?? "Unknown error"}`);
            return;
          }
        }
      }

      // 3. Simpan urutan gambar ke database
      const imagesRes = await fetch(`/api/chapters/${chapter.id}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: uploadedImages }),
      });

      const imagesJson = await imagesRes.json();

      if (!imagesRes.ok || !imagesJson.success) {
        setError(imagesJson.message ?? "Gagal menyimpan gambar");
        return;
      }

      // Cleanup preview URLs untuk gambar baru
      images.forEach((img) => {
        if (!img.isExisting) {
          URL.revokeObjectURL(img.preview);
        }
      });

      // Redirect ke halaman chapters
      router.push(`/dashboard-admin/chapters`);
    } catch (err) {
      console.error("[ChapterEditForm] submit error", err);
      setError("Terjadi kesalahan, coba lagi nanti");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-card p-4"
    >
      <h2 className="text-lg font-semibold">Edit Chapter</h2>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="chapter_number">
          Nomor Chapter <span className="text-red-400">*</span>
        </label>
        <input
          id="chapter_number"
          required
          value={chapterNumber}
          onChange={(e) => setChapterNumber(e.target.value)}
          className="w-full rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          placeholder="Contoh: 1, 1.5, 20, Extra"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="title">
          Judul Chapter (Opsional)
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          placeholder="Contoh: Pertarungan Akhir"
        />
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Gambar Chapter <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            onClick={handleAddImage}
            className="text-sm text-primary hover:text-primary/80"
          >
            + Tambah Gambar
          </button>
        </div>

        {images.length === 0 ? (
          <div className="rounded border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Belum ada gambar. Klik "Tambah Gambar" untuk menambahkan.
            </p>
            <button
              type="button"
              onClick={handleAddImage}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Tambah Gambar Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="flex items-center gap-3 rounded border border-border bg-input p-3"
              >
                <div className="shrink-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-medium text-foreground">
                    {img.pageNumber}
                  </span>
                </div>
                <div className="flex-1">
                  <img
                    src={img.preview}
                    alt={`Page ${img.pageNumber}`}
                    className="h-20 w-auto rounded object-cover"
                  />
                  {img.isExisting && (
                    <p className="text-[10px] text-muted-foreground mt-1">Gambar existing</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(img.id, "up")}
                    disabled={idx === 0}
                    className="rounded border border-border bg-card px-2 py-1 text-xs hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Pindah ke atas"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(img.id, "down")}
                    disabled={idx === images.length - 1}
                    className="rounded border border-border bg-card px-2 py-1 text-xs hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Pindah ke bawah"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="rounded border border-border bg-card px-2 py-1 text-xs text-red-400 hover:bg-muted"
                    title="Hapus"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button
          type="button"
          onClick={() => router.push("/dashboard-admin/chapters")}
          className="rounded border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading || images.length === 0}
          className="inline-flex items-center justify-center rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}

