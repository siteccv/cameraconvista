import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { useToast } from "@/hooks/use-toast";
import type { MenuItem } from "@shared/schema";

export default function Menu() {
  const { t } = useLanguage();
  const { deviceView } = useAdmin();
  const { toast } = useToast();

  const [heroTitle, setHeroTitle] = useState({
    it: "Menù", en: "Menu",
    fontSizeDesktop: 72, fontSizeMobile: 40
  });
  const [heroImage, setHeroImage] = useState({
    src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    zoomDesktop: 100, zoomMobile: 100,
    offsetXDesktop: 0, offsetYDesktop: 0,
    offsetXMobile: 0, offsetYMobile: 0,
  });
  const [introText, setIntroText] = useState({
    it: "La nostra cucina celebra i sapori autentici della tradizione italiana, reinterpretati con creatività e ingredienti di stagione.",
    en: "Our cuisine celebrates the authentic flavors of Italian tradition, reinterpreted with creativity and seasonal ingredients.",
    fontSizeDesktop: 16, fontSizeMobile: 14
  });

  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  const categorizedItems = menuItems?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>) ?? {};

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
      <section className="relative h-[60vh] flex items-center justify-center">
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

      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
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
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(categorizedItems).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-menu-empty">
                {t("Il menù sarà disponibile a breve.", "The menu will be available soon.")}
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(categorizedItems).map(([category, items]) => (
                <div key={category}>
                  <h2 className="font-display text-2xl md:text-3xl text-center mb-8" data-testid={`text-category-${category}`}>
                    {category}
                  </h2>
                  <div className="space-y-6">
                    {items.map((item) => (
                      <MenuItemCard key={item.id} item={item} />
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

function MenuItemCard({ item }: { item: MenuItem }) {
  const { t } = useLanguage();

  return (
    <div className="flex justify-between items-start gap-4 pb-4 border-b border-border last:border-0" data-testid={`menu-item-${item.id}`}>
      <div className="flex-1">
        <h3 className="font-medium text-lg">{t(item.nameIt, item.nameEn)}</h3>
        {(item.descriptionIt || item.descriptionEn) && (
          <p className="text-sm text-muted-foreground mt-1">
            {t(item.descriptionIt, item.descriptionEn)}
          </p>
        )}
      </div>
      {item.price && (
        <span className="text-primary font-medium shrink-0">{item.price}</span>
      )}
    </div>
  );
}
