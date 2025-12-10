import Link from "next/link";
import SearchBar from "./SearchBar";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border/60">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6"
        aria-label="Navigasi utama"
      >
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight hover:opacity-90 transition-opacity shrink-0"
          aria-label="Home"
        >
          SSSS Komik
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <Link
            href="/daftar-komik"
            className="hover:text-foreground transition-colors"
          >
            Daftar Komik
          </Link>
        </div>

        <div className="flex-1 max-w-md">
          <SearchBar />
        </div>
      </nav>
    </header>
  );
}

