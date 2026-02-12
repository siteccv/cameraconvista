import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { EditableText } from "@/components/admin/EditableText";
import { ImageContainer } from "@/components/admin/ImageContainer";
import type { ImageContainerSaveData } from "@/components/admin/ImageContainer";
import { usePageBlocks } from "@/hooks/use-page-blocks";
import { PAGE_IDS, MENU_DEFAULTS } from "@/lib/page-defaults";
import type { MenuItem } from "@shared/schema";

export default function Menu() {
  const { t } = useLanguage();
  const { adminPreview } = useAdmin();

  const { getBlock, updateBlock, isLoading: blocksLoading } = usePageBlocks({
    pageId: PAGE_IDS.menu,
    defaults: MENU_DEFAULTS,
  });

  const heroBlock = getBlock("hero");
  const introBlock = getBlock("intro");

  const heroDef = MENU_DEFAULTS[0];
  const introDef = MENU_DEFAULTS[1];

  const menuEndpoint = adminPreview ? "/api/admin/menu-items" : "/api/menu-items";
  const { data: menuItems, isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: [menuEndpoint],
  });

  const categorizedItems = menuItems?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>) ?? {};

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
              testIdPrefix="menu-hero"
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
          {menuLoading ? (
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
                  <h2
                    className="font-display text-4xl md:text-5xl mb-8 text-center"
                    style={{ color: '#722F37' }}
                    data-testid={`text-category-${category}`}
                  >
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
    <div
      className="pb-7 mb-7 last:mb-0 last:pb-0 [border-bottom:1px_solid_#e5d6b6] last:[border-bottom:none]"
      data-testid={`menu-item-${item.id}`}
    >
      <div className="space-y-1">
        <div className="md:flex md:items-center md:justify-between md:gap-4">
          <h3
            className="text-lg md:text-xl leading-tight"
            style={{ color: '#2f2b2a' }}
          >
            {t(item.nameIt, item.nameEn)}
          </h3>
          {item.price && (
            <span
              className="price-text shrink-0 leading-tight"
              style={{
                fontSize: '20px',
                fontWeight: 500,
                color: '#c7902f'
              }}
            >
              <span>€</span>
              <span>{item.price.replace('€', '').trim()}</span>
            </span>
          )}
        </div>

        {(item.descriptionIt || item.descriptionEn) && (
          <p className="text-sm md:text-base text-muted-foreground">
            {t(item.descriptionIt, item.descriptionEn)}
          </p>
        )}
      </div>
    </div>
  );
}
