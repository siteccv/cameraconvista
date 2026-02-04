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
