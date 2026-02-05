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
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@shared/schema";

export default function Eventi() {
  const { t } = useLanguage();
  const { deviceView } = useAdmin();
  const { toast } = useToast();

  const [heroTitle, setHeroTitle] = useState({
    it: "Eventi", en: "Events",
    fontSizeDesktop: 72, fontSizeMobile: 40
  });
  const [heroImage, setHeroImage] = useState({
    src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    zoomDesktop: 100, zoomMobile: 100,
    offsetXDesktop: 0, offsetYDesktop: 0,
    offsetXMobile: 0, offsetYMobile: 0,
  });
  const [introText, setIntroText] = useState({
    it: "Scopri i nostri eventi speciali: serate a tema, degustazioni, musica dal vivo e molto altro.",
    en: "Discover our special events: themed nights, tastings, live music and much more.",
    fontSizeDesktop: 16, fontSizeMobile: 14
  });

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const handleTextSave = (field: string, data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    switch (field) {
      case "heroTitle":
        setHeroTitle({ it: data.textIt, en: data.textEn, fontSizeDesktop: data.fontSizeDesktop, fontSizeMobile: data.fontSizeMobile });
        break;
      case "introText":
        setIntroText({ it: data.textIt, en: data.textEn, fontSizeDesktop: data.fontSizeDesktop, fontSizeMobile: data.fontSizeMobile });
        break;
    }
    toast({ title: t("Salvato", "Saved"), description: t("Le modifiche sono state salvate.", "Changes have been saved.") });
  };

  const handleHeroImageSave = (data: typeof heroImage) => {
    setHeroImage(data);
    toast({ title: t("Salvato", "Saved"), description: t("Immagine aggiornata.", "Image updated.") });
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-80px)] flex flex-col">
        <section className="relative h-[60vh] shrink-0 flex items-center justify-center">
          <div className="absolute inset-y-0 left-4 right-4 md:left-0 md:right-0 rounded-xl md:rounded-none overflow-hidden">
            <EditableImage
              src={heroImage.src}
              zoomDesktop={heroImage.zoomDesktop}
              zoomMobile={heroImage.zoomMobile}
              offsetXDesktop={heroImage.offsetXDesktop}
              offsetYDesktop={heroImage.offsetYDesktop}
              offsetXMobile={heroImage.offsetXMobile}
              offsetYMobile={heroImage.offsetYMobile}
              deviceView={deviceView}
              containerClassName="absolute inset-0"
              className="w-full h-full object-cover"
              onSave={handleHeroImageSave}
            />
            <div 
              className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 pointer-events-none"
            />
          </div>
          <div className="relative z-10 text-center text-white">
            <EditableText
              textIt={heroTitle.it}
              textEn={heroTitle.en}
              fontSizeDesktop={heroTitle.fontSizeDesktop}
              fontSizeMobile={heroTitle.fontSizeMobile}
              as="h1"
              className="font-display drop-shadow-lg"
              applyFontSize
              onSave={(data) => handleTextSave("heroTitle", data)}
            />
          </div>
        </section>

        <section className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 max-w-2xl text-center py-6">
            <EditableText
              textIt={introText.it}
              textEn={introText.en}
              fontSizeDesktop={introText.fontSizeDesktop}
              fontSizeMobile={introText.fontSizeMobile}
              as="p"
              className="text-muted-foreground"
              multiline
              applyFontSize
              onSave={(data) => handleTextSave("introText", data)}
            />
          </div>
        </section>
      </div>

      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          {isLoading ? (
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
    if (!dateStr) return { month: "", day: "", weekday: "" };
    const date = new Date(dateStr);
    const month = date.toLocaleDateString(language === "it" ? "it-IT" : "en-US", { month: "short" }).toUpperCase().replace(".", "");
    const day = date.getDate().toString().padStart(2, "0");
    const weekday = date.toLocaleDateString(language === "it" ? "it-IT" : "en-US", { weekday: "long" }).toUpperCase();
    return { month, day, weekday };
  };

  return (
    <Link href={`/eventi/${event.id}`}>
      <div 
        className="group relative aspect-[9/16] rounded-lg overflow-hidden bg-card border border-border cursor-pointer hover-elevate"
        data-testid={`event-card-${event.id}`}
      >
        {event.posterUrl ? (
          <div className="w-full h-full overflow-hidden">
            <img
              src={event.posterUrl}
              alt={language === "it" ? event.titleIt : event.titleEn}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              style={{
                transformOrigin: "center center",
              }}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Calendar className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        <div className="absolute bottom-0 left-0 right-0 p-4 text-white text-center md:text-left">
          {event.startAt && (() => {
            const { month, day, weekday } = formatDateLine(event.startAt);
            return (
              <div className="text-base md:text-lg tracking-tight mb-2">
                <span className="text-white">{month}</span>
                <span className="text-yellow-200 font-semibold">{day}</span>
                <span className="text-white">{weekday}</span>
              </div>
            );
          })()}
          
          <h3 className="font-display text-base md:text-xl line-clamp-2">
            {language === "it" ? event.titleIt : event.titleEn}
          </h3>
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
      <div className="flex items-center justify-center gap-2 w-full">
        {events.length > 1 && (
          <button
            onClick={() => scrollToIndex(currentIndex - 1)}
            disabled={!canScrollLeft}
            className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-background/90 border border-border shadow-lg transition-opacity ${!canScrollLeft ? 'opacity-30' : 'opacity-100'}`}
            data-testid="button-mobile-scroll-left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide flex-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {events.map((event) => (
            <div key={event.id} className="w-full flex-shrink-0 snap-center px-4">
              <div className="max-w-[280px] mx-auto">
                <EventCard event={event} />
              </div>
            </div>
          ))}
        </div>

        {events.length > 1 && (
          <button
            onClick={() => scrollToIndex(currentIndex + 1)}
            disabled={!canScrollRight}
            className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-background/90 border border-border shadow-lg transition-opacity ${!canScrollRight ? 'opacity-30' : 'opacity-100'}`}
            data-testid="button-mobile-scroll-right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {events.length > 1 && (
        <div className="mt-4 flex gap-2">
          {events.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
