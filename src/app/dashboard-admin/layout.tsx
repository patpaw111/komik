"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutButton } from "./LogoutButton";
import { AdminGuard } from "./AdminGuard";

type Props = {
  children: ReactNode;
};

const NAV_ITEMS = [
  { href: "/dashboard-admin/series", label: "Series" },
  { href: "/dashboard-admin/genres", label: "Genres" },
  // nanti bisa ditambah: chapters, formats, authors, users, dll
];

export default function DashboardLayout({ children }: Props) {
  const pathname = usePathname();

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <aside className="hidden w-64 flex-col border-r border-border bg-card/80 px-4 py-6 md:flex">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">SSSS Komik</h1>
              <p className="text-xs text-muted-foreground">Dashboard Admin</p>
            </div>
          </div>

          <nav className="space-y-1 text-sm">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded px-3 py-2 ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <LogoutButton />
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}


