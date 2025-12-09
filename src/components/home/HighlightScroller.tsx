import Image from "next/image";
import Link from "next/link";

export type HighlightChapter = {
  id: string;
  title: string;
  chapterLabel: string;
  cover: string;
  tagline?: string;
  updatedAtText: string;
};

type Props = {
  items: HighlightChapter[];
};

export default function HighlightScroller({ items }: Props) {
  return (
    <section
      className="mx-auto max-w-7xl px-4 pb-10 pt-8 md:px-6 md:pt-10"
      aria-labelledby="section-new"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="section-new"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          New
        </h2>
        <Link
          href="/terbaru"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          View More
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {items.map((item) => (
          <article
            key={item.id}
            className="group relative min-w-[68%] max-w-[68%] snap-start overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:min-w-[42%] sm:max-w-[42%] lg:min-w-[22%] lg:max-w-[22%]"
          >
            <div className="relative aspect-3/4 overflow-hidden">
              <Image
                src={item.cover}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 23vw"
                className="object-cover transition duration-700 group-hover:scale-110"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 space-y-1 text-white">
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <span className="rounded-full bg-primary px-2 py-0.5 font-semibold text-primary-foreground">
                    {item.chapterLabel}
                  </span>
                </div>
                <h3 className="line-clamp-2 text-base font-semibold leading-tight">
                  {item.title}
                </h3>
                {item.tagline ? (
                  <p className="text-xs text-white/80">{item.tagline}</p>
                ) : null}
                <p className="text-xs text-white/70">Update {item.updatedAtText}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

