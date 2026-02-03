import { useState, useMemo, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ObjectUploader } from "@/components/ObjectUploader";
import { ImageDetailsModal } from "@/components/admin/ImageDetailsModal";
import { Upload, Search, Image, FolderOpen, Loader2 } from "lucide-react";
import type { Media, InsertMedia } from "@shared/schema";
import type { UppyFile, UploadResult } from "@uppy/core";

const CATEGORIES = [
  { id: "all", labelIt: "Tutte le cartelle", labelEn: "All folders" },
  { id: "varie", labelIt: "Varie", labelEn: "Various" },
  { id: "interni", labelIt: "Interni", labelEn: "Interiors" },
  { id: "food", labelIt: "Food", labelEn: "Food" },
  { id: "drink", labelIt: "Drink", labelEn: "Drink" },
  { id: "eventi", labelIt: "Eventi", labelEn: "Events" },
];

export default function AdminMedia() {
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: mediaItems = [], isLoading } = useQuery<Media[]>({
    queryKey: ["/api/admin/media"],
  });

  const createMediaMutation = useMutation({
    mutationFn: async (data: InsertMedia) => {
      const response = await apiRequest("POST", "/api/admin/media", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({
        title: t("Caricato", "Uploaded"),
        description: t("File caricato con successo.", "File uploaded successfully."),
      });
    },
    onError: () => {
      toast({
        title: t("Errore", "Error"),
        description: t("Impossibile salvare il file.", "Failed to save file."),
        variant: "destructive",
      });
    },
  });

  const filteredMedia = useMemo(() => {
    let items = mediaItems;

    if (selectedCategory !== "all") {
      items = items.filter(m => m.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(m =>
        m.filename.toLowerCase().includes(query) ||
        m.altIt?.toLowerCase().includes(query) ||
        m.altEn?.toLowerCase().includes(query) ||
        m.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return items.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [mediaItems, selectedCategory, searchQuery]);

  const pendingUploads = useRef(new Map<string, { objectPath: string; name: string; size: number; mimeType: string }>());

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      for (const file of result.successful) {
        const pending = pendingUploads.current.get(file.id);
        if (pending) {
          const mediaData: InsertMedia = {
            filename: pending.name,
            url: pending.objectPath,
            mimeType: pending.mimeType,
            size: pending.size,
            category: "varie",
          };
          createMediaMutation.mutate(mediaData);
          pendingUploads.current.delete(file.id);
        }
      }
    }
  };

  const handleGetUploadParameters = async (file: UppyFile<Record<string, unknown>, Record<string, unknown>>) => {
    const response = await fetch("/api/admin/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    });
    const data = await response.json();
    
    pendingUploads.current.set(file.id, {
      objectPath: data.objectPath,
      name: file.name || "uploaded-file",
      size: file.size || 0,
      mimeType: file.type || "application/octet-stream",
    });
    
    return {
      method: "PUT" as const,
      url: data.uploadURL as string,
    };
  };

  const openDetails = (media: Media) => {
    setSelectedMedia(media);
    setDetailsOpen(true);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl" data-testid="text-media-title">
              {t("Libreria media", "Media Library")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("Carica e gestisci le immagini", "Upload and manage images")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" data-testid="button-create-folder" disabled>
              <FolderOpen className="h-4 w-4 mr-2" />
              {t("Crea cartella", "Create folder")}
            </Button>
            <ObjectUploader
              maxNumberOfFiles={10}
              maxFileSize={10485760}
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t("Carica immagine", "Upload image")}
            </ObjectUploader>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Cerca per testo alt o tag...", "Search by alt text or tag...")}
              className="pl-10"
              data-testid="input-search-media"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                className="cursor-pointer px-3 py-1"
                onClick={() => setSelectedCategory(cat.id)}
                data-testid={`filter-${cat.id}`}
              >
                {language === "it" ? cat.labelIt : cat.labelEn}
              </Badge>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-square" />
                <CardContent className="p-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMedia.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== "all"
                  ? t("Nessuna immagine trovata con questi filtri.", "No images found with these filters.")
                  : t("Nessun file caricato. Clicca su 'Carica immagine' per iniziare.", "No files uploaded. Click 'Upload image' to get started.")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMedia.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden cursor-pointer hover-elevate transition-all group"
                onClick={() => openDetails(item)}
                data-testid={`media-item-${item.id}`}
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img
                    src={item.url}
                    alt={language === "it" ? (item.altIt || item.filename) : (item.altEn || item.filename)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-2">
                  <p className="text-sm font-medium truncate" title={item.filename}>
                    {language === "it" ? (item.altIt || item.filename) : (item.altEn || item.filename)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)} · {formatSize(item.size)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {createMediaMutation.isPending && (
          <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("Salvataggio in corso...", "Saving...")}</span>
          </div>
        )}
      </div>

      <ImageDetailsModal
        media={selectedMedia}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </AdminLayout>
  );
}
