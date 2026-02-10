import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { usePageBlocks } from "@/hooks/use-page-blocks";
import { PAGE_IDS, EVENTI_DEFAULTS } from "@/lib/page-defaults";
import type { Event } from "@shared/schema";

export default function Eventi() {
  const { t } = useLanguage();
  const { deviceView } = useAdmin();

  const { getBlock, updateBlock, isLoading: blocksLoading } = usePageBlocks({
    pageId: PAGE_IDS.eventi,
    defaults: EVENTI_DEFAULTS,
  });

  const heroBlock = getBlock("hero");
  const introBlock = getBlock("intro");

  const heroDef = EVENTI_DEFAULTS[0];
  const introDef = EVENTI_DEFAULTS[1];

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const handleHeroTitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!heroBlock) return;
    updateBlock(heroBlock.id, {
      titleIt: data.textIt,
      titleEn: data.textEn,
      titleFontSize: data.fontSizeDesktop,
      titleFontSizeMobile: data.fontSizeMobile,
    });
  };

  const handleHeroImageSave = (data: {
    src: string;
    zoomDesktop: number;
    zoomMobile: number;
    offsetXDesktop: number;
    offsetYDesktop: number;
    offsetXMobile: number;
    offsetYMobile: number;
  }) => {
    if (!heroBlock) return;
    updateBlock(heroBlock.id, {
      imageUrl: data.src,
      imageScaleDesktop: data.zoomDesktop,
      imageScaleMobile: data.zoomMobile,
      imageOffsetX: data.offsetXDesktop,
      imageOffsetY: data.offsetYDesktop,
      imageOffsetXMobile: data.offsetXMobile,
      imageOffsetYMobile: data.offsetYMobile,
    });
  };

  const handleIntroSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!introBlock) return;
    updateBlock(introBlock.id, {
      bodyIt: data.textIt,
      bodyEn: data.textEn,
      bodyFontSize: data.fontSizeDesktop,
      bodyFontSizeMobile: data.fontSizeMobile,
    });
  };

  if (blocksLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-80px)] flex flex-col">
        <section className="relative h-[60vh] shrink-0 flex items-center justify-center">
          <div className="absolute inset-y-0 left-4 right-4 md:left-0 md:right-0 rounded-xl md:rounded-none overflow-hidden">
            <EditableImage
              src={heroBlock?.imageUrl || heroDef.imageUrl || ""}
              zoomDesktop={heroBlock?.imageScaleDesktop || heroDef.imageScaleDesktop || 100}
              zoomMobile={heroBlock?.imageScaleMobile || heroDef.imageScaleMobile || 100}
              offsetXDesktop={heroBlock?.imageOffsetX || heroDef.imageOffsetX || 0}
              offsetYDesktop={heroBlock?.imageOffsetY || heroDef.imageOffsetY || 0}
              offsetXMobile={heroBlock?.imageOffsetXMobile || heroDef.imageOffsetXMobile || 0}
              offsetYMobile={heroBlock?.imageOffsetYMobile || heroDef.imageOffsetYMobile || 0}
              deviceView={deviceView}
              containerClassName="absolute inset-0"
              className="w-full h-full object-cover"
              loading="eager"
              onSave={handleHeroImageSave}
            />
            <div className="absolute inset-0 bg-black/35 pointer-events-none" />
          </div>
          <div className="relative z-10 text-center text-white">
            <EditableText
              textIt={heroBlock?.titleIt || heroDef.titleIt || ""}
              textEn={heroBlock?.titleEn || heroDef.titleEn || ""}
              fontSizeDesktop={heroBlock?.titleFontSize || heroDef.titleFontSize || 72}
              fontSizeMobile={heroBlock?.titleFontSizeMobile || heroDef.titleFontSizeMobile || 40}
              as="h1"
              className="font-display drop-shadow-lg"
              applyFontSize
              onSave={handleHeroTitleSave}
            />
          </div>
        </section>

        <section className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 max-w-2xl text-center py-6">
            <EditableText
              textIt={introBlock?.bodyIt || introDef.bodyIt || ""}
              textEn={introBlock?.bodyEn || introDef.bodyEn || ""}
              fontSizeDesktop={introBlock?.bodyFontSize || introDef.bodyFontSize || 20}
              fontSizeMobile={introBlock?.bodyFontSizeMobile || introDef.bodyFontSizeMobile || 14}
              as="p"
              className="text-muted-foreground"
              multiline
              applyFontSize
              onSave={handleIntroSave}
            />
          </div>
        </section>
      </div>

      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          {eventsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="aspect-[9/16] w-full rounded-lg" />
              ))}
            </div>
          ) : !events || events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-events-empty">
                {t("Nessun evento in programma al momento.", "No events scheduled at the moment.")}
              </p>
            </div>
          ) : (() => {
            const sortedEvents = [...events].sort((a, b) => {
              if (!a.startAt) return 1;
              if (!b.startAt) return -1;
              return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nextEventIndex = sortedEvents.findIndex(e => {
              if (!e.startAt) return false;
              const eventDate = new Date(e.startAt);
              eventDate.setHours(0, 0, 0, 0);
              return eventDate >= today;
            });
            const initialIndex = nextEventIndex >= 0 ? nextEventIndex : 0;

            return (
              <>
                <div className="hidden md:block">
                  {sortedEvents.length > 3 ? (
                    <EventsSlider events={sortedEvents} initialIndex={initialIndex} />
                  ) : (
                    <div className="flex flex-wrap justify-center gap-8">
                      {sortedEvents.map((event) => (
                        <div key={event.id} className="w-[560px]">
                          <EventCard event={event} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="md:hidden">
                  <MobileEventsSlider events={sortedEvents} initialIndex={initialIndex} />
                </div>
              </>
            );
          })()}
        </div>
      </section>
    </PublicLayout>
  );
}

function EventCard({ event }: { event: Event }) {
  const { t, language } = useLanguage();

  const formatDateLine = (dateStr: string | Date | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    const formatted = date.toLocaleDateString(language === "it" ? "it-IT" : "en-US", options);
    return formatted.toUpperCase();
  };

  return (
    <Link href={`/eventi/${event.id}`}>
      <div
        className="group relative flex flex-col cursor-pointer"
        data-testid={`event-card-${event.id}`}
      >
        <div className="mb-4 text-center">
          {event.startAt && (
            <div className="text-xs md:text-sm tracking-normal mb-1 font-sans text-muted-foreground uppercase">
              {formatDateLine(event.startAt)}
            </div>
          )}

          <h3 className="font-display text-lg md:text-2xl line-clamp-2 tracking-wide" style={{ color: '#722F37' }}>
            {language === "it" ? event.titleIt : event.titleEn}
          </h3>
        </div>

        <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-card border border-border hover-elevate">
          {event.posterUrl ? (
            <div className="w-full h-full overflow-hidden">
              <img
                src={event.posterUrl}
                alt={language === "it" ? event.titleIt : event.titleEn}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ transformOrigin: "center center" }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function EventsSlider({ events, initialIndex = 0 }: { events: Event[]; initialIndex?: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    if (scrollRef.current && initialIndex > 0) {
      const cardWidth = 560 + 32;
      scrollRef.current.scrollTo({
        left: initialIndex * cardWidth,
        behavior: "auto",
      });
    }
    checkScrollButtons();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScrollButtons);
      return () => el.removeEventListener("scroll", checkScrollButtons);
    }
  }, [events, initialIndex]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 420;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        className={`hidden md:flex flex-shrink-0 w-14 h-14 items-center justify-center rounded-full bg-background border-2 border-border shadow-xl hover-elevate transition-opacity ${!canScrollLeft ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
        data-testid="button-scroll-left"
      >
        <ChevronLeft className="h-7 w-7" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth py-4 max-w-[1800px]"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {events.map((event) => (
          <div key={event.id} className="w-[560px] flex-shrink-0">
            <EventCard event={event} />
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        className={`hidden md:flex flex-shrink-0 w-14 h-14 items-center justify-center rounded-full bg-background border-2 border-border shadow-xl hover-elevate transition-opacity ${!canScrollRight ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
        data-testid="button-scroll-right"
      >
        <ChevronRight className="h-7 w-7" />
      </button>
    </div>
  );
}

function MobileEventsSlider({ events, initialIndex = 0 }: { events: Event[]; initialIndex?: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.offsetWidth;
      const newIndex = Math.round(scrollRef.current.scrollLeft / cardWidth);
      setCurrentIndex(newIndex);
    }
  };

  useEffect(() => {
    if (scrollRef.current && initialIndex > 0) {
      const cardWidth = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: initialIndex * cardWidth,
        behavior: "auto",
      });
    }
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [initialIndex]);

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < events.length - 1;

  return (
    <div className="flex flex-col items-center">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {events.map((event) => (
          <div key={event.id} className="w-full flex-shrink-0 snap-center px-8">
            <div className="max-w-[280px] mx-auto">
              <EventCard event={event} />
            </div>
          </div>
        ))}
      </div>

      {events.length > 1 && (
        <div className="mt-6 flex gap-3">
          {events.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`w-3 h-3 rounded-full transition-all ${i === currentIndex ? 'bg-primary scale-110' : 'bg-muted-foreground/30'}`}
              data-testid={`button-dot-${i}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
