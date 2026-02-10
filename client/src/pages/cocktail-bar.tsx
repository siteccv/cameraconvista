import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { usePageBlocks } from "@/hooks/use-page-blocks";
import { PAGE_IDS, COCKTAIL_BAR_DEFAULTS } from "@/lib/page-defaults";
import type { Cocktail } from "@shared/schema";

export default function CocktailBar() {
  const { t } = useLanguage();
  const { deviceView, adminPreview } = useAdmin();

  const { getBlock, updateBlock, isLoading: blocksLoading } = usePageBlocks({
    pageId: PAGE_IDS["cocktail-bar"],
    defaults: COCKTAIL_BAR_DEFAULTS,
  });

  const heroBlock = getBlock("hero");
  const introBlock = getBlock("intro");
  const gallery1Block = getBlock("gallery-1");
  const gallery2Block = getBlock("gallery-2");
  const gallery3Block = getBlock("gallery-3");
  const outroBlock = getBlock("outro");

  const heroDef = COCKTAIL_BAR_DEFAULTS[0];
  const introDef = COCKTAIL_BAR_DEFAULTS[1];
  const gallery1Def = COCKTAIL_BAR_DEFAULTS[2];
  const gallery2Def = COCKTAIL_BAR_DEFAULTS[3];
  const gallery3Def = COCKTAIL_BAR_DEFAULTS[4];
  const outroDef = COCKTAIL_BAR_DEFAULTS[5];

  const cocktailsEndpoint = adminPreview ? "/api/admin/cocktails" : "/api/cocktails";
  const { data: cocktails, isLoading: cocktailsLoading } = useQuery<Cocktail[]>({
    queryKey: [cocktailsEndpoint],
  });

  const categorizedCocktails = cocktails?.reduce((acc, cocktail) => {
    if (!acc[cocktail.category]) {
      acc[cocktail.category] = [];
    }
    acc[cocktail.category].push(cocktail);
    return acc;
  }, {} as Record<string, Cocktail[]>) ?? {};

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

  const makeGalleryImageSave = (block: ReturnType<typeof getBlock>) => (data: {
    src: string;
    zoomDesktop: number;
    zoomMobile: number;
    offsetXDesktop: number;
    offsetYDesktop: number;
    offsetXMobile: number;
    offsetYMobile: number;
  }) => {
    if (!block) return;
    updateBlock(block.id, {
      imageUrl: data.src,
      imageScaleDesktop: data.zoomDesktop,
      imageScaleMobile: data.zoomMobile,
      imageOffsetX: data.offsetXDesktop,
      imageOffsetY: data.offsetYDesktop,
      imageOffsetXMobile: data.offsetXMobile,
      imageOffsetYMobile: data.offsetYMobile,
    });
  };

  const handleOutroSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!outroBlock) return;
    updateBlock(outroBlock.id, {
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

      <section className="py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { block: gallery1Block, def: gallery1Def, idx: 1 },
              { block: gallery2Block, def: gallery2Def, idx: 2 },
              { block: gallery3Block, def: gallery3Def, idx: 3 },
            ].map(({ block, def, idx }) => (
              <div key={idx} data-testid={`cocktail-gallery-image-${idx}`}>
                <EditableImage
                  src={block?.imageUrl || def.imageUrl || ""}
                  zoomDesktop={block?.imageScaleDesktop || def.imageScaleDesktop || 100}
                  zoomMobile={block?.imageScaleMobile || def.imageScaleMobile || 100}
                  offsetXDesktop={block?.imageOffsetX || def.imageOffsetX || 0}
                  offsetYDesktop={block?.imageOffsetY || def.imageOffsetY || 0}
                  offsetXMobile={block?.imageOffsetXMobile || def.imageOffsetXMobile || 0}
                  offsetYMobile={block?.imageOffsetYMobile || def.imageOffsetYMobile || 0}
                  deviceView={deviceView}
                  containerClassName="aspect-[4/3] rounded-2xl overflow-hidden relative"
                  className="w-full h-full object-cover"
                  onSave={makeGalleryImageSave(block)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {cocktailsLoading ? (
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
                    style={{ color: '#722F37' }}
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

      <section className="pb-16 md:pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <EditableText
            textIt={outroBlock?.bodyIt || outroDef.bodyIt || ""}
            textEn={outroBlock?.bodyEn || outroDef.bodyEn || ""}
            fontSizeDesktop={outroBlock?.bodyFontSize || outroDef.bodyFontSize || 16}
            fontSizeMobile={outroBlock?.bodyFontSizeMobile || outroDef.bodyFontSizeMobile || 14}
            as="p"
            className="text-muted-foreground text-center"
            multiline
            applyFontSize
            onSave={handleOutroSave}
          />
        </div>
      </section>
    </PublicLayout>
  );
}

function CocktailCard({ cocktail }: { cocktail: Cocktail }) {
  const { t } = useLanguage();

  return (
    <div
      className="pb-7 mb-7 last:mb-0 last:pb-0 [border-bottom:1px_solid_#e5d6b6] last:[border-bottom:none]"
      data-testid={`cocktail-item-${cocktail.id}`}
    >
      <div className="space-y-1">
        <h4
          className="text-lg md:text-xl"
          style={{ color: '#2f2b2a' }}
        >
          {t(cocktail.nameIt, cocktail.nameEn)}
        </h4>

        {(cocktail.descriptionIt || cocktail.descriptionEn) && (
          <p className="text-sm md:text-base text-muted-foreground">
            {t(cocktail.descriptionIt, cocktail.descriptionEn)}
          </p>
        )}

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
