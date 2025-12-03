"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // sanitasi ringan di sisi client
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    setError(null);
    setLoading(true);

    try {
      const { error } = await supabaseBrowser.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (error) {
        // jangan bocorkan detail error ke user (hindari user enumeration)
        console.warn("[LoginPage] auth error", error);
        setError("Login gagal. Cek kembali email dan password kamu.");
        return;
      }

      // kalau sukses, arahkan ke dashboard admin
      router.push("/dashboard-admin/series");
      router.refresh();
    } catch (err) {
      console.error("[LoginPage] unexpected error", err);
      setError("Terjadi kesalahan saat login, coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h1 className="mb-1 text-2xl font-semibold text-foreground">Login Admin</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Masuk dengan akun admin Supabase untuk mengakses dashboard.
        </p>

        {error && (
          <p className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Masuk..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}


