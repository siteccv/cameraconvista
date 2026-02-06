import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Save, Loader2, X, RotateCcw, RotateCw } from "lucide-react";
import type { Media } from "@shared/schema";
import { formatSize, formatDate } from "@/lib/formatters";

const CATEGORIES = ["varie", "interni", "food", "drink", "eventi"] as const;

interface ImageDetailsModalProps {
  media: Media | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageDetailsModal({ media, open, onOpenChange }: ImageDetailsModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [altIt, setAltIt] = useState("");
  const [altEn, setAltEn] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (media) {
      setAltIt(media.altIt || "");
      setAltEn(media.altEn || "");
      setCategory(media.category || "");
      setTags(media.tags || []);
    }
  }, [media]);

  const updateMutation = useMutation({
    mutationFn: async (data: { altIt: string; altEn: string; category: string; tags: string[] }) => {
      if (!media) return;
      const response = await apiRequest("PUT", `/api/admin/media/${media.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({
        title: t("Salvato", "Saved"),
        description: t("Dettagli immagine aggiornati.", "Image details updated."),
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: t("Errore", "Error"),
        description: t("Impossibile salvare i dettagli.", "Failed to save details."),
        variant: "destructive",
      });
    },
  });

  const rotateMutation = useMutation({
    mutationFn: async (direction: "cw" | "ccw") => {
      if (!media) return;
      const response = await apiRequest("POST", `/api/admin/media/${media.id}/rotate`, { direction });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({
        title: t("Ruotato", "Rotated"),
        description: t("Immagine ruotata con successo.", "Image rotated successfully."),
      });
    },
    onError: () => {
      toast({
        title: t("Errore", "Error"),
        description: t("Impossibile ruotare l'immagine.", "Failed to rotate image."),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!media) return;
      await apiRequest("DELETE", `/api/admin/media/${media.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({
        title: t("Eliminato", "Deleted"),
        description: t("Immagine eliminata dalla libreria.", "Image removed from library."),
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: t("Errore", "Error"),
        description: t("Impossibile eliminare l'immagine.", "Failed to delete image."),
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ altIt, altEn, category, tags });
  };

  const handleDelete = () => {
    if (window.confirm(t("Sei sicuro di voler eliminare questa immagine?", "Are you sure you want to delete this image?"))) {
      deleteMutation.mutate();
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  if (!media) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Dettagli immagine", "Image Details")}</DialogTitle>
          <DialogDescription>
            {t("Visualizza e gestisci le informazioni dell'immagine", "View and manage image information")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <div className="aspect-video bg-muted rounded-md overflow-hidden">
              {rotateMutation.isPending ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <img
                  src={media.url}
                  alt={altIt || media.filename}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => rotateMutation.mutate("ccw")}
                disabled={rotateMutation.isPending}
                data-testid="button-rotate-ccw"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                {t("Ruota sx", "Rotate left")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => rotateMutation.mutate("cw")}
                disabled={rotateMutation.isPending}
                data-testid="button-rotate-cw"
              >
                <RotateCw className="h-4 w-4 mr-1" />
                {t("Ruota dx", "Rotate right")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("Testo alternativo (IT)", "Alt Text (IT)")}</Label>
              <Input
                value={altIt}
                onChange={(e) => setAltIt(e.target.value)}
                placeholder={media.filename}
                data-testid="input-alt-it"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Testo alternativo (EN)", "Alt Text (EN)")}</Label>
              <Input
                value={altEn}
                onChange={(e) => setAltEn(e.target.value)}
                placeholder={media.filename}
                data-testid="input-alt-en"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("Cartella", "Folder")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder={t("Seleziona cartella", "Select folder")} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tag</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={t("Aggiungi tag...", "Add tag...")}
                data-testid="input-tag"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                +
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("Nessun tag", "No tags")}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {t("Caricato", "Uploaded")}: {formatDate(media.createdAt)} · {formatSize(media.size)}
          </p>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              className="bg-white text-primary border-primary/20 hover:bg-primary/5"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-media"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t("Elimina", "Delete")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              data-testid="button-save-media"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t("Salva dettagli", "Save details")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
