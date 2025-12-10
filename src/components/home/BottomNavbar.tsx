"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNavbar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: "/daftar-komik",
      label: "Daftar Komik",
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <line x1="9" x2="9" y1="3" y2="21" />
          <line x1="9" x2="21" y1="9" y2="9" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden"
      aria-label="Navigasi bawah"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={item.label}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

