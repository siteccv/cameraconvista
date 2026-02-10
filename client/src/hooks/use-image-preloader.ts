import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PageBlock } from "@shared/schema";

const preloadedUrls = new Set<string>();

function preloadImage(url: string) {
  if (!url || preloadedUrls.has(url)) return;
  preloadedUrls.add(url);
  const img = new Image();
  img.src = url;
}

export function useImagePreloader() {
  const started = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { data: pages = [] } = useQuery<{ id: number; slug: string }[]>({
    queryKey: ["/api/pages"],
  });

  useEffect(() => {
    if (started.current || pages.length === 0) return;
    started.current = true;

    const slugs = pages.map(p => p.slug).filter(s => s !== "eventi-privati");

    let delay = 0;
    for (const slug of slugs) {
      const t = setTimeout(() => {
        fetch(`/api/pages/slug/${slug}/blocks`)
          .then(r => r.ok ? r.json() : [])
          .then((blocks: PageBlock[]) => {
            for (const block of blocks) {
              if (block.imageUrl) preloadImage(block.imageUrl);
            }
          })
          .catch(() => {});
      }, delay);
      timers.current.push(t);
      delay += 100;
    }

    const tGallery = setTimeout(() => {
      fetch("/api/galleries")
        .then(r => r.ok ? r.json() : [])
        .then((galleries: { coverUrl?: string }[]) => {
          for (const g of galleries) {
            if (g.coverUrl) preloadImage(g.coverUrl);
          }
        })
        .catch(() => {});
    }, delay);
    timers.current.push(tGallery);
    delay += 100;

    const tEvents = setTimeout(() => {
      fetch("/api/events")
        .then(r => r.ok ? r.json() : [])
        .then((events: { posterUrl?: string }[]) => {
          for (const ev of events) {
            if (ev.posterUrl) preloadImage(ev.posterUrl);
          }
        })
        .catch(() => {});
    }, delay);
    timers.current.push(tEvents);

    return () => {
      for (const t of timers.current) clearTimeout(t);
      timers.current = [];
    };
  }, [pages]);
}

export function preloadImageUrl(url: string) {
  preloadImage(url);
}
