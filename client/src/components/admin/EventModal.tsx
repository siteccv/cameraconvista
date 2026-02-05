import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon, Loader2, FolderOpen } from "lucide-react";
import { TranslateButton } from "./TranslateButton";
import { MediaPickerModal } from "./MediaPickerModal";
import type { Event, InsertEvent, Media } from "@shared/schema";

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}

export function EventModal({ open, onOpenChange, event }: EventModalProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const isEditing = !!event;

  const [formData, setFormData] = useState<Partial<InsertEvent>>({
    titleIt: "",
    titleEn: "",
    descriptionIt: "",
    descriptionEn: "",
    detailsIt: "",
    detailsEn: "",
    posterUrl: "",
    posterZoom: 100,
    posterOffsetX: 0,
    posterOffsetY: 0,
    startAt: null,
    active: false,
    bookingEnabled: false,
    bookingUrl: "https://cameraconvista.resos.com/booking",
    visibilityMode: "ACTIVE_ONLY",
    visibilityDaysAfter: 7,
    sortOrder: 0,
  });

  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const posterPreviewRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartOffset.current = { 
      x: formData.posterOffsetX || 0, 
      y: formData.posterOffsetY || 0 
    };
  }, [formData.posterOffsetX, formData.posterOffsetY]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !posterPreviewRef.current) return;
    
    const rect = posterPreviewRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartPos.current.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartPos.current.y) / rect.height) * 100;
    
    const newOffsetX = Math.max(-50, Math.min(50, dragStartOffset.current.x + deltaX));
    const newOffsetY = Math.max(-50, Math.min(50, dragStartOffset.current.y + deltaY));
    
    setFormData(prev => ({
      ...prev,
      posterOffsetX: Math.round(newOffsetX),
      posterOffsetY: Math.round(newOffsetY),
    }));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (event) {
      setFormData({
        titleIt: event.titleIt,
        titleEn: event.titleEn,
        descriptionIt: event.descriptionIt || "",
        descriptionEn: event.descriptionEn || "",
        detailsIt: event.detailsIt || "",
        detailsEn: event.detailsEn || "",
        posterUrl: event.posterUrl || "",
        posterZoom: event.posterZoom || 100,
        posterOffsetX: event.posterOffsetX || 0,
        posterOffsetY: event.posterOffsetY || 0,
        startAt: event.startAt,
        active: event.active,
        bookingEnabled: event.bookingEnabled,
        bookingUrl: event.bookingUrl || "https://cameraconvista.resos.com/booking",
        visibilityMode: event.visibilityMode,
        visibilityDaysAfter: event.visibilityDaysAfter || 7,
        sortOrder: event.sortOrder,
      });
    } else {
      setFormData({
        titleIt: "",
        titleEn: "",
        descriptionIt: "",
        descriptionEn: "",
        detailsIt: "",
        detailsEn: "",
        posterUrl: "",
        posterZoom: 100,
        posterOffsetX: 0,
        posterOffsetY: 0,
        startAt: null,
        active: false,
        bookingEnabled: false,
        bookingUrl: "https://cameraconvista.resos.com/booking",
        visibilityMode: "ACTIVE_ONLY",
        visibilityDaysAfter: 7,
        sortOrder: 0,
      });
    }
  }, [event, open]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertEvent) => {
      const response = await apiRequest("POST", "/api/admin/events", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({
        title: t("Creato", "Created"),
        description: t("Evento creato con successo.", "Event created successfully."),
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: t("Errore", "Error"),
        description: t("Impossibile creare l'evento.", "Failed to create event."),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEvent> }) => {
      const response = await apiRequest("PATCH", `/api/admin/events/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({
        title: t("Aggiornato", "Updated"),
        description: t("Evento aggiornato con successo.", "Event updated successfully."),
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: t("Errore", "Error"),
        description: t("Impossibile aggiornare l'evento.", "Failed to update event."),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titleIt || !formData.titleEn) {
      toast({
        title: t("Errore", "Error"),
        description: t("Titolo obbligatorio in entrambe le lingue.", "Title required in both languages."),
        variant: "destructive",
      });
      return;
    }

    if (isEditing && event) {
      updateMutation.mutate({ id: event.id, data: formData as Partial<InsertEvent> });
    } else {
      createMutation.mutate(formData as InsertEvent);
    }
  };

  const handleSelectMedia = (media: Media) => {
    setFormData({
      ...formData,
      posterUrl: media.url,
    });
    setShowMediaPicker(false);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("Modifica Evento", "Edit Event") : t("Nuovo Evento", "New Event")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">{t("Contenuto", "Content")}</TabsTrigger>
              <TabsTrigger value="poster">{t("Poster", "Poster")}</TabsTrigger>
              <TabsTrigger value="settings">{t("Impostazioni", "Settings")}</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titleIt">{t("Titolo (Italiano)", "Title (Italian)")} *</Label>
                  <Input
                    id="titleIt"
                    value={formData.titleIt}
                    onChange={(e) => setFormData({ ...formData, titleIt: e.target.value })}
                    placeholder="Jazz Night"
                    data-testid="input-title-it"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="titleEn" className="flex-1">{t("Titolo (Inglese)", "Title (English)")} *</Label>
                    <TranslateButton
                      textIt={formData.titleIt || ""}
                      onTranslated={(text) => setFormData({ ...formData, titleEn: text })}
                      context="event title for a restaurant and cocktail bar"
                    />
                  </div>
                  <Input
                    id="titleEn"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder="Jazz Night"
                    data-testid="input-title-en"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descriptionIt">{t("Descrizione (Italiano)", "Description (Italian)")}</Label>
                  <Textarea
                    id="descriptionIt"
                    value={formData.descriptionIt ?? ""}
                    onChange={(e) => setFormData({ ...formData, descriptionIt: e.target.value })}
                    placeholder="Serata di musica jazz dal vivo..."
                    rows={3}
                    data-testid="input-description-it"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="descriptionEn" className="flex-1">{t("Descrizione (Inglese)", "Description (English)")}</Label>
                    <TranslateButton
                      textIt={formData.descriptionIt || ""}
                      onTranslated={(text) => setFormData({ ...formData, descriptionEn: text })}
                      context="event description for a restaurant and cocktail bar"
                    />
                  </div>
                  <Textarea
                    id="descriptionEn"
                    value={formData.descriptionEn ?? ""}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    placeholder="Live jazz music evening..."
                    rows={3}
                    data-testid="input-description-en"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="detailsIt">{t("Dettagli (Italiano)", "Details (Italian)")}</Label>
                  <Textarea
                    id="detailsIt"
                    value={formData.detailsIt ?? ""}
                    onChange={(e) => setFormData({ ...formData, detailsIt: e.target.value })}
                    placeholder="Informazioni aggiuntive sull'evento..."
                    rows={4}
                    data-testid="input-details-it"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="detailsEn" className="flex-1">{t("Dettagli (Inglese)", "Details (English)")}</Label>
                    <TranslateButton
                      textIt={formData.detailsIt || ""}
                      onTranslated={(text) => setFormData({ ...formData, detailsEn: text })}
                      context="event details for a restaurant and cocktail bar"
                    />
                  </div>
                  <Textarea
                    id="detailsEn"
                    value={formData.detailsEn ?? ""}
                    onChange={(e) => setFormData({ ...formData, detailsEn: e.target.value })}
                    placeholder="Additional event information..."
                    rows={4}
                    data-testid="input-details-en"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="poster" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>{t("Poster dell'evento", "Event Poster")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "Formato Instagram Story (9:16). Senza poster l'evento non sarà visibile.",
                      "Instagram Story format (9:16). Without poster the event won't be visible."
                    )}
                  </p>

                  {formData.posterUrl ? (
                    <div 
                      ref={posterPreviewRef}
                      className={`relative aspect-[9/16] w-48 bg-muted rounded-lg overflow-hidden border ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                      onMouseDown={handleMouseDown}
                    >
                      <img
                        src={formData.posterUrl}
                        alt="Preview"
                        className="w-full h-full object-cover pointer-events-none select-none"
                        style={{
                          transform: `scale(${(formData.posterZoom || 100) / 100}) translate(${formData.posterOffsetX || 0}%, ${formData.posterOffsetY || 0}%)`,
                        }}
                        draggable={false}
                      />
                      <div className="absolute bottom-2 left-2 right-2 text-center text-xs text-white bg-black/50 rounded px-2 py-1 pointer-events-none">
                        {t("Trascina per posizionare", "Drag to position")}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[9/16] w-48 bg-muted rounded-lg border flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowMediaPicker(true)}>
                      {t("Scegli dalla libreria", "Choose from library")}
                    </Button>
                    {formData.posterUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setFormData({ ...formData, posterUrl: "" })}
                      >
                        {t("Rimuovi", "Remove")}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("Zoom", "Zoom")} ({formData.posterZoom}%)</Label>
                    <Slider
                      value={[formData.posterZoom || 100]}
                      onValueChange={([value]) => setFormData({ ...formData, posterZoom: value })}
                      min={50}
                      max={200}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("Offset X", "Offset X")} ({formData.posterOffsetX}%)</Label>
                    <Slider
                      value={[formData.posterOffsetX || 0]}
                      onValueChange={([value]) => setFormData({ ...formData, posterOffsetX: value })}
                      min={-50}
                      max={50}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("Offset Y", "Offset Y")} ({formData.posterOffsetY}%)</Label>
                    <Slider
                      value={[formData.posterOffsetY || 0]}
                      onValueChange={([value]) => setFormData({ ...formData, posterOffsetY: value })}
                      min={-50}
                      max={50}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="posterUrl">{t("URL Poster (diretto)", "Poster URL (direct)")}</Label>
                    <Input
                      id="posterUrl"
                      value={formData.posterUrl ?? ""}
                      onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                      placeholder="https://..."
                      data-testid="input-poster-url"
                    />
                  </div>
                </div>
              </div>

            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startAt">{t("Data e Ora Inizio", "Start Date & Time")}</Label>
                  <Input
                    id="startAt"
                    type="datetime-local"
                    value={formData.startAt ? new Date(formData.startAt).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setFormData({ ...formData, startAt: e.target.value ? new Date(e.target.value) : null })}
                    data-testid="input-start-at"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">{t("Ordine", "Sort Order")}</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    data-testid="input-sort-order"
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">{t("Visibilità", "Visibility")}</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("Evento Attivo", "Event Active")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("L'evento è visibile pubblicamente", "Event is publicly visible")}
                    </p>
                  </div>
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    data-testid="switch-active"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("Modalità Visibilità", "Visibility Mode")}</Label>
                  <Select
                    value={formData.visibilityMode}
                    onValueChange={(value) => setFormData({ ...formData, visibilityMode: value })}
                  >
                    <SelectTrigger data-testid="select-visibility-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE_ONLY">
                        {t("Sempre visibile (finché attivo)", "Always visible (while active)")}
                      </SelectItem>
                      <SelectItem value="UNTIL_DAYS_AFTER">
                        {t("Nascondi dopo X giorni dalla data", "Hide after X days from date")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.visibilityMode === "UNTIL_DAYS_AFTER" && (
                  <div className="space-y-2">
                    <Label>{t("Giorni dopo l'evento", "Days after event")}</Label>
                    <Input
                      type="number"
                      value={formData.visibilityDaysAfter || 7}
                      onChange={(e) => setFormData({ ...formData, visibilityDaysAfter: parseInt(e.target.value) || 7 })}
                      min={0}
                      max={365}
                      data-testid="input-visibility-days"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">{t("Prenotazioni", "Bookings")}</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("Prenotazioni Attive", "Bookings Enabled")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Mostra il bottone di prenotazione", "Show booking button")}
                    </p>
                  </div>
                  <Switch
                    checked={formData.bookingEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, bookingEnabled: checked })}
                    data-testid="switch-booking-enabled"
                  />
                </div>

                {formData.bookingEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="bookingUrl">{t("URL Prenotazioni", "Booking URL")}</Label>
                    <Input
                      id="bookingUrl"
                      value={formData.bookingUrl ?? "https://cameraconvista.resos.com/booking"}
                      onChange={(e) => setFormData({ ...formData, bookingUrl: e.target.value })}
                      placeholder="https://cameraconvista.resos.com/booking"
                      data-testid="input-booking-url"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("Annulla", "Cancel")}
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-event">
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? t("Salva Modifiche", "Save Changes") : t("Crea Evento", "Create Event")}
            </Button>
          </div>
        </form>
      </DialogContent>

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleSelectMedia}
      />
    </Dialog>
  );
}
