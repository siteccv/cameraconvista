import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PageBlock } from "@shared/schema";

const preloadedUrls = new Set<string>();
const IDLE_FALLBACK_MS = 1500;

type IdleCallbackHandle = number;
type IdleCallbackScheduler = (
  callback: IdleRequestCallback,
  options?: IdleRequestOptions,
) => IdleCallbackHandle;
type IdleCallbackCanceller = (handle: IdleCallbackHandle) => void;

function preloadImage(url: string) {
  if (!url || preloadedUrls.has(url)) return;
  preloadedUrls.add(url);
  const img = new Image();
  img.src = url;
}

function getIdleScheduler(): {
  requestIdle: IdleCallbackScheduler;
  cancelIdle: IdleCallbackCanceller;
} {
  const globalWindow = window as Window & {
    requestIdleCallback?: IdleCallbackScheduler;
    cancelIdleCallback?: IdleCallbackCanceller;
  };

  return {
    requestIdle:
      globalWindow.requestIdleCallback ??
      ((callback) =>
        window.setTimeout(
          () => callback({ didTimeout: false, timeRemaining: () => 0 }),
          IDLE_FALLBACK_MS,
        )),
    cancelIdle: globalWindow.cancelIdleCallback ?? ((handle) => window.clearTimeout(handle)),
  };
}

function shouldSkipAggressivePreload() {
  const connection = (
    navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
      };
    }
  ).connection;

  if (!connection) return false;
  if (connection.saveData) return true;
  return connection.effectiveType === "slow-2g" || connection.effectiveType === "2g";
}

export function useImagePreloader() {
  const started = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const idleHandle = useRef<IdleCallbackHandle | null>(null);

  const { data: pages = [] } = useQuery<{ id: number; slug: string }[]>({
    queryKey: ["/api/pages"],
  });

  useEffect(() => {
    if (started.current || pages.length === 0) return;
    started.current = true;
    if (shouldSkipAggressivePreload()) return;

    const { requestIdle, cancelIdle } = getIdleScheduler();
    const slugs = pages.map((p) => p.slug).filter((s) => s !== "eventi-privati");

    idleHandle.current = requestIdle(() => {
      let delay = 0;
      for (const slug of slugs) {
        const t = setTimeout(() => {
          fetch(`/api/pages/slug/${slug}/blocks`)
            .then((r) => (r.ok ? r.json() : []))
            .then((blocks: PageBlock[]) => {
              for (const block of blocks) {
                if (block.imageUrl) preloadImage(block.imageUrl);
              }
            })
            .catch(() => {});
        }, delay);
        timers.current.push(t);
        delay += 250;
      }

      const tGallery = setTimeout(() => {
        fetch("/api/galleries")
          .then((r) => (r.ok ? r.json() : []))
          .then((galleries: { coverUrl?: string }[]) => {
            for (const g of galleries) {
              if (g.coverUrl) preloadImage(g.coverUrl);
            }
          })
          .catch(() => {});
      }, delay);
      timers.current.push(tGallery);
      delay += 250;

      const tEvents = setTimeout(() => {
        fetch("/api/events")
          .then((r) => (r.ok ? r.json() : []))
          .then((events: { posterUrl?: string }[]) => {
            for (const ev of events) {
              if (ev.posterUrl) preloadImage(ev.posterUrl);
            }
          })
          .catch(() => {});
      }, delay);
      timers.current.push(tEvents);
    });

    return () => {
      if (idleHandle.current !== null) {
        cancelIdle(idleHandle.current);
        idleHandle.current = null;
      }
      for (const t of timers.current) clearTimeout(t);
      timers.current = [];
    };
  }, [pages]);
}

export function preloadImageUrl(url: string) {
  preloadImage(url);
}
