import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TranslateButton } from "@/components/admin/TranslateButton";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { Image as ImageIcon, ZoomIn, Move } from "lucide-react";
import type { Gallery, InsertGallery, Media } from "@shared/schema";

interface GalleryModalProps {
  open: boolean;
  onClose: () => void;
  gallery?: Gallery | null;
}

export function GalleryModal({ open, onClose, gallery }: GalleryModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [titleIt, setTitleIt] = useState(gallery?.titleIt || "");
  const [titleEn, setTitleEn] = useState(gallery?.titleEn || "");
  const [coverUrl, setCoverUrl] = useState(gallery?.coverUrl || "");
  const [coverZoom, setCoverZoom] = useState(gallery?.coverZoom || 100);
  const [coverOffsetX, setCoverOffsetX] = useState(gallery?.coverOffsetX || 0);
  const [coverOffsetY, setCoverOffsetY] = useState(gallery?.coverOffsetY || 0);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: InsertGallery) => {
      const response = await apiRequest("POST", "/api/admin/galleries", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries"] });
      toast({ title: t("Creato", "Created"), description: t("Album creato con successo.", "Album created successfully.") });
      onClose();
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), description: t("Impossibile creare l'album.", "Failed to create album."), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertGallery>) => {
      const response = await apiRequest("PATCH", `/api/admin/galleries/${gallery?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries"] });
      toast({ title: t("Salvato", "Saved"), description: t("Album aggiornato.", "Album updated.") });
      onClose();
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), description: t("Impossibile aggiornare l'album.", "Failed to update album."), variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const data: InsertGallery = {
      titleIt,
      titleEn,
      coverUrl: coverUrl || null,
      coverZoom,
      coverOffsetX,
      coverOffsetY,
      isVisible: gallery?.isVisible ?? true,
      sortOrder: gallery?.sortOrder ?? 0,
    };
    if (gallery) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleMediaSelect = (media: Media) => {
    setCoverUrl(media.url);
    setShowMediaPicker(false);
  };

  const handleTranslate = (translated: string) => {
    setTitleEn(translated);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {gallery ? t("Modifica Album", "Edit Album") : t("Nuovo Album", "New Album")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("Titolo (IT)", "Title (IT)")}</Label>
                <div className="flex gap-2">
                  <Input
                    value={titleIt}
                    onChange={(e) => setTitleIt(e.target.value)}
                    placeholder={t("Es: Il Locale", "E.g.: The Venue")}
                    data-testid="input-gallery-title-it"
                  />
                  <TranslateButton
                    textIt={titleIt}
                    onTranslated={handleTranslate}
                    context="gallery album title"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Titolo (EN)", "Title (EN)")}</Label>
                <Input
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder={t("Es: The Venue", "E.g.: The Venue")}
                  data-testid="input-gallery-title-en"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>{t("Immagine di Copertina", "Cover Image")}</Label>
              <div className="flex gap-4 items-start">
                <div
                  className="relative w-40 aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group"
                  onClick={() => setShowMediaPicker(true)}
                  data-testid="button-select-cover"
                >
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Cover"
                      className="w-full h-full object-cover transition-transform"
                      style={{
                        transform: `scale(${coverZoom / 100}) translate(${coverOffsetX}%, ${coverOffsetY}%)`,
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm">
                    {t("Cambia", "Change")}
                  </div>
                </div>

                {coverUrl && (
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ZoomIn className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm">Zoom: {coverZoom}%</Label>
                      </div>
                      <Slider
                        value={[coverZoom]}
                        onValueChange={([v]) => setCoverZoom(v)}
                        min={100}
                        max={200}
                        step={5}
                        data-testid="slider-cover-zoom"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Move className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm">X: {coverOffsetX}%</Label>
                        </div>
                        <Slider
                          value={[coverOffsetX]}
                          onValueChange={([v]) => setCoverOffsetX(v)}
                          min={-50}
                          max={50}
                          step={1}
                          data-testid="slider-cover-offset-x"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Y: {coverOffsetY}%</Label>
                        <Slider
                          value={[coverOffsetY]}
                          onValueChange={([v]) => setCoverOffsetY(v)}
                          min={-50}
                          max={50}
                          step={1}
                          data-testid="slider-cover-offset-y"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {t("Annulla", "Cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!titleIt || !titleEn || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-gallery"
            >
              {gallery ? t("Salva", "Save") : t("Crea Album", "Create Album")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
      />
    </>
  );
}
