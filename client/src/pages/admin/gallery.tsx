import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { GalleryModal, AlbumImagesModal } from "@/components/admin/gallery";
import {
  Plus,
  Images,
  Trash2,
  Edit2,
  Image as ImageIcon,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { Gallery } from "@shared/schema";

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

  const reorderMutation = useMutation({
    mutationFn: async ({ id, sortOrder }: { id: number; sortOrder: number }) => {
      const response = await apiRequest("PATCH", `/api/admin/galleries/${id}`, { sortOrder });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries"] });
    },
  });

  const handleDelete = (gallery: Gallery) => {
    if (confirm(t("Sei sicuro di voler eliminare questo album e tutte le sue immagini?", "Are you sure you want to delete this album and all its images?"))) {
      deleteMutation.mutate(gallery.id);
    }
  };

  const sortedGalleries = [...galleries].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const current = sortedGalleries[index];
    const prev = sortedGalleries[index - 1];
    reorderMutation.mutate({ id: current.id, sortOrder: prev.sortOrder ?? index - 1 });
    reorderMutation.mutate({ id: prev.id, sortOrder: current.sortOrder ?? index });
  };

  const handleMoveDown = (index: number) => {
    if (index >= sortedGalleries.length - 1) return;
    const current = sortedGalleries[index];
    const next = sortedGalleries[index + 1];
    reorderMutation.mutate({ id: current.id, sortOrder: next.sortOrder ?? index + 1 });
    reorderMutation.mutate({ id: next.id, sortOrder: current.sortOrder ?? index });
  };

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
            {sortedGalleries.map((gallery, index) => (
              <Card key={gallery.id} className="overflow-hidden" data-testid={`gallery-card-${gallery.id}`}>
                <div 
                  className="relative aspect-square bg-muted cursor-pointer hover-elevate"
                  onClick={() => setManagingImages(gallery)}
                >
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                    <h3 className="text-white text-xl font-display">
                      {language === "it" ? gallery.titleIt : gallery.titleEn}
                    </h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
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
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || reorderMutation.isPending}
                        data-testid={`button-move-up-${gallery.id}`}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === sortedGalleries.length - 1 || reorderMutation.isPending}
                        data-testid={`button-move-down-${gallery.id}`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => { setEditingGallery(gallery); setShowGalleryModal(true); }}
                        data-testid={`button-edit-gallery-${gallery.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-white text-primary border-primary/20"
                        onClick={() => handleDelete(gallery)}
                        data-testid={`button-delete-gallery-${gallery.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
