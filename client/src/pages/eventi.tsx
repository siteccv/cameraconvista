import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
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

  const upcomingEvents = events?.filter(e => e.eventDate && new Date(e.eventDate) >= new Date()) ?? [];
  const pastEvents = events?.filter(e => e.eventDate && new Date(e.eventDate) < new Date()) ?? [];

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
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
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

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 max-w-2xl mx-auto">
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

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 w-full rounded-lg" />
              ))}
            </div>
          ) : upcomingEvents.length === 0 && pastEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-events-empty">
                {t("Nessun evento in programma al momento.", "No events scheduled at the moment.")}
              </p>
            </div>
          ) : (
            <>
              {upcomingEvents.length > 0 && (
                <div className="mb-16">
                  <h2 className="font-display text-2xl md:text-3xl text-center mb-8" data-testid="text-upcoming-events">
                    {t("Prossimi Eventi", "Upcoming Events")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl md:text-3xl text-center mb-8 text-muted-foreground" data-testid="text-past-events">
                    {t("Eventi Passati", "Past Events")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                    {pastEvents.slice(0, 6).map((event) => (
                      <EventCard key={event.id} event={event} isPast />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

function EventCard({ event, isPast = false }: { event: Event; isPast?: boolean }) {
  const { t, language } = useLanguage();

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "it" ? "it-IT" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div 
      className={`group rounded-placeholder overflow-hidden border border-border bg-card ${isPast ? "" : "hover-elevate"}`}
      data-testid={`event-card-${event.id}`}
    >
      {event.imageUrl && (
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={event.imageUrl}
            alt={t(event.titleIt, event.titleEn) || ""}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-4 md:p-6">
        <h3 className="font-display text-xl mb-2">{t(event.titleIt, event.titleEn)}</h3>
        {(event.descriptionIt || event.descriptionEn) && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {t(event.descriptionIt, event.descriptionEn)}
          </p>
        )}
        {event.eventDate && (
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.eventDate)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
