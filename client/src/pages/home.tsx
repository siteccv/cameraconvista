import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PageBlock } from "@shared/schema";
import logoImg from "@assets/Logo_ccv_nobistrot.png";
import { Button } from "@/components/ui/button";
import { 
  TeaserCard, 
  BookingDialog, 
  PhilosophySection, 
  HOME_PAGE_ID, 
  DEFAULT_BLOCKS, 
  TEASER_CARDS 
} from "@/components/home";

export default function Home() {
  const { t } = useLanguage();
  const { deviceView, forceMobileLayout } = useAdmin();
  const { toast } = useToast();
  const viewportIsMobile = useIsMobile();

  const isMobile = forceMobileLayout || viewportIsMobile;

  const [hasInitialized, setHasInitialized] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  const blocksQueryKey = ["/api", "pages", HOME_PAGE_ID, "blocks"];

  const { data: blocks = [], isLoading } = useQuery<PageBlock[]>({
    queryKey: blocksQueryKey,
  });

  const heroBlock = blocks.find(b => b.blockType === "hero");
  const conceptBlock = blocks.find(b => b.blockType === "concept");
  const brandingBlock = blocks.find(b => b.blockType === "branding");

  const createBlockMutation = useMutation({
    mutationFn: async (blockData: Partial<PageBlock>) => {
      return apiRequest("POST", "/api/admin/page-blocks", {
        ...blockData,
        pageId: HOME_PAGE_ID,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blocksQueryKey });
    },
    onError: () => {
      setHasInitialized(false);
    },
  });

  const updateBlockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PageBlock> }) => {
      return apiRequest("PATCH", `/api/admin/page-blocks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blocksQueryKey });
      toast({ 
        title: t("Salvato", "Saved"), 
        description: t("Le modifiche sono state salvate.", "Changes have been saved.") 
      });
    },
    onError: () => {
      toast({ 
        title: t("Errore", "Error"), 
        description: t("Impossibile salvare le modifiche.", "Failed to save changes."),
        variant: "destructive"
      });
    },
  });

  useEffect(() => {
    const needsHero = !heroBlock && !isLoading;
    const needsConcept = !conceptBlock && !isLoading;
    const needsBranding = !brandingBlock && !isLoading;
    
    if (needsHero && !hasInitialized && !createBlockMutation.isPending) {
      setHasInitialized(true);
      createBlockMutation.mutate(DEFAULT_BLOCKS.hero, {
        onSuccess: () => {
          if (needsConcept) {
            createBlockMutation.mutate(DEFAULT_BLOCKS.concept, {
              onSuccess: () => {
                if (needsBranding) {
                  createBlockMutation.mutate(DEFAULT_BLOCKS.branding);
                }
              }
            });
          } else if (needsBranding) {
            createBlockMutation.mutate(DEFAULT_BLOCKS.branding);
          }
        }
      });
    } else if (needsConcept && heroBlock && !hasInitialized && !createBlockMutation.isPending) {
      setHasInitialized(true);
      createBlockMutation.mutate(DEFAULT_BLOCKS.concept, {
        onSuccess: () => {
          if (needsBranding) {
            createBlockMutation.mutate(DEFAULT_BLOCKS.branding);
          }
        }
      });
    } else if (needsBranding && heroBlock && conceptBlock && !hasInitialized && !createBlockMutation.isPending) {
      setHasInitialized(true);
      createBlockMutation.mutate(DEFAULT_BLOCKS.branding);
    }
  }, [isLoading, heroBlock, conceptBlock, brandingBlock, hasInitialized, createBlockMutation.isPending]);

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
    updateBlockMutation.mutate({
      id: heroBlock.id,
      data: {
        imageUrl: data.src,
        imageScaleDesktop: data.zoomDesktop,
        imageScaleMobile: data.zoomMobile,
        imageOffsetX: data.offsetXDesktop,
        imageOffsetY: data.offsetYDesktop,
        imageOffsetXMobile: data.offsetXMobile,
        imageOffsetYMobile: data.offsetYMobile,
      },
    });
  };

  const handleBrandingTitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!brandingBlock) return;
    updateBlockMutation.mutate({
      id: brandingBlock.id,
      data: {
        titleIt: data.textIt,
        titleEn: data.textEn,
        titleFontSize: data.fontSizeDesktop,
        titleFontSizeMobile: data.fontSizeMobile,
      },
    });
  };

  const handleBrandingTaglineSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!brandingBlock) return;
    updateBlockMutation.mutate({
      id: brandingBlock.id,
      data: {
        bodyIt: data.textIt,
        bodyEn: data.textEn,
        bodyFontSize: data.fontSizeDesktop,
        bodyFontSizeMobile: data.fontSizeMobile,
      },
    });
  };

  const handleConceptTitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!conceptBlock) return;
    updateBlockMutation.mutate({
      id: conceptBlock.id,
      data: {
        titleIt: data.textIt,
        titleEn: data.textEn,
        titleFontSize: data.fontSizeDesktop,
        titleFontSizeMobile: data.fontSizeMobile,
      },
    });
  };

  const handleConceptBodySave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!conceptBlock) return;
    updateBlockMutation.mutate({
      id: conceptBlock.id,
      data: {
        bodyIt: data.textIt,
        bodyEn: data.textEn,
        bodyFontSize: data.fontSizeDesktop,
        bodyFontSizeMobile: data.fontSizeMobile,
      },
    });
  };

  const heroImage = {
    src: heroBlock?.imageUrl || DEFAULT_BLOCKS.hero.imageUrl,
    zoomDesktop: heroBlock?.imageScaleDesktop || DEFAULT_BLOCKS.hero.imageScaleDesktop,
    zoomMobile: heroBlock?.imageScaleMobile || DEFAULT_BLOCKS.hero.imageScaleMobile,
    offsetXDesktop: heroBlock?.imageOffsetX || DEFAULT_BLOCKS.hero.imageOffsetX,
    offsetYDesktop: heroBlock?.imageOffsetY || DEFAULT_BLOCKS.hero.imageOffsetY,
    offsetXMobile: heroBlock?.imageOffsetXMobile || DEFAULT_BLOCKS.hero.imageOffsetXMobile,
    offsetYMobile: heroBlock?.imageOffsetYMobile || DEFAULT_BLOCKS.hero.imageOffsetYMobile,
  };

  const brandingTitle = {
    it: brandingBlock?.titleIt || DEFAULT_BLOCKS.branding.titleIt,
    en: brandingBlock?.titleEn || DEFAULT_BLOCKS.branding.titleEn,
    fontSizeDesktop: brandingBlock?.titleFontSize || DEFAULT_BLOCKS.branding.titleFontSize,
    fontSizeMobile: brandingBlock?.titleFontSizeMobile || DEFAULT_BLOCKS.branding.titleFontSizeMobile,
  };

  const brandingTagline = {
    it: brandingBlock?.bodyIt || DEFAULT_BLOCKS.branding.bodyIt,
    en: brandingBlock?.bodyEn || DEFAULT_BLOCKS.branding.bodyEn,
    fontSizeDesktop: brandingBlock?.bodyFontSize || DEFAULT_BLOCKS.branding.bodyFontSize,
    fontSizeMobile: brandingBlock?.bodyFontSizeMobile || DEFAULT_BLOCKS.branding.bodyFontSizeMobile,
  };

  const conceptTitle = {
    it: conceptBlock?.titleIt || DEFAULT_BLOCKS.concept.titleIt,
    en: conceptBlock?.titleEn || DEFAULT_BLOCKS.concept.titleEn,
    fontSizeDesktop: conceptBlock?.titleFontSize || DEFAULT_BLOCKS.concept.titleFontSize,
    fontSizeMobile: conceptBlock?.titleFontSizeMobile || DEFAULT_BLOCKS.concept.titleFontSizeMobile,
  };

  const conceptBody = {
    it: conceptBlock?.bodyIt || DEFAULT_BLOCKS.concept.bodyIt,
    en: conceptBlock?.bodyEn || DEFAULT_BLOCKS.concept.bodyEn,
    fontSizeDesktop: conceptBlock?.bodyFontSize || DEFAULT_BLOCKS.concept.bodyFontSize,
    fontSizeMobile: conceptBlock?.bodyFontSizeMobile || DEFAULT_BLOCKS.concept.bodyFontSizeMobile,
  };

  const heroHeight = "h-[60vh]";
  const sectionPadding = isMobile ? "py-10" : "py-20";
  const titleMargin = isMobile ? "mb-8" : "mb-12";
  const cardGrid = isMobile ? "grid grid-cols-1 gap-6" : "grid grid-cols-3 gap-8";
  const twoColGrid = isMobile ? "grid grid-cols-1 gap-6" : "grid-cols-2 gap-12 items-center";
  const titleSize = isMobile ? "text-3xl" : "text-4xl";
  const logoHeight = isMobile ? "h-4" : "h-10";

  if (isLoading) {
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
        <section className={`relative ${heroHeight} shrink-0`}>
          <div className={`absolute inset-y-0 ${isMobile ? "left-4 right-4 rounded-xl" : "left-0 right-0 rounded-none"} overflow-hidden`}>
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
          </div>
        </section>

        <section className="flex-1 flex flex-col text-center" data-testid="section-branding">
          <div className="flex-1" />
          
          <div className="container mx-auto px-4">
            <div className={isMobile ? "mb-2" : "mb-4"}>
              <EditableText
                textIt={brandingTitle.it}
                textEn={brandingTitle.en}
                fontSizeDesktop={brandingTitle.fontSizeDesktop}
                fontSizeMobile={brandingTitle.fontSizeMobile}
                as="p"
                className={`${isMobile ? "tracking-[0.1em]" : "tracking-[0.2em]"} font-medium uppercase`}
                style={{ 
                  color: '#c9a048',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                applyFontSize
                onSave={handleBrandingTitleSave}
                data-testid="text-restaurant-bar"
              />
            </div>
            
            <div className={`flex justify-center ${isMobile ? "mb-2" : "mb-4"}`}>
              <img 
                src={logoImg} 
                alt="Camera con Vista" 
                className={`${logoHeight} w-auto`}
                data-testid="img-logo"
              />
            </div>
            
            <div className={isMobile ? "mt-4" : "mt-6"}>
              <EditableText
                textIt={brandingTagline.it}
                textEn={brandingTagline.en}
                fontSizeDesktop={brandingTagline.fontSizeDesktop}
                fontSizeMobile={brandingTagline.fontSizeMobile}
                as="p"
                className="italic"
                style={{ 
                  fontFamily: 'Adelia, cursive',
                  color: '#2d2926'
                }}
                applyFontSize
                onSave={handleBrandingTaglineSave}
                data-testid="text-tagline"
              />
            </div>
          </div>
          
          <div className="flex-1 flex items-end justify-center pb-6">
            <Button 
              onClick={() => setBookingDialogOpen(true)}
              className={`${isMobile ? "px-5 py-2 text-[10px] tracking-[0.08em]" : "px-8 py-3 text-sm tracking-[0.1em]"} font-medium text-white rounded-full`}
              style={{ 
                backgroundColor: '#722f37',
                fontFamily: 'Montserrat, sans-serif'
              }}
              data-testid="button-book-table"
            >
              {t("PRENOTA UN TAVOLO", "BOOK A TABLE")}
            </Button>
          </div>
        </section>
      </div>

      <BookingDialog 
        open={bookingDialogOpen} 
        onOpenChange={setBookingDialogOpen} 
        isMobile={isMobile} 
      />

      <section className={sectionPadding}>
        <div className="container mx-auto px-4">
          <div className={`text-center max-w-3xl mx-auto ${titleMargin}`}>
            <EditableText
              textIt={conceptTitle.it}
              textEn={conceptTitle.en}
              fontSizeDesktop={conceptTitle.fontSizeDesktop}
              fontSizeMobile={conceptTitle.fontSizeMobile}
              as="h2"
              className="font-display mb-4"
              applyFontSize
              onSave={handleConceptTitleSave}
            />
            <EditableText
              textIt={conceptBody.it}
              textEn={conceptBody.en}
              fontSizeDesktop={conceptBody.fontSizeDesktop}
              fontSizeMobile={conceptBody.fontSizeMobile}
              as="p"
              className="text-muted-foreground leading-relaxed"
              applyFontSize
              multiline
              onSave={handleConceptBodySave}
            />
          </div>

          <div className={cardGrid}>
            {TEASER_CARDS.map((card) => (
              <TeaserCard key={card.testId} {...card} />
            ))}
          </div>
        </div>
      </section>

      <PhilosophySection 
        sectionPadding={sectionPadding}
        titleSize={titleSize}
        twoColGrid={twoColGrid}
      />
    </PublicLayout>
  );
}
