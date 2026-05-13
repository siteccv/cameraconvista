import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Instagram, MapPin, X } from "lucide-react";
import { SiApple, SiGooglemaps } from "react-icons/si";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ImageContainer } from "@/components/admin/ImageContainer";
import type { ImageContainerSaveData } from "@/components/admin/ImageContainer";
import { EditableText } from "@/components/admin/EditableText";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageBlocks } from "@/hooks/use-page-blocks";
import { COLLI_DEFAULTS, PAGE_IDS } from "@/lib/page-defaults";
import colliLogo from "@assets/logo_ccv_colli.png";
import {
  buildColliBookingUrl,
  DEFAULT_COLLI_BOOKING_SETTINGS,
  type ColliBookingSettings,
} from "@shared/colli";
import type { Page, PageBlock } from "@shared/schema";

const COLORS = {
  cream: "#F4ECDD",
  green: "#5B7A4E",
  brown: "#2C1F14",
  muted: "#7A6A5A",
};
const COLLI_INSTAGRAM_URL = "https://www.instagram.com/cameraconvistacolli/";

function getOverlay(block: PageBlock | null, fallback = 0): number {
  return ((block?.metadata as Record<string, unknown> | null)?.overlay as number) ?? fallback;
}

function getOverlayMobile(block: PageBlock | null, fallback = 0): number {
  return ((block?.metadata as Record<string, unknown> | null)?.overlayMobile as number) ?? fallback;
}

interface ColliProps {
  pageId?: number;
}

