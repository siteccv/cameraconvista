import { useState, useRef, useEffect, useCallback } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { FolderOpen, ZoomIn, RotateCcw, GripVertical, Sun } from "lucide-react";
import { MediaPickerModal } from "./MediaPickerModal";
import type { Media } from "@shared/schema";

interface TestImageContainerProps {
  src: string;
  zoom: number;
  panX: number;
  panY: number;
  overlay: number;
  containerClassName?: string;
  aspectRatio?: string;
  children?: React.ReactNode;
  onSave?: (data: { src: string; zoom: number; panX: number; panY: number; overlay: number }) => void;
}

function useImageMath(
  containerW: number,
  containerH: number,
  naturalW: number,
  naturalH: number,
  zoom: number,
  panX: number,
  panY: number,
) {
  if (naturalW <= 0 || naturalH <= 0 || containerW <= 0 || containerH <= 0) {
    return { imgW: 0, imgH: 0, imgLeft: 0, imgTop: 0, overflowX: 0, overflowY: 0, minZoom: 100 };
  }

  const baseW = containerW;
  const baseH = containerW * (naturalH / naturalW);

  const minZoom = baseH < containerH
    ? Math.ceil((containerH / baseH) * 100)
    : 100;

  const effectiveZoom = Math.max(minZoom, zoom);
  const zoomFactor = effectiveZoom / 100;
  const imgW = baseW * zoomFactor;
  const imgH = baseH * zoomFactor;

  const overflowX = Math.max(0, imgW - containerW);
  const overflowY = Math.max(0, imgH - containerH);

  const clampedPanX = overflowX > 0 ? Math.max(-100, Math.min(100, panX)) : 0;
  const clampedPanY = overflowY > 0 ? Math.max(-100, Math.min(100, panY)) : 0;

  const translateX = (clampedPanX / 100) * (overflowX / 2);
  const translateY = (clampedPanY / 100) * (overflowY / 2);

  const imgLeft = (containerW - imgW) / 2 + translateX;
  const imgTop = (containerH - imgH) / 2 + translateY;

  return { imgW, imgH, imgLeft, imgTop, overflowX, overflowY, minZoom };
}

