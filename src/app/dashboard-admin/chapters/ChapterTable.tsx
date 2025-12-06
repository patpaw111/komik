"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ChapterItem = {
  id: string;
  title: string | null;
  chapter_number: string;
  slug: string;
  index: number;
  view_count: number;
  created_at: string;
  published_at: string;
  series_id: string;
  series: { id: string; title: string; slug: string } | null;
};

type Props = {
  items: ChapterItem[];
  error?: string | null;
  currentPage?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
  seriesId?: string | null;
  allSeries: Array<{ id: string; title: string; slug: string }>;
};

export function ChapterTable({
  items,
  error,
  currentPage = 1,
  totalPages = 1,
  total = 0,
  limit = 20,
  seriesId,
  allSeries,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      return (
        item.chapter_number.toLowerCase().includes(q) ||
        item.title?.toLowerCase().includes(q) ||
        item.series?.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    if (seriesId) {
      params.set("series_id", seriesId);
    } else {
      params.delete("series_id");
    }
    router.push(`?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin mau hapus chapter ini? Semua gambar chapter juga akan dihapus.")) return;

    setDeletingId(id);
    setActionError(null);

    try {
      const res = await fetch(`/api/chapters/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setActionError(json.message ?? "Gagal menghapus chapter");
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("[ChapterTable] delete error", err);
      setActionError("Terjadi kesalahan saat menghapus chapter");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari chapter..."
            className="flex-1 rounded border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Total: {total} | Menampilkan {items.length} dari {total}
        </p>
      </div>

      {actionError && (
        <p className="text-sm text-red-400">{actionError}</p>
      )}

      {error && (
        <p className="text-sm text-red-400">
          Gagal mengambil data chapters. Coba refresh halaman.
        </p>
      )}

      {filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada chapter. Tambahkan chapter baru dari tombol di atas.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="px-1.5 py-2 whitespace-nowrap">Series</th>
                  <th className="px-1.5 py-2 whitespace-nowrap">Chapter</th>
                  <th className="px-1.5 py-2 whitespace-nowrap">Judul</th>
                  <th className="px-1.5 py-2 whitespace-nowrap">Slug</th>
                  <th className="px-1.5 py-2 whitespace-nowrap">Views</th>
                  <th className="px-1.5 py-2 whitespace-nowrap">Tanggal</th>
                  <th className="px-1.5 py-2 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-1.5 py-2">
                      <div className="max-w-[150px] text-xs truncate" title={item.series?.title || ""}>
                        {item.series?.title || "-"}
                      </div>
                    </td>
                    <td className="px-1.5 py-2">
                      <span className="font-medium text-xs">{item.chapter_number}</span>
                    </td>
                    <td className="px-1.5 py-2">
                      <div className="max-w-[200px] text-xs truncate" title={item.title || ""}>
                        {item.title || "-"}
                      </div>
                    </td>
                    <td className="px-1.5 py-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[9px] block truncate max-w-[150px]" title={item.slug}>
                        {item.slug}
                      </code>
                    </td>
                    <td className="px-1.5 py-2">
                      <span className="text-[10px]">{item.view_count.toLocaleString()}</span>
                    </td>
                    <td className="px-1.5 py-2">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("id-ID")}
                      </span>
                    </td>
                    <td className="px-1.5 py-2">
                      <div className="flex justify-end gap-1">
                        <a
                          href={`/dashboard-admin/chapters/${item.id}/edit`}
                          className="rounded border border-border px-2 py-1 text-[10px] hover:bg-muted"
                        >
                          Edit
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded border border-red-500/50 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === item.id ? "Menghapus..." : "Hapus"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <span className="text-xs text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

