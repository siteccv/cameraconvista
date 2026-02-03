import { useLanguage } from "@/contexts/LanguageContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import type { Event } from "@shared/schema";

export default function Eventi() {
  const { t } = useLanguage();

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const upcomingEvents = events?.filter(e => e.eventDate && new Date(e.eventDate) >= new Date()) ?? [];
  const pastEvents = events?.filter(e => e.eventDate && new Date(e.eventDate) < new Date()) ?? [];

  return (
    <PublicLayout>
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(30,25,20,0.5), rgba(30,25,20,0.7)), url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
          }}
        />
        <div className="relative z-10 text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl drop-shadow-lg" data-testid="text-events-hero">
            {t("Eventi", "Events")}
          </h1>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-muted-foreground" data-testid="text-events-intro">
              {t(
                "Scopri i nostri eventi speciali: serate a tema, degustazioni, musica dal vivo e molto altro.",
                "Discover our special events: themed nights, tastings, live music and much more."
              )}
            </p>
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
