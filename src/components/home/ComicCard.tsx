import Image from "next/image";
import type { ComicUpdate } from "@/data/home";

type Props = {
  item: ComicUpdate;
};

export default function ComicCard({ item }: Props) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-3/4 overflow-hidden">
        <Image
          src={item.cover}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute left-3 right-3 top-3 flex items-center gap-2 text-xs font-semibold text-white">
          <span className="rounded-full bg-black/50 px-2 py-1 backdrop-blur">
            {item.latestChapter}
          </span>
          <span className="rounded-full bg-primary px-2 py-1 text-primary-foreground shadow">
            {item.releaseAgo}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
          {item.title}
        </h3>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-foreground">
              {item.latestChapter}
            </span>
            <span className="text-[11px]">• {item.releaseAgo}</span>
          </div>
          {item.previousChapter && item.previousAgo ? (
            <p className="text-[11px]">
              {item.previousChapter} • {item.previousAgo}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

