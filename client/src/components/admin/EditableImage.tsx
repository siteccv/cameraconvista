import { useState, useRef, useEffect } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ImageIcon, RotateCcw, ZoomIn, Move, FolderOpen, Maximize } from "lucide-react";
import { MediaPickerModal } from "./MediaPickerModal";
import type { Media } from "@shared/schema";

interface EditableImageProps {
  blockId?: number;
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  zoomDesktop?: number;
  zoomMobile?: number;
  offsetXDesktop?: number;
  offsetYDesktop?: number;
  offsetXMobile?: number;
  offsetYMobile?: number;
  deviceView?: "desktop" | "mobile";
  onSave?: (data: {
    src: string;
    zoomDesktop: number;
    zoomMobile: number;
    offsetXDesktop: number;
    offsetYDesktop: number;
    offsetXMobile: number;
    offsetYMobile: number;
  }) => void;
}

export function EditableImage({
  blockId,
  src,
  alt = "",
  className = "",
  containerClassName = "",
  zoomDesktop = 100,
  zoomMobile = 100,
  offsetXDesktop = 0,
  offsetYDesktop = 0,
  offsetXMobile = 0,
  offsetYMobile = 0,
  deviceView = "desktop",
  onSave,
}: EditableImageProps) {
  const { adminPreview, forceMobileLayout } = useAdmin();
  const { t } = useLanguage();
  const viewportIsMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const [editSrc, setEditSrc] = useState(src);
  const [editZoomDesktop, setEditZoomDesktop] = useState(zoomDesktop);
  const [editZoomMobile, setEditZoomMobile] = useState(zoomMobile);
  const [editOffsetXDesktop, setEditOffsetXDesktop] = useState(offsetXDesktop);
  const [editOffsetYDesktop, setEditOffsetYDesktop] = useState(offsetYDesktop);
  const [editOffsetXMobile, setEditOffsetXMobile] = useState(offsetXMobile);
  const [editOffsetYMobile, setEditOffsetYMobile] = useState(offsetYMobile);
  const [activeTab, setActiveTab] = useState<"desktop" | "mobile">(deviceView);

  const [naturalDims, setNaturalDims] = useState<{ w: number; h: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameDims, setFrameDims] = useState<{ w: number; h: number }>({ w: 400, h: 300 });

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragStartOffset = useRef({ x: 0, y: 0 });

  const [previewAspect, setPreviewAspect] = useState(16 / 9);

  const currentZoom = activeTab === "desktop" ? editZoomDesktop : editZoomMobile;
  const currentOffsetX = activeTab === "desktop" ? editOffsetXDesktop : editOffsetXMobile;
  const currentOffsetY = activeTab === "desktop" ? editOffsetYDesktop : editOffsetYMobile;

  const setCurrentZoom = (val: number) => {
    if (activeTab === "desktop") setEditZoomDesktop(val);
    else setEditZoomMobile(val);
  };
  const setCurrentOffsetX = (val: number) => {
    if (activeTab === "desktop") setEditOffsetXDesktop(val);
    else setEditOffsetXMobile(val);
  };
  const setCurrentOffsetY = (val: number) => {
    if (activeTab === "desktop") setEditOffsetYDesktop(val);
    else setEditOffsetYMobile(val);
  };

  useEffect(() => {
    if (isOpen && editSrc) {
      setNaturalDims(null);
      const img = new Image();
      img.onload = () => {
        setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = () => {
        setNaturalDims({ w: 800, h: 600 });
      };
      img.src = editSrc;
    }
  }, [isOpen, editSrc]);

  useEffect(() => {
    if (!isOpen || !frameRef.current) return;
    const measure = () => {
      if (frameRef.current) {
        const rect = frameRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setFrameDims({ w: rect.width, h: rect.height });
        }
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, [isOpen, previewAspect]);

  const coverScale = naturalDims
    ? Math.max(frameDims.w / naturalDims.w, frameDims.h / naturalDims.h)
    : 1;

  const containScale = naturalDims
    ? Math.min(frameDims.w / naturalDims.w, frameDims.h / naturalDims.h)
    : 1;

  const fitZoom = naturalDims ? Math.round((containScale / coverScale) * 100) : 100;

  const totalScale = coverScale * (currentZoom / 100);
  const imgWidth = naturalDims ? naturalDims.w * totalScale : frameDims.w;
  const imgHeight = naturalDims ? naturalDims.h * totalScale : frameDims.h;
  const imgLeft = frameDims.w / 2 - imgWidth / 2 + (currentOffsetX * coverScale * (currentZoom / 100));
  const imgTop = frameDims.h / 2 - imgHeight / 2 + (currentOffsetY * coverScale * (currentZoom / 100));

  const handleClick = (e: React.MouseEvent) => {
    if (adminPreview) {
      e.preventDefault();
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setPreviewAspect(rect.width / rect.height);
      }
      setEditSrc(src);
      setEditZoomDesktop(zoomDesktop);
      setEditZoomMobile(zoomMobile);
      setEditOffsetXDesktop(offsetXDesktop);
      setEditOffsetYDesktop(offsetYDesktop);
      setEditOffsetXMobile(offsetXMobile);
      setEditOffsetYMobile(offsetYMobile);
      setActiveTab(deviceView);
      setNaturalDims(null);
      setIsOpen(true);
    }
  };

  const handleReset = () => {
    setCurrentZoom(100);
    setCurrentOffsetX(0);
    setCurrentOffsetY(0);
  };

  const handleFit = () => {
    setCurrentZoom(Math.max(10, fitZoom));
    setCurrentOffsetX(0);
    setCurrentOffsetY(0);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        src: editSrc,
        zoomDesktop: editZoomDesktop,
        zoomMobile: editZoomMobile,
        offsetXDesktop: Math.round(editOffsetXDesktop),
        offsetYDesktop: Math.round(editOffsetYDesktop),
        offsetXMobile: Math.round(editOffsetXMobile),
        offsetYMobile: Math.round(editOffsetYMobile),
      });
    }
    setIsOpen(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragStartOffset.current = { x: currentOffsetX, y: currentOffsetY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const zoomFactor = currentZoom / 100;
    setCurrentOffsetX(dragStartOffset.current.x + dx / zoomFactor);
    setCurrentOffsetY(dragStartOffset.current.y + dy / zoomFactor);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    dragStartOffset.current = { x: currentOffsetX, y: currentOffsetY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    const zoomFactor = currentZoom / 100;
    setCurrentOffsetX(dragStartOffset.current.x + dx / zoomFactor);
    setCurrentOffsetY(dragStartOffset.current.y + dy / zoomFactor);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -5 : 5;
    const newZoom = Math.min(300, Math.max(Math.max(10, fitZoom), currentZoom + delta));
    if (newZoom !== currentZoom) {
      setCurrentZoom(newZoom);
    }
  };

  const handleMediaSelect = (media: Media) => {
    setEditSrc(media.url);
    setMediaPickerOpen(false);
  };

  const isMobile = forceMobileLayout || viewportIsMobile;
  const displayZoom = isMobile ? zoomMobile : zoomDesktop;
  const displayOffsetX = isMobile ? offsetXMobile : offsetXDesktop;
  const displayOffsetY = isMobile ? offsetYMobile : offsetYDesktop;

  const imageStyle = {
    transform: `scale(${displayZoom / 100}) translate(${displayOffsetX}px, ${displayOffsetY}px)`,
    transformOrigin: "center center",
  };

  if (!adminPreview) {
    return (
      <div className={containerClassName}>
        <img
          src={src}
          alt={alt}
          className={className}
          style={imageStyle}
        />
      </div>
    );
  }

  const minZoom = Math.max(10, fitZoom);

  return (
    <>
      <div
        className={`${containerClassName} cursor-pointer group`}
        onClick={handleClick}
        data-testid="editable-image-container"
      >
        <img
          src={src}
          alt={alt}
          className={className}
          style={imageStyle}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-lg p-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm">{t("Modifica", "Edit")}</span>
          </div>
        </div>
        <span className="absolute inset-0 ring-2 ring-primary/50 ring-offset-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl flex flex-col max-h-[85vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle>{t("Modifica Immagine", "Edit Image")}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("Immagine", "Image")}</Label>
              <Button
                variant="outline"
                onClick={() => setMediaPickerOpen(true)}
                type="button"
                className="w-full"
                data-testid="button-open-media-picker"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                {t("Scegli dalla libreria", "Choose from library")}
              </Button>
              {editSrc && (
                <p className="text-xs text-muted-foreground truncate">{editSrc}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant={activeTab === "desktop" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("desktop")}
              >
                Desktop
              </Button>
              <Button
                variant={activeTab === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("mobile")}
              >
                Mobile
              </Button>
            </div>

            <div
              className="rounded-lg overflow-hidden"
              style={{ background: "#1a1a1a" }}
            >
              <div
                ref={frameRef}
                className="relative overflow-hidden cursor-move mx-auto select-none"
                style={{
                  aspectRatio: `${previewAspect}`,
                  backgroundImage:
                    "repeating-conic-gradient(#333 0% 25%, #222 0% 50%)",
                  backgroundSize: "16px 16px",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
              >
                {editSrc && naturalDims && (
                  <img
                    key={editSrc}
                    src={editSrc}
                    alt="Preview"
                    className="absolute pointer-events-none"
                    style={{
                      width: imgWidth + "px",
                      height: imgHeight + "px",
                      left: imgLeft + "px",
                      top: imgTop + "px",
                      maxWidth: 'none', // Prevent interference from global styles
                      maxHeight: 'none'
                    }}
                    draggable={false}
                    onError={(e) => {
                      console.error("IMG tag error:", editSrc);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                {editSrc && !naturalDims && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                    {t("Caricamento...", "Loading...")}
                  </div>
                )}
                <div className="absolute inset-0 ring-2 ring-inset ring-white/20 pointer-events-none z-10 rounded-sm" />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded z-10">
                  {t("Trascina per spostare · Scroll per zoom", "Drag to pan · Scroll to zoom")}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <ZoomIn className="h-4 w-4" />
                    Zoom ({activeTab === "desktop" ? "Desktop" : "Mobile"})
                  </Label>
                  <span className="text-sm text-muted-foreground">{currentZoom}%</span>
                </div>
                <Slider
                  value={[currentZoom]}
                  onValueChange={([val]) => setCurrentZoom(val)}
                  min={minZoom}
                  max={300}
                  step={5}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{t("Foto intera", "Full image")}</span>
                  <span>|</span>
                  <span>{t("Riempie cornice", "Fills frame")} (100%)</span>
                  <span>|</span>
                  <span>Zoom in</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleFit} className="flex-1">
                  <Maximize className="h-4 w-4 mr-2" />
                  {t("Foto intera", "Full image")}
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t("Reset (riempie)", "Reset (cover)")}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Move className="h-4 w-4" />
                    Offset X
                  </Label>
                  <Input
                    type="number"
                    value={Math.round(currentOffsetX)}
                    onChange={(e) => setCurrentOffsetX(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Offset Y</Label>
                  <Input
                    type="number"
                    value={Math.round(currentOffsetY)}
                    onChange={(e) => setCurrentOffsetY(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {t("Annulla", "Cancel")}
            </Button>
            <Button onClick={handleSave}>
              {t("Salva", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
      />
    </>
  );
}
