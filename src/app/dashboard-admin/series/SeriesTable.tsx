"use client";

import { useRouter } from "next/navigation";
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
};

type Props = {
  items: SeriesItem[];
  error?: string | null;
};

type FormatOption = { id: string; name: string };
type GenreOption = { id: string; name: string };
type AuthorOption = { id: string; name: string };

export function SeriesTable({ items, error }: Props) {
  const router = useRouter();
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

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Total series: {items.length}
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
        <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="px-2 py-2">Judul</th>
                <th className="px-2 py-2">Slug</th>
                <th className="px-2 py-2">Status</th>
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
                      {item.title}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <code className="rounded bg-muted px-2 py-0.5 text-[11px]">
                      {item.slug}
                    </code>
                  </td>
                  <td className="px-2 py-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {item.status}
                    </span>
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


