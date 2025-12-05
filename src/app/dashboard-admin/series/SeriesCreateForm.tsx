"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { MultiSelect } from "./MultiSelect";

type FormState = {
  title: string;
  slug: string;
  alternative_title: string;
  description: string;
  status: string;
};

type FormatOption = { id: string; name: string };
type GenreOption = { id: string; name: string };
type AuthorOption = { id: string; name: string };

const DEFAULT_STATE: FormState = {
  title: "",
  slug: "",
  alternative_title: "",
  description: "",
  status: "Ongoing",
};

export function SeriesCreateForm() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [formats, setFormats] = useState<FormatOption[]>([]);
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [selectedFormatId, setSelectedFormatId] = useState<string | "">("");
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [storyAuthorIds, setStoryAuthorIds] = useState<string[]>([]);
  const [artAuthorIds, setArtAuthorIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [formatsRes, genresRes, authorsRes] = await Promise.all([
          fetch("/api/formats"),
          fetch("/api/genres"),
          fetch("/api/authors"),
        ]);

        const [formatsJson, genresJson, authorsJson] = await Promise.all([
          formatsRes.json(),
          genresRes.json(),
          authorsRes.json(),
        ]);

        if (formatsJson.success) {
          setFormats(
            (formatsJson.data ?? []).map((f: any) => ({
              id: f.id,
              name: f.name,
            }))
          );
        }

        if (genresJson.success) {
          setGenres(
            (genresJson.data ?? []).map((g: any) => ({
              id: g.id,
              name: g.name,
            }))
          );
        }

        if (authorsJson.success) {
          setAuthors(
            (authorsJson.data ?? []).map((a: any) => ({
              id: a.id,
              name: a.name,
            }))
          );
        }
      } catch (err) {
        console.error("[SeriesCreateForm] load master error", err);
      }
    };

    loadMasterData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let coverImageUrl: string | null = null;

      // kalau user pilih file cover, upload dulu ke Supabase Storage
      if (coverFile) {
        const ext = coverFile.name.split(".").pop() ?? "jpg";
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        // NOTE: pastikan kamu sudah punya bucket "covers" di Supabase Storage
        const { data: uploadData, error: uploadError } =
          await supabaseBrowser.storage.from("covers").upload(fileName, coverFile);

        if (uploadError) {
          console.error("[SeriesCreateForm] upload error", uploadError);
          setError("Gagal meng-upload cover ke Supabase Storage");
          return;
        }

        const { data: publicUrlData } = supabaseBrowser.storage
          .from("covers")
          .getPublicUrl(uploadData.path);

        coverImageUrl = publicUrlData.publicUrl;
      }

      const payload = {
        ...form,
        format_id: selectedFormatId || null,
        cover_image_url: coverImageUrl,
      };

      const res = await fetch("/api/series", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message ?? "Gagal menambahkan series");
        return;
      }

      const created = json.data;

      // set genre (kalau ada)
      if (created?.id && selectedGenreIds.length > 0) {
        try {
          await fetch(`/api/series/${created.id}/genres`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ genre_ids: selectedGenreIds }),
          });
        } catch (err) {
          console.error("[SeriesCreateForm] set genres error", err);
        }
      }

      // set authors (kalau ada)
      const authorsPayload = [
        ...storyAuthorIds.map((id) => ({ author_id: id, role: "Story" })),
        ...artAuthorIds.map((id) => ({ author_id: id, role: "Art" })),
      ];

      if (created?.id && authorsPayload.length > 0) {
        try {
          await fetch(`/api/series/${created.id}/authors`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ authors: authorsPayload }),
          });
        } catch (err) {
          console.error("[SeriesCreateForm] set authors error", err);
        }
      }

      setForm(DEFAULT_STATE);
      setCoverFile(null);
      setSelectedFormatId("");
      setSelectedGenreIds([]);
      setStoryAuthorIds([]);
      setArtAuthorIds([]);
      router.refresh();
    } catch (err) {
      console.error("[SeriesCreateForm] submit error", err);
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
      <h2 className="text-lg font-semibold">Tambah Series Baru</h2>

      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="title">
          Judul
        </label>
        <input
          id="title"
          name="title"
          required
          value={form.title}
          onChange={handleChange}
          className="w-full rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          placeholder="Masukkan judul komik"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="slug">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          required
          value={form.slug}
          onChange={handleChange}
          className="w-full rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          placeholder="contoh: solo-leveling"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="alternative_title">
          Judul Alternatif
        </label>
        <input
          id="alternative_title"
          name="alternative_title"
          value={form.alternative_title}
          onChange={handleChange}
          className="w-full rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          placeholder="Judul asli / bahasa lain (opsional)"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="description">
          Deskripsi
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          className="w-full rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="format">
          Format
        </label>
        <select
          id="format"
          value={selectedFormatId}
          onChange={(e) => setSelectedFormatId(e.target.value)}
          className="w-full rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">Tanpa format</option>
          {formats.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Genre</label>
        <MultiSelect
          options={genres}
          selectedIds={selectedGenreIds}
          onChange={setSelectedGenreIds}
          placeholder="Pilih genre..."
          emptyMessage="Belum ada data genre di database."
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="cover">
          Cover image (Supabase Storage)
        </label>
        <input
          id="cover"
          name="cover"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:text-foreground hover:file:bg-muted/80"
        />
        <p className="text-xs text-muted-foreground">
          File akan di-upload ke bucket <code>covers</code> di Supabase Storage.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
          <option value="Hiatus">Hiatus</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-sm font-medium text-foreground">Author</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Story</label>
            <MultiSelect
              options={authors}
              selectedIds={storyAuthorIds}
              onChange={setStoryAuthorIds}
              placeholder="Pilih author story..."
              emptyMessage="Belum ada data author di database."
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Art</label>
            <MultiSelect
              options={authors}
              selectedIds={artAuthorIds}
              onChange={setArtAuthorIds}
              placeholder="Pilih author art..."
              emptyMessage="Belum ada data author di database."
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}


