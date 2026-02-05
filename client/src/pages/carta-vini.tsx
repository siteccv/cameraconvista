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

  const CATEGORY_ORDER = [
    "Bollicine Italiane",
    "Bollicine Francesi", 
    "Bianchi",
    "Rossi",
    "Rosati",
    "Vini Dolci",
  ];

  const categorizedWines = wines?.reduce((acc, wine) => {
    if (!acc[wine.category]) {
      acc[wine.category] = [];
    }
    acc[wine.category].push(wine);
    return acc;
  }, {} as Record<string, Wine[]>) ?? {};

  const orderedCategories = CATEGORY_ORDER.filter(cat => categorizedWines[cat]?.length > 0);

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
            <div 
              className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 pointer-events-none"
            />
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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <WineIcon className="h-6 w-6" />
            </div>
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
        <div className="container mx-auto px-4 max-w-4xl">
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
          ) : orderedCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-wines-empty">
                {t("La carta dei vini sarà disponibile a breve.", "The wine list will be available soon.")}
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {orderedCategories.map((category) => (
                <div key={category}>
                  <div className="flex items-center gap-4 mb-8">
                    <WineIcon className="h-6 w-6" style={{ color: '#c7902f', strokeWidth: 1.5 }} />
                    <h2 
                      className="font-display"
                      style={{ 
                        fontSize: '32px',
                        lineHeight: 1.2,
                        letterSpacing: '0.01em',
                        fontWeight: 500,
                        color: '#2f2b2a'
                      }}
                      data-testid={`text-wine-category-${category}`}
                    >
                      {category}
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {categorizedWines[category].map((wine) => (
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
  
  const hasGlassPrice = wine.priceGlass && wine.priceGlass !== "";
  const hasBottlePrice = wine.price && wine.price !== "";

  return (
    <div 
      className="pb-7 mb-7 last:border-0 last:mb-0 last:pb-0" 
      style={{ borderBottom: '1px solid #e5d6b6' }}
      data-testid={`wine-item-${wine.id}`}
    >
      <div className="space-y-1">
        {/* Nome vino */}
        <h3 
          className="font-display uppercase"
          style={{ 
            fontSize: '22px',
            lineHeight: 1.25,
            letterSpacing: '0.02em',
            fontWeight: 500,
            color: '#2f2b2a'
          }}
        >
          {t(wine.nameIt, wine.nameEn)}
          {wine.year && <span className="ml-2 text-base font-normal">{wine.year}</span>}
        </h3>
        
        {/* Cantina + Provenienza */}
        {(wine.descriptionIt || wine.descriptionEn) && (
          <p 
            style={{ 
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '15px',
              lineHeight: 1.4,
              letterSpacing: '0.02em',
              fontWeight: 400,
              color: '#666a70'
            }}
          >
            {t(wine.descriptionIt, wine.descriptionEn)}
          </p>
        )}
        
        {/* Prezzi */}
        <div className="flex gap-6 pt-1">
          {hasGlassPrice && (
            <span 
              className="price-text"
              style={{ 
                fontSize: '20px',
                fontWeight: 500,
                color: '#c7902f'
              }}
            >
              <span>€</span>
              <span>{wine.priceGlass}</span>
            </span>
          )}
          {hasBottlePrice && (
            <span 
              className="price-text"
              style={{ 
                fontSize: '20px',
                fontWeight: 500,
                color: '#c7902f'
              }}
            >
              <span>€</span>
              <span>{wine.price}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
