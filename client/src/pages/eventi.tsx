import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
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
          ) : events.length > 3 ? (
            <EventsSlider events={events} />
          ) : (
            <div className="flex flex-wrap justify-center gap-8">
              {events.map((event) => (
                <div key={event.id} className="w-[calc(50%-1rem)] sm:w-[calc(33.333%-1.5rem)] md:w-[400px] lg:w-[400px]">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

function EventCard({ event }: { event: Event }) {
  const { t, language } = useLanguage();

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "it" ? "it-IT" : "en-US", {
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (dateStr: string | Date | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString(language === "it" ? "it-IT" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-display text-base md:text-xl mb-2 line-clamp-2">
            {language === "it" ? event.titleIt : event.titleEn}
          </h3>
          
          {event.startAt && (
            <div className="flex items-center gap-1.5 text-sm text-white/80">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.startAt)}</span>
              <span className="ml-1">{formatTime(event.startAt)}</span>
            </div>
          )}

          {event.bookingEnabled && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="secondary"
                className="w-full text-sm h-8"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(event.bookingUrl || "https://cameraconvista.resos.com/booking", "_blank");
                }}
                data-testid={`button-book-${event.id}`}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                {t("Prenota", "Book")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function EventsSlider({ events }: { events: Event[] }) {
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
    checkScrollButtons();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScrollButtons);
      return () => el.removeEventListener("scroll", checkScrollButtons);
    }
  }, [events]);

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
    <div className="relative flex items-center justify-center">
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        className={`hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-10 w-14 h-14 items-center justify-center rounded-full bg-background border-2 border-border shadow-xl hover-elevate transition-opacity ${!canScrollLeft ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
        data-testid="button-scroll-left"
      >
        <ChevronLeft className="h-7 w-7" />
      </button>
      
      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth py-4 max-w-[1320px] mx-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {events.map((event) => (
          <div key={event.id} className="w-[calc(50%-1rem)] sm:w-[calc(33.333%-1.5rem)] md:w-[400px] flex-shrink-0 first:ml-4 last:mr-4 md:first:ml-0 md:last:mr-0">
            <EventCard event={event} />
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        className={`hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-10 w-14 h-14 items-center justify-center rounded-full bg-background border-2 border-border shadow-xl hover-elevate transition-opacity ${!canScrollRight ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
        data-testid="button-scroll-right"
      >
        <ChevronRight className="h-7 w-7" />
      </button>
    </div>
  );
}
