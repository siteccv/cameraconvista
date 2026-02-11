import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { EventModal } from "@/components/admin/EventModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Calendar, 
  Trash2, 
  Copy,
  Image as ImageIcon,
  ExternalLink
} from "lucide-react";
import type { Event, InsertEvent } from "@shared/schema";

export default function AdminEvents() {
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEvent> }) => {
      const response = await apiRequest("PATCH", `/api/admin/events/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
    },
    onError: () => {
      toast({
        title: t("Errore", "Error"),
        description: t("Impossibile aggiornare l'evento.", "Failed to update event."),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/events/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({
        title: t("Eliminato", "Deleted"),
        description: t("Evento eliminato con successo.", "Event deleted successfully."),
      });
    },
    onError: () => {
      toast({
        title: t("Errore", "Error"),
        description: t("Impossibile eliminare l'evento.", "Failed to delete event."),
        variant: "destructive",
      });
    },
  });

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = a.startAt ? new Date(a.startAt).getTime() : 0;
    const dateB = b.startAt ? new Date(b.startAt).getTime() : 0;
    return dateB - dateA;
  });

  const handleAddEvent = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent({ ...event });
    setModalOpen(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setDeleteTarget(event);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleDuplicateEvent = (event: Event) => {
    if (events.length >= 10) {
      toast({
        title: t("Limite raggiunto", "Limit reached"),
        description: t("Hai raggiunto il limite massimo di 10 eventi.", "You have reached the maximum limit of 10 events."),
        variant: "destructive",
      });
      return;
    }
    
    if (!confirm(t(`Vuoi duplicare l'evento "${event.titleIt}"?`, `Do you want to duplicate "${event.titleEn}"?`))) {
      return;
    }
    
    const duplicatedEvent = {
      titleIt: `${event.titleIt} (copia)`,
      titleEn: `${event.titleEn} (copy)`,
      descriptionIt: event.descriptionIt || "",
      descriptionEn: event.descriptionEn || "",
      detailsIt: event.detailsIt || "",
      detailsEn: event.detailsEn || "",
      posterUrl: event.posterUrl || "",
      posterZoom: event.posterZoom || 100,
      posterOffsetX: event.posterOffsetX || 0,
      posterOffsetY: event.posterOffsetY || 0,
      startAt: null,
      active: false,
      bookingEnabled: event.bookingEnabled || false,
      bookingUrl: event.bookingUrl || "https://cameraconvista.resos.com/booking",
      visibilityMode: event.visibilityMode || "ACTIVE_ONLY",
      visibilityDaysAfter: event.visibilityDaysAfter || 7,
      sortOrder: events.length,
    };
    
    apiRequest("POST", "/api/admin/events", duplicatedEvent)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
        toast({
          title: t("Duplicato", "Duplicated"),
          description: t("Evento duplicato con successo.", "Event duplicated successfully."),
        });
      })
      .catch(() => {
        toast({
          title: t("Errore", "Error"),
          description: t("Impossibile duplicare l'evento.", "Failed to duplicate event."),
          variant: "destructive",
        });
      });
  };

  const handleToggleActive = (event: Event) => {
    updateMutation.mutate({
      id: event.id,
      data: { active: !event.active },
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString(language === "it" ? "it-IT" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl" data-testid="text-events-title">
              {t("Eventi", "Events")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t(
                `Gestisci gli eventi del ristorante (max 10 eventi, ${events.length}/10)`,
                `Manage restaurant events (max 10 events, ${events.length}/10)`
              )}
            </p>
          </div>
          <Button 
            onClick={handleAddEvent}
            disabled={events.length >= 10}
            data-testid="button-add-event"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("Nuovo Evento", "New Event")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("Lista Eventi", "Events List")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="text-muted-foreground text-center py-8" data-testid="text-no-events">
                {t(
                  "Nessun evento creato. Clicca su 'Nuovo Evento' per iniziare.",
                  "No events created. Click 'New Event' to get started."
                )}
              </p>
            ) : (
              <div className="space-y-3">
                {sortedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-card hover-elevate cursor-pointer"
                    onClick={() => handleEditEvent(event)}
                    data-testid={`event-item-${event.id}`}
                  >
                    <div className="w-16 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      {event.posterUrl ? (
                        <img
                          src={event.posterUrl}
                          alt={language === "it" ? event.titleIt : event.titleEn}
                          className="w-full h-full object-cover"
                          style={{
                            transform: `scale(${(event.posterZoom || 100) / 100}) translate(${event.posterOffsetX || 0}%, ${event.posterOffsetY || 0}%)`,
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">
                          {language === "it" ? event.titleIt : event.titleEn}
                        </h3>
                        {!event.posterUrl && (
                          <Badge variant="outline" className="text-xs">
                            {t("Nessun poster", "No poster")}
                          </Badge>
                        )}
                        {event.active ? (
                          <Badge variant="default" className="text-xs bg-green-600">
                            {t("Attivo", "Active")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {t("Bozza", "Draft")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {language === "it" ? event.descriptionIt : event.descriptionEn}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{formatDate(event.startAt)}</span>
                        <span>
                          {event.visibilityMode === "ACTIVE_ONLY" 
                            ? t("Sempre visibile", "Always visible")
                            : t(`Visibile ${event.visibilityDaysAfter}gg dopo`, `Visible ${event.visibilityDaysAfter}d after`)}
                        </span>
                        {event.bookingEnabled && (
                          <span className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {t("Prenotazioni attive", "Bookings active")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={event.active}
                        onCheckedChange={() => handleToggleActive(event)}
                        data-testid={`switch-active-${event.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicateEvent(event)}
                        title={t("Duplica evento", "Duplicate event")}
                        data-testid={`button-duplicate-${event.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-white text-primary border-primary/20 hover:bg-primary/5"
                        onClick={() => handleDeleteEvent(event)}
                        data-testid={`button-delete-${event.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        event={editingEvent}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Elimina evento", "Delete event")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `Sei sicuro di voler eliminare "${deleteTarget?.titleIt}"? Questa azione non può essere annullata.`,
                `Are you sure you want to delete "${deleteTarget?.titleEn}"? This action cannot be undone.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t("Annulla", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {t("Elimina", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
