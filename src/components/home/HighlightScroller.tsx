"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type HighlightChapter = {
  id: string;
  title: string;
  chapterLabel: string;
  cover: string;
  tagline?: string;
  updatedAtText: string;
  slug?: string;
};

type Props = {
  items: HighlightChapter[];
};

export default function HighlightScroller({ items }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const cardWidth = container.clientWidth * 0.22; // 22% untuk desktop
    container.scrollBy({
      left: -cardWidth,
      behavior: 'smooth',
    });
    
    // Update state after scroll animation
    setTimeout(checkScrollability, 300);
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const cardWidth = container.clientWidth * 0.22; // 22% untuk desktop
    container.scrollBy({
      left: cardWidth,
      behavior: 'smooth',
    });
    
    // Update state after scroll animation
    setTimeout(checkScrollability, 300);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;
    let hasMoved = false;

    const handleMouseDown = (e: MouseEvent) => {
      // Jangan aktifkan drag jika klik di Link
      const target = e.target as HTMLElement;
      if (target.closest('a')) {
        return;
      }
      
      isDown = true;
      hasMoved = false;
      container.style.cursor = 'grabbing';
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
      hasMoved = false;
      container.style.cursor = 'grab';
    };

    const handleMouseUp = () => {
      isDown = false;
      hasMoved = false;
      container.style.cursor = 'grab';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      
      // Deteksi jika ada pergerakan signifikan (lebih dari 10px)
      if (Math.abs(walk) > 10) {
        hasMoved = true;
        e.preventDefault();
        e.stopPropagation();
        container.scrollLeft = scrollLeft - walk;
      }
    };

    // Handle touch events untuk mobile
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a')) {
        return;
      }
      
      isDown = true;
      hasMoved = false;
      startX = e.touches[0].pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDown) return;
      
      const x = e.touches[0].pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      
      if (Math.abs(walk) > 10) {
        hasMoved = true;
        e.preventDefault();
        container.scrollLeft = scrollLeft - walk;
      }
    };

    const handleTouchEnd = () => {
      isDown = false;
      hasMoved = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('scroll', checkScrollability);

    // Check initial state
    checkScrollability();

    // Check on resize
    const handleResize = () => {
      checkScrollability();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
          href="/daftar-komik"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          View More
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="relative">
        {/* Left Arrow Button - Desktop Only */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-background transition-all hover:scale-110"
            aria-label="Scroll left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
        )}

        {/* Right Arrow Button - Desktop Only */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-background transition-all hover:scale-110"
            aria-label="Scroll right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          className="no-scrollbar flex gap-4 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory scroll-smooth"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
            cursor: 'grab',
          }}
        >
        {items.map((item) => {
          const href = item.slug ? `/komik/${item.slug}` : '#';
          return (
            <Link
              key={item.id}
              href={href}
              className="group relative min-w-[68%] max-w-[68%] shrink-0 snap-start overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:min-w-[42%] sm:max-w-[42%] lg:min-w-[22%] lg:max-w-[22%]"
            >
              <article className="relative aspect-3/4 overflow-hidden">
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
              </article>
            </Link>
          );
        })}
        </div>
      </div>
    </section>
  );
}

