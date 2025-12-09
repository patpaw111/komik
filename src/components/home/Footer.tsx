import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <div className="space-y-1">
          <p className="font-semibold text-foreground">SSSS Komik</p>
          <p>Tempat baca komik favoritmu. Update cepat & nyaman dibaca.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/tos" className="hover:text-foreground">
            Ketentuan
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privasi
          </Link>
          <Link href="mailto:hi@sssskomik.com" className="hover:text-foreground">
            Kontak
          </Link>
        </div>
      </div>
    </footer>
  );
}

