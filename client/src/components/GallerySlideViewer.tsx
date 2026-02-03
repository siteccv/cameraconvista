import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Gallery, GalleryImage } from "@shared/schema";

interface GallerySlideViewerProps {
  open: boolean;
  onClose: () => void;
  gallery: Gallery;
  images: GalleryImage[];
  initialIndex?: number;
}

export function GallerySlideViewer({
  open,
  onClose,
  gallery,
  images,
  initialIndex = 0,
}: GallerySlideViewerProps) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : prev));
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) goToNext();
    if (isRightSwipe) goToPrevious();
  };

  if (sortedImages.length === 0) return null;

  const currentImage = sortedImages[currentIndex];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 bg-black border-none [&>button]:hidden"
        data-testid="gallery-slide-viewer"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>{language === "it" ? gallery.titleIt : gallery.titleEn}</DialogTitle>
        </VisuallyHidden>
        
        <div 
          className="relative w-full h-full flex flex-col items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={onClose}
            data-testid="button-close-viewer"
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="text-center text-white mb-4 z-50">
            <h2 className="font-display text-2xl md:text-3xl">
              {language === "it" ? gallery.titleIt : gallery.titleEn}
            </h2>
            <p className="text-sm text-white/70 mt-1">
              {currentIndex + 1} / {sortedImages.length}
            </p>
          </div>

          <div className="relative flex items-center justify-center w-full max-w-4xl px-4">
            {currentIndex > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-2 md:left-4 z-50 text-white hover:bg-white/20 h-12 w-12 hidden md:flex"
                onClick={goToPrevious}
                data-testid="button-previous-slide"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            <div 
              className="relative aspect-[9/16] overflow-hidden rounded-lg mx-auto"
              style={{ 
                maxHeight: "calc(100vh - 180px)", 
                maxWidth: "min(85vw, 400px)",
                width: "100%"
              }}
            >
              <img
                src={currentImage.imageUrl}
                alt={language === "it" ? currentImage.altIt || "" : currentImage.altEn || ""}
                className="w-full h-full object-cover"
                style={{
                  transform: `scale(${(currentImage.imageZoom || 100) / 100}) translate(${currentImage.imageOffsetX || 0}%, ${currentImage.imageOffsetY || 0}%)`,
                }}
                loading="eager"
                data-testid={`slide-image-${currentIndex}`}
              />
            </div>

            {currentIndex < sortedImages.length - 1 && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 md:right-4 z-50 text-white hover:bg-white/20 h-12 w-12 hidden md:flex"
                onClick={goToNext}
                data-testid="button-next-slide"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}
          </div>

          <div className="flex justify-center gap-2 mt-6 z-50">
            {sortedImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? "bg-white w-6" 
                    : "bg-white/50 hover:bg-white/70"
                }`}
                data-testid={`dot-indicator-${index}`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
