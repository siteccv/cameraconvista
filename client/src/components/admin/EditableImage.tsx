import { useState, useRef, useEffect, useCallback } from "react";
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

  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const [frameW, setFrameW] = useState(400);
  const [frameH, setFrameH] = useState(300);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragStartOffset = useRef({ x: 0, y: 0 });

  const [previewAspect, setPreviewAspect] = useState(16 / 9);

  const zoom = activeTab === "desktop" ? editZoomDesktop : editZoomMobile;
  const offsetX = activeTab === "desktop" ? editOffsetXDesktop : editOffsetXMobile;
  const offsetY = activeTab === "desktop" ? editOffsetYDesktop : editOffsetYMobile;

  const setZoom = useCallback((val: number) => {
    if (activeTab === "desktop") setEditZoomDesktop(val);
    else setEditZoomMobile(val);
  }, [activeTab]);

  const setOffsetX = useCallback((val: number) => {
    if (activeTab === "desktop") setEditOffsetXDesktop(val);
    else setEditOffsetXMobile(val);
  }, [activeTab]);

  const setOffsetY = useCallback((val: number) => {
    if (activeTab === "desktop") setEditOffsetYDesktop(val);
    else setEditOffsetYMobile(val);
  }, [activeTab]);

  useEffect(() => {
    if (isOpen && editSrc) {
      setImageLoaded(false);
      const img = new Image();
      img.onload = () => {
        setNaturalWidth(img.naturalWidth);
        setNaturalHeight(img.naturalHeight);
        setImageLoaded(true);
      };
      img.onerror = () => {
        setNaturalWidth(800);
        setNaturalHeight(600);
        setImageLoaded(true);
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
          setFrameW(rect.width);
          setFrameH(rect.height);
        }
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, [isOpen, previewAspect]);

  const coverScale = (naturalWidth > 0 && naturalHeight > 0)
    ? Math.max(frameW / naturalWidth, frameH / naturalHeight)
    : 1;

  const containScale = (naturalWidth > 0 && naturalHeight > 0)
    ? Math.min(frameW / naturalWidth, frameH / naturalHeight)
    : 1;

  const fitZoom = Math.max(10, Math.round((containScale / coverScale) * 100));

  const s = zoom / 100;

  const openEditor = (e: React.MouseEvent) => {
    if (!adminPreview) return;
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
    setImageLoaded(false);
    setIsOpen(true);
  };

  const handleReset = () => {
    setZoom(100);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleFit = () => {
    setZoom(Math.max(10, fitZoom));
    setOffsetX(0);
    setOffsetY(0);
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
    dragStartOffset.current = { x: offsetX, y: offsetY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffsetX(dragStartOffset.current.x + dx / s);
    setOffsetY(dragStartOffset.current.y + dy / s);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    dragStartOffset.current = { x: offsetX, y: offsetY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    setOffsetX(dragStartOffset.current.x + dx / s);
    setOffsetY(dragStartOffset.current.y + dy / s);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -5 : 5;
    const minZoom = Math.max(10, fitZoom);
    const newZoom = Math.min(300, Math.max(minZoom, zoom + delta));
    if (newZoom !== zoom) setZoom(newZoom);
  };

  const handleMediaSelect = (media: Media) => {
    setEditSrc(media.url);
    setMediaPickerOpen(false);
  };

  const isMobile = forceMobileLayout || viewportIsMobile;
  const displayZoom = isMobile ? zoomMobile : zoomDesktop;
  const displayOffsetX = isMobile ? offsetXMobile : offsetXDesktop;
  const displayOffsetY = isMobile ? offsetYMobile : offsetYDesktop;

  const needsTransform = displayZoom !== 100 || displayOffsetX !== 0 || displayOffsetY !== 0;
  const siteTransform: React.CSSProperties = needsTransform ? {
    transform: `scale(${displayZoom / 100}) translate(${displayOffsetX}px, ${displayOffsetY}px)`,
    transformOrigin: "center center",
  } : {};

  if (!adminPreview) {
    return (
      <div className={containerClassName}>
        <img src={src} alt={alt} className={`${className} absolute inset-0`} style={siteTransform} />
      </div>
    );
  }

  const minZoom = Math.max(10, fitZoom);

  return (
    <>
      <div
        className={`${containerClassName} cursor-pointer group`}
        onClick={openEditor}
        data-testid="editable-image-container"
      >
        <img src={src} alt={alt} className={`${className} absolute inset-0`} style={siteTransform} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-lg p-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm">{t("Modifica", "Edit")}</span>
          </div>
        </div>
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
                  backgroundImage: "repeating-conic-gradient(#333 0% 25%, #222 0% 50%)",
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
                {editSrc && imageLoaded ? (
                  <img
                    key={editSrc}
                    src={editSrc}
                    alt="Preview"
                    className="absolute pointer-events-none"
                    style={{
                      width: naturalWidth * coverScale * s,
                      height: naturalHeight * coverScale * s,
                      left: (frameW - naturalWidth * coverScale * s) / 2 + offsetX * s,
                      top: (frameH - naturalHeight * coverScale * s) / 2 + offsetY * s,
                      maxWidth: "none",
                      maxHeight: "none",
                    }}
                    draggable={false}
                  />
                ) : editSrc ? (
                  <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                    {t("Caricamento...", "Loading...")}
                  </div>
                ) : null}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded z-10 pointer-events-none">
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
                  <span className="text-sm text-muted-foreground">{zoom}%</span>
                </div>
                <Slider
                  value={[zoom]}
                  onValueChange={([val]) => setZoom(val)}
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
                    value={Math.round(offsetX)}
                    onChange={(e) => setOffsetX(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Offset Y</Label>
                  <Input
                    type="number"
                    value={Math.round(offsetY)}
                    onChange={(e) => setOffsetY(Number(e.target.value))}
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
