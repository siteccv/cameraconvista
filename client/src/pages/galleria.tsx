import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { useToast } from "@/hooks/use-toast";
import type { Media } from "@shared/schema";

const defaultImages = [
  { id: 1, url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Cocktail" },
  { id: 2, url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Cocktail" },
  { id: 3, url: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Bar" },
  { id: 4, url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Restaurant" },
  { id: 5, url: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Event" },
  { id: 6, url: "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Interior" },
  { id: 7, url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Wine" },
  { id: 8, url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Event" },
  { id: 9, url: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Party" },
];

export default function Galleria() {
  const { t } = useLanguage();
  const { deviceView } = useAdmin();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
    it: "Scopri l'atmosfera unica di Camera con Vista attraverso i nostri scatti.",
    en: "Discover the unique atmosphere of Camera con Vista through our photos.",
    fontSizeDesktop: 16, fontSizeMobile: 14
  });

  const { data: media, isLoading } = useQuery<Media[]>({
    queryKey: ["/api/media"],
  });

  const images = media?.length ? media.map(m => ({ id: m.id, url: m.url, alt: m.altIt || m.altEn || "" })) : defaultImages;

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

  return (
    <PublicLayout>
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
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
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 pointer-events-none"
        />
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

      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 max-w-2xl mx-auto">
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

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(image.url)}
                  className="aspect-square rounded-placeholder overflow-hidden group cursor-pointer"
                  data-testid={`gallery-image-${image.id}`}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading={index > 3 ? "lazy" : "eager"}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-white/80 transition-colors"
            data-testid="button-close-lightbox"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={selectedImage}
            alt="Gallery image"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </PublicLayout>
  );
}
