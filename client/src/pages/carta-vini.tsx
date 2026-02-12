import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { EditableText } from "@/components/admin/EditableText";
import { ImageContainer } from "@/components/admin/ImageContainer";
import type { ImageContainerSaveData } from "@/components/admin/ImageContainer";
import { usePageBlocks } from "@/hooks/use-page-blocks";
import { PAGE_IDS, CARTA_VINI_DEFAULTS } from "@/lib/page-defaults";
import type { Wine } from "@shared/schema";

export default function CartaVini() {
  const { t } = useLanguage();
  const { adminPreview } = useAdmin();

  const { getBlock, updateBlock, isLoading: blocksLoading } = usePageBlocks({
    pageId: PAGE_IDS["carta-vini"],
    defaults: CARTA_VINI_DEFAULTS,
  });

  const heroBlock = getBlock("hero");
  const introBlock = getBlock("intro");

  const heroDef = CARTA_VINI_DEFAULTS[0];
  const introDef = CARTA_VINI_DEFAULTS[1];

  const winesEndpoint = adminPreview ? "/api/admin/wines" : "/api/wines";
  const { data: wines, isLoading: winesLoading } = useQuery<Wine[]>({
    queryKey: [winesEndpoint],
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
              testIdPrefix="carta-vini-hero"
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
        <div className="container mx-auto px-4 max-w-4xl">
          {winesLoading ? (
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
                  <div className="flex items-center justify-center mb-8">
                    <h2
                      className="font-display text-3xl md:text-4xl"
                      style={{ color: '#722F37' }}
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
      className="pb-7 mb-7 last:mb-0 last:pb-0 [border-bottom:1px_solid_#e5d6b6] last:[border-bottom:none]"
      data-testid={`wine-item-${wine.id}`}
    >
      <div className="space-y-1">
        <div className="md:flex md:items-center md:justify-between md:gap-4">
          <h3
            className="text-base md:text-lg leading-tight"
            style={{ color: '#2f2b2a' }}
          >
            {t(wine.nameIt, wine.nameEn)}
            {wine.year && <span className="ml-2 text-sm">{wine.year}</span>}
          </h3>
          <div className="hidden md:flex gap-6 shrink-0 leading-tight">
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

        {(wine.descriptionIt || wine.descriptionEn) && (
          <p className="text-sm text-muted-foreground">
            {t(wine.descriptionIt, wine.descriptionEn)}
          </p>
        )}

        <div className="flex gap-6 pt-1 md:hidden">
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
