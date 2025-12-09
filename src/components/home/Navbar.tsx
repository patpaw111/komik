import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border/60">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6"
        aria-label="Navigasi utama"
      >
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight hover:opacity-90 transition-opacity"
            aria-label="Beranda"
          >
            SSSS Komik
          </Link>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Beta
          </span>
        </div>

        <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/" className="hover:text-foreground transition-colors">
            Beranda
          </Link>
          <Link
            href="/genre"
            className="hover:text-foreground transition-colors"
          >
            Genre
          </Link>
          <Link
            href="/terbaru"
            className="hover:text-foreground transition-colors"
          >
            Terbaru
          </Link>
        </div>

        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          aria-label="Cari komik"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            className="h-4 w-4 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 5 5" />
          </svg>
          <span className="hidden sm:inline">Cari komik</span>
          <span className="inline sm:hidden">Cari</span>
        </Link>
      </nav>
    </header>
  );
}

