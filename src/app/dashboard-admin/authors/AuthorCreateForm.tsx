"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  name: string;
};

const DEFAULT_STATE: FormState = {
  name: "",
};

export function AuthorCreateForm() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/authors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message ?? "Gagal menambahkan author");
        return;
      }

      setForm(DEFAULT_STATE);
      router.refresh();
    } catch (err) {
      console.error("[AuthorCreateForm] submit error", err);
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
      <h2 className="text-lg font-semibold text-foreground">Tambah Author Baru</h2>

      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="name">
          Nama Author
        </label>
        <input
          id="name"
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          placeholder="Contoh: Tite Kubo, Eiichiro Oda"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          Maksimal 100 karakter.
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

