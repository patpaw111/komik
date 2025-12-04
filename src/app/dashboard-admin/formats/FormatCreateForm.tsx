"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  name: string;
  slug: string;
};

const DEFAULT_STATE: FormState = {
  name: "",
  slug: "",
};

export function FormatCreateForm() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // auto-generate slug dari name kalau name baru diisi
    if (name === "name" && !form.slug) {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setForm((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/formats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message ?? "Gagal menambahkan format");
        return;
      }

      setForm(DEFAULT_STATE);
      router.refresh();
    } catch (err) {
      console.error("[FormatCreateForm] submit error", err);
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
      <h2 className="text-lg font-semibold text-foreground">Tambah Format Baru</h2>

      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="name">
          Nama Format
        </label>
        <input
          id="name"
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          placeholder="Contoh: Manga, Manhwa, Manhua"
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
          placeholder="contoh: manga, manhwa, manhua"
        />
        <p className="text-xs text-muted-foreground">
          Slug akan otomatis dibuat dari nama, tapi bisa kamu edit manual juga.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}

