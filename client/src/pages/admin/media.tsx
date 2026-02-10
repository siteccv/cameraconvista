import { useState, useMemo, useRef, useCallback } from "react";
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
import { ImageDetailsModal } from "@/components/admin/ImageDetailsModal";
import { ManageCategoriesModal } from "@/components/admin/ManageCategoriesModal";
import { Upload, Search, Image, Settings, Loader2, CheckSquare, Trash2, X } from "lucide-react";
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
import type { Media, InsertMedia, MediaCategory } from "@shared/schema";
import { formatSize, formatDate } from "@/lib/formatters";

export default function AdminMedia() {
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: mediaItems = [], isLoading } = useQuery<Media[]>({
    queryKey: ["/api/admin/media"],
  });

  const { data: dbCategories = [] } = useQuery<MediaCategory[]>({
    queryKey: ["/api/admin/media-categories"],
  });

  const categories = useMemo(() => {
    const allOption = { id: "all", labelIt: "Tutte le cartelle", labelEn: "All folders" };
    const mapped = dbCategories.map(c => ({
      id: c.slug,
      labelIt: c.labelIt,
      labelEn: c.labelEn,
    }));
    return [allOption, ...mapped];
  }, [dbCategories]);

  const createMediaMutation = useMutation({
    mutationFn: async (data: InsertMedia) => {
      const response = await apiRequest("POST", "/api/admin/media", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiRequest("POST", "/api/admin/media/bulk-delete", { ids });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      setSelectedIds(new Set());
      setSelectMode(false);
      toast({
        title: t("Eliminato", "Deleted"),
        description: t(
          `${data.deleted} immagini eliminate con successo.`,
          `${data.deleted} images deleted successfully.`
        ),
      });
    },
    onError: () => {
      toast({
        title: t("Errore", "Error"),
        description: t("Impossibile eliminare le immagini.", "Failed to delete images."),
        variant: "destructive",
      });
    },
  });

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredMedia.map(m => m.id)));
  }, [filteredMedia]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  const MAX_FILES = 10;

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Validate file count
    if (files.length > MAX_FILES) {
      toast({
        title: t("Errore", "Error"),
        description: t(`Massimo ${MAX_FILES} file alla volta.`, `Maximum ${MAX_FILES} files at once.`),
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: t("Errore", "Error"),
          description: t(`Il file "${file.name}" supera i 25MB.`, `File "${file.name}" exceeds 25MB.`),
          variant: "destructive",
        });
        return;
      }
    }

    setIsUploading(true);
    let successCount = 0;
    
    try {
      for (const file of Array.from(files)) {
        // Upload file directly to server
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/admin/uploads/direct", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Upload failed (${uploadResponse.status})`);
        }

        const uploadResult = await uploadResponse.json();

        // Determine category
        const uploadCategory = selectedCategory !== "all" 
          ? selectedCategory 
          : (dbCategories.length > 0 ? dbCategories[0].slug : null);

        // Save to database
        const mediaData: InsertMedia = {
          filename: uploadResult.filename,
          url: uploadResult.url,
          mimeType: uploadResult.mimeType,
          size: uploadResult.size,
          category: uploadCategory,
        };

        await createMediaMutation.mutateAsync(mediaData);
        successCount++;
      }

      toast({
        title: t("Caricato", "Uploaded"),
        description: successCount > 1 
          ? t(`${successCount} file caricati con successo.`, `${successCount} files uploaded successfully.`)
          : t("File caricato con successo.", "File uploaded successfully."),
      });
    } catch (error) {
      console.error("Upload error:", error);
      const errMsg = error instanceof Error ? error.message : "";
      toast({
        title: t("Errore", "Error"),
        description: errMsg || t("Impossibile caricare il file.", "Failed to upload file."),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [selectedCategory, dbCategories, createMediaMutation, t, toast]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Filter only image files
      const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        processFiles(imageFiles);
      } else {
        toast({
          title: t("Errore", "Error"),
          description: t("Solo file immagine sono accettati.", "Only image files are accepted."),
          variant: "destructive",
        });
      }
    }
  }, [processFiles, t, toast]);

  const openDetails = (media: Media) => {
    setSelectedMedia(media);
    setDetailsOpen(true);
  };

  return (
    <AdminLayout>
      <div 
        className="p-6 relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
            <div className="bg-background/90 backdrop-blur-sm px-8 py-6 rounded-lg shadow-lg text-center">
              <Upload className="h-12 w-12 mx-auto mb-3 text-primary" />
              <p className="text-lg font-medium">{t("Rilascia qui le immagini", "Drop images here")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("Max 10 file, 25MB ciascuno", "Max 10 files, 25MB each")}</p>
            </div>
          </div>
        )}
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
            {!selectMode && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setManageCategoriesOpen(true)}
                  data-testid="button-manage-folders"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t("Gestisci cartelle", "Manage folders")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectMode(true)}
                  data-testid="button-select-mode"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {t("Seleziona", "Select")}
                </Button>
              </>
            )}
            {selectMode && (
              <>
                <Button
                  variant="outline"
                  onClick={selectedIds.size === filteredMedia.length ? deselectAll : selectAll}
                  data-testid="button-select-all"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {selectedIds.size === filteredMedia.length
                    ? t("Deseleziona tutto", "Deselect all")
                    : t("Seleziona tutto", "Select all")}
                </Button>
                <Button
                  variant="destructive"
                  disabled={selectedIds.size === 0 || bulkDeleteMutation.isPending}
                  onClick={() => setConfirmDeleteOpen(true)}
                  data-testid="button-delete-selected"
                >
                  {bulkDeleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {t(`Elimina (${selectedIds.size})`, `Delete (${selectedIds.size})`)}
                </Button>
                <Button
                  variant="ghost"
                  onClick={exitSelectMode}
                  data-testid="button-exit-select"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t("Annulla", "Cancel")}
                </Button>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
              data-testid="input-file-upload"
            />
            {!selectMode && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                data-testid="button-upload"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading 
                  ? t("Caricamento...", "Uploading...") 
                  : t("Carica immagine", "Upload image")}
              </Button>
            )}
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
            {categories.map((cat) => (
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
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                {searchQuery || selectedCategory !== "all"
                  ? t("Nessuna immagine trovata con questi filtri.", "No images found with these filters.")
                  : t("Nessun file caricato.", "No files uploaded.")}
              </p>
              {!searchQuery && selectedCategory === "all" && (
                <p className="text-sm text-muted-foreground">
                  {t("Trascina le immagini qui o clicca su 'Carica immagine'", "Drag images here or click 'Upload image'")}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMedia.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <Card
                  key={item.id}
                  className={`overflow-hidden cursor-pointer hover-elevate transition-all group ${selectMode && isSelected ? "ring-2 ring-primary" : ""}`}
                  onClick={() => {
                    if (selectMode) {
                      toggleSelection(item.id);
                    } else {
                      openDetails(item);
                    }
                  }}
                  data-testid={`media-item-${item.id}`}
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img
                      src={item.url}
                      alt={language === "it" ? (item.altIt || item.filename) : (item.altEn || item.filename)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {selectMode && (
                      <div className="absolute top-2 left-2 z-10">
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-background/80 border-muted-foreground/50 backdrop-blur-sm"
                          }`}
                          data-testid={`checkbox-media-${item.id}`}
                        >
                          {isSelected && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.5 3.5L5.5 9.5L2.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
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
              );
            })}
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

      <ManageCategoriesModal
        open={manageCategoriesOpen}
        onOpenChange={setManageCategoriesOpen}
      />

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Conferma eliminazione", "Confirm deletion")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `Stai per eliminare ${selectedIds.size} immagini. Questa azione non può essere annullata.`,
                `You are about to delete ${selectedIds.size} images. This action cannot be undone.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t("Annulla", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
              data-testid="button-confirm-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("Elimina", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
