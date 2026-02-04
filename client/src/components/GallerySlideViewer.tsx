import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
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
  const { language, t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < sortedImages.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const dragX = useMotionValue(0);
  const dragProgress = useTransform(dragX, [-100, 100], [1, -1]);

  const onDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      goToNext();
    } else if (info.offset.x > swipeThreshold) {
      goToPrevious();
    }
  };

  if (sortedImages.length === 0) return null;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 bg-black border-none [&>button]:hidden overflow-hidden"
        data-testid="gallery-slide-viewer"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>{language === "it" ? gallery.titleIt : gallery.titleEn}</DialogTitle>
        </VisuallyHidden>
        
        <div className="relative w-full h-full flex flex-col items-center justify-between py-8 md:py-12 bg-black">
          {/* Header */}
          <div className="text-center text-white z-50 px-4 pt-4">
            <h2 className="font-display text-2xl md:text-3xl">
              {language === "it" ? gallery.titleIt : gallery.titleEn}
            </h2>
            <p className="text-sm text-white/70 mt-1">
              {currentIndex + 1} / {sortedImages.length}
            </p>
          </div>

          {/* Main Image Container */}
          <div className="relative flex items-center justify-center w-full flex-1 overflow-hidden px-4 my-4">
            {currentIndex > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-2 md:left-8 z-50 text-white hover:bg-white/20 h-12 w-12 hidden md:flex rounded-full border border-white/20 backdrop-blur-sm"
                onClick={goToPrevious}
                data-testid="button-previous-slide"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.5}
                  onDragEnd={onDragEnd}
                  className="absolute w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                >
                  <div 
                    className="relative aspect-[9/16] overflow-hidden rounded-xl shadow-2xl bg-zinc-900"
                    style={{ 
                      maxHeight: "min(70vh, calc(100vh - 280px))", 
                      width: "auto",
                      aspectRatio: "9/16",
                    }}
                  >
                    <img
                      src={sortedImages[currentIndex].imageUrl}
                      alt={language === "it" ? sortedImages[currentIndex].altIt || "" : sortedImages[currentIndex].altEn || ""}
                      className="w-full h-full object-cover pointer-events-none"
                      style={{
                        transform: `scale(${(sortedImages[currentIndex].imageZoom || 100) / 100}) translate(${sortedImages[currentIndex].imageOffsetX || 0}%, ${sortedImages[currentIndex].imageOffsetY || 0}%)`,
                      }}
                      loading="eager"
                      data-testid={`slide-image-${currentIndex}`}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {currentIndex < sortedImages.length - 1 && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 md:right-8 z-50 text-white hover:bg-white/20 h-12 w-12 hidden md:flex rounded-full border border-white/20 backdrop-blur-sm"
                onClick={goToNext}
                data-testid="button-next-slide"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}
          </div>

          {/* Footer Controls */}
          <div className="w-full flex flex-col items-center gap-6 pb-6 px-4 z-50">
            {/* Dot indicators */}
            <div className="flex justify-center gap-2">
              {sortedImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? "bg-white w-6" 
                      : "bg-white/30 hover:bg-white/50 w-1.5"
                  }`}
                  data-testid={`dot-indicator-${index}`}
                />
              ))}
            </div>

            {/* Close Button */}
            <Button
              variant="outline"
              size="lg"
              className="min-w-[120px] rounded-full bg-white/10 text-white border-white/20 hover:bg-white hover:text-black transition-all duration-300 font-display uppercase tracking-widest text-xs h-10 px-8"
              onClick={onClose}
              data-testid="button-close-viewer"
            >
              {t("Chiudi", "Close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
