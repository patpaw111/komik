"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabaseBrowser.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="text-xs rounded border border-neutral-700 px-3 py-1 text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Keluar..." : "Logout"}
    </button>
  );
}


