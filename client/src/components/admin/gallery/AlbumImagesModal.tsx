import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { ImageZoomModal } from "./ImageZoomModal";
import { Plus, Images, GripVertical, Edit2, Trash2 } from "lucide-react";
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
  
  // Local state for immediate UI updates during drag
  const [orderedImages, setOrderedImages] = useState<GalleryImage[]>([]);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const { data: serverImages = [], isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/admin/galleries", gallery.id, "images"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/galleries/${gallery.id}/images`, { credentials: "include" });
      return response.json();
    },
    enabled: open,
  });

  // Sync server data to local state
  useEffect(() => {
    const sorted = [...serverImages].sort((a, b) => a.sortOrder - b.sortOrder);
    setOrderedImages(sorted);
  }, [serverImages]);

  const addImageMutation = useMutation({
    mutationFn: async (data: Partial<InsertGalleryImage>) => {
      const response = await apiRequest("POST", `/api/admin/galleries/${gallery.id}/images`, data);
      return response.json();
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

  const reorderMutation = useMutation({
    mutationFn: async (imageIds: number[]) => {
      const response = await apiRequest("POST", `/api/admin/galleries/${gallery.id}/images/reorder`, { imageIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries", gallery.id, "images"] });
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), description: t("Impossibile riordinare le immagini.", "Failed to reorder images."), variant: "destructive" });
      // Reset to server state on error
      const sorted = [...serverImages].sort((a, b) => a.sortOrder - b.sortOrder);
      setOrderedImages(sorted);
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

  const handleMediaSelect = async (mediaItems: Media[]) => {
    setShowMediaPicker(false);
    let nextSortOrder = orderedImages.length > 0 
      ? Math.max(...orderedImages.map(img => img.sortOrder)) + 1 
      : 0;
    
    let addedCount = 0;
    for (const media of mediaItems) {
      try {
        await addImageMutation.mutateAsync({
          imageUrl: media.url,
          altIt: media.altIt || null,
          altEn: media.altEn || null,
          sortOrder: nextSortOrder,
        });
        nextSortOrder++;
        addedCount++;
      } catch {
        toast({ title: t("Errore", "Error"), description: t(`Impossibile aggiungere "${media.filename}".`, `Failed to add "${media.filename}".`), variant: "destructive" });
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries", gallery.id, "images"] });
    if (addedCount > 0) {
      toast({
        title: t("Aggiunta", "Added"),
        description: addedCount > 1
          ? t(`${addedCount} immagini aggiunte all'album.`, `${addedCount} images added to album.`)
          : t("Immagine aggiunta all'album.", "Image added to album."),
      });
    }
  };

  const handleDeleteImage = (image: GalleryImage) => {
    if (confirm(t("Sei sicuro di voler rimuovere questa immagine?", "Are you sure you want to remove this image?"))) {
      deleteImageMutation.mutate(image.id);
    }
  };

  // Simple drag & drop handlers using HTML5 API
  const handleDragStart = useCallback((e: React.DragEvent, imageId: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', imageId.toString());
    setDraggedId(imageId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, imageId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId !== imageId) {
      setDragOverId(imageId);
    }
  }, [draggedId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    setDragOverId(null);
    
    if (draggedId === null || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    // Find indices
    const fromIndex = orderedImages.findIndex(img => img.id === draggedId);
    const toIndex = orderedImages.findIndex(img => img.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Reorder array
    const newOrder = [...orderedImages];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);

    // Update local state immediately
    setOrderedImages(newOrder);
    setDraggedId(null);

    // Persist to server
    const imageIds = newOrder.map(img => img.id);
    reorderMutation.mutate(imageIds);
  }, [draggedId, orderedImages, reorderMutation]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

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
                  `${orderedImages.length} immagini nell'album. Trascina per riordinare.`,
                  `${orderedImages.length} images in album. Drag to reorder.`
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
            ) : orderedImages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Images className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("Nessuna immagine nell'album.", "No images in album.")}</p>
                <p className="text-sm mt-2">{t("Clicca 'Aggiungi Immagine' per iniziare.", "Click 'Add Image' to start.")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {orderedImages.map((image) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, image.id)}
                    onDragOver={(e) => handleDragOver(e, image.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, image.id)}
                    onDragEnd={handleDragEnd}
                    className={`
                      relative aspect-[9/16] rounded-lg overflow-hidden bg-muted group cursor-grab active:cursor-grabbing
                      transition-all duration-200
                      ${draggedId === image.id ? 'opacity-50 scale-95' : ''}
                      ${dragOverId === image.id ? 'ring-2 ring-primary ring-offset-2' : ''}
                    `}
                    data-testid={`album-image-${image.id}`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={language === "it" ? image.altIt || "" : image.altEn || ""}
                      className="w-full h-full object-cover pointer-events-none"
                      style={{
                        transform: `scale(${(image.imageZoom || 100) / 100}) translate(${image.imageOffsetX || 0}%, ${image.imageOffsetY || 0}%)`,
                      }}
                      draggable={false}
                    />
                    <div className="absolute top-2 left-2 p-1.5 rounded bg-black/60 text-white">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div 
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); setEditingImage(image); }}
                        data-testid={`button-edit-image-${image.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="bg-white text-primary border-primary/20 hover:bg-primary/5"
                        onClick={(e) => { e.stopPropagation(); handleDeleteImage(image); }}
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
        multiple
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
