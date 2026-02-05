import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { BookingDialog } from "@/components/home/BookingDialog";
import type { Event } from "@shared/schema";

export default function EventDetail() {
  const { t, language } = useLanguage();
  const [, params] = useRoute("/eventi/:id");
  const eventId = params?.id;
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString(language === "it" ? "it-IT" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formatTime = (dateStr: string | Date | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString(language === "it" ? "it-IT" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-32 mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <Skeleton className="aspect-[9/16] w-full rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !event) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl mb-4" data-testid="text-event-not-found">
            {t("Evento non trovato", "Event not found")}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t("L'evento che stai cercando non esiste o non è più disponibile.", "The event you're looking for doesn't exist or is no longer available.")}
          </p>
          <Link href="/eventi">
            <Button variant="outline" data-testid="button-back-to-events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("Torna agli eventi", "Back to events")}
            </Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const title = language === "it" ? event.titleIt : event.titleEn;
  const description = language === "it" ? event.descriptionIt : event.descriptionEn;
  const details = language === "it" ? event.detailsIt : event.detailsEn;

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          <Link href="/eventi">
            <Button variant="ghost" className="mb-6" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("Tutti gli eventi", "All events")}
            </Button>
          </Link>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="relative aspect-[9/16] max-h-[65vh] md:max-h-none rounded-lg overflow-hidden bg-muted border mx-auto w-full md:w-auto">
              {event.posterUrl ? (
                <img
                  src={event.posterUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  style={{
                    transform: `scale(${(event.posterZoom || 100) / 100}) translate(${event.posterOffsetX || 0}%, ${event.posterOffsetY || 0}%)`,
                  }}
                  data-testid="img-event-poster"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Calendar className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl md:text-4xl mb-4" data-testid="text-event-title">
                  {title}
                </h1>

                {event.startAt && (
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      <span>{formatDate(event.startAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span>{formatTime(event.startAt)}</span>
                    </div>
                  </div>
                )}
              </div>

              {description && (
                <div>
                  <h2 className="font-display text-xl mb-2">
                    {t("Descrizione", "Description")}
                  </h2>
                  <p className="text-muted-foreground whitespace-pre-line" data-testid="text-event-description">
                    {description}
                  </p>
                </div>
              )}

              {details && (
                <div>
                  <h2 className="font-display text-xl mb-2">
                    {t("Dettagli", "Details")}
                  </h2>
                  <div 
                    className="text-muted-foreground whitespace-pre-line" 
                    data-testid="text-event-details"
                  >
                    {details}
                  </div>
                </div>
              )}

              {event.bookingEnabled && (
                <div className="pt-4 flex flex-col items-center md:items-start gap-3">
                  <Button
                    className="min-w-[200px] md:min-w-[240px] px-6 py-4 text-[10px] tracking-[0.08em] md:px-10 md:py-5 md:text-xs md:tracking-[0.1em] font-medium text-white rounded-full shadow-lg"
                    style={{ 
                      backgroundColor: '#722f37',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                    onClick={() => setShowBookingDialog(true)}
                    data-testid="button-book-event"
                  >
                    {t("PRENOTA UN TAVOLO", "BOOK A TABLE")}
                  </Button>
                  
                  {details && (details.includes("soci") || details.includes("members")) && (
                    <Button
                      className="min-w-[200px] md:min-w-[240px] px-6 py-4 text-[10px] tracking-[0.08em] md:px-10 md:py-5 md:text-xs md:tracking-[0.1em] font-medium rounded-full shadow-lg border-0"
                      style={{ 
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                      onClick={() => window.open("https://camerajazzclub.com/registrati/", "_blank")}
                      data-testid="button-become-member"
                    >
                      {t("DIVENTA SOCIO", "BECOME A MEMBER")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BookingDialog 
        open={showBookingDialog} 
        onOpenChange={setShowBookingDialog}
        isMobile={false}
      />
    </PublicLayout>
  );
}
