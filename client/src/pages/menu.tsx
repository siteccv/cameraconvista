import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { EditableText } from "@/components/admin/EditableText";
import { ImageContainer } from "@/components/admin/ImageContainer";
import type { ImageContainerSaveData } from "@/components/admin/ImageContainer";
import { BookingDialog } from "@/components/home/BookingDialog";
import { usePageBlocks } from "@/hooks/use-page-blocks";
import { useIsMobile } from "@/hooks/use-mobile";
import { PAGE_IDS, MENU_DEFAULTS } from "@/lib/page-defaults";
import { FilledLeafIcon, GlutenFreeIcon } from "@/components/colli/ColliMenuPrimitives";
import type { MenuItem } from "@shared/schema";

export default function Menu() {
  const { t, language } = useLanguage();
  const { adminPreview, forceMobileLayout } = useAdmin();
  const viewportIsMobile = useIsMobile();
  const isMobile = forceMobileLayout || viewportIsMobile;
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  const { data: categoryMap = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/menu-category-map"],
  });

  const {
    getBlock,
    updateBlock,
    isLoading: blocksLoading,
  } = usePageBlocks({
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

  const categorizedItems =
    menuItems?.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, MenuItem[]>,
    ) ?? {};

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
        ...((heroBlock.metadata as Record<string, unknown>) || {}),
        overlay: data.overlay,
        overlayMobile: data.overlayMobile,
      },
    });
  };

  const handleIntroSave = (data: {
    textIt: string;
    textEn: string;
    fontSizeDesktop: number;
    fontSizeMobile: number;
  }) => {
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
              overlay={((heroBlock?.metadata as Record<string, unknown>)?.overlay as number) ?? 35}
              zoomMobile={heroBlock?.imageScaleMobile || heroDef.imageScaleMobile || 100}
              panXMobile={heroBlock?.imageOffsetXMobile ?? heroDef.imageOffsetXMobile ?? 0}
              panYMobile={heroBlock?.imageOffsetYMobile ?? heroDef.imageOffsetYMobile ?? 0}
              overlayMobile={
                ((heroBlock?.metadata as Record<string, unknown>)?.overlayMobile as number) ?? 35
              }
              containerClassName="w-full h-full rounded-xl"
              aspectRatio="auto"
              referenceWidth={1560}
              testIdPrefix="menu-hero"
              onSave={handleHeroImageSave}
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
                    style={{ color: "#722F37" }}
                    data-testid={`text-category-${category}`}
                  >
                    {language === "en" ? categoryMap[category] || category : category}
                  </h2>
                  <div className="space-y-6">
                    {items.map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
              <MenuLegend />
            </div>
          )}
        </div>
      </section>

      <section className="pb-12 md:pb-20">
        <div className="container mx-auto px-4 flex justify-center">
          <Button
            onClick={() => setBookingDialogOpen(true)}
            className={`${isMobile ? "px-6 py-4 text-[10px] tracking-[0.08em]" : "px-10 py-5 text-xs tracking-[0.1em]"} font-medium text-white rounded-full shadow-lg`}
            style={{
              backgroundColor: "#722f37",
              fontFamily: "Montserrat, sans-serif",
            }}
            data-testid="button-book-table-menu"
          >
            {t("PRENOTA UN TAVOLO", "BOOK A TABLE")}
          </Button>
        </div>
      </section>

      <BookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        isMobile={isMobile}
      />
    </PublicLayout>
  );
}

function MenuLegend() {
  const { t } = useLanguage();

  return (
    <div
      className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 px-4 py-4 text-center text-sm text-muted-foreground sm:flex-row sm:gap-6 sm:px-6"
      aria-label={t("Legenda icone menu", "Menu icon legend")}
    >
      <div className="flex items-center gap-2">
        <FilledLeafIcon className="h-4 w-4 shrink-0" />
        <span>{t("Vegetariano", "Vegetarian")}</span>
      </div>
      <div className="flex items-center gap-2">
        <GlutenFreeIcon className="h-4 w-4 shrink-0" />
        <span>{t("Senza glutine", "Gluten free")}</span>
      </div>
    </div>
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
          <h3 className="text-lg md:text-xl leading-tight" style={{ color: "#2f2b2a" }}>
            {item.vegetarian && (
              <FilledLeafIcon
                className={`${item.glutenFree ? "mr-1.5" : "mr-2"} inline h-3.5 w-3.5 align-[-0.08em]`}
              />
            )}
            {item.glutenFree && (
              <GlutenFreeIcon className="mr-2 inline h-3.5 w-3.5 align-[-0.08em]" />
            )}
            {t(item.nameIt, item.nameEn)}
          </h3>
          {item.price && (
            <span
              className="price-text shrink-0 leading-tight"
              style={{
                fontSize: "20px",
                fontWeight: 500,
                color: "#c7902f",
              }}
            >
              <span>€</span>
              <span>{item.price.replace("€", "").trim()}</span>
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
