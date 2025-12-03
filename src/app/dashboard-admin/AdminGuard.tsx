"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Props = {
  children: ReactNode;
};

// guard sederhana: pastikan user sudah login sebelum bisa akses dashboard-admin
// untuk saat ini, semua user yang berhasil login dianggap admin
// (kalau nanti mau multi-role, bisa ditambah cek tabel profiles di sisi server)
export function AdminGuard({ children }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        setChecking(false);
      } catch (err) {
        console.error("[AdminGuard] error", err);
        router.replace("/login");
      }
    };

    run();
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Memeriksa sesi login...</p>
      </main>
    );
  }

  return <>{children}</>;
}