export function TestImageContainer({
  src,
  zoom: propZoom,
  panX: propPanX,
  panY: propPanY,
  overlay: propOverlay,
  containerClassName = "",
  aspectRatio = "16/9",
  children,
  onSave,
}: TestImageContainerProps) {
  const { adminPreview } = useAdmin();
  const { t } = useLanguage();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const [containerH, setContainerH] = useState(0);

  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [editSrc, setEditSrc] = useState(src);
  const [editZoom, setEditZoom] = useState(propZoom);
  const [editPanX, setEditPanX] = useState(propPanX);
  const [editPanY, setEditPanY] = useState(propPanY);
  const [editOverlay, setEditOverlay] = useState(propOverlay);
  const [isEditing, setIsEditing] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragStartPan = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setEditSrc(src);
    setEditZoom(propZoom);
    setEditPanX(propPanX);
    setEditPanY(propPanY);
    setEditOverlay(propOverlay);
    setHasChanges(false);
  }, [src, propZoom, propPanX, propPanY, propOverlay]);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerW(rect.width);
          setContainerH(rect.height);
        }
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!editSrc) return;
    setImageLoaded(false);
    const img = new Image();
    img.onload = () => {
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImageLoaded(false);
    };
    img.src = editSrc;
  }, [editSrc]);

  const displaySrc = isEditing ? editSrc : src;
  const displayZoom = isEditing ? editZoom : propZoom;
  const displayPanX = isEditing ? editPanX : propPanX;
  const displayPanY = isEditing ? editPanY : propPanY;
  const displayOverlay = isEditing ? editOverlay : propOverlay;

  const { imgW, imgH, imgLeft, imgTop, overflowX, overflowY, minZoom } = useImageMath(
    containerW, containerH, naturalW, naturalH, displayZoom, displayPanX, displayPanY
  );

  const updatePan = useCallback((newPanX: number, newPanY: number) => {
    const clampedX = overflowX > 0 ? Math.max(-100, Math.min(100, newPanX)) : 0;
    const clampedY = overflowY > 0 ? Math.max(-100, Math.min(100, newPanY)) : 0;
    setEditPanX(clampedX);
    setEditPanY(clampedY);
    setHasChanges(true);
  }, [overflowX, overflowY]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragStartPan.current = { x: editPanX, y: editPanY };
  }, [isEditing, editPanX, editPanY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    const currentOverflowX = Math.max(0, imgW - containerW);
    const currentOverflowY = Math.max(0, imgH - containerH);

    let newPanX = dragStartPan.current.x;
    let newPanY = dragStartPan.current.y;

    if (currentOverflowX > 0) {
      newPanX = dragStartPan.current.x + (dx / (currentOverflowX / 2)) * 100;
    }
    if (currentOverflowY > 0) {
      newPanY = dragStartPan.current.y + (dy / (currentOverflowY / 2)) * 100;
    }

    updatePan(newPanX, newPanY);
  }, [imgW, imgH, containerW, containerH, updatePan]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isEditing || e.touches.length !== 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    dragStartPan.current = { x: editPanX, y: editPanY };
  }, [isEditing, editPanX, editPanY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;

    const currentOverflowX = Math.max(0, imgW - containerW);
    const currentOverflowY = Math.max(0, imgH - containerH);

    let newPanX = dragStartPan.current.x;
    let newPanY = dragStartPan.current.y;

    if (currentOverflowX > 0) {
      newPanX = dragStartPan.current.x + (dx / (currentOverflowX / 2)) * 100;
    }
    if (currentOverflowY > 0) {
      newPanY = dragStartPan.current.y + (dy / (currentOverflowY / 2)) * 100;
    }

    updatePan(newPanX, newPanY);
  }, [imgW, imgH, containerW, containerH, updatePan]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isEditing) return;
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -5 : 5;
    const newZoom = Math.min(300, Math.max(minZoom, editZoom + delta));
    if (newZoom !== editZoom) {
      setEditZoom(newZoom);
      setHasChanges(true);
    }
  }, [isEditing, editZoom, minZoom]);

  const handleMediaSelect = useCallback((media: Media) => {
    setEditSrc(media.url);
    setMediaPickerOpen(false);
    setEditZoom(100);
    setEditPanX(0);
    setEditPanY(0);
    setHasChanges(true);
  }, []);

  const handleReset = useCallback(() => {
    setEditZoom(100);
    setEditPanX(0);
    setEditPanY(0);
    setEditOverlay(0);
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({
        src: editSrc,
        zoom: editZoom,
        panX: Math.round(editPanX),
        panY: Math.round(editPanY),
        overlay: editOverlay,
      });
    }
    setIsEditing(false);
    setHasChanges(false);
  }, [onSave, editSrc, editZoom, editPanX, editPanY, editOverlay]);

  const handleCancel = useCallback(() => {
    setEditSrc(src);
    setEditZoom(propZoom);
    setEditPanX(propPanX);
    setEditPanY(propPanY);
    setEditOverlay(propOverlay);
    setIsEditing(false);
    setHasChanges(false);
  }, [src, propZoom, propPanX, propPanY, propOverlay]);

  const handleStartEdit = useCallback((e: React.MouseEvent) => {
    if (!adminPreview) return;
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  }, [adminPreview]);

  const imgStyle: React.CSSProperties = imgW > 0 && imgH > 0 ? {
    position: "absolute",
    width: imgW,
    height: imgH,
    left: imgLeft,
    top: imgTop,
    maxWidth: "none",
    maxHeight: "none",
  } : {};

  const overlayLabel = displayOverlay === 0
    ? t("Nessuna", "None")
    : displayOverlay <= 20
    ? t("Leggera", "Light")
    : displayOverlay <= 45
    ? t("Media", "Medium")
    : t("Forte", "Strong");

  const debugInfo = isEditing ? {
    container: `${Math.round(containerW)}×${Math.round(containerH)}`,
    natural: `${naturalW}×${naturalH}`,
    displayed: `${Math.round(imgW)}×${Math.round(imgH)}`,
    overflow: `X:${Math.round(overflowX)} Y:${Math.round(overflowY)}`,
    zoom: displayZoom,
    pan: `X:${Math.round(displayPanX)} Y:${Math.round(displayPanY)}`,
    overlay: displayOverlay,
  } : null;

  return (
    <>
      <div
        ref={containerRef}
        className={`${containerClassName} relative overflow-hidden ${isEditing ? "cursor-move ring-2 ring-primary" : adminPreview ? "cursor-pointer group" : ""}`}
        style={{ aspectRatio }}
        onClick={!isEditing ? handleStartEdit : undefined}
        onMouseDown={isEditing ? handleMouseDown : undefined}
        onMouseMove={isEditing ? handleMouseMove : undefined}
        onMouseUp={isEditing ? handleMouseUp : undefined}
        onMouseLeave={isEditing ? handleMouseUp : undefined}
        onTouchStart={isEditing ? handleTouchStart : undefined}
        onTouchMove={isEditing ? handleTouchMove : undefined}
        onTouchEnd={isEditing ? handleTouchEnd : undefined}
        onWheel={isEditing ? handleWheel : undefined}
        data-testid="test-image-container"
      >
        {displaySrc && imageLoaded && imgW > 0 ? (
          <img
            src={displaySrc}
            alt=""
            style={imgStyle}
            className="pointer-events-none select-none"
            draggable={false}
          />
        ) : displaySrc ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            {t("Caricamento...", "Loading...")}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm bg-muted/30">
            {adminPreview ? t("Clicca per scegliere immagine", "Click to choose image") : ""}
          </div>
        )}

        {displayOverlay > 0 && displaySrc && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: `rgba(0, 0, 0, ${displayOverlay / 100})` }}
            data-testid="test-image-overlay"
          />
        )}

        {children && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {children}
          </div>
        )}

        {adminPreview && !isEditing && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none z-10">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-lg p-2 flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              <span className="text-sm">{t("Modifica", "Edit")}</span>
            </div>
          </div>
        )}

        {isEditing && (
          <>
            <div className="absolute top-2 left-2 right-2 z-20 flex flex-col gap-2 pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => { e.stopPropagation(); setMediaPickerOpen(true); }}
                  data-testid="test-image-media-picker"
                >
                  <FolderOpen className="h-4 w-4 mr-1" />
                  {t("Media", "Media")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-black/60 text-white border-white/30"
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  data-testid="test-image-reset"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                <div className="flex-1" />
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-black/60 text-white border-white/30"
                  onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                >
                  {t("Annulla", "Cancel")}
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => { e.stopPropagation(); handleSave(); }}
                  disabled={!hasChanges}
                  data-testid="test-image-save"
                >
                  {t("Salva", "Save")}
                </Button>
              </div>

              <div className="flex items-center gap-2 bg-black/70 rounded-lg px-3 py-2 pointer-events-auto max-w-xs">
                <ZoomIn className="h-4 w-4 text-white shrink-0" />
                <Slider
                  value={[editZoom]}
                  onValueChange={([val]) => { setEditZoom(val); setHasChanges(true); }}
                  min={minZoom}
                  max={300}
                  step={1}
                  className="flex-1"
                  data-testid="test-image-zoom-slider"
                />
                <span className="text-white text-xs w-10 text-right shrink-0">{editZoom}%</span>
              </div>

              <div className="flex items-center gap-2 bg-black/70 rounded-lg px-3 py-2 pointer-events-auto max-w-xs">
                <Sun className="h-4 w-4 text-white shrink-0" />
                <Slider
                  value={[editOverlay]}
                  onValueChange={([val]) => { setEditOverlay(val); setHasChanges(true); }}
                  min={0}
                  max={70}
                  step={1}
                  className="flex-1"
                  data-testid="test-image-overlay-slider"
                />
                <span className="text-white text-xs w-16 text-right shrink-0">{editOverlay}% {overlayLabel}</span>
              </div>
            </div>

            <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                  <GripVertical className="h-3 w-3 inline mr-1" />
                  {t("Trascina per spostare · Scroll per zoom", "Drag to pan · Scroll to zoom")}
                </div>
                {debugInfo && (
                  <div className="bg-black/70 text-green-400 text-[9px] px-2 py-1 rounded font-mono leading-tight">
                    {debugInfo.container} | img:{debugInfo.natural} | disp:{debugInfo.displayed} | ovf:{debugInfo.overflow} | z:{debugInfo.zoom} | pan:{debugInfo.pan} | ovl:{debugInfo.overlay}%
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
      />
    </>
  );
}
