import { useState, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn, Move } from "lucide-react";
import type { GalleryImage, InsertGalleryImage } from "@shared/schema";

interface ImageZoomModalProps {
  open: boolean;
  onClose: () => void;
  image: GalleryImage;
  onSave: (data: Partial<InsertGalleryImage>) => void;
}

export function ImageZoomModal({ open, onClose, image, onSave }: ImageZoomModalProps) {
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
