import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image as ImageIcon, Search, Check } from "lucide-react";
import type { Media, MediaCategory } from "@shared/schema";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: Media) => void;
  multiple?: false;
}

interface MediaPickerMultipleProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: Media[]) => void;
  multiple: true;
}

export function MediaPickerModal(props: MediaPickerModalProps | MediaPickerMultipleProps) {
  const { open, onClose, multiple } = props;
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [selectedMultiple, setSelectedMultiple] = useState<Map<number, Media>>(new Map());

  const { data: mediaList = [], isLoading: mediaLoading } = useQuery<Media[]>({
    queryKey: ["/api/admin/media"],
    enabled: open,
  });

  const { data: categories = [] } = useQuery<MediaCategory[]>({
    queryKey: ["/api/admin/media-categories"],
    enabled: open,
  });

  const filteredMedia = mediaList.filter((media) => {
    const matchesSearch =
      !searchQuery ||
      media.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      media.altIt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      media.altEn?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || media.category === selectedCategory;

    const isImage = media.mimeType.startsWith("image/");

    return matchesSearch && matchesCategory && isImage;
  });

  const handleConfirm = () => {
    if (multiple) {
      const selected = Array.from(selectedMultiple.values());
      if (selected.length > 0) {
        (props as MediaPickerMultipleProps).onSelect(selected);
        setSelectedMultiple(new Map());
        onClose();
      }
    } else {
      if (selectedMedia) {
        (props as MediaPickerModalProps).onSelect(selectedMedia);
        setSelectedMedia(null);
        onClose();
      }
    }
  };

  const handleMediaClick = (media: Media) => {
    if (multiple) {
      setSelectedMultiple(prev => {
        const next = new Map(prev);
        if (next.has(media.id)) {
          next.delete(media.id);
        } else {
          next.set(media.id, media);
        }
        return next;
      });
    } else {
      setSelectedMedia(media);
    }
  };

  const handleDoubleClick = (media: Media) => {
    if (!multiple) {
      (props as MediaPickerModalProps).onSelect(media);
      setSelectedMedia(null);
      onClose();
    }
  };

  const isSelected = (media: Media) => {
    if (multiple) return selectedMultiple.has(media.id);
    return selectedMedia?.id === media.id;
  };

  const selectionCount = multiple ? selectedMultiple.size : (selectedMedia ? 1 : 0);

  const getFooterText = () => {
    if (multiple) {
      if (selectedMultiple.size === 0) {
        return t("Clicca per selezionare una o più immagini", "Click to select one or more images");
      }
      return t(`${selectedMultiple.size} immagini selezionate`, `${selectedMultiple.size} images selected`);
    }
    if (selectedMedia) {
      return t(`Selezionato: ${selectedMedia.filename}`, `Selected: ${selectedMedia.filename}`);
    }
    return t("Clicca per selezionare, doppio click per confermare", "Click to select, double click to confirm");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setSelectedMedia(null);
        setSelectedMultiple(new Map());
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {multiple
              ? t("Seleziona Immagini", "Select Images")
              : t("Seleziona Immagine", "Select Image")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-4 items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Cerca immagini...", "Search images...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-media-search"
              />
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mb-4 flex-wrap h-auto">
              <TabsTrigger value="all" data-testid="tab-all-media">
                {t("Tutti", "All")}
              </TabsTrigger>
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.slug} data-testid={`tab-category-${cat.slug}`}>
                  {language === "it" ? cat.labelIt : cat.labelEn}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="flex-1 overflow-y-auto mt-0">
              {mediaLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("Nessuna immagine trovata.", "No images found.")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredMedia.map((media) => (
                    <button
                      key={media.id}
                      onClick={() => handleMediaClick(media)}
                      onDoubleClick={() => handleDoubleClick(media)}
                      className={`
                        relative aspect-square rounded-lg overflow-hidden bg-muted
                        transition-all hover:ring-2 hover:ring-primary/50
                        ${isSelected(media) ? "ring-2 ring-primary" : ""}
                      `}
                      data-testid={`media-item-${media.id}`}
                    >
                      <img
                        src={media.url}
                        alt={language === "it" ? media.altIt || media.filename : media.altEn || media.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {isSelected(media) && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <p className="text-sm text-muted-foreground">
            {getFooterText()}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setSelectedMedia(null);
              setSelectedMultiple(new Map());
              onClose();
            }}>
              {t("Annulla", "Cancel")}
            </Button>
            <Button onClick={handleConfirm} disabled={selectionCount === 0} data-testid="button-confirm-media">
              {multiple && selectionCount > 0
                ? t(`Aggiungi (${selectionCount})`, `Add (${selectionCount})`)
                : t("Seleziona", "Select")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