export default function Colli({ pageId }: ColliProps = {}) {
  const { t } = useLanguage();
  const { adminPreview } = useAdmin();
  const [showMapsModal, setShowMapsModal] = useState(false);
  const { data: visiblePages = [] } = useQuery<Page[]>({
    queryKey: ["/api/pages"],
    enabled: !adminPreview && !pageId,
  });
  const { data: bookingSettings = DEFAULT_COLLI_BOOKING_SETTINGS } = useQuery<ColliBookingSettings>(
    {
      queryKey: ["/api/colli-booking-settings"],
      enabled: !adminPreview,
    },
  );
  const resolvedPageId =
    pageId ?? visiblePages.find((page) => page.slug === "colli")?.id ?? PAGE_IDS.colli;

  const {
    getBlock,
    updateBlock,
    isLoading: blocksLoading,
  } = usePageBlocks({
    pageId: resolvedPageId,
    defaults: COLLI_DEFAULTS,
  });

  const heroBlock = getBlock("hero");
  const introBlock = getBlock("intro");
  const locationBlock = getBlock("location");
  const ctaBlock = getBlock("cta");
  const bookingBlock = getBlock("booking-cta");
  const gallery1Block = getBlock("gallery-1");
  const gallery2Block = getBlock("gallery-2");
  const gallery3Block = getBlock("gallery-3");

  const getDefault = (blockType: string, fallbackIndex: number) =>
    COLLI_DEFAULTS.find((block) => block.blockType === blockType) || COLLI_DEFAULTS[fallbackIndex];
  const heroDef = getDefault("hero", 0);
  const introDef = getDefault("intro", 1);
  const locationDef = getDefault("location", 2);
  const ctaDef = getDefault("cta", 3);
  const bookingDef = getDefault("booking-cta", 4);
  const galleryDefs = [
    getDefault("gallery-1", 5),
    getDefault("gallery-2", 6),
    getDefault("gallery-3", 7),
  ];
  const galleryBlocks = [gallery1Block, gallery2Block, gallery3Block];

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

  const handleIntroTitleSave = (data: {
    textIt: string;
    textEn: string;
    fontSizeDesktop: number;
    fontSizeMobile: number;
  }) => {
    if (!introBlock) return;
    updateBlock(introBlock.id, {
      titleIt: data.textIt,
      titleEn: data.textEn,
      titleFontSize: data.fontSizeDesktop,
      titleFontSizeMobile: data.fontSizeMobile,
    });
  };

  const handleCtaSave = (data: {
    textIt: string;
    textEn: string;
    fontSizeDesktop: number;
    fontSizeMobile: number;
  }) => {
    if (!ctaBlock) return;
    updateBlock(ctaBlock.id, {
      bodyIt: data.textIt,
      bodyEn: data.textEn,
      bodyFontSize: data.fontSizeDesktop,
      bodyFontSizeMobile: data.fontSizeMobile,
    });
  };

  const handleBookingSave = (data: {
    textIt: string;
    textEn: string;
    fontSizeDesktop: number;
    fontSizeMobile: number;
  }) => {
    if (!bookingBlock) return;
    updateBlock(bookingBlock.id, {
      bodyIt: data.textIt,
      bodyEn: data.textEn,
      bodyFontSize: data.fontSizeDesktop,
      bodyFontSizeMobile: data.fontSizeMobile,
    });
  };

  const handleLocationSave = (data: {
    textIt: string;
    textEn: string;
    fontSizeDesktop: number;
    fontSizeMobile: number;
  }) => {
    if (!locationBlock) return;
    updateBlock(locationBlock.id, {
      bodyIt: data.textIt,
      bodyEn: data.textEn,
      bodyFontSize: data.fontSizeDesktop,
      bodyFontSizeMobile: data.fontSizeMobile,
    });
  };

  const makeGalleryImageSave = (block: PageBlock | null) => (data: ImageContainerSaveData) => {
    if (!block) return;
    updateBlock(block.id, {
      imageUrl: data.src,
      imageScaleDesktop: data.zoom,
      imageScaleMobile: data.zoomMobile,
      imageOffsetX: data.panX,
      imageOffsetY: data.panY,
      imageOffsetXMobile: data.panXMobile,
      imageOffsetYMobile: data.panYMobile,
      metadata: {
        ...((block.metadata as Record<string, unknown>) || {}),
        overlay: data.overlay,
        overlayMobile: data.overlayMobile,
      },
    });
  };

  if (blocksLoading) {
    return (
      <PublicLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </PublicLayout>
    );
  }

  const ctaLabelIt = ctaBlock?.bodyIt || ctaDef.bodyIt || "Scopri il menu";
  const ctaLabelEn = ctaBlock?.bodyEn || ctaDef.bodyEn || "Discover the menu";
  const bookingLabelIt = bookingBlock?.bodyIt || bookingDef.bodyIt || "Prenota";
  const bookingLabelEn = bookingBlock?.bodyEn || bookingDef.bodyEn || "Book";
  const bookingUrl = buildColliBookingUrl(bookingSettings.phoneNumber);
  const locationLabelIt = locationBlock?.bodyIt || locationDef.bodyIt || "";
  const locationLabelEn = locationBlock?.bodyEn || locationDef.bodyEn || locationLabelIt;
  const mapsAddress = locationLabelIt.replace(/\n/g, ", ");
  const hasCustomIntroTitle = Boolean(introBlock?.titleIt || introBlock?.titleEn);
  const introTitleIt = introBlock?.titleIt || introDef.titleIt || "Food · Drinks · Vini";
  const introTitleEn = introBlock?.titleEn || introDef.titleEn || "Food · Drinks · Wines";
  const introTitleFontDesktop = hasCustomIntroTitle
    ? introBlock?.titleFontSize || introDef.titleFontSize || 12
    : introDef.titleFontSize || 12;
  const introTitleFontMobile = hasCustomIntroTitle
    ? introBlock?.titleFontSizeMobile || introDef.titleFontSizeMobile || 11
    : introDef.titleFontSizeMobile || 11;

  const openAppleMaps = () => {
    const query = encodeURIComponent(mapsAddress);
    window.open(`https://maps.apple.com/?q=${query}`, "_blank");
    setShowMapsModal(false);
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(mapsAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
    setShowMapsModal(false);
  };

  const ctaContent = (
    <EditableText
      textIt={ctaLabelIt}
      textEn={ctaLabelEn}
      fontSizeDesktop={ctaBlock?.bodyFontSize || ctaDef.bodyFontSize || 14}
      fontSizeMobile={ctaBlock?.bodyFontSizeMobile || ctaDef.bodyFontSizeMobile || 13}
      as="span"
      className="font-semibold uppercase tracking-[0.14em]"
      applyFontSize
      onSave={handleCtaSave}
    />
  );

  const bookingContent = (
    <EditableText
      textIt={bookingLabelIt}
      textEn={bookingLabelEn}
      fontSizeDesktop={bookingBlock?.bodyFontSize || bookingDef.bodyFontSize || 14}
      fontSizeMobile={bookingBlock?.bodyFontSizeMobile || bookingDef.bodyFontSizeMobile || 13}
      as="span"
      className="font-semibold uppercase tracking-[0.14em]"
      applyFontSize
      onSave={handleBookingSave}
    />
  );

  const addressContent = (
    <>
      <MapPin
        className="mt-1 h-4 w-4 shrink-0"
        style={{ color: COLORS.green }}
        aria-hidden="true"
      />
      <div className="space-y-1 text-left">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: COLORS.green }}
        >
          Indirizzo
        </p>
        <EditableText
          textIt={locationLabelIt}
          textEn={locationLabelEn}
          fontSizeDesktop={locationBlock?.bodyFontSize || locationDef.bodyFontSize || 15}
          fontSizeMobile={locationBlock?.bodyFontSizeMobile || locationDef.bodyFontSizeMobile || 14}
          as="p"
          className="leading-7"
          applyFontSize
          multiline
          onSave={handleLocationSave}
        />
      </div>
    </>
  );

  const instagramContent = (
    <>
      <Instagram
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ color: COLORS.green }}
        aria-hidden="true"
      />
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: COLORS.green }}
      >
        Instagram
      </span>
    </>
  );

  return (
    <PublicLayout>
      <main style={{ backgroundColor: COLORS.cream, color: COLORS.brown }}>
        <section className="px-4 py-5 md:px-8 md:py-10 lg:py-12">
          <div className="mx-auto grid max-w-[1560px] items-stretch gap-4 md:gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.55fr)]">
            <ImageContainer
              src={heroBlock?.imageUrl || heroDef.imageUrl || ""}
              zoom={heroBlock?.imageScaleDesktop || heroDef.imageScaleDesktop || 100}
              panX={heroBlock?.imageOffsetX ?? heroDef.imageOffsetX ?? 0}
              panY={heroBlock?.imageOffsetY ?? heroDef.imageOffsetY ?? 0}
              overlay={getOverlay(heroBlock, 0)}
              zoomMobile={heroBlock?.imageScaleMobile || heroDef.imageScaleMobile || 100}
              panXMobile={heroBlock?.imageOffsetXMobile ?? heroDef.imageOffsetXMobile ?? 0}
              panYMobile={heroBlock?.imageOffsetYMobile ?? heroDef.imageOffsetYMobile ?? 0}
              overlayMobile={getOverlayMobile(heroBlock, 0)}
              containerClassName="h-[28vh] min-h-[210px] max-h-[260px] rounded-lg border md:h-[58vh] md:min-h-[340px] md:max-h-none lg:h-full lg:min-h-[65vh]"
              aspectRatio="auto"
              referenceWidth={1040}
              testIdPrefix="colli-hero-image"
              onSave={handleHeroImageSave}
            />

            <div className="flex flex-col items-start gap-5 lg:h-full lg:min-h-[65vh] lg:justify-between lg:gap-8 lg:pl-4">
              <div className="flex flex-col items-start gap-4 md:gap-6">
                <h1 className="sr-only">Camera con Vista Colli</h1>
                <img
                  src={colliLogo}
                  alt="Camera con Vista Colli"
                  className="h-[76px] max-w-full object-contain md:h-[120px]"
                />

                <div className="max-w-xl space-y-3 md:space-y-4">
                  <EditableText
                    textIt={introTitleIt}
                    textEn={introTitleEn}
                    fontSizeDesktop={introTitleFontDesktop}
                    fontSizeMobile={introTitleFontMobile}
                    as="p"
                    className="text-xs font-semibold uppercase tracking-[0.28em]"
                    style={{ color: COLORS.green }}
                    applyFontSize
                    onSave={handleIntroTitleSave}
                  />
                  <EditableText
                    textIt={introBlock?.bodyIt || introDef.bodyIt || ""}
                    textEn={introBlock?.bodyEn || introDef.bodyEn || ""}
                    fontSizeDesktop={introBlock?.bodyFontSize || introDef.bodyFontSize || 18}
                    fontSizeMobile={
                      introBlock?.bodyFontSizeMobile || introDef.bodyFontSizeMobile || 15
                    }
                    as="p"
                    className="max-w-[34rem] leading-7 md:leading-8"
                    style={{ color: COLORS.muted }}
                    multiline
                    applyFontSize
                    onSave={handleIntroSave}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {adminPreview ? (
                    <div
                      className="inline-flex min-h-12 items-center justify-center rounded-md px-6 py-3 text-white sm:px-7"
                      style={{ backgroundColor: COLORS.green }}
                      data-testid="colli-menu-cta"
                    >
                      {ctaContent}
                    </div>
                  ) : (
                    <Link href="/colli/menu">
                      <span
                        className="inline-flex min-h-12 items-center justify-center rounded-md px-6 py-3 text-white transition-opacity hover:opacity-90 sm:px-7"
                        style={{ backgroundColor: COLORS.green }}
                        data-testid="colli-menu-cta"
                      >
                        {ctaContent}
                      </span>
                    </Link>
                  )}

                  {adminPreview ? (
                    <div
                      className="inline-flex min-h-12 items-center justify-center rounded-md border px-6 py-3 sm:px-7"
                      style={{ borderColor: COLORS.green, color: COLORS.green }}
                      data-testid="colli-booking-cta"
                    >
                      {bookingContent}
                    </div>
                  ) : (
                    <a
                      href={bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-12 items-center justify-center rounded-md border px-6 py-3 transition-colors hover:bg-white/35 sm:px-7"
                      style={{ borderColor: COLORS.green, color: COLORS.green }}
                      data-testid="colli-booking-cta"
                    >
                      {bookingContent}
                    </a>
                  )}
                </div>
              </div>

              <div
                className="flex w-full max-w-[34rem] flex-col gap-3 border-l pl-4"
                style={{ borderColor: "rgba(91, 122, 78, 0.35)", color: COLORS.muted }}
                data-testid="colli-location-group"
              >
                {adminPreview ? (
                  <div className="flex items-center gap-3" data-testid="colli-instagram-link">
                    {instagramContent}
                  </div>
                ) : (
                  <a
                    href={COLLI_INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 transition-opacity hover:opacity-80"
                    data-testid="colli-instagram-link"
                  >
                    {instagramContent}
                  </a>
                )}

                {adminPreview ? (
                  <div className="flex items-start gap-3" data-testid="colli-address">
                    {addressContent}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex items-start gap-3 text-left transition-opacity hover:opacity-80"
                    data-testid="colli-address"
                    onClick={() => setShowMapsModal(true)}
                  >
                    {addressContent}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-12 md:px-8 md:pb-16">
          <div className="mx-auto max-w-[1560px]">
            <div className="grid gap-4 md:grid-cols-3 md:gap-5">
              {galleryBlocks.map((block, index) => {
                const def = galleryDefs[index];
                return (
                  <ImageContainer
                    key={def.blockType}
                    src={block?.imageUrl || def.imageUrl || ""}
                    zoom={block?.imageScaleDesktop || def.imageScaleDesktop || 100}
                    panX={block?.imageOffsetX ?? def.imageOffsetX ?? 0}
                    panY={block?.imageOffsetY ?? def.imageOffsetY ?? 0}
                    overlay={getOverlay(block, 0)}
                    zoomMobile={block?.imageScaleMobile || def.imageScaleMobile || 100}
                    panXMobile={block?.imageOffsetXMobile ?? def.imageOffsetXMobile ?? 0}
                    panYMobile={block?.imageOffsetYMobile ?? def.imageOffsetYMobile ?? 0}
                    overlayMobile={getOverlayMobile(block, 0)}
                    containerClassName="rounded-lg border"
                    aspectRatio="4/3"
                    testIdPrefix={`colli-gallery-image-${index + 1}`}
                    onSave={makeGalleryImageSave(block)}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {showMapsModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowMapsModal(false)}
          >
            <div
              className="mx-4 w-full max-w-sm space-y-4 rounded-lg bg-background p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl">{t("Apri con", "Open with")}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMapsModal(false)}
                  aria-label={t("Chiudi", "Close")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={openAppleMaps}
                  className="w-full justify-start"
                  data-testid="button-colli-apple-maps"
                >
                  <SiApple className="mr-3 h-5 w-5" />
                  Apple Mappe
                </Button>
                <Button
                  variant="outline"
                  onClick={openGoogleMaps}
                  className="w-full justify-start"
                  data-testid="button-colli-google-maps"
                >
                  <SiGooglemaps className="mr-3 h-5 w-5" />
                  Google Maps
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </PublicLayout>
  );
}
