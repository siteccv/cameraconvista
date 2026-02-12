import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { EditableText } from "@/components/admin/EditableText";
import { ImageContainer } from "@/components/admin/ImageContainer";
import type { ImageContainerSaveData } from "@/components/admin/ImageContainer";
import { GallerySlideViewer } from "@/components/GallerySlideViewer";
import { usePageBlocks } from "@/hooks/use-page-blocks";
import { PAGE_IDS, GALLERIA_DEFAULTS } from "@/lib/page-defaults";
import { Images } from "lucide-react";
import type { Gallery, GalleryImage } from "@shared/schema";

export default function Galleria() {
  const { t, language } = useLanguage();
  const { forceMobileLayout } = useAdmin();
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const viewportIsMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isMobile = forceMobileLayout || viewportIsMobile;

  const { getBlock, updateBlock, isLoading: blocksLoading } = usePageBlocks({
    pageId: PAGE_IDS.galleria,
    defaults: GALLERIA_DEFAULTS,
  });

  const heroBlock = getBlock("hero");
  const introBlock = getBlock("intro");

  const heroDef = GALLERIA_DEFAULTS[0];
  const introDef = GALLERIA_DEFAULTS[1];

  const { data: galleries = [], isLoading: galleriesLoading } = useQuery<Gallery[]>({
    queryKey: ["/api/galleries"],
  });

  const { data: galleryImages = [] } = useQuery<GalleryImage[]>({
    queryKey: ["/api/galleries", selectedGallery?.id, "images"],
    queryFn: async () => {
      if (!selectedGallery) return [];
      const response = await fetch(`/api/galleries/${selectedGallery.id}/images`);
      return response.json();
    },
    enabled: !!selectedGallery,
  });

  const visibleGalleries = galleries
    .filter(g => g.isVisible)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  useEffect(() => {
    if (visibleGalleries.length === 0 || selectedGallery) return;
    const params = new URLSearchParams(window.location.search);
    const albumParam = params.get("album");
    if (!albumParam) return;
    const match = visibleGalleries.find(g => {
      const slugIt = (g.titleIt || "").toLowerCase().replace(/\s+/g, "-");
      const slugEn = (g.titleEn || "").toLowerCase().replace(/\s+/g, "-");
      return slugIt === albumParam || slugEn === albumParam || String(g.id) === albumParam;
    });
    if (match) {
      setSelectedGallery(match);
      setViewerOpen(true);
      params.delete("album");
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [visibleGalleries, selectedGallery]);

  const handleHeroTitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!heroBlock) return;
    updateBlock(heroBlock.id, {
      titleIt: data.textIt,
      titleEn: data.textEn,
      titleFontSize: data.fontSizeDesktop,
      titleFontSizeMobile: data.fontSizeMobile,
    });
  };

  const handleHeroImageSave = (data: ImageContainerSaveData) => {
    if (!heroBlock) return;
    updateBlock(heroBlock.id, {
      imageUrl: data.src,
      imageScaleDesktop: data.zoom,
      imageScaleMobile: data.zoomMobile,
      imageOffsetX: data.panX,
      imageOffsetY: data.panY,
      imageOffsetXMobile: data.panXMobile,
      imageOffsetYMobile: data.panYMobile,
      metadata: {
        ...(heroBlock.metadata as Record<string, unknown> || {}),
        overlay: data.overlay,
        overlayMobile: data.overlayMobile,
      },
    });
  };

  const handleIntroSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!introBlock) return;
    updateBlock(introBlock.id, {
      bodyIt: data.textIt,
      bodyEn: data.textEn,
      bodyFontSize: data.fontSizeDesktop,
      bodyFontSizeMobile: data.fontSizeMobile,
    });
  };

  const handleAlbumClick = (gallery: Gallery) => {
    setSelectedGallery(gallery);
    setViewerOpen(true);
  };

  if (blocksLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-80px)] flex flex-col">
        <section className="h-[60vh] shrink-0 px-4 md:px-8">
          <div className="mx-auto max-w-[1560px] h-full">
            <ImageContainer
              src={heroBlock?.imageUrl || heroDef.imageUrl || ""}
              zoom={heroBlock?.imageScaleDesktop || heroDef.imageScaleDesktop || 100}
              panX={heroBlock?.imageOffsetX ?? heroDef.imageOffsetX ?? 0}
              panY={heroBlock?.imageOffsetY ?? heroDef.imageOffsetY ?? 0}
              overlay={(heroBlock?.metadata as Record<string, unknown>)?.overlay as number ?? 35}
              zoomMobile={heroBlock?.imageScaleMobile || heroDef.imageScaleMobile || 100}
              panXMobile={heroBlock?.imageOffsetXMobile ?? heroDef.imageOffsetXMobile ?? 0}
              panYMobile={heroBlock?.imageOffsetYMobile ?? heroDef.imageOffsetYMobile ?? 0}
              overlayMobile={(heroBlock?.metadata as Record<string, unknown>)?.overlayMobile as number ?? 35}
              containerClassName="w-full h-full rounded-xl"
              aspectRatio="auto"
              referenceWidth={1560}
              testIdPrefix="galleria-hero"
              onSave={handleHeroImageSave}
            >
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <EditableText
                    textIt={heroBlock?.titleIt || heroDef.titleIt || ""}
                    textEn={heroBlock?.titleEn || heroDef.titleEn || ""}
                    fontSizeDesktop={heroBlock?.titleFontSize || heroDef.titleFontSize || 72}
                    fontSizeMobile={heroBlock?.titleFontSizeMobile || heroDef.titleFontSizeMobile || 40}
                    as="h1"
                    className="font-display drop-shadow-lg"
                    applyFontSize
                    onSave={handleHeroTitleSave}
                  />
                </div>
              </div>
            </ImageContainer>
          </div>
        </section>

        <section className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 max-w-2xl text-center py-6">
            <EditableText
              textIt={introBlock?.bodyIt || introDef.bodyIt || ""}
              textEn={introBlock?.bodyEn || introDef.bodyEn || ""}
              fontSizeDesktop={introBlock?.bodyFontSize || introDef.bodyFontSize || 20}
              fontSizeMobile={introBlock?.bodyFontSizeMobile || introDef.bodyFontSizeMobile || 14}
              as="p"
              className="text-muted-foreground"
              multiline
              applyFontSize
              onSave={handleIntroSave}
            />
          </div>
        </section>
      </div>

      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          {galleriesLoading ? (
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"}`}>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
              ))}
            </div>
          ) : visibleGalleries.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Images className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>{t("La galleria sarà presto disponibile.", "Gallery coming soon.")}</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"}`}>
              {visibleGalleries.map((gallery) => (
                <div key={gallery.id} className="flex flex-col items-center">
                  <h3 className="font-display text-xl md:text-2xl text-[#2f2b2a] text-center mb-3">
                    {language === "it" ? gallery.titleIt : gallery.titleEn}
                  </h3>
                  <button
                    onClick={() => handleAlbumClick(gallery)}
                    className="group relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-muted cursor-pointer"
                    data-testid={`album-cover-${gallery.id}`}
                  >
                    {gallery.coverUrl ? (
                      <img
                        src={gallery.coverUrl}
                        alt={language === "it" ? gallery.titleIt : gallery.titleEn}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{
                          transform: `scale(${(gallery.coverZoom || 100) / 100}) translate(${gallery.coverOffsetX || 0}%, ${gallery.coverOffsetY || 0}%)`,
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Images className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedGallery && (
        <GallerySlideViewer
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedGallery(null);
          }}
          gallery={selectedGallery}
          images={galleryImages}
        />
      )}
    </PublicLayout>
  );
}
