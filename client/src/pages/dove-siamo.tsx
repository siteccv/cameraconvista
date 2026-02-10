import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Navigation, X } from "lucide-react";
import { SiApple, SiGooglemaps } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { usePageBlocks } from "@/hooks/use-page-blocks";
import { PAGE_IDS, DOVE_SIAMO_DEFAULTS } from "@/lib/page-defaults";
import { BookingDialog } from "@/components/home/BookingDialog";
import type { FooterSettings } from "@shared/schema";
import { defaultFooterSettings } from "@shared/schema";

export default function DoveSiamo() {
  const { t } = useLanguage();
  const { deviceView, forceMobileLayout } = useAdmin();
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const viewportIsMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isMobile = forceMobileLayout || viewportIsMobile;

  const { getBlock, updateBlock, isLoading: blocksLoading } = usePageBlocks({
    pageId: PAGE_IDS["dove-siamo"],
    defaults: DOVE_SIAMO_DEFAULTS,
  });

  const heroBlock = getBlock("hero");
  const introBlock = getBlock("intro");

  const heroDef = DOVE_SIAMO_DEFAULTS[0];
  const introDef = DOVE_SIAMO_DEFAULTS[1];

  const { data: footerSettings } = useQuery<FooterSettings>({
    queryKey: ["/api/footer-settings"],
    staleTime: 1000 * 60 * 5,
  });

  const footer = footerSettings || defaultFooterSettings;
  const address = footer.contacts.address.replace(/\n/g, ", ");

  const openAppleMaps = () => {
    const query = encodeURIComponent(address);
    window.open(`https://maps.apple.com/?q=${query}`, "_blank");
    setShowMapsModal(false);
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
    setShowMapsModal(false);
  };

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
              loading="eager"
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
              className="text-muted-foreground whitespace-pre-line"
              multiline
              applyFontSize
              onSave={handleIntroSave}
            />
          </div>
        </section>
      </div>

      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-2xl space-y-8">
          <div className="space-y-4">
            <div className="aspect-[16/9] rounded-placeholder overflow-hidden bg-muted">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(address)}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t("Mappa", "Map") || "Map"}
              />
            </div>
            <Button
              onClick={() => setShowMapsModal(true)}
              className="w-full"
              data-testid="button-open-maps"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {t("Apri indicazioni", "Get Directions")}
            </Button>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={() => setBookingDialogOpen(true)}
              className={`${isMobile ? "px-6 py-4 text-[10px] tracking-[0.08em]" : "px-10 py-5 text-xs tracking-[0.1em]"} font-medium text-white rounded-full shadow-lg`}
              style={{
                backgroundColor: '#722f37',
                fontFamily: 'Montserrat, sans-serif'
              }}
              data-testid="button-book-table-dove-siamo"
            >
              {t("PRENOTA UN TAVOLO", "BOOK A TABLE")}
            </Button>
          </div>

          {showMapsModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={() => setShowMapsModal(false)}
            >
              <div
                className="bg-background rounded-lg p-6 w-full max-w-sm mx-4 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl">
                    {t("Apri con", "Open with")}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMapsModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={openAppleMaps}
                    className="w-full justify-start"
                    data-testid="button-apple-maps"
                  >
                    <SiApple className="h-5 w-5 mr-3" />
                    Apple Mappe
                  </Button>
                  <Button
                    variant="outline"
                    onClick={openGoogleMaps}
                    className="w-full justify-start"
                    data-testid="button-google-maps"
                  >
                    <SiGooglemaps className="h-5 w-5 mr-3" />
                    Google Maps
                  </Button>
                </div>
              </div>
            </div>
          )}
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
