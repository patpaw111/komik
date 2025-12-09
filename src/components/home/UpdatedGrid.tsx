import Link from "next/link";
import ComicCard from "./ComicCard";
import type { ComicUpdate } from "@/data/home";

type Props = {
  items: ComicUpdate[];
};

export default function UpdatedGrid({ items }: Props) {
  return (
    <section
      className="mx-auto max-w-7xl px-4 pb-12 md:px-6"
      aria-labelledby="section-update"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="section-update"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Update Terbaru
          </h2>
          <p className="text-sm text-muted-foreground">
            Lanjutkan baca dengan cepat dari update terakhir
          </p>
        </div>
        <Link
          href="/update"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Lihat semua
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item) => (
          <ComicCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

