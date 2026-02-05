import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Martini } from "lucide-react";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { useToast } from "@/hooks/use-toast";
import type { Cocktail } from "@shared/schema";

export default function CocktailBar() {
  const { t } = useLanguage();
  const { deviceView } = useAdmin();
  const { toast } = useToast();

  const [heroTitle, setHeroTitle] = useState({
    it: "Cocktail Bar", en: "Cocktail Bar",
    fontSizeDesktop: 72, fontSizeMobile: 40
  });
  const [heroImage, setHeroImage] = useState({
    src: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    zoomDesktop: 100, zoomMobile: 100,
    offsetXDesktop: 0, offsetYDesktop: 0,
    offsetXMobile: 0, offsetYMobile: 0,
  });
  const [sectionTitle, setSectionTitle] = useState({
    it: "Cocktails", en: "Cocktails",
    fontSizeDesktop: 36, fontSizeMobile: 28
  });
  const [introText, setIntroText] = useState({
    it: "I nostri cocktail sono creazioni uniche, preparate con ingredienti selezionati e tecniche innovative per offrirvi un'esperienza sensoriale indimenticabile.",
    en: "Our cocktails are unique creations, prepared with selected ingredients and innovative techniques to offer you an unforgettable sensory experience.",
    fontSizeDesktop: 16, fontSizeMobile: 14
  });

  const { data: cocktails, isLoading } = useQuery<Cocktail[]>({
    queryKey: ["/api/cocktails"],
  });

  const categorizedCocktails = cocktails?.reduce((acc, cocktail) => {
    if (!acc[cocktail.category]) {
      acc[cocktail.category] = [];
    }
    acc[cocktail.category].push(cocktail);
    return acc;
  }, {} as Record<string, Cocktail[]>) ?? {};

  const handleTextSave = (field: string, data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    switch (field) {
      case "heroTitle":
        setHeroTitle({ it: data.textIt, en: data.textEn, fontSizeDesktop: data.fontSizeDesktop, fontSizeMobile: data.fontSizeMobile });
        break;
      case "sectionTitle":
        setSectionTitle({ it: data.textIt, en: data.textEn, fontSizeDesktop: data.fontSizeDesktop, fontSizeMobile: data.fontSizeMobile });
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
              <Martini className="h-6 w-6" />
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
              {[1, 2].map((i) => (
                <div key={i}>
                  <Skeleton className="h-8 w-48 mx-auto mb-6" />
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(categorizedCocktails).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-cocktails-empty">
                {t("La lista cocktail sarà disponibile a breve.", "The cocktail list will be available soon.")}
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(categorizedCocktails).map(([category, cocktails]) => (
                <div key={category}>
                  <h3 
                    className="font-display text-4xl md:text-5xl mb-8 text-center"
                    style={{ color: '#2f2b2a' }}
                    data-testid={`text-cocktail-category-${category}`}
                  >
                    {category}
                  </h3>
                  <div className="space-y-6">
                    {cocktails.map((cocktail) => (
                      <CocktailCard key={cocktail.id} cocktail={cocktail} />
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

function CocktailCard({ cocktail }: { cocktail: Cocktail }) {
  const { t } = useLanguage();

  return (
    <div 
      className="pb-7 mb-7 last:border-0 last:mb-0 last:pb-0" 
      style={{ borderBottom: '1px solid #e5d6b6' }}
      data-testid={`cocktail-item-${cocktail.id}`}
    >
      <div className="space-y-1">
        {/* Nome cocktail */}
        <h4 
          className="text-lg md:text-xl"
          style={{ color: '#2f2b2a' }}
        >
          {t(cocktail.nameIt, cocktail.nameEn)}
        </h4>
        
        {/* Descrizione/Ingredienti */}
        {(cocktail.descriptionIt || cocktail.descriptionEn) && (
          <p className="text-sm md:text-base text-muted-foreground">
            {t(cocktail.descriptionIt, cocktail.descriptionEn)}
          </p>
        )}
        
        {/* Prezzo */}
        {cocktail.price && (
          <div className="pt-1">
            <span 
              className="price-text"
              style={{ 
                fontSize: '20px',
                fontWeight: 500,
                color: '#c7902f'
              }}
            >
              <span>€</span>
              <span>{cocktail.price.replace('€', '').trim()}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
