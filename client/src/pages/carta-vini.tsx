import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Wine as WineIcon } from "lucide-react";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { useToast } from "@/hooks/use-toast";
import type { Wine } from "@shared/schema";

export default function CartaVini() {
  const { t } = useLanguage();
  const { deviceView } = useAdmin();
  const { toast } = useToast();

  const [heroTitle, setHeroTitle] = useState({
    it: "Carta dei Vini", en: "Wine List",
    fontSizeDesktop: 72, fontSizeMobile: 40
  });
  const [heroImage, setHeroImage] = useState({
    src: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    zoomDesktop: 100, zoomMobile: 100,
    offsetXDesktop: 0, offsetYDesktop: 0,
    offsetXMobile: 0, offsetYMobile: 0,
  });
  const [introText, setIntroText] = useState({
    it: "Una selezione curata di etichette italiane e internazionali, scelte per accompagnare ogni momento della vostra esperienza.",
    en: "A curated selection of Italian and international labels, chosen to accompany every moment of your experience.",
    fontSizeDesktop: 16, fontSizeMobile: 14
  });

  const { data: wines, isLoading } = useQuery<Wine[]>({
    queryKey: ["/api/wines"],
  });

  const categorizedWines = wines?.reduce((acc, wine) => {
    if (!acc[wine.category]) {
      acc[wine.category] = [];
    }
    acc[wine.category].push(wine);
    return acc;
  }, {} as Record<string, Wine[]>) ?? {};

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

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <WineIcon className="h-6 w-6" />
            </div>
            <EditableText
              textIt={introText.it}
              textEn={introText.en}
              fontSizeDesktop={introText.fontSizeDesktop}
              fontSizeMobile={introText.fontSizeMobile}
              as="p"
              className="text-muted-foreground max-w-2xl mx-auto"
              multiline
              applyFontSize
              onSave={(data) => handleTextSave("introText", data)}
            />
          </div>

          {isLoading ? (
            <div className="space-y-12">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-8 w-48 mx-auto mb-6" />
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(categorizedWines).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-wines-empty">
                {t("La carta dei vini sarà disponibile a breve.", "The wine list will be available soon.")}
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(categorizedWines).map(([category, wines]) => (
                <div key={category}>
                  <h2 className="font-display text-2xl md:text-3xl text-center mb-8" data-testid={`text-wine-category-${category}`}>
                    {category}
                  </h2>
                  <div className="space-y-6">
                    {wines.map((wine) => (
                      <WineCard key={wine.id} wine={wine} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

function WineCard({ wine }: { wine: Wine }) {
  const { t } = useLanguage();

  return (
    <div className="pb-4 border-b border-border last:border-0" data-testid={`wine-item-${wine.id}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="font-medium text-lg">{t(wine.nameIt, wine.nameEn)}</h3>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-1">
            {wine.region && <span>{wine.region}</span>}
            {wine.region && wine.year && <span>•</span>}
            {wine.year && <span>{wine.year}</span>}
          </div>
          {(wine.descriptionIt || wine.descriptionEn) && (
            <p className="text-sm text-muted-foreground mt-2">
              {t(wine.descriptionIt, wine.descriptionEn)}
            </p>
          )}
        </div>
        {wine.price && (
          <span className="text-primary font-medium shrink-0">{wine.price}</span>
        )}
      </div>
    </div>
  );
}
