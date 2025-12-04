"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type SeriesItem = {
  id: string;
  title: string;
  slug: string;
  alternative_title: string | null;
  description: string | null;
  status: string;
  cover_image_url: string | null;
  format_id: string | null;
  formats: { id: string; name: string } | null;
  series_genres: Array<{ genres: { id: string; name: string } }>;
  series_authors: Array<{ authors: { id: string; name: string }; role: string }>;
};

type Props = {
  items: SeriesItem[];
  error?: string | null;
  currentPage?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
};

type FormatOption = { id: string; name: string };
type GenreOption = { id: string; name: string };
type AuthorOption = { id: string; name: string };

export function SeriesTable({
  items,
  error,
  currentPage = 1,
  totalPages = 1,
  total = 0,
  limit = 20,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<SeriesItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editAlternativeTitle, setEditAlternativeTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("Ongoing");
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [formats, setFormats] = useState<FormatOption[]>([]);
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [selectedFormatId, setSelectedFormatId] = useState<string | "">("");
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [storyAuthorIds, setStoryAuthorIds] = useState<string[]>([]);
  const [artAuthorIds, setArtAuthorIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [relationsLoading, setRelationsLoading] = useState(false);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

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
            (formatsJson.data ?? []).map((f: any) => ({ id: f.id, name: f.name }))
          );
        }

        if (genresJson.success) {
          setGenres(
            (genresJson.data ?? []).map((g: any) => ({ id: g.id, name: g.name }))
          );
        }

        if (authorsJson.success) {
          setAuthors(
            (authorsJson.data ?? []).map((a: any) => ({ id: a.id, name: a.name }))
          );
        }
      } catch (err) {
        console.error("[SeriesTable] load master data error", err);
      }
    };
    loadMasterData();
  }, []);

  const startEdit = async (item: SeriesItem) => {
    setEditing(item);
    setEditTitle(item.title);
    setEditSlug(item.slug);
    setEditAlternativeTitle(item.alternative_title ?? "");
    setEditDescription(item.description ?? "");
    setEditStatus(item.status);
    setSelectedFormatId(item.format_id ?? "");
    setNewCoverFile(null);
    setRemoveCover(false);
    setActionError(null);

    setRelationsLoading(true);
    try {
      const [{ data: genresData }, { data: authorsData }] = await Promise.all([
        supabaseBrowser
          .from("series_genres")
          .select("genre_id")
          .eq("series_id", item.id),
        supabaseBrowser
          .from("series_authors")
          .select("author_id, role")
          .eq("series_id", item.id),
      ]);

      setSelectedGenreIds(
        (genresData ?? []).map((g: any) => g.genre_id)
      );

      const story = (authorsData ?? []).filter(
        (a: any) => (a.role ?? "Story") === "Story"
      );
      const art = (authorsData ?? []).filter(
        (a: any) => (a.role ?? "Story") === "Art"
      );

      setStoryAuthorIds(story.map((a: any) => a.author_id));
      setArtAuthorIds(art.map((a: any) => a.author_id));
    } catch (err) {
      console.error("[SeriesTable] load relations error", err);
    } finally {
      setRelationsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditTitle("");
    setEditSlug("");
    setEditAlternativeTitle("");
    setEditDescription("");
    setNewCoverFile(null);
    setRemoveCover(false);
    setSelectedFormatId("");
    setSelectedGenreIds([]);
    setStoryAuthorIds([]);
    setArtAuthorIds([]);
    setActionError(null);
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setNewCoverFile(file);
    if (file) {
      setRemoveCover(false);
    }
  };

  const toggleGenre = (id: string) => {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleStoryAuthor = (id: string) => {
    setStoryAuthorIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleArtAuthor = (id: string) => {
    setArtAuthorIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  // helper function untuk extract path dari Supabase Storage URL
  const extractPathFromUrl = (url: string): string | null => {
    if (!url) return null;
    
    try {
      // Format URL: https://xxx.supabase.co/storage/v1/object/public/covers/path/to/file.jpg
      // atau: https://xxx.supabase.co/storage/v1/object/sign/covers/path/to/file.jpg
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      
      // cari index "covers" di pathname
      const coversIndex = pathParts.indexOf("covers");
      if (coversIndex === -1 || coversIndex === pathParts.length - 1) {
        console.warn("[SeriesTable] cannot find 'covers' in URL:", url);
        return null;
      }
      
      // ambil semua bagian setelah "covers"
      const pathAfterCovers = pathParts.slice(coversIndex + 1).join("/");
      return pathAfterCovers || null;
    } catch (err) {
      console.warn("[SeriesTable] error parsing URL:", url, err);
      // fallback: coba split manual
      const urlParts = url.split("/covers/");
      if (urlParts.length > 1) {
        const pathWithQuery = urlParts[1];
        return pathWithQuery.split("?")[0].split("#")[0].trim() || null;
      }
      return null;
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setActionError(null);

    try {
      let coverImageUrl: string | null = editing.cover_image_url;
      let oldCoverPath: string | null = null; // simpan path cover lama untuk dihapus nanti

      // kalau ada file baru, upload ke Supabase Storage
      if (newCoverFile) {
        const ext = newCoverFile.name.split(".").pop() ?? "jpg";
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        console.log("[SeriesTable] uploading new cover:", fileName);

        const { data: uploadData, error: uploadError } =
          await supabaseBrowser.storage.from("covers").upload(fileName, newCoverFile);

        if (uploadError) {
          console.error("[SeriesTable] upload error", uploadError);
          setActionError("Gagal meng-upload cover baru ke Supabase Storage");
          setSaving(false);
          return;
        }

        const { data: publicUrlData } = supabaseBrowser.storage
          .from("covers")
          .getPublicUrl(uploadData.path);

        coverImageUrl = publicUrlData.publicUrl;
        console.log("[SeriesTable] new cover URL:", coverImageUrl);
        console.log("[SeriesTable] upload path:", uploadData.path);

        // simpan path cover lama untuk dihapus setelah update database berhasil
        if (editing.cover_image_url) {
          oldCoverPath = extractPathFromUrl(editing.cover_image_url);
          console.log("[SeriesTable] old cover URL:", editing.cover_image_url);
          console.log("[SeriesTable] old cover path to delete:", oldCoverPath);
          
          if (!oldCoverPath) {
            console.warn("[SeriesTable] cannot extract path from old cover URL");
          }
        }
      } else if (removeCover && editing.cover_image_url) {
        // kalau pilih hapus cover tanpa upload baru
        oldCoverPath = extractPathFromUrl(editing.cover_image_url);
        console.log("[SeriesTable] cover URL to remove:", editing.cover_image_url);
        console.log("[SeriesTable] cover path to delete:", oldCoverPath);
        coverImageUrl = null;
      }

      const seriesId = editing.id;

      const payload = {
        title: editTitle,
        slug: editSlug,
        alternative_title: editAlternativeTitle || null,
        description: editDescription || null,
        status: editStatus,
        cover_image_url: coverImageUrl,
        format_id: selectedFormatId || null,
      };

      console.log("[SeriesTable] sending PATCH request with payload:", payload);

      const res = await fetch(`/api/series/${seriesId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg = json.message ?? "Gagal mengubah series";
        let errorDetails = "";
        
        // tampilkan detail error lebih lengkap
        if (json.details) {
          if (typeof json.details === "string") {
            errorDetails = `: ${json.details}`;
          } else if (typeof json.details === "object") {
            if (json.details.message) {
              errorDetails = `: ${json.details.message}`;
            } else {
              errorDetails = `: ${JSON.stringify(json.details, null, 2)}`;
            }
          }
        }
        
        // log lengkap untuk debugging
        console.error("[SeriesTable] save error - FULL DETAILS:", {
          status: res.status,
          statusText: res.statusText,
          json: JSON.stringify(json, null, 2),
          payload: JSON.stringify(payload, null, 2),
        });
        
        // tampilkan error yang lebih informatif
        let displayError = errorMsg;
        if (errorDetails) {
          displayError += errorDetails;
        } else if (json.details) {
          // fallback: tampilkan details langsung
          displayError += `: ${JSON.stringify(json.details)}`;
        } else {
          displayError += ` (HTTP ${res.status})`;
        }
        
        console.error("[SeriesTable] displayError:", displayError);
        setActionError(displayError);
        
        // kalau upload file baru berhasil tapi update database gagal, hapus file baru
        if (newCoverFile && coverImageUrl && coverImageUrl !== editing.cover_image_url) {
          try {
            const urlParts = coverImageUrl.split("/covers/");
            if (urlParts.length > 1) {
              const newPath = urlParts[1].split("?")[0].split("#")[0];
              await supabaseBrowser.storage.from("covers").remove([newPath]);
              console.log("[SeriesTable] cleaned up new cover file after error");
            }
          } catch (cleanupErr) {
            console.warn("[SeriesTable] failed to cleanup new cover file", cleanupErr);
          }
        }
        
        return;
      }

      // sinkronkan genre
      try {
        const genresRes = await fetch(`/api/series/${seriesId}/genres`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ genre_ids: selectedGenreIds }),
        });
        if (!genresRes.ok) {
          const genresJson = await genresRes.json();
          console.error("[SeriesTable] update genres error", genresJson);
        }
      } catch (err) {
        console.error("[SeriesTable] update genres error", err);
      }

      // sinkronkan authors
      const authorsPayload = [
        ...storyAuthorIds.map((id) => ({ author_id: id, role: "Story" })),
        ...artAuthorIds.map((id) => ({ author_id: id, role: "Art" })),
      ];

      try {
        const authorsRes = await fetch(`/api/series/${seriesId}/authors`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authors: authorsPayload }),
        });
        if (!authorsRes.ok) {
          const authorsJson = await authorsRes.json();
          console.error("[SeriesTable] update authors error", authorsJson);
        }
      } catch (err) {
        console.error("[SeriesTable] update authors error", err);
      }

      // kalau update database berhasil, baru hapus cover lama
      // dilakukan setelah semua operasi selesai (termasuk genres/authors)
      if (oldCoverPath && oldCoverPath.trim()) {
        try {
          console.log("[SeriesTable] attempting to delete old cover:", oldCoverPath);
          
          // pastikan path tidak kosong dan valid
          const pathToDelete = oldCoverPath.trim();
          if (!pathToDelete) {
            console.warn("[SeriesTable] path to delete is empty");
            return;
          }
          
          const { data: removeData, error: removeError } = await supabaseBrowser.storage
            .from("covers")
            .remove([pathToDelete]);
          
          if (removeError) {
            console.error("[SeriesTable] failed to remove old cover", {
              error: removeError,
              path: pathToDelete,
              errorMessage: removeError.message,
            });
            // tidak perlu gagalkan karena update database sudah berhasil
          } else {
            console.log("[SeriesTable] old cover deleted successfully", {
              path: pathToDelete,
              removedFiles: removeData,
            });
          }
        } catch (err: any) {
          console.error("[SeriesTable] error removing old cover", {
            error: err,
            errorMessage: err?.message,
            path: oldCoverPath,
          });
          // tidak perlu gagalkan karena update database sudah berhasil
        }
      } else {
        console.log("[SeriesTable] no old cover to delete (path:", oldCoverPath, ")");
      }

      setEditing(null);
      setEditTitle("");
      setEditSlug("");
      setEditAlternativeTitle("");
      setEditDescription("");
      setNewCoverFile(null);
      setRemoveCover(false);
      setSelectedFormatId("");
      setSelectedGenreIds([]);
      setStoryAuthorIds([]);
      setArtAuthorIds([]);
      router.refresh();
    } catch (err) {
      console.error("[SeriesTable] edit error", err);
      setActionError("Terjadi kesalahan saat menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin mau hapus series ini?")) return;

    setDeletingId(id);
    setActionError(null);

    try {
      const res = await fetch(`/api/series/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setActionError(json.message ?? "Gagal menghapus series");
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("[SeriesTable] delete error", err);
      setActionError("Terjadi kesalahan saat menghapus series");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Total series: {total} | Menampilkan {items.length} dari {total}
        </p>
        <div className="w-full max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan judul atau slug..."
            className="w-full rounded border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-400">
          Gagal mengambil data series. Coba refresh halaman.
        </p>
      )}

      {filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada series. Tambahkan series baru dari form di sebelah kanan.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="px-1.5 py-2 whitespace-nowrap">Cover</th>
                <th className="px-1.5 py-2 whitespace-nowrap">Judul</th>
                <th className="px-1.5 py-2 whitespace-nowrap">Judul Alternatif</th>
                <th className="px-1.5 py-2 whitespace-nowrap">Slug</th>
                <th className="px-1.5 py-2 whitespace-nowrap">Deskripsi</th>
                <th className="px-1.5 py-2 whitespace-nowrap">Format</th>
                <th className="px-1.5 py-2 whitespace-nowrap">Genre</th>
                <th className="px-1.5 py-2 whitespace-nowrap">Author</th>
                <th className="px-1.5 py-2 whitespace-nowrap">Status</th>
                <th className="px-1.5 py-2 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const genres = item.series_genres
                  ?.map((sg) => sg.genres?.name)
                  .filter(Boolean) || [];
                const authors = item.series_authors
                  ?.map((sa) => sa.authors?.name)
                  .filter(Boolean) || [];
                const description = item.description
                  ? item.description.length > 40
                    ? `${item.description.substring(0, 40)}...`
                    : item.description
                  : "-";

                return (
                  <tr
                    key={item.id}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-1.5 py-2">
                      {item.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.cover_image_url}
                          alt={item.title}
                          className="h-14 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-10 items-center justify-center rounded bg-muted text-[8px] text-muted-foreground">
                          No Cover
                        </div>
                      )}
                    </td>
                    <td className="px-1.5 py-2">
                      <div className="max-w-[120px] font-medium text-xs truncate" title={item.title}>
                        {item.title}
                      </div>
                    </td>
                    <td className="px-1.5 py-2">
                      <div className="max-w-[120px] text-[10px] text-muted-foreground truncate" title={item.alternative_title || undefined}>
                        {item.alternative_title || "-"}
                      </div>
                    </td>
                    <td className="px-1.5 py-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[9px] block truncate max-w-[100px]" title={item.slug}>
                        {item.slug}
                      </code>
                    </td>
                    <td className="px-1.5 py-2">
                      <div className="max-w-[150px] text-[10px] text-muted-foreground truncate" title={item.description || undefined}>
                        {description}
                      </div>
                    </td>
                    <td className="px-1.5 py-2">
                      <span className="text-[10px] whitespace-nowrap">
                        {item.formats?.name || "-"}
                      </span>
                    </td>
                    <td className="px-1.5 py-2">
                      <div className="flex flex-wrap gap-0.5 max-w-[100px]">
                        {genres.length > 0 ? (
                          genres.slice(0, 2).map((genre, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-muted px-1 py-0.5 text-[9px]"
                            >
                              {genre}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground">-</span>
                        )}
                        {genres.length > 2 && (
                          <span className="text-[9px] text-muted-foreground">
                            +{genres.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-1.5 py-2">
                      <div className="flex flex-wrap gap-0.5 max-w-[100px]">
                        {authors.length > 0 ? (
                          authors.slice(0, 2).map((author, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-muted px-1 py-0.5 text-[9px]"
                            >
                              {author}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground">-</span>
                        )}
                        {authors.length > 2 && (
                          <span className="text-[9px] text-muted-foreground">
                            +{authors.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-1.5 py-2">
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] whitespace-nowrap">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-1.5 py-2 text-right text-xs text-muted-foreground">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded border border-border px-1.5 py-0.5 text-[10px] hover:bg-muted"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded border border-red-500/60 px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === item.id ? "Hapus..." : "Del"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="text-xs text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`rounded border px-2 py-1 text-xs ${
                      currentPage === pageNum
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {actionError && (
        <p className="text-xs text-red-400">{actionError}</p>
      )}

      {editing && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-4 text-sm shadow-lg">
            <h4 className="mb-3 font-medium">Edit Series</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="edit-title">
                  Judul
                </label>
                <input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
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

              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="edit-alternative-title">
                  Judul Alternatif
                </label>
                <input
                  id="edit-alternative-title"
                  value={editAlternativeTitle}
                  onChange={(e) => setEditAlternativeTitle(e.target.value)}
                  className="w-full rounded border border-border bg-input px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                  placeholder="Judul asli / bahasa lain (opsional)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="edit-description">
                  Deskripsi
                </label>
                <textarea
                  id="edit-description"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded border border-border bg-input px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                  placeholder="Ringkasan cerita (opsional)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="edit-status">
                  Status
                </label>
                <select
                  id="edit-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded border border-border bg-input px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Hiatus">Hiatus</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-xs font-medium">Cover</span>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-10 overflow-hidden rounded border border-border bg-muted">
                    {newCoverFile ? (
                      <div className="flex h-full w-full items-center justify-center px-1 text-[9px] text-muted-foreground">
                        File baru
                      </div>
                    ) : editing.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={editing.cover_image_url}
                        alt={editing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-1 text-[9px] text-muted-foreground">
                        Tidak ada cover
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 text-[11px] text-muted-foreground">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileChange}
                      className="block w-full text-[11px] text-foreground file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-[11px] file:text-foreground hover:file:bg-muted/80"
                    />
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={removeCover}
                        onChange={(e) => setRemoveCover(e.target.checked)}
                        disabled={!!newCoverFile}
                        className="h-3 w-3 rounded border-border bg-input text-primary"
                      />
                      <span>
                        Hapus cover (tanpa mengganti baru)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {relationsLoading && (
                <p className="text-[11px] text-muted-foreground">
                  Memuat data genre & author...
                </p>
              )}

              <div className="space-y-2 border-t border-border pt-2 text-[11px]">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Format</p>
                  <select
                    value={selectedFormatId}
                    onChange={(e) => setSelectedFormatId(e.target.value)}
                    className="w-full rounded border border-border bg-input px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
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
                  <p className="font-medium text-foreground">Genre</p>
                  <div className="max-h-32 overflow-y-auto rounded border border-border bg-input px-2 py-2">
                    {genres.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        Belum ada genre di database.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {genres.map((g) => (
                          <label key={g.id} className="inline-flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={selectedGenreIds.includes(g.id)}
                              onChange={() => toggleGenre(g.id)}
                              className="h-3 w-3 rounded border-border bg-input text-primary"
                            />
                            <span className="text-[11px]">{g.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-medium text-foreground">Author (Story)</p>
                  <div className="max-h-32 overflow-y-auto rounded border border-border bg-input px-2 py-2">
                    {authors.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        Belum ada author di database.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {authors.map((a) => (
                          <label key={a.id} className="inline-flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={storyAuthorIds.includes(a.id)}
                              onChange={() => toggleStoryAuthor(a.id)}
                              className="h-3 w-3 rounded border-border bg-input text-primary"
                            />
                            <span className="text-[11px]">{a.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-medium text-foreground">Author (Art)</p>
                  <div className="max-h-32 overflow-y-auto rounded border border-border bg-input px-2 py-2">
                    {authors.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        Belum ada author di database.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {authors.map((a) => (
                          <label key={a.id} className="inline-flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={artAuthorIds.includes(a.id)}
                              onChange={() => toggleArtAuthor(a.id)}
                              className="h-3 w-3 rounded border-border bg-input text-primary"
                            />
                            <span className="text-[11px]">{a.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
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


