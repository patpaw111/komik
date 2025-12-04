"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type FormatItem = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  items: FormatItem[];
  error?: string | null;
};

export function FormatTable({ items, error }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FormatItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const startEdit = (item: FormatItem) => {
    setEditing(item);
    setEditName(item.name);
    setEditSlug(item.slug);
    setActionError(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setActionError(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/formats/${editing.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          slug: editSlug,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg = json.message ?? "Gagal mengubah format";
        let errorDetails = "";
        if (json.details) {
          if (typeof json.details === "string") {
            errorDetails = `: ${json.details}`;
          } else if (typeof json.details === "object" && json.details.message) {
            errorDetails = `: ${json.details.message}`;
          } else {
            errorDetails = `: ${JSON.stringify(json.details)}`;
          }
        }
        setActionError(`${errorMsg}${errorDetails}`);
        return;
      }

      setEditing(null);
      router.refresh();
    } catch (err) {
      console.error("[FormatTable] edit error", err);
      setActionError("Terjadi kesalahan saat menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin mau hapus format ini?")) return;

    setDeletingId(id);
    setActionError(null);

    try {
      const res = await fetch(`/api/formats/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setActionError(json.message ?? "Gagal menghapus format");
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("[FormatTable] delete error", err);
      setActionError("Terjadi kesalahan saat menghapus format");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Total formats: {items.length}
        </p>
        <div className="w-full max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama atau slug..."
            className="w-full rounded border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-400">
          Gagal mengambil data formats. Coba refresh halaman.
        </p>
      )}

      {filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada format. Tambahkan format baru dari form di sebelah kanan.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="px-2 py-2">Nama</th>
                <th className="px-2 py-2">Slug</th>
                <th className="px-2 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="px-2 py-2">
                    <div className="max-w-xs truncate font-medium">
                      {item.name}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <code className="rounded bg-muted px-2 py-0.5 text-[11px]">
                      {item.slug}
                    </code>
                  </td>
                  <td className="px-2 py-2 text-right text-xs text-muted-foreground">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded border border-border px-2 py-1 text-[11px] hover:bg-muted"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded border border-red-500/60 px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === item.id ? "Hapus..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {actionError && (
        <p className="text-xs text-red-400">{actionError}</p>
      )}

      {editing && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-4 text-sm shadow-lg">
            <h4 className="mb-2 font-medium">Edit Format</h4>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="edit-name">
                  Nama Format
                </label>
                <input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    // auto-update slug kalau slug masih sama dengan yang lama
                    if (editSlug === editing.slug) {
                      const slug = e.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "");
                      setEditSlug(slug);
                    }
                  }}
                  className="w-full rounded border border-border bg-input px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="edit-slug">
                  Slug
                </label>
                <input
                  id="edit-slug"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full rounded border border-border bg-input px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded border border-border px-3 py-1 text-xs hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

