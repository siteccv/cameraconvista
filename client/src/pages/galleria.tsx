import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { GallerySlideViewer } from "@/components/GallerySlideViewer";
import { usePageBlocks } from "@/hooks/use-page-blocks";
import { PAGE_IDS, GALLERIA_DEFAULTS } from "@/lib/page-defaults";
import { Images } from "lucide-react";
import type { Gallery, GalleryImage } from "@shared/schema";

export default function Galleria() {
  const { t, language } = useLanguage();
  const { deviceView, forceMobileLayout } = useAdmin();
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const isMobile = forceMobileLayout || deviceView === "mobile";

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
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleHeroTitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!heroBlock) return;
    updateBlock(heroBlock.id, {
      titleIt: data.textIt,
      titleEn: data.textEn,
      titleFontSize: data.fontSizeDesktop,
      titleFontSizeMobile: data.fontSizeMobile,
    });
  };

  const handleHeroImageSave = (data: {
    src: string;
    zoomDesktop: number;
    zoomMobile: number;
    offsetXDesktop: number;
    offsetYDesktop: number;
    offsetXMobile: number;
    offsetYMobile: number;
  }) => {
    if (!heroBlock) return;
    updateBlock(heroBlock.id, {
      imageUrl: data.src,
      imageScaleDesktop: data.zoomDesktop,
      imageScaleMobile: data.zoomMobile,
      imageOffsetX: data.offsetXDesktop,
      imageOffsetY: data.offsetYDesktop,
      imageOffsetXMobile: data.offsetXMobile,
      imageOffsetYMobile: data.offsetYMobile,
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
        <section className="relative h-[60vh] shrink-0 flex items-center justify-center">
          <div className="absolute inset-y-0 left-4 right-4 md:left-0 md:right-0 rounded-xl md:rounded-none overflow-hidden">
            <EditableImage
              src={heroBlock?.imageUrl || heroDef.imageUrl || ""}
              zoomDesktop={heroBlock?.imageScaleDesktop || heroDef.imageScaleDesktop || 100}
              zoomMobile={heroBlock?.imageScaleMobile || heroDef.imageScaleMobile || 100}
              offsetXDesktop={heroBlock?.imageOffsetX || heroDef.imageOffsetX || 0}
              offsetYDesktop={heroBlock?.imageOffsetY || heroDef.imageOffsetY || 0}
              offsetXMobile={heroBlock?.imageOffsetXMobile || heroDef.imageOffsetXMobile || 0}
              offsetYMobile={heroBlock?.imageOffsetYMobile || heroDef.imageOffsetYMobile || 0}
              deviceView={deviceView}
              containerClassName="absolute inset-0"
              className="w-full h-full object-cover"
              onSave={handleHeroImageSave}
            />
            <div className="absolute inset-0 bg-black/35 pointer-events-none" />
          </div>
          <div className="relative z-10 text-center text-white">
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
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"}`}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : visibleGalleries.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Images className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>{t("La galleria sarà presto disponibile.", "Gallery coming soon.")}</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"}`}>
              {visibleGalleries.map((gallery) => (
                <button
                  key={gallery.id}
                  onClick={() => handleAlbumClick(gallery)}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="font-display text-2xl md:text-3xl text-white text-center px-4 drop-shadow-lg">
                      {language === "it" ? gallery.titleIt : gallery.titleEn}
                    </h3>
                  </div>
                </button>
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
