import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Edit2, GripVertical } from "lucide-react";
import type { GalleryImage } from "@shared/schema";

interface SortableImageProps {
  image: GalleryImage;
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableImage({ image, onEdit, onDelete }: SortableImageProps) {
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
      {...attributes}
      {...listeners}
      className={`relative aspect-[9/16] rounded-lg overflow-hidden bg-muted group cursor-grab active:cursor-grabbing touch-none ${isDragging ? 'ring-2 ring-primary shadow-lg' : ''}`}
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
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="secondary"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          data-testid={`button-edit-image-${image.id}`}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          data-testid={`button-delete-image-${image.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
