import { useState, useRef } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ImageIcon, RotateCcw, ZoomIn, Move, FolderOpen } from "lucide-react";
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
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

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

  const handleClick = (e: React.MouseEvent) => {
    if (adminPreview) {
      e.preventDefault();
      e.stopPropagation();
      setEditSrc(src);
      setEditZoomDesktop(zoomDesktop);
      setEditZoomMobile(zoomMobile);
      setEditOffsetXDesktop(offsetXDesktop);
      setEditOffsetYDesktop(offsetYDesktop);
      setEditOffsetXMobile(offsetXMobile);
      setEditOffsetYMobile(offsetYMobile);
      setActiveTab(deviceView);
      setIsOpen(true);
    }
  };

  const handleReset = () => {
    setCurrentZoom(100);
    setCurrentOffsetX(0);
    setCurrentOffsetY(0);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        src: editSrc,
        zoomDesktop: editZoomDesktop,
        zoomMobile: editZoomMobile,
        offsetXDesktop: editOffsetXDesktop,
        offsetYDesktop: editOffsetYDesktop,
        offsetXMobile: editOffsetXMobile,
        offsetYMobile: editOffsetYMobile,
      });
    }
    setIsOpen(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - currentOffsetX, y: e.clientY - currentOffsetY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setCurrentOffsetX(e.clientX - dragStart.current.x);
    setCurrentOffsetY(e.clientY - dragStart.current.y);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMediaSelect = (media: Media) => {
    setEditSrc(media.url);
    setMediaPickerOpen(false);
  };

  // Use mobile values when: admin forces mobile layout OR real viewport is mobile
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

  return (
    <>
      <div 
        className={`${containerClassName} cursor-pointer group`}
        onClick={handleClick}
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
              className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={editSrc}
                alt="Preview"
                className="w-full h-full object-cover pointer-events-none"
                style={{
                  transform: `scale(${currentZoom / 100}) translate(${currentOffsetX}px, ${currentOffsetY}px)`,
                  transformOrigin: "center center",
                }}
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {t("Trascina per spostare", "Drag to pan")}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <ZoomIn className="h-4 w-4" />
                    {t("Zoom", "Zoom")} ({activeTab === "desktop" ? "Desktop" : "Mobile"})
                  </Label>
                  <span className="text-sm text-muted-foreground">{currentZoom}%</span>
                </div>
                <Slider
                  value={[currentZoom]}
                  onValueChange={([val]) => setCurrentZoom(val)}
                  min={50}
                  max={200}
                  step={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Move className="h-4 w-4" />
                    Offset X
                  </Label>
                  <Input
                    type="number"
                    value={currentOffsetX}
                    onChange={(e) => setCurrentOffsetX(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Offset Y</Label>
                  <Input
                    type="number"
                    value={currentOffsetY}
                    onChange={(e) => setCurrentOffsetY(Number(e.target.value))}
                  />
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("Reset Posizione", "Reset Position")}
              </Button>
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
