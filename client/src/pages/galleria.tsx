import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { GallerySlideViewer } from "@/components/GallerySlideViewer";
import { useToast } from "@/hooks/use-toast";
import { Images } from "lucide-react";
import type { Gallery, GalleryImage } from "@shared/schema";

export default function Galleria() {
  const { t, language } = useLanguage();
  const { deviceView, forceMobileLayout } = useAdmin();
  const { toast } = useToast();
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const isMobile = forceMobileLayout || deviceView === "mobile";

  const [heroTitle, setHeroTitle] = useState({
    it: "Galleria", en: "Gallery",
    fontSizeDesktop: 72, fontSizeMobile: 40
  });
  const [heroImage, setHeroImage] = useState({
    src: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    zoomDesktop: 100, zoomMobile: 100,
    offsetXDesktop: 0, offsetYDesktop: 0,
    offsetXMobile: 0, offsetYMobile: 0,
  });
  const [introText, setIntroText] = useState({
    it: "Scopri l'atmosfera unica di Camera con Vista attraverso i nostri album fotografici.",
    en: "Discover the unique atmosphere of Camera con Vista through our photo albums.",
    fontSizeDesktop: 20, fontSizeMobile: 14
  });

  const { data: galleries = [], isLoading: galleriesLoading } = useQuery<Gallery[]>({
    queryKey: ["/api/galleries"],
  });

  const { data: galleryImages = [], isLoading: imagesLoading } = useQuery<GalleryImage[]>({
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

  const handleTextSave = (field: string, data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    switch (field) {
      case "heroTitle":
        setHeroTitle({ it: data.textIt, en: data.textEn, fontSizeDesktop: data.fontSizeDesktop, fontSizeMobile: data.fontSizeMobile });
        break;
      case "introText":
        setIntroText({ it: data.textIt, en: data.textEn, fontSizeDesktop: data.fontSizeDesktop, fontSizeMobile: data.fontSizeMobile });
        break;
    }
    toast({ title: t("Salvato", "Saved"), description: t("Le modifiche sono state salvate.", "Changes have been saved.") });
  };

  const handleHeroImageSave = (data: typeof heroImage) => {
    setHeroImage(data);
    toast({ title: t("Salvato", "Saved"), description: t("Immagine aggiornata.", "Image updated.") });
  };

  const handleAlbumClick = (gallery: Gallery) => {
    setSelectedGallery(gallery);
    setViewerOpen(true);
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-80px)] flex flex-col">
        <section className="relative h-[60vh] shrink-0 flex items-center justify-center">
          <div className="absolute inset-y-0 left-4 right-4 md:left-0 md:right-0 rounded-xl md:rounded-none overflow-hidden">
            <EditableImage
              src={heroImage.src}
              zoomDesktop={heroImage.zoomDesktop}
              zoomMobile={heroImage.zoomMobile}
              offsetXDesktop={heroImage.offsetXDesktop}
              offsetYDesktop={heroImage.offsetYDesktop}
              offsetXMobile={heroImage.offsetXMobile}
              offsetYMobile={heroImage.offsetYMobile}
              deviceView={deviceView}
              containerClassName="absolute inset-0"
              className="w-full h-full object-cover"
              onSave={handleHeroImageSave}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 pointer-events-none" />
          </div>
          <div className="relative z-10 text-center text-white">
            <EditableText
              textIt={heroTitle.it}
              textEn={heroTitle.en}
              fontSizeDesktop={heroTitle.fontSizeDesktop}
              fontSizeMobile={heroTitle.fontSizeMobile}
              as="h1"
              className="font-display drop-shadow-lg"
              applyFontSize
              onSave={(data) => handleTextSave("heroTitle", data)}
            />
          </div>
        </section>

        <section className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 max-w-2xl text-center py-6">
            <EditableText
              textIt={introText.it}
              textEn={introText.en}
              fontSizeDesktop={introText.fontSizeDesktop}
              fontSizeMobile={introText.fontSizeMobile}
              as="p"
              className="text-muted-foreground"
              multiline
              applyFontSize
              onSave={(data) => handleTextSave("introText", data)}
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
