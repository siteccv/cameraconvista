import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { SortableImage } from "./SortableImage";
import { ImageZoomModal } from "./ImageZoomModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Images } from "lucide-react";
import type { Gallery, GalleryImage, InsertGalleryImage, Media } from "@shared/schema";

interface AlbumImagesModalProps {
  open: boolean;
  onClose: () => void;
  gallery: Gallery;
}

export function AlbumImagesModal({ open, onClose, gallery }: AlbumImagesModalProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [localImages, setLocalImages] = useState<GalleryImage[]>([]);

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
    mutationFn: async (imageIds: number[]) => {
      const response = await apiRequest("POST", `/api/admin/galleries/${gallery.id}/images/reorder`, { imageIds });
      return response.json();
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

  // Sync server images to local state for drag operations
  useEffect(() => {
    if (images.length > 0) {
      const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
      setLocalImages(sorted);
    }
  }, [images]);

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localImages.findIndex((img) => img.id === active.id);
    const newIndex = localImages.findIndex((img) => img.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      setLocalImages(arrayMove(localImages, oldIndex, newIndex));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over || active.id === over.id) return;

    // Final reorder with localImages state (already updated by onDragOver)
    const imageIds = localImages.map((img) => img.id);
    reorderImagesMutation.mutate(imageIds);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    // Reset to server state on cancel
    const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
    setLocalImages(sorted);
  };

  const activeImage = activeId ? localImages.find((img) => img.id === activeId) : null;

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
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext
                  items={localImages.map((img) => img.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {localImages.map((image) => (
                      <SortableImage
                        key={image.id}
                        image={image}
                        onEdit={() => setEditingImage(image)}
                        onDelete={() => handleDeleteImage(image)}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeImage && (
                    <div className="aspect-[9/16] rounded-lg overflow-hidden bg-muted shadow-2xl ring-2 ring-primary opacity-90">
                      <img
                        src={activeImage.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{
                          transform: `scale(${(activeImage.imageZoom || 100) / 100}) translate(${activeImage.imageOffsetX || 0}%, ${activeImage.imageOffsetY || 0}%)`,
                        }}
                      />
                    </div>
                  )}
                </DragOverlay>
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
