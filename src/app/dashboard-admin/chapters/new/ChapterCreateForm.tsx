"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ImageItem = {
  id: string;
  file: File;
  preview: string;
  pageNumber: number;
};

type SeriesData = {
  id: string;
  title: string;
  slug: string;
};

export function ChapterCreateForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const seriesId = searchParams.get("series_id");

  const [series, setSeries] = useState<SeriesData | null>(null);
  const [chapterNumber, setChapterNumber] = useState("");
  const [title, setTitle] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSeries, setLoadingSeries] = useState(true);

  useEffect(() => {
    if (!seriesId) {
      router.push("/dashboard-admin/chapters/new");
      return;
    }

    const loadSeries = async () => {
      try {
        const res = await fetch("/api/series");
        const json = await res.json();

        if (json.success) {
          const found = (json.data ?? []).find((s: any) => s.id === seriesId);
          if (found) {
            setSeries({
              id: found.id,
              title: found.title,
              slug: found.slug,
            });
          } else {
            setError("Series tidak ditemukan");
          }
        }
      } catch (err) {
        console.error("[ChapterCreateForm] load series error", err);
        setError("Gagal memuat data series");
      } finally {
        setLoadingSeries(false);
      }
    };

    loadSeries();
  }, [seriesId, router]);

  const normalizeName = (name: string) => name.toLowerCase();

  const naturalCompare = (a: string, b: string) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  };

  const handleAddImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Buat copy dari file untuk memastikan file original tidak diubah
        // Ini mencegah ERR_UPLOAD_FILE_CHANGED error
        const fileCopy = new File([file], file.name, { type: file.type });
        const preview = URL.createObjectURL(fileCopy);
        const newImage: ImageItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file: fileCopy, // Gunakan copy untuk upload
          preview,
          pageNumber: images.length + 1,
        };
        setImages([...images, newImage]);
      }
    };
    input.click();
  };

  const handleAddImagesBulk = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      const sorted = Array.from(files).sort((a, b) =>
        naturalCompare(normalizeName(a.name), normalizeName(b.name))
      );

      const startIndex = images.length;
      const newItems: ImageItem[] = [];

      sorted.forEach((file, idx) => {
        const fileCopy = new File([file], file.name, { type: file.type });
        const preview = URL.createObjectURL(fileCopy);
        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file: fileCopy,
          preview,
          pageNumber: startIndex + idx + 1,
        });
      });

      setImages((prev) => [...prev, ...newItems]);
    };
    input.click();
  };

  const handleRemoveImage = (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    const newImages = images.filter((img) => img.id !== id);
    // Re-number pages
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

    // Re-number pages
    const renumbered = newImages.map((img, idx) => ({
      ...img,
      pageNumber: idx + 1,
    }));
    setImages(renumbered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesId || !chapterNumber) {
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
      // 1. Buat chapter dulu
      const chapterRes = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          series_id: seriesId,
          chapter_number: chapterNumber,
          title: title || null,
        }),
      });

      const chapterJson = await chapterRes.json();

      if (!chapterRes.ok || !chapterJson.success) {
        setError(chapterJson.message ?? "Gagal membuat chapter");
        return;
      }

      const chapterId = chapterJson.data.id;

      // 2. Upload semua gambar ke Supabase Storage via API (server side)
      const uploadedImages: Array<{ image_url: string; page_number: number }> = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        try {
          // Pastikan file masih valid dan tidak diubah
          if (!img.file || img.file.size === 0) {
            setError(`File gambar ke-${img.pageNumber} tidak valid`);
            return;
          }

          // Upload via API endpoint (server side, bypass RLS)
          const formData = new FormData();
          // Gunakan file langsung tanpa modifikasi
          formData.append("file", img.file, img.file.name);
          formData.append("chapter_id", chapterId);
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
            console.error("[ChapterCreateForm] upload error", errorJson);
            setError(`Gagal meng-upload gambar ke-${img.pageNumber}: ${errorJson.message ?? "Unknown error"}`);
            return;
          }

          const uploadJson = await uploadRes.json();

          if (!uploadJson.success) {
            console.error("[ChapterCreateForm] upload error", uploadJson);
            setError(`Gagal meng-upload gambar ke-${img.pageNumber}: ${uploadJson.message ?? "Unknown error"}`);
            return;
          }

          uploadedImages.push({
            image_url: uploadJson.data.url,
            page_number: img.pageNumber,
          });
        } catch (err: any) {
          console.error(`[ChapterCreateForm] upload error for image ${img.pageNumber}`, err);
          setError(`Gagal meng-upload gambar ke-${img.pageNumber}: ${err.message ?? "Unknown error"}`);
          return;
        }
      }

      // 3. Simpan urutan gambar ke database
      const imagesRes = await fetch(`/api/chapters/${chapterId}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: uploadedImages }),
      });

      const imagesJson = await imagesRes.json();

      if (!imagesRes.ok || !imagesJson.success) {
        setError(imagesJson.message ?? "Gagal menyimpan gambar");
        return;
      }

      // Cleanup preview URLs
      images.forEach((img) => URL.revokeObjectURL(img.preview));

      // Redirect ke halaman daftar chapters
      router.push(`/dashboard-admin/chapters`);
    } catch (err) {
      console.error("[ChapterCreateForm] submit error", err);
      setError("Terjadi kesalahan, coba lagi nanti");
    } finally {
      setLoading(false);
    }
  };

  if (loadingSeries) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Memuat data series...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-red-400">
          {error || "Series tidak ditemukan"}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tambah Chapter Baru</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Series: <span className="font-medium">{series.title}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard-admin/chapters/new")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Ganti Series
        </button>
      </div>

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
        <p className="text-xs text-muted-foreground">
          Bisa menggunakan angka (1, 2, 3) atau format khusus (1.5, Extra, Bonus)
        </p>
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
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAddImagesBulk}
              className="text-sm text-primary hover:text-primary/80"
            >
              + Upload Bulk
            </button>
            <button
              type="button"
              onClick={handleAddImage}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              + Satu Gambar
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Tips: jika file sudah dinamai berurutan (1, 2, 3...) gunakan "Upload Bulk" supaya otomatis diurutkan sesuai nama file.
        </p>

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
          onClick={() => router.push("/dashboard-admin/chapters/new")}
          className="rounded border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading || images.length === 0}
          className="inline-flex items-center justify-center rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Simpan Chapter"}
        </button>
      </div>
    </form>
  );
}

