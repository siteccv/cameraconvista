import { useState, useRef, useCallback } from "react";
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  GripVertical,
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

interface SortableImageProps {
  image: GalleryImage;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableImage({ image, onEdit, onDelete }: SortableImageProps) {
  const { language } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted group"
      data-testid={`album-image-${image.id}`}
    >
      <img
        src={image.imageUrl}
        alt={language === "it" ? image.altIt || "" : image.altEn || ""}
        className="w-full h-full object-cover"
        style={{
          transform: `scale(${(image.imageZoom || 100) / 100}) translate(${image.imageOffsetX || 0}%, ${image.imageOffsetY || 0}%)`,
        }}
      />
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing p-1.5 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        data-testid={`drag-handle-${image.id}`}
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={onEdit}
          data-testid={`button-edit-image-${image.id}`}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={onDelete}
          data-testid={`button-delete-image-${image.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const reorderImagesMutation = useMutation({
    mutationFn: async (updates: { id: number; sortOrder: number }[]) => {
      await Promise.all(
        updates.map(({ id, sortOrder }) =>
          apiRequest("PATCH", `/api/admin/galleries/${gallery.id}/images/${id}`, { sortOrder })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries", gallery.id, "images"] });
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), description: t("Impossibile riordinare le immagini.", "Failed to reorder images."), variant: "destructive" });
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
    const oldIndex = sortedImages.findIndex((img) => img.id === active.id);
    const newIndex = sortedImages.findIndex((img) => img.id === over.id);

    const reordered = arrayMove(sortedImages, oldIndex, newIndex);
    const updates = reordered.map((img, index) => ({
      id: img.id,
      sortOrder: index,
    }));

    reorderImagesMutation.mutate(updates);
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
                  `${images.length} immagini nell'album. Trascina per riordinare.`,
                  `${images.length} images in album. Drag to reorder.`
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedImages.map((img) => img.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {sortedImages.map((image) => (
                      <SortableImage
                        key={image.id}
                        image={image}
                        onEdit={() => setEditingImage(image)}
                        onDelete={() => handleDeleteImage(image)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    onSave({ imageZoom: zoom, imageOffsetX: offsetX, imageOffsetY: offsetY });
    onClose();
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 100) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, offsetX, offsetY };
    e.preventDefault();
  }, [zoom, offsetX, offsetY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const sensitivity = 100 / rect.width;
    
    const deltaX = (e.clientX - dragStartRef.current.x) * sensitivity;
    const deltaY = (e.clientY - dragStartRef.current.y) * sensitivity;
    
    const maxOffset = (zoom - 100) / 2;
    const newX = Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.offsetX + deltaX));
    const newY = Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.offsetY + deltaY));
    
    setOffsetX(Math.round(newX));
    setOffsetY(Math.round(newY));
  }, [isDragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (zoom <= 100) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = { x: touch.clientX, y: touch.clientY, offsetX, offsetY };
  }, [zoom, offsetX, offsetY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const container = containerRef.current;
    if (!container) return;
    
    const touch = e.touches[0];
    const rect = container.getBoundingClientRect();
    const sensitivity = 100 / rect.width;
    
    const deltaX = (touch.clientX - dragStartRef.current.x) * sensitivity;
    const deltaY = (touch.clientY - dragStartRef.current.y) * sensitivity;
    
    const maxOffset = (zoom - 100) / 2;
    const newX = Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.offsetX + deltaX));
    const newY = Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.offsetY + deltaY));
    
    setOffsetX(Math.round(newX));
    setOffsetY(Math.round(newY));
  }, [isDragging, zoom]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Regola Immagine", "Adjust Image")}</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div 
            ref={containerRef}
            className={`aspect-[9/16] rounded-lg overflow-hidden bg-muted mx-auto max-w-[200px] ${zoom > 100 ? "cursor-grab" : ""} ${isDragging ? "cursor-grabbing" : ""}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            data-testid="image-drag-area"
          >
            <img
              src={image.imageUrl}
              alt=""
              className="w-full h-full object-cover pointer-events-none select-none"
              style={{
                transform: `scale(${zoom / 100}) translate(${offsetX}%, ${offsetY}%)`,
              }}
              draggable={false}
            />
          </div>
          {zoom > 100 && (
            <p className="text-xs text-center text-muted-foreground">
              {t("Trascina l'immagine per regolare la posizione", "Drag the image to adjust position")}
            </p>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Zoom: {zoom}%</Label>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={100}
                max={200}
                step={5}
                data-testid="slider-image-zoom"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Move className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">X: {offsetX}%</Label>
                </div>
                <Slider
                  value={[offsetX]}
                  onValueChange={([v]) => setOffsetX(v)}
                  min={-50}
                  max={50}
                  step={1}
                  data-testid="slider-image-offset-x"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Y: {offsetY}%</Label>
                <Slider
                  value={[offsetY]}
                  onValueChange={([v]) => setOffsetY(v)}
                  min={-50}
                  max={50}
                  step={1}
                  data-testid="slider-image-offset-y"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t("Annulla", "Cancel")}
          </Button>
          <Button onClick={handleSave} data-testid="button-save-image-zoom">
            {t("Salva", "Save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function GalleryPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [managingImages, setManagingImages] = useState<Gallery | null>(null);

  const { data: galleries = [], isLoading } = useQuery<Gallery[]>({
    queryKey: ["/api/admin/galleries"],
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisible }: { id: number; isVisible: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/galleries/${id}`, { isVisible });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries"] });
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), description: t("Impossibile aggiornare la visibilità.", "Failed to update visibility."), variant: "destructive" });
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

  const handleDelete = (gallery: Gallery) => {
    if (confirm(t("Sei sicuro di voler eliminare questo album e tutte le sue immagini?", "Are you sure you want to delete this album and all its images?"))) {
      deleteMutation.mutate(gallery.id);
    }
  };

  const sortedGalleries = [...galleries].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t("Galleria", "Gallery")}</h1>
            <p className="text-muted-foreground">
              {t("Gestisci gli album fotografici del ristorante", "Manage restaurant photo albums")}
            </p>
          </div>
          <Button onClick={() => { setEditingGallery(null); setShowGalleryModal(true); }} data-testid="button-new-gallery">
            <Plus className="h-4 w-4 mr-2" />
            {t("Nuovo Album", "New Album")}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : galleries.length === 0 ? (
          <Card className="p-12 text-center">
            <Images className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t("Nessun album", "No albums")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("Crea il primo album per iniziare a organizzare le foto.", "Create the first album to start organizing photos.")}
            </p>
            <Button onClick={() => setShowGalleryModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("Crea Album", "Create Album")}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedGalleries.map((gallery) => (
              <Card key={gallery.id} className="overflow-hidden" data-testid={`gallery-card-${gallery.id}`}>
                <div className="relative aspect-square bg-muted">
                  {gallery.coverUrl ? (
                    <img
                      src={gallery.coverUrl}
                      alt={language === "it" ? gallery.titleIt : gallery.titleEn}
                      className="w-full h-full object-cover"
                      style={{
                        transform: `scale(${(gallery.coverZoom || 100) / 100}) translate(${gallery.coverOffsetX || 0}%, ${gallery.coverOffsetY || 0}%)`,
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white text-xl font-display">
                      {language === "it" ? gallery.titleIt : gallery.titleEn}
                    </h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={gallery.isVisible}
                        onCheckedChange={(checked) =>
                          toggleVisibilityMutation.mutate({ id: gallery.id, isVisible: checked })
                        }
                        data-testid={`switch-visibility-${gallery.id}`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {gallery.isVisible ? t("Visibile", "Visible") : t("Nascosto", "Hidden")}
                      </span>
                    </div>
                    {!gallery.isVisible && (
                      <Badge variant="outline">
                        <EyeOff className="h-3 w-3 mr-1" />
                        {t("Nascosto", "Hidden")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setManagingImages(gallery)}
                      data-testid={`button-manage-images-${gallery.id}`}
                    >
                      <Images className="h-4 w-4 mr-2" />
                      {t("Immagini", "Images")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingGallery(gallery); setShowGalleryModal(true); }}
                      data-testid={`button-edit-gallery-${gallery.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(gallery)}
                      data-testid={`button-delete-gallery-${gallery.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <GalleryModal
        open={showGalleryModal}
        onClose={() => { setShowGalleryModal(false); setEditingGallery(null); }}
        gallery={editingGallery}
      />

      {managingImages && (
        <AlbumImagesModal
          open={!!managingImages}
          onClose={() => setManagingImages(null)}
          gallery={managingImages}
        />
      )}
    </AdminLayout>
  );
}
