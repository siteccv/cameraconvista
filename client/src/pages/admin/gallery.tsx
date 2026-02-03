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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TranslateButton } from "@/components/admin/TranslateButton";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import {
  Plus,
  Images,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Eye,
  EyeOff,
  X,
  ZoomIn,
  Move,
} from "lucide-react";
import type { Gallery, InsertGallery, GalleryImage, InsertGalleryImage, Media } from "@shared/schema";

interface GalleryModalProps {
  open: boolean;
  onClose: () => void;
  gallery?: Gallery | null;
}

function GalleryModal({ open, onClose, gallery }: GalleryModalProps) {
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
                    textToTranslate={titleIt}
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

interface AlbumImagesModalProps {
  open: boolean;
  onClose: () => void;
  gallery: Gallery;
}

function AlbumImagesModal({ open, onClose, gallery }: AlbumImagesModalProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);

  const { data: images = [], isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/admin/galleries", gallery.id, "images"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/galleries/${gallery.id}/images`, { credentials: "include" });
      return response.json();
    },
    enabled: open,
  });

  const addImageMutation = useMutation({
    mutationFn: async (data: Partial<InsertGalleryImage>) => {
      const response = await apiRequest("POST", `/api/admin/galleries/${gallery.id}/images`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries", gallery.id, "images"] });
      toast({ title: t("Aggiunta", "Added"), description: t("Immagine aggiunta all'album.", "Image added to album.") });
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), description: t("Impossibile aggiungere l'immagine.", "Failed to add image."), variant: "destructive" });
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertGalleryImage> }) => {
      const response = await apiRequest("PATCH", `/api/admin/galleries/${gallery.id}/images/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries", gallery.id, "images"] });
      setEditingImage(null);
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), description: t("Impossibile aggiornare l'immagine.", "Failed to update image."), variant: "destructive" });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/galleries/${gallery.id}/images/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries", gallery.id, "images"] });
      toast({ title: t("Eliminata", "Deleted"), description: t("Immagine rimossa dall'album.", "Image removed from album.") });
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), description: t("Impossibile eliminare l'immagine.", "Failed to delete image."), variant: "destructive" });
    },
  });

  const handleMediaSelect = (media: Media) => {
    addImageMutation.mutate({
      imageUrl: media.url,
      altIt: media.altIt,
      altEn: media.altEn,
      sortOrder: images.length,
    });
    setShowMediaPicker(false);
  };

  const handleDeleteImage = (image: GalleryImage) => {
    if (confirm(t("Sei sicuro di voler rimuovere questa immagine?", "Are you sure you want to remove this image?"))) {
      deleteImageMutation.mutate(image.id);
    }
  };

  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Images className="h-5 w-5" />
              {language === "it" ? gallery.titleIt : gallery.titleEn} - {t("Immagini Album", "Album Images")}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                {t(
                  `${images.length} immagini nell'album. Formato: Instagram Story (9:16)`,
                  `${images.length} images in album. Format: Instagram Story (9:16)`
                )}
              </p>
              <Button onClick={() => setShowMediaPicker(true)} data-testid="button-add-album-image">
                <Plus className="h-4 w-4 mr-2" />
                {t("Aggiungi Immagine", "Add Image")}
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="aspect-[9/16] rounded-lg" />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Images className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("Nessuna immagine nell'album.", "No images in album.")}</p>
                <p className="text-sm mt-2">{t("Clicca 'Aggiungi Immagine' per iniziare.", "Click 'Add Image' to start.")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {sortedImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted group"
                    data-testid={`album-image-${image.id}`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={language === "it" ? image.altIt || "" : image.altEn || ""}
                      className="w-full h-full object-cover transition-transform"
                      style={{
                        transform: `scale(${(image.imageZoom || 100) / 100}) translate(${image.imageOffsetX || 0}%, ${image.imageOffsetY || 0}%)`,
                      }}
                    />
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        {index + 1}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => setEditingImage(image)}
                        data-testid={`button-edit-image-${image.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDeleteImage(image)}
                        data-testid={`button-delete-image-${image.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>{t("Chiudi", "Close")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
      />

      {editingImage && (
        <ImageZoomModal
          open={!!editingImage}
          onClose={() => setEditingImage(null)}
          image={editingImage}
          onSave={(data) => updateImageMutation.mutate({ id: editingImage.id, data })}
        />
      )}
    </>
  );
}

interface ImageZoomModalProps {
  open: boolean;
  onClose: () => void;
  image: GalleryImage;
  onSave: (data: Partial<InsertGalleryImage>) => void;
}

function ImageZoomModal({ open, onClose, image, onSave }: ImageZoomModalProps) {
  const { t } = useLanguage();
  const [zoom, setZoom] = useState(image.imageZoom || 100);
  const [offsetX, setOffsetX] = useState(image.imageOffsetX || 0);
  const [offsetY, setOffsetY] = useState(image.imageOffsetY || 0);

  const handleSave = () => {
    onSave({ imageZoom: zoom, imageOffsetX: offsetX, imageOffsetY: offsetY });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Regola Immagine", "Adjust Image")}</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="aspect-[9/16] rounded-lg overflow-hidden bg-muted mx-auto max-w-[200px]">
            <img
              src={image.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{
                transform: `scale(${zoom / 100}) translate(${offsetX}%, ${offsetY}%)`,
              }}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Zoom: {zoom}%</Label>
              </div>
              <Slider value={[zoom]} onValueChange={([v]) => setZoom(v)} min={100} max={200} step={5} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Move className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">X: {offsetX}%</Label>
                </div>
                <Slider value={[offsetX]} onValueChange={([v]) => setOffsetX(v)} min={-50} max={50} step={1} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Y: {offsetY}%</Label>
                <Slider value={[offsetY]} onValueChange={([v]) => setOffsetY(v)} min={-50} max={50} step={1} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>{t("Annulla", "Cancel")}</Button>
          <Button onClick={handleSave}>{t("Salva", "Save")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminGallery() {
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [viewingAlbum, setViewingAlbum] = useState<Gallery | null>(null);

  const { data: galleries = [], isLoading } = useQuery<Gallery[]>({
    queryKey: ["/api/admin/galleries"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertGallery> }) => {
      const response = await apiRequest("PATCH", `/api/admin/galleries/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries"] });
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), description: t("Impossibile aggiornare l'album.", "Failed to update album."), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/galleries/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries"] });
      toast({ title: t("Eliminato", "Deleted"), description: t("Album eliminato con successo.", "Album deleted successfully.") });
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), description: t("Impossibile eliminare l'album.", "Failed to delete album."), variant: "destructive" });
    },
  });

  const sortedGalleries = [...galleries].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleAddGallery = () => {
    setEditingGallery(null);
    setModalOpen(true);
  };

  const handleEditGallery = (gallery: Gallery) => {
    setEditingGallery(gallery);
    setModalOpen(true);
  };

  const handleDeleteGallery = (gallery: Gallery) => {
    if (confirm(t(`Sei sicuro di voler eliminare l'album "${gallery.titleIt}"?`, `Are you sure you want to delete the album "${gallery.titleEn}"?`))) {
      deleteMutation.mutate(gallery.id);
    }
  };

  const handleToggleVisible = (gallery: Gallery) => {
    updateMutation.mutate({
      id: gallery.id,
      data: { isVisible: !gallery.isVisible },
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl" data-testid="text-gallery-title">
              {t("Galleria Album", "Album Gallery")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t(
                `Gestisci gli album della galleria (${galleries.length} album)`,
                `Manage gallery albums (${galleries.length} albums)`
              )}
            </p>
          </div>
          <Button onClick={handleAddGallery} disabled={galleries.length >= 10} data-testid="button-add-gallery">
            <Plus className="h-4 w-4 mr-2" />
            {t("Nuovo Album", "New Album")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Images className="h-5 w-5" />
              {t("Album", "Albums")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : galleries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8" data-testid="text-no-galleries">
                {t("Nessun album creato.", "No albums created.")}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedGalleries.map((gallery) => (
                  <div
                    key={gallery.id}
                    className="relative rounded-lg overflow-hidden bg-muted group cursor-pointer"
                    data-testid={`gallery-card-${gallery.id}`}
                  >
                    <div
                      className="aspect-square relative"
                      onClick={() => setViewingAlbum(gallery)}
                    >
                      {gallery.coverUrl ? (
                        <img
                          src={gallery.coverUrl}
                          alt={language === "it" ? gallery.titleIt : gallery.titleEn}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          style={{
                            transform: `scale(${(gallery.coverZoom || 100) / 100}) translate(${gallery.coverOffsetX || 0}%, ${gallery.coverOffsetY || 0}%)`,
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-16 w-16" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-display text-xl">
                          {language === "it" ? gallery.titleIt : gallery.titleEn}
                        </h3>
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge variant={gallery.isVisible ? "default" : "secondary"}>
                        {gallery.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Badge>
                    </div>

                    <div className="p-3 border-t bg-card flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={gallery.isVisible}
                          onCheckedChange={() => handleToggleVisible(gallery)}
                          data-testid={`switch-gallery-visible-${gallery.id}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {gallery.isVisible ? t("Visibile", "Visible") : t("Nascosto", "Hidden")}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setViewingAlbum(gallery)}
                          data-testid={`button-view-album-${gallery.id}`}
                        >
                          <Images className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditGallery(gallery)}
                          data-testid={`button-edit-gallery-${gallery.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteGallery(gallery)}
                          data-testid={`button-delete-gallery-${gallery.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <GalleryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        gallery={editingGallery}
      />

      {viewingAlbum && (
        <AlbumImagesModal
          open={!!viewingAlbum}
          onClose={() => setViewingAlbum(null)}
          gallery={viewingAlbum}
        />
      )}
    </AdminLayout>
  );
}
